import { adminToken, bearerJsonHeaders, jsonBody } from '@tests/helpers/http.js';
import { TINY_JPEG } from '@tests/helpers/binary.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/upload/presign', () => {
		let token: string;

		beforeAll(async () => {
			token = await adminToken(wrapped, requestContext, expect);
		});

		it('rejects unsupported content type (schema allows only jpeg, png, webp)', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/upload/presign',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					contentType: 'image/gif',
					originalFileName: 'a.gif',
				}),
			});
			expect([400, 415]).toContain(res.statusCode);
		});

		it('returns presigned PUT fields for a valid image request', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/upload/presign',
				method: 'POST',
				headers: bearerJsonHeaders(token),
				body: JSON.stringify({
					scope: 'common',
					contentType: 'image/jpeg',
					originalFileName: 'integration.jpg',
				}),
			});
			expect(res.statusCode).toBe(200);
			const body = jsonBody(res, expect) as {
				uploadUrl: string;
				method: string;
				headers: { 'Content-Type': string };
				s3: { bucket: string; key: string };
				imageUrl: string;
			};
			expect(body.method).toBe('PUT');
			expect(body.uploadUrl).toMatch(/^https?:\/\//);
			expect(body.s3.bucket).toBeTruthy();
			expect(body.s3.key).toContain('images/');
			expect(body.headers['Content-Type']).toBe('image/jpeg');

			if (!process.env.S3_ENDPOINT) {
				return;
			}

			const put = await fetch(body.uploadUrl, {
				method: 'PUT',
				headers: body.headers,
				body: TINY_JPEG,
			});
			expect(put.ok).toBe(true);
		});

		it('requires authentication', async () => {
			const res = await wrapped.run({
				requestContext,
				path: '/api/upload/presign',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contentType: 'image/jpeg',
					originalFileName: 'x.jpg',
				}),
			});
			expect(res.statusCode).toBe(401);
		});
	});
