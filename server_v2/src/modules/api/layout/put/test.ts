import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('PUT /api/layout', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		it('round-trips layout config when saving the current public shape', async () => {
			const getRes = await wrapped.run({
				requestContext,
				path: '/api/layout',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(getRes.statusCode).toBe(200);
			const cfg = jsonBody(getRes, expect);

			const putRes = await wrapped.run({
				requestContext: adminRC,
				path: '/api/layout',
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(cfg),
			});
			expect(putRes.statusCode).toBe(200);
			const saved = jsonBody(putRes, expect) as { ok?: boolean };
			expect(saved.ok).toBe(true);

			const again = await wrapped.run({
				requestContext,
				path: '/api/layout',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(again.statusCode).toBe(200);
			const body2 = jsonBody(again, expect);
			expect(body2).toEqual(cfg);
		});

		it('rejects unauthenticated save', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/layout',
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ headerFields: [], sections: [] }),
			});
			expect(res.statusCode).toBe(401);
		});
	});
