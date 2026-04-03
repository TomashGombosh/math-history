import type { Context } from 'aws-lambda';
import type { AnyDict, Engine, IRequest, User } from '@interfaces/types';
import * as fs from 'fs';
import type z from 'zod';
import type { AppConfig } from '@config/types';
import getConfig from '@config/env';
import * as consts from '@config/consts';
import { assertAuthenticatedRequest } from '@lib/admin-auth';
import { correlationFromLambda, logInfo, logWarn } from '@lib/lambda-log';
import { ResponseWriter } from '@lib/response-writer';
import { normalizeApiSegments, resolveModulePath } from '@lib/route-resolve';

const modules: Record<string, { handler?: (ctx: Engine) => Promise<unknown>; publicResource?: boolean }> = {};
const schemas: { [path: string]: { schema: z.ZodType } } = {};
const cleanDirname = __dirname.replace('.build', 'src');

function getHeader(headers: Record<string, string | undefined> | undefined, name: string): string | undefined {
	if (!headers) return undefined;
	const lower = name.toLowerCase();
	for (const [k, v] of Object.entries(headers)) {
		if (k.toLowerCase() === lower) {
			return v;
		}
	}
	return undefined;
}

let appConfig: AppConfig | null = null;
let firstInvocationInContainer = true;

export const handler = async (event: any, context: Context) => {
	const t0 = Date.now();
	const correlationIds = correlationFromLambda(event, context);
	const coldStart = firstInvocationInContainer;
	firstInvocationInContainer = false;

	const trace = (msg: string, extra?: Record<string, unknown>) => {
		logInfo(msg, {
			...correlationIds,
			route: extra?.route as string | undefined,
			durationMs: Date.now() - t0,
			coldStart,
			service: 'math-history-server',
			...extra,
		});
	};

	const routeEarly = String(event.rawPath ?? event.path ?? '').split('?')[0];
	trace('handler:entry', { route: routeEarly });

	const rawMethod = String(event.requestContext?.http?.method ?? event.httpMethod ?? event.method ?? 'GET');
	if (rawMethod === 'OPTIONS') {
		return ResponseWriter.Success('');
	}
	const method = rawMethod as IRequest['method'];

	const rawPath = (event.rawPath ?? event.path ?? '') as string;
	const pathOnly = rawPath.split('?')[0].split('#')[0];
	const pathSegments = pathOnly.split('/').filter(Boolean);

	const headers = Object.fromEntries(
		Object.entries(event.headers || {}).filter(([, v]) => v !== undefined),
	) as IRequest['headers'];

	const req: IRequest = {
		method,
		params: (event.queryStringParameters || {}) as Record<string, string>,
		headers,
		ip: event.requestContext?.http?.sourceIp ?? event.requestContext?.identity?.sourceIp ?? '',
		body: event.body || {},
		cookies: getHeader(headers, 'cookie')
			? Object.fromEntries(
					getHeader(headers, 'cookie')!
						.split('; ')
						.map((c: string) => [c.split('=')[0], c.split('=').slice(1).join('=')]),
				)
			: {},
	};

	const contentType = getHeader(headers, 'content-type') || '';

	if (typeof event.body === 'string' && event.body.length) {
		if (event.body.startsWith('{') || event.body.startsWith('[')) {
			try {
				req.body = JSON.parse(event.body);
			} catch {
				req.body = {};
			}
		} else if (contentType.includes('application/x-www-form-urlencoded')) {
			req.body = Object.fromEntries(new URLSearchParams(event.body));
		}
	}

	const normalizedSegments = normalizeApiSegments(pathSegments);
	const resolved = resolveModulePath(normalizedSegments, method);

	if (!resolved) {
		trace('handler:invalidPath', { route: pathOnly, segments: normalizedSegments.join('/') });
		return ResponseWriter.BadRequest({ message: 'Invalid path' });
	}

	const { modulePath, pathParams } = resolved;
	trace('handler:resolved', { route: pathOnly, modulePath });
	req.params = { ...req.params, ...pathParams };

	const queryString = rawPath.includes('?') ? rawPath.split('?')[1] : '';
	if (queryString) {
		req.params = { ...req.params, ...Object.fromEntries(new URLSearchParams(queryString)) };
	}

	trace('handler:beforeGetConfig', { route: pathOnly, modulePath });
	appConfig = appConfig || (await getConfig());
	trace('handler:afterGetConfig', { route: pathOnly, modulePath });

	const ctx: Engine = {
		req,
		consts,
		config: appConfig,
		user: {} as User,
		lambdaEvent: event,
		correlationIds,
	};

	logInfo('request:summary', {
		...correlationIds,
		route: pathOnly,
		method,
		modulePath,
		moduleCached: Boolean(modules[modulePath]),
		coldStart,
		hasBody: typeof event.body === 'string' && event.body.length > 0,
		durationMs: Date.now() - t0,
		service: 'math-history-server',
	});

	if (!modules[modulePath]) {
		const moduleFsPath = `./modules/${modulePath}`;

		if (!fs.existsSync(`${__dirname}/${moduleFsPath}/index.js`)) {
			logWarn('module:not_found', {
				...correlationIds,
				route: pathOnly,
				moduleFsPath: `${cleanDirname}/${moduleFsPath}/index.ts`,
				durationMs: Date.now() - t0,
				service: 'math-history-server',
			});
			return ResponseWriter.NotFound();
		}

		trace('handler:beforeImportSchema', { route: pathOnly, moduleFsPath });
		if (fs.existsSync(`${__dirname}/${moduleFsPath}/schema.js`)) {
			schemas[modulePath] = await import(`${moduleFsPath}/schema.js`);
		} else {
			logWarn('module:schema_missing', {
				...correlationIds,
				route: pathOnly,
				moduleFsPath: `${cleanDirname}/${moduleFsPath}/schema.ts`,
				durationMs: Date.now() - t0,
				service: 'math-history-server',
			});
			return ResponseWriter.NotFound();
		}
		trace('handler:afterImportSchema', { route: pathOnly, moduleFsPath });

		trace('handler:beforeImportModule', { route: pathOnly, moduleFsPath });
		modules[modulePath] = await import(moduleFsPath);
		trace('handler:afterImportModule', { route: pathOnly, moduleFsPath });
	} else {
		trace('handler:moduleCacheHit', { route: pathOnly, modulePath });
	}

	const mod = modules[modulePath];
	if (typeof mod?.handler !== 'function') {
		logWarn('module:handler_missing', {
			...correlationIds,
			route: pathOnly,
			modulePath: `${cleanDirname}/${modulePath}/index.ts`,
			durationMs: Date.now() - t0,
			service: 'math-history-server',
		});
		return ResponseWriter.NotFound();
	}

	if (['GET', 'DELETE'].includes(req.method)) {
		const getParseResult = schemas[modulePath].schema.safeParse(req.params);
		if (!getParseResult.success) {
			return ResponseWriter.BadRequest({ message: 'Invalid input', errors: getParseResult.error.message });
		}
		req.params = getParseResult.data as AnyDict;
	} else if (['POST', 'PUT'].includes(req.method)) {
		const postParseResult = schemas[modulePath].schema.safeParse(req.body);
		if (!postParseResult.success) {
			return ResponseWriter.BadRequest({ message: 'Invalid input', errors: postParseResult.error.message });
		}
		req.body = postParseResult.data as AnyDict;
	}

	if (!mod.publicResource) {
		try {
			assertAuthenticatedRequest(req, event);
		} catch {
			return ResponseWriter.Unauthorized({ message: 'Unauthorized' });
		}
	}

	trace('handler:beforeModuleHandler', { route: pathOnly, modulePath });
	const out = await mod.handler(ctx);
	trace('handler:afterModuleHandler', { route: pathOnly, modulePath });
	return out;
};
