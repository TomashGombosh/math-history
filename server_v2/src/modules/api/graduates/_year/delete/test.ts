import { TEST_GRADUATE_YEAR_DELETE } from 'tests/consts';
import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('DELETE /api/graduates/:year', () => {
		let token: string;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
			await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: bearerJsonHeaders(token),
			});
			const post = await wrapped.run({
				requestContext,
				path: '/api/graduates',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					year: TEST_GRADUATE_YEAR_DELETE,
					students: [{ name: 'ToDelete' }],
				}),
			});
			expect(post.statusCode).toBe(200);
		});

		it('removes the year cohort', async () => {
			const del = await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: bearerJsonHeaders(token),
			});
			expect(del.statusCode).toBe(200);
			const again = await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_DELETE}`,
				method: 'DELETE',
				headers: bearerJsonHeaders(token),
			});
			expect(again.statusCode).toBe(404);
		});
	});
