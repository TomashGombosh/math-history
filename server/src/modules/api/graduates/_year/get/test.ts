import { TEST_GRADUATE_YEAR_EMPTY } from 'tests/consts';
import { jsonBody } from '@tests/helpers/http.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/graduates/:year', () => {
		it('returns merged year detail (empty cohort when none stored)', async () => {
			const res = await wrapped.run({
				requestContext,
				path: `/api/graduates/${TEST_GRADUATE_YEAR_EMPTY}`,
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as {
				year: number;
				students: unknown[];
				images: unknown[];
			};
			expect(body.year).toBe(TEST_GRADUATE_YEAR_EMPTY);
			expect(Array.isArray(body.students)).toBe(true);
			expect(Array.isArray(body.images)).toBe(true);
		});
	});
