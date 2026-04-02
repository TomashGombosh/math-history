import { TEST_GRADUATE_YEAR_DELETE } from 'tests/consts';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/graduates/:year', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		beforeAll(async () => {
			await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			const post = await wrapped.run({
				requestContext: adminRC,
				path: '/api/graduates',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					year: TEST_GRADUATE_YEAR_DELETE,
					students: [{ name: 'ToDelete' }],
				}),
			});
			expect(post.statusCode).toBe(200);
		});

		it('removes the year cohort', async () => {
			const del = await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(del.statusCode).toBe(200);
			const again = await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(again.statusCode).toBe(404);
		});
	});
