import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/:id', () => {
		let token: string;
		let id: number;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
			const create = await wrapped.run({
				requestContext,
				path: '/api/teachers',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					name: `GetById ${Date.now().toString(36)}`,
				}),
			});
			expect(create.statusCode).toBe(200);
			id = (jsonBody(create, expect) as { id: number }).id;
		});

		it('returns teacher by id when authenticated', async () => {
			const res = await wrapped.run({
				requestContext,
				path: `/api/teachers/${id}`,
				method: 'GET',
				headers: bearerJsonHeaders(token),
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { id: number };
			expect(body.id).toBe(id);
		});

		it('returns 404 for missing id', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers/999999991',
				method: 'GET',
				headers: bearerJsonHeaders(token),
			});
			expect(res.statusCode).toBe(404);
		});
	});
