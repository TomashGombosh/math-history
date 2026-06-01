module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('OpenAPI', () => {
		it('should get openapi document', async () => {
			const response = await wrapped.run({
				requestContext,
				path: `/openapi`,
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			expect(response.statusCode).toEqual(200);
			expect(response.body).toBeDefined();

			response.body = JSON.parse(response.body);

			expect(response.body).toBeDefined();
		});
	});
