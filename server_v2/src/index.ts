	import type { AnyDict, Engine, IRequest, User } from '@interfaces/types';
import * as fs from 'fs';
import type z from 'zod';
import getConfig from './config/env';
import * as consts from './config/consts';
import { ResponseWriter } from './lib/response-writer';

const modules = {}; // Modules cache
const schemas: { [path: string]: { schema: z.ZodType } } = {}; // Schemas cache
const cleanDirname = __dirname.replace('.build', 'src');

let config: any = null;
export const handler = async (event: any, context: any) => {
	if ((event.httpMethod || event.method) === 'OPTIONS') {
		return ResponseWriter.Success('');
	}

	const req: IRequest = {
		method: event.httpMethod || event.method,
		params: event.queryStringParameters || {},
		headers: event.headers,
		ip: event.requestContext.http?.sourceIp || event.requestContext.identity.sourceIp,
		body: event.body || {},
		cookies:
			event.headers?.cookie || event.headers?.Cookie
				? Object.fromEntries(
						(event.headers.cookie || event.headers.Cookie)
							.split('; ')
							.map((c: string) => [c.split('=')[0], c.split('=').slice(1).join('=')]),
					)
				: {},
	};
	config = config || (await getConfig());

	const ctx: Engine = {
		req,
		consts,
		config,
		user: {} as User,
	};

	if (typeof event.body === 'string' && event.body.length) {
		if (event.body.startsWith('{') | event.body.startsWith('[')) {
			req.body = JSON.parse(event.body);
		} else if (
			[event.headers['Content-Type'], event.headers['content-type']].includes('application/x-www-form-urlencoded')
		) {
			req.body = Object.fromEntries(new URLSearchParams(event.body));
		}
	}

	const pathParts: string[] = event.path.split('/').filter(Boolean);

	if (!pathParts.length) {
		return ResponseWriter.BadRequest({ message: 'Invalid path' });
	}

	const [_path, query] = pathParts.join('/').split(/\?|#/);

	const path =
		_path
			.split('/')
			.filter((v: string) => v && !v.includes('.'))
			.join('/') + `/${req.method.toLowerCase()}`;

	if (query) {
		req.params = { ...req.params, ...Object.fromEntries(new URLSearchParams(query)) };
	}

	if (consts.isProduction) {
		console.info('>> Request', {
			path: event.path,
			moduleLoaded: !!modules[path],
			request: req,
		});
	} else {
		console.info('>> Event', event);
	}

	if (!modules[path]) {
		const module = `./modules/${path}`;

		if (!fs.existsSync(`${__dirname}/${module}/index.js`)) {
			console.warn(`>> Not found: ${cleanDirname}/${module}/index.ts`);
			return ResponseWriter.NotFound();
		}

		if (fs.existsSync(`${__dirname}/${module}/schema.js`)) {
			schemas[path] = await import(`${module}/schema.js`);
		} else {
			console.warn(`>> Not found: ${cleanDirname}/${module}/schema.ts`);
			return ResponseWriter.NotFound();
		}

		modules[path] = await import(module);
	}

	if (typeof modules[path]?.handler !== 'function') {
		console.warn(`>> Not found: ${cleanDirname}/${path}/index.ts`);
		return ResponseWriter.NotFound();
	}

	if (['GET', 'DELETE'].includes(req.method)) {
		const getParseResult = schemas[path].schema.safeParse(req.params);
		if (!getParseResult.success) {
			return ResponseWriter.BadRequest({ message: 'Invalid input', errors: getParseResult.error.message });
		}
		req.params = getParseResult.data as AnyDict;
	} else if (['POST', 'PUT'].includes(req.method)) {
		const postParseResult = schemas[path].schema.safeParse(req.body);
		if (!postParseResult.success) {
			return ResponseWriter.BadRequest({ message: 'Invalid input', errors: postParseResult.error.message });
		}
		req.body = postParseResult.data as AnyDict;
	}

	// Authenticate all the requests except the public ones
	if (!modules[path].publicResource) {
		if (!(req.headers?.Authorization || req.cookies?.token)) {
			return ResponseWriter.Unauthorized({ message: 'Unauthorized' });
		}
	}

	return modules[path].handler(ctx);
};
