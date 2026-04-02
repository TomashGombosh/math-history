import type { Engine } from '@interfaces/types';
import { createDocument } from 'zod-openapi';
import { ResponseWriter } from '@lib/response-writer';

export const publicResource = true;

const PUBLIC_DESCRIPTION = `
## Authentication

- **Public** operations do not require a token (see paths tagged **Public**).
- **Protected** operations require \`Authorization: Bearer <jwt>\` (JWT from \`POST /api/auth/login\`, or API Gateway V2 authorizer when \`TRUST_API_GATEWAY_AUTH\` is enabled).

## Public API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | /openapi | This OpenAPI document |
| POST | /api/auth/login | Admin login; returns JWT |
| GET | /api/teachers | Paginated teacher list (query: page, limit, search, sortBy, sortDir, positions, degrees) |
| GET | /api/teachers/filters | Distinct positions and degrees for filters |
| GET | /api/teachers/by-slug/{slug} | Teacher by URL slug |
| GET | /api/graduates | Graduate cohorts (optional query: year) |
| GET | /api/graduates/years | Aggregated stats per year |
| GET | /api/graduates/specialties | Distinct student specialties |
| GET | /api/graduates/{year} | Single year cohort (merged view) |
| GET | /api/layout | Public layout / field visibility config |

All other routes under \`/api/*\` require authentication unless otherwise noted.
`.trim();

export const handler = async (ctx: Engine) => {
	const openapiDocument = createDocument({
		openapi: '3.0.0',
		info: {
			title: 'math-history-server',
			version: '1.0.0',
			description: PUBLIC_DESCRIPTION,
		},
		servers: [
			{
				url: `https://${ctx.req.headers.host ?? ctx.req.headers.Host ?? 'localhost'}/`,
				description: 'Base URL for the math-history-server',
			},
		],
		tags: [
			{ name: 'Public', description: 'No authentication required.' },
			{ name: 'Authentication', description: 'Obtain JWT for protected routes.' },
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Admin JWT from POST /api/auth/login (role: admin).',
				},
			},
		},
		paths: {
			'/openapi': {
				get: {
					tags: ['Public'],
					summary: 'OpenAPI document',
					description: 'Machine-readable API description (this document).',
					security: [],
					responses: {
						200: {
							description: 'OpenAPI 3.0 JSON',
						},
					},
				},
			},
			'/api/auth/login': {
				post: {
					tags: ['Authentication', 'Public'],
					summary: 'Admin login',
					description: 'Returns a JWT for use on protected routes.',
					security: [],
					requestBody: {
						required: true,
						content: {
							'application/json': {
								schema: {
									type: 'object',
									required: ['username', 'password'],
									properties: {
										username: { type: 'string' },
										password: { type: 'string' },
									},
								},
							},
						},
					},
					responses: {
						200: {
							description: 'JWT issued',
							content: {
								'application/json': {
									schema: {
										type: 'object',
										properties: {
											token: { type: 'string' },
										},
									},
								},
							},
						},
						400: { description: 'Missing credentials' },
						401: { description: 'Invalid credentials' },
					},
				},
			},
			'/api/teachers': {
				get: {
					tags: ['Public'],
					summary: 'List teachers',
					description:
						'Paginated list with optional search and filters. Query: page, limit, search, sortBy (name|position|degree), sortDir (asc|desc), positions, degrees (comma-separated or repeated).',
					security: [],
					responses: {
						200: {
							description: 'teachers, total, totalPages, currentPage',
						},
					},
				},
			},
			'/api/teachers/filters': {
				get: {
					tags: ['Public'],
					summary: 'Teacher filter options',
					description: 'Distinct positions and academic degrees for UI filters.',
					security: [],
					responses: {
						200: {
							description: '{ positions: string[], degrees: string[] }',
						},
					},
				},
			},
			'/api/teachers/by-slug/{slug}': {
				get: {
					tags: ['Public'],
					summary: 'Teacher by slug',
					security: [],
					parameters: [
						{
							name: 'slug',
							in: 'path',
							required: true,
							schema: { type: 'string' },
						},
					],
					responses: {
						200: { description: 'Teacher record' },
						404: { description: 'Not found' },
					},
				},
			},
			'/api/graduates': {
				get: {
					tags: ['Public'],
					summary: 'List graduate cohorts',
					description: 'Optional query: year (filter by graduation year).',
					security: [],
					responses: {
						200: { description: 'Array of graduate cohort rows' },
					},
				},
			},
			'/api/graduates/years': {
				get: {
					tags: ['Public'],
					summary: 'Years aggregate',
					description: 'Per-year totals and cohort counts.',
					security: [],
					responses: {
						200: { description: 'Array of { year, totalStudents, totalWithHonours, cohortsCount }' },
					},
				},
			},
			'/api/graduates/specialties': {
				get: {
					tags: ['Public'],
					summary: 'Distinct specialties',
					security: [],
					responses: {
						200: { description: 'string[]' },
					},
				},
			},
			'/api/graduates/{year}': {
				get: {
					tags: ['Public'],
					summary: 'Graduate year detail',
					description: 'Merged cohort view for a single year (title, images, students).',
					security: [],
					parameters: [
						{
							name: 'year',
							in: 'path',
							required: true,
							schema: { type: 'integer' },
						},
					],
					responses: {
						200: { description: '{ year, title, images, students }' },
						400: { description: 'Invalid year' },
					},
				},
			},
			'/api/layout': {
				get: {
					tags: ['Public'],
					summary: 'Layout configuration',
					description: 'Header fields and section visibility/order for teacher profile UI.',
					security: [],
					responses: {
						200: {
							description: '{ headerFields, sections }',
						},
					},
				},
			},
		},
	});

	return ResponseWriter.Success(openapiDocument);
};
