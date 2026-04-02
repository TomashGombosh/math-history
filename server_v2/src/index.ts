import type { AnyDict, Engine, IRequest, User } from '@interfaces/types';
import * as fs from 'fs';
import type z from 'zod';
import type { AppConfig } from '@config/types';
import getConfig from '@config/env';
import * as consts from '@config/consts';
import { assertAuthenticatedRequest, isApiGatewayAdminAuthorizer } from '@lib/admin-auth';
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

export const handler = async (event: any) => {
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
		return ResponseWriter.BadRequest({ message: 'Invalid path' });
	}

	const { modulePath, pathParams } = resolved;
	req.params = { ...req.params, ...pathParams };

	const queryString = rawPath.includes('?') ? rawPath.split('?')[1] : '';
	if (queryString) {
		req.params = { ...req.params, ...Object.fromEntries(new URLSearchParams(queryString)) };
	}

	appConfig = appConfig || (await getConfig());

	const ctx: Engine = {
		req,
		consts,
		config: appConfig,
		user: {} as User,
		lambdaEvent: event,
	};

	if (consts.isProduction) {
		console.info('>> Request', {
			path: rawPath,
			modulePath,
			moduleLoaded: Boolean(modules[modulePath]),
			request: req,
		});
	} else {
		console.info('>> Event', event);
	}

	if (!modules[modulePath]) {
		const moduleFsPath = `./modules/${modulePath}`;

		if (!fs.existsSync(`${__dirname}/${moduleFsPath}/index.js`)) {
			console.warn(`>> Not found: ${cleanDirname}/${moduleFsPath}/index.ts`);
			return ResponseWriter.NotFound();
		}

		if (fs.existsSync(`${__dirname}/${moduleFsPath}/schema.js`)) {
			schemas[modulePath] = await import(`${moduleFsPath}/schema.js`);
		} else {
			console.warn(`>> Not found: ${cleanDirname}/${moduleFsPath}/schema.ts`);
			return ResponseWriter.NotFound();
		}

		modules[modulePath] = await import(moduleFsPath);
	}

	const mod = modules[modulePath];
	if (typeof mod?.handler !== 'function') {
		console.warn(`>> Not found: ${cleanDirname}/${modulePath}/index.ts`);
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
			if (!isApiGatewayAdminAuthorizer(event)) {
				assertAuthenticatedRequest(req, event, appConfig);
			}
		} catch {
			return ResponseWriter.Unauthorized({ message: 'Unauthorized' });
		}
	}

	return mod.handler(ctx);
};
