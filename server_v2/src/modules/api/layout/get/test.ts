import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/layout', () => {
		it('returns headerFields and sections', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/layout',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as {
				headerFields: unknown[];
				sections: unknown[];
			};
			expect(Array.isArray(body.headerFields)).toBe(true);
			expect(Array.isArray(body.sections)).toBe(true);
			expect(body.headerFields.length).toBeGreaterThan(0);
		});
	});
