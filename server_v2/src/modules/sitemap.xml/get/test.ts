module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /sitemap.xml', () => {
		it('returns 200 XML urlset without auth', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/sitemap.xml',
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					host: 'example.com',
					'x-forwarded-proto': 'https',
				},
			});
			expect(res.statusCode).toBe(200);
			expect(res.headers?.['Content-Type'] || res.headers?.['content-type']).toContain('application/xml');
			const body = String(res.body ?? '');
			expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
			expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
			expect(body).toContain('<loc>https://example.com/</loc>');
			expect(body).toContain('<loc>https://example.com/teachers</loc>');
			expect(body).toContain('<loc>https://example.com/graduates</loc>');
		});
	});
