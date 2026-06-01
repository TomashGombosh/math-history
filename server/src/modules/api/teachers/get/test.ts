import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers', () => {
		it('returns paginated teacher list shape', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				queryStringParameters: { page: '1', limit: '5' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as {
				teachers: unknown[];
				total: number;
				totalPages: number;
				currentPage: number;
			};
			expect(Array.isArray(body.teachers)).toBe(true);
			expect(typeof body.total).toBe('number');
			expect(typeof body.totalPages).toBe('number');
			expect(typeof body.currentPage).toBe('number');
		});
	});
