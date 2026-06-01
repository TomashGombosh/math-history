import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/filters', () => {
		it('returns positions and degrees arrays', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers/filters',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { positions: unknown[]; degrees: unknown[] };
			expect(Array.isArray(body.positions)).toBe(true);
			expect(Array.isArray(body.degrees)).toBe(true);
		});
	});
