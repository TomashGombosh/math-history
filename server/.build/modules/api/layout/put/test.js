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
module.exports = (wrapped, expect, requestContext) => describe('PUT /api/layout', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    it('round-trips layout config when saving the current public shape', () => __awaiter(void 0, void 0, void 0, function* () {
        const getRes = yield wrapped.run({
            requestContext,
            path: '/api/layout',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(getRes.statusCode).toBe(200);
        const cfg = (0, http_js_1.jsonBody)(getRes, expect);
        const putRes = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/layout',
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cfg),
        });
        expect(putRes.statusCode).toBe(200);
        const saved = (0, http_js_1.jsonBody)(putRes, expect);
        expect(saved.ok).toBe(true);
        const again = yield wrapped.run({
            requestContext,
            path: '/api/layout',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(again.statusCode).toBe(200);
        const body2 = (0, http_js_1.jsonBody)(again, expect);
        expect(body2).toEqual(cfg);
    }));
    it('rejects unauthenticated save', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext,
            path: '/api/layout',
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headerFields: [], sections: [] }),
        });
        expect(res.statusCode).toBe(401);
    }));
});
