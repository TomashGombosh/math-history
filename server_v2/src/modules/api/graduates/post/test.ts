import { TEST_GRADUATE_YEAR_CREATE, TEST_GRADUATE_YEAR_DELETE, TEST_GRADUATE_YEAR_UPDATE } from 'tests/consts';
import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';

async function deleteYearQuiet(wrapped: any, requestContext: unknown, token: string, year: number): Promise<void> {
	await wrapped.run({
		requestContext,
		path: `/api/graduates/${year}`,
		method: 'DELETE',
		headers: bearerJsonHeaders(token),
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/graduates', () => {
		let token: string;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
			await deleteYearQuiet(wrapped, requestContext, token, TEST_GRADUATE_YEAR_CREATE);
			await deleteYearQuiet(wrapped, requestContext, token, TEST_GRADUATE_YEAR_UPDATE);
			await deleteYearQuiet(wrapped, requestContext, token, TEST_GRADUATE_YEAR_DELETE);
		});

		afterAll(async () => {
			await deleteYearQuiet(wrapped, requestContext, token, TEST_GRADUATE_YEAR_CREATE);
		});

		it('creates a cohort and public year detail includes the student', async () => {
			const post = await wrapped.run({
				requestContext,
				path: '/api/graduates',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					year: TEST_GRADUATE_YEAR_CREATE,
					title: 'Integration cohort',
					students: [{ name: 'Student A', specialty: 'Math' }],
				}),
			});
			expect(post.statusCode).toBe(200);
			const created = jsonBody(post, expect) as { ok: boolean; year: number };
			expect(created.ok).toBe(true);
			expect(created.year).toBe(TEST_GRADUATE_YEAR_CREATE);

			const get = await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_CREATE}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(get.statusCode).toBe(200);
			const detail = jsonBody(get, expect) as { students: Array<{ name: string }> };
			const names = detail.students.map((s) => s.name);
			expect(names).toContain('Student A');
		});

		it('returns 401 without JWT', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/graduates',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					year: 1950,
					students: [{ name: 'NoAuthProbe' }],
				}),
			});
			expect(res.statusCode).toBe(401);
		});
	});
