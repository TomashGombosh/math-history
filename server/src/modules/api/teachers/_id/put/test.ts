import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('PUT /api/teachers/:id', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);
		let id: number;

		beforeAll(async () => {
			const create = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: `PutTarget ${Date.now().toString(36)}`,
					title: 'Before',
				}),
			});
			expect(create.statusCode).toBe(200);
			id = (jsonBody(create, expect) as { id: number }).id;
		});

		it('updates fields on existing teacher', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: `/api/teachers/${id}`,
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'After update' }),
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { id: number; title: string | null };
			expect(body.id).toBe(id);
			expect(body.title).toBe('After update');
		});
	});
