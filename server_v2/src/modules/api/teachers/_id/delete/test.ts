import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/teachers/:id', () => {
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
					name: `DeleteMe ${Date.now().toString(36)}`,
				}),
			});
			expect(create.statusCode).toBe(200);
			id = (jsonBody(create, expect) as { id: number }).id;
		});

		it('deletes teacher and follow-up GET is 404', async () => {
			const del = await wrapped.run({
				requestContext,
				path: `/api/teachers/${id}`,
				method: 'DELETE',
				headers: bearerJsonHeaders(token),
			});
			expect(del.statusCode).toBe(200);

			const get = await wrapped.run({
				requestContext,
				path: `/api/teachers/${id}`,
				method: 'GET',
				headers: bearerJsonHeaders(token),
			});
			expect(get.statusCode).toBe(404);
		});
	});
