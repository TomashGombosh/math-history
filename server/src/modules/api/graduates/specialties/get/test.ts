import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/graduates/specialties', () => {
		it('returns specialty strings', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/graduates/specialties',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect);
			expect(Array.isArray(body)).toBe(true);
		});
	});
