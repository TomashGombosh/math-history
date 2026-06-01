import { TEST_GRADUATE_YEAR_UPDATE } from 'tests/consts';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('PUT /api/graduates/:year', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		beforeAll(async () => {
			await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_UPDATE}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			const post = await wrapped.run({
				requestContext: adminRC,
				path: '/api/graduates',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					year: TEST_GRADUATE_YEAR_UPDATE,
					students: [{ name: 'BeforePut', specialty: 'Physics' }],
				}),
			});
			expect(post.statusCode).toBe(200);
		});

		afterAll(async () => {
			await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_UPDATE}`,
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
		});

		it('updates cohort students in place', async () => {
			const put = await wrapped.run({
				requestContext: adminRC,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_UPDATE}`,
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					year: TEST_GRADUATE_YEAR_UPDATE,
					title: 'Updated title',
					students: [{ name: 'AfterPut', specialty: 'Physics' }],
				}),
			});
			expect(put.statusCode).toBe(200);
			const body = jsonBody(put, expect) as { ok: boolean; year: number };
			expect(body.ok).toBe(true);
			expect(body.year).toBe(TEST_GRADUATE_YEAR_UPDATE);

			const get = await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_UPDATE}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(get.statusCode).toBe(200);
			const detail = jsonBody(get, expect) as { students: Array<{ name: string }> };
			expect(detail.students.some((s) => s.name === 'AfterPut')).toBe(true);
		});
	});
