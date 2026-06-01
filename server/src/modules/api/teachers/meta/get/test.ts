import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/teachers/meta', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		it('requires Cognito admin context', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers/meta',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(401);
		});

		it('returns meta aligned with filter facets', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers/meta',
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { positions: unknown[]; degrees: unknown[] };
			expect(Array.isArray(body.positions)).toBe(true);
			expect(Array.isArray(body.degrees)).toBe(true);
		});
	});
