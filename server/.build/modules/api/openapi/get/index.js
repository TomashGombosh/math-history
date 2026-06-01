"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.publicResource = void 0;
const zod_openapi_1 = require("zod-openapi");
const response_writer_1 = require("../../../../lib/response-writer");
exports.publicResource = true;
const PUBLIC_DESCRIPTION = `
## Authentication

- **Public** operations do not require a token (see paths tagged **Public**).
- **Protected** operations require a valid **Amazon Cognito** access or ID token (JWT) in \`Authorization: Bearer <token>\`. API Gateway validates the JWT before invoking Lambda; the app checks \`cognito:groups\` (include \`admin\`) or claim \`role: admin\`.

## Public API surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | /openapi | This OpenAPI document |
| GET | /api/teachers | Paginated teacher list (query: page, limit, search, sortBy, sortDir, positions, degrees) |
| GET | /api/teachers/filters | Distinct positions and degrees for filters |
| GET | /api/teachers/by-slug/{slug} | Teacher by URL slug |
| GET | /api/graduates | Graduate cohorts (optional query: year) |
| GET | /api/graduates/years | Aggregated stats per year |
| GET | /api/graduates/specialties | Distinct student specialties |
| GET | /api/graduates/{year} | Single year cohort (merged view) |
| GET | /api/layout | Public layout / field visibility config |
| GET | /sitemap.xml | Dynamic XML sitemap (teachers, graduates, static pages) |

All other routes under \`/api/*\` require authentication unless otherwise noted.
`.trim();
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const openapiDocument = (0, zod_openapi_1.createDocument)({
        openapi: '3.0.0',
        info: {
            title: 'math-history-server',
            version: '1.0.0',
            description: PUBLIC_DESCRIPTION,
        },
        servers: [
            {
                url: `https://${(_b = (_a = ctx.req.headers.host) !== null && _a !== void 0 ? _a : ctx.req.headers.Host) !== null && _b !== void 0 ? _b : 'localhost'}/`,
                description: 'Base URL for the math-history-server',
            },
        ],
        tags: [{ name: 'Public', description: 'No authentication required.' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Amazon Cognito JWT (admin group or role claim).',
                },
            },
        },
        paths: {
            '/sitemap.xml': {
                get: {
                    tags: ['Public'],
                    summary: 'XML sitemap',
                    description: 'Search-engine sitemap for public pages (`/`, `/teachers`, `/teacher/{slug}`, `/graduates`, `/graduates/{year}`).',
                    security: [],
                    responses: {
                        200: {
                            description: 'application/xml sitemap',
                        },
                    },
                },
            },
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
            '/api/teachers': {
                get: {
                    tags: ['Public'],
                    summary: 'List teachers',
                    description: 'Paginated list with optional search and filters. Query: page, limit, search, sortBy (name|position|degree), sortDir (asc|desc), positions, degrees (comma-separated or repeated).',
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
    return response_writer_1.ResponseWriter.Success(openapiDocument);
});
exports.handler = handler;
