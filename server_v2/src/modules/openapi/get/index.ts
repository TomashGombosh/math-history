import type { Engine } from '@interfaces/types';
import { createDocument } from 'zod-openapi';
import { ResponseWriter } from '../../../lib/response-writer';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const openapiDocument = createDocument({
		openapi: '3.0.0',
		info: {
			title: 'math-history-server',
			version: '1.0.0',
			description: 'Documentation for the "math-history-server" service.',
		},
		servers: [
			{
				url: `https://${ctx.req.headers.Host}/`,
				description: 'Base URL for the math-history-server',
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
		paths: {
			'/openapi': {
				get: {
					summary: 'Get OpenAPI Documentation',
					responses: {
						200: {
							description: 'Successful response',
						},
					},
				},
			},
		},
	});

	return ResponseWriter.Success(openapiDocument);
};
