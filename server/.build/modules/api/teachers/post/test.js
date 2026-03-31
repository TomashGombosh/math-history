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
const http_js_1 = require("../../../../tests/helpers/http.js");
module.exports = (wrapped, expect, requestContext) => describe('POST /api/teachers', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    const uniqueSuffix = Date.now().toString(36);
    it('creates a teacher and returns id and slug', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/teachers',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Integration Teacher ${uniqueSuffix}`,
                position: 'Assoc. Prof.',
                faculty: 'Math',
                academicDegree: 'Ph.D.',
            }),
        });
        expect(res.statusCode).toBe(200);
        const body = (0, http_js_1.jsonBody)(res, expect);
        expect(typeof body.id).toBe('number');
        expect(body.slug.length).toBeGreaterThan(0);
        expect(body.name).toContain('Integration Teacher');
    }));
    it('rejects anonymous create', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext,
            path: '/api/teachers',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'X' }),
        });
        expect(res.statusCode).toBe(401);
    }));
});
