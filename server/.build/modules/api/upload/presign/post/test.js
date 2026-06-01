"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_js_1 = require("../../../../../tests/helpers/http.js");
const binary_js_1 = require("../../../../../tests/helpers/binary.js");
module.exports = (wrapped, expect, requestContext) => describe('POST /api/upload/presign', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    it('rejects unsupported content type (schema allows only jpeg, png, webp)', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
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
    }));
    it('returns presigned PUT fields for a valid image request', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
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
        const body = (0, http_js_1.jsonBody)(res, expect);
        expect(body.method).toBe('PUT');
        expect(body.uploadUrl).toMatch(/^https?:\/\//);
        expect(body.s3.bucket).toBeTruthy();
        expect(body.s3.key).toContain('images/');
        expect(body.headers['Content-Type']).toBe('image/jpeg');
        if (!process.env.S3_ENDPOINT) {
            return;
        }
        const put = yield fetch(body.uploadUrl, {
            method: 'PUT',
            headers: body.headers,
            body: binary_js_1.TINY_JPEG,
        });
        expect(put.ok).toBe(true);
    }));
    it('requires authentication', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
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
    }));
});
