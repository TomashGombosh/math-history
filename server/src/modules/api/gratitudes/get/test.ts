import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/gratitudes', () => {
		it('returns paginated shape', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/gratitudes',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { gratitudes: unknown[]; lastEvaluatedKey: unknown };
			expect(Array.isArray(body.gratitudes)).toBe(true);
			expect(body).toHaveProperty('lastEvaluatedKey');
		});
	});
