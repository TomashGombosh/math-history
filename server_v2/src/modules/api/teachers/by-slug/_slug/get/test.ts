import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/by-slug/:slug', () => {
		let token: string;
		let slug: string;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
			const suffix = Date.now().toString(36);
			const create = await wrapped.run({
				requestContext,
				path: '/api/teachers',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					name: `Slug Lookup ${suffix}`,
					position: 'Professor',
				}),
			});
			expect(create.statusCode).toBe(200);
			const t = jsonBody(create, expect) as { slug: string };
			slug = t.slug;
		});

		it('returns the teacher for an existing slug', async () => {
			const res = await wrapped.run({
				requestContext,
				path: `/api/teachers/by-slug/${encodeURIComponent(slug)}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { slug: string; name: string };
			expect(body.slug).toBe(slug);
			expect(body.name).toContain('Slug Lookup');
		});

		it('returns 404 for unknown slug', async () => {
			const res = await wrapped.run({
				requestContext,
				path: `/api/teachers/by-slug/${encodeURIComponent('no-such-slug-' + Date.now())}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(404);
		});
	});
