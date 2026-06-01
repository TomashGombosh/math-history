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
module.exports = (wrapped, expect, requestContext) => describe('GET /api/teachers/meta', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    it('requires Cognito admin context', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext,
            path: '/api/teachers/meta',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.statusCode).toBe(401);
    }));
    it('returns meta aligned with filter facets', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/teachers/meta',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(res.statusCode).toBe(200);
        const body = (0, http_js_1.jsonBody)(res, expect);
        expect(Array.isArray(body.positions)).toBe(true);
        expect(Array.isArray(body.degrees)).toBe(true);
    }));
});
