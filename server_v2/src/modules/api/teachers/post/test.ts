import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/teachers', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);
		const uniqueSuffix = Date.now().toString(36);

		it('creates a teacher and returns id and slug', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: '/api/teachers',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: `Integration Teacher ${uniqueSuffix}`,
					position: 'Assoc. Prof.',
					faculty: 'Math',
					academicDegree: 'Ph.D.',
				}),
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as { id: number; slug: string; name: string };
			expect(typeof body.id).toBe('number');
			expect(body.slug.length).toBeGreaterThan(0);
			expect(body.name).toContain('Integration Teacher');
		});

		it('rejects anonymous create', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/teachers',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'X' }),
			});
			expect(res.statusCode).toBe(401);
		});
	});
