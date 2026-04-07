import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';
import { TINY_JPEG } from '@tests/helpers/binary.js';

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/upload/presign', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		it('rejects unsupported content type (schema allows only jpeg, png, webp)', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: '/api/upload/presign',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contentType: 'image/gif',
					originalFileName: 'a.gif',
				}),
			});
			expect([400, 415]).toContain(res.statusCode);
		});

		it('returns presigned PUT fields for a valid image request', async () => {
			const res = await wrapped.run({
				requestContext: adminRC,
				path: '/api/upload/presign',
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
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
				webpUrl: string;
				thumbUrl: string;
			};
			expect(body.method).toBe('PUT');
			expect(body.uploadUrl).toMatch(/^https?:\/\//);
			expect(body.s3.bucket).toBeTruthy();
			expect(body.s3.key).toContain('images/');
			expect(body.headers['Content-Type']).toBe('image/jpeg');
			expect(body.webpUrl).toContain('/images-webp/');
			expect(body.thumbUrl).toContain('/images-thumbs-webp/');

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

		it('uses teachers/ prefix and full imageUrl for teacher scope', async () => {
			const prev = process.env.TEACHER_IMAGE_CDN_BASE;
			process.env.TEACHER_IMAGE_CDN_BASE = 'https://assets-cdn.example.com';
			try {
				const res = await wrapped.run({
					requestContext: adminRC,
					path: '/api/upload/presign',
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						scope: 'teacher',
						contentType: 'image/png',
						originalFileName: 'photo.png',
					}),
				});
				expect(res.statusCode).toBe(200);
				const body = jsonBody(res, expect) as {
					s3: { key: string };
					imageUrl: string;
					webpUrl: string;
					thumbUrl: string;
				};
				expect(body.s3.key).toMatch(/^teachers\/[0-9a-f-]{36}\.png$/i);
				expect(body.imageUrl).toMatch(
					/^https:\/\/assets-cdn\.example\.com\/teachers\/[0-9a-f-]{36}\.png$/i,
				);
				expect(body.webpUrl).toMatch(
					/^https:\/\/assets-cdn\.example\.com\/teachers-webp\/[0-9a-f-]{36}\.webp$/i,
				);
				expect(body.thumbUrl).toMatch(
					/^https:\/\/assets-cdn\.example\.com\/teachers-thumbs-webp\/[0-9a-f-]{36}\.webp$/i,
				);
			} finally {
				if (prev === undefined) {
					delete process.env.TEACHER_IMAGE_CDN_BASE;
				} else {
					process.env.TEACHER_IMAGE_CDN_BASE = prev;
				}
			}
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
