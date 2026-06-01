import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/teachers/:id', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);
		let id: number;

		beforeAll(async () => {
			const create = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: `DeleteMe ${Date.now().toString(36)}`,
				}),
			});
			expect(create.statusCode).toBe(200);
			id = (jsonBody(create, expect) as { id: number }).id;
		});

		it('deletes teacher and follow-up GET is 404', async () => {
			const del = await wrapped.run({
				requestContext: adminRC,
				path: `/api/teachers/${id}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(del.statusCode).toBe(200);

			const get = await wrapped.run({
				requestContext: adminRC,
				path: `/api/teachers/${id}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(get.statusCode).toBe(404);
		});
	});
