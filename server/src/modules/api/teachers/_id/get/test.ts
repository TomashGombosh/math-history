import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/:id', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);
		let id: number;

		beforeAll(async () => {
			const create = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: `GetById ${Date.now().toString(36)}`,
				}),
			});
			expect(create.statusCode).toBe(200);
			id = (jsonBody(create, expect) as { id: number }).id;
		});

		it('returns teacher by id when authenticated', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: `/api/teachers/${id}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { id: number };
			expect(body.id).toBe(id);
		});

		it('returns 404 for missing id', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers/999999991',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(404);
		});
	});
