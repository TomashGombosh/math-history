import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/meta', () => {
		let token: string;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
		});

		it('requires admin JWT', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers/meta',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(401);
		});

		it('returns meta aligned with filter facets', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers/meta',
				method: 'GET',
				headers: bearerJsonHeaders(token),
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { positions: unknown[]; degrees: unknown[] };
			expect(Array.isArray(body.positions)).toBe(true);
			expect(Array.isArray(body.degrees)).toBe(true);
		});
	});
