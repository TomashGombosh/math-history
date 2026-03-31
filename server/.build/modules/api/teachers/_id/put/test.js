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
module.exports = (wrapped, expect, requestContext) => describe('PUT /api/teachers/:id', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    let id;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const create = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/teachers',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `PutTarget ${Date.now().toString(36)}`,
                title: 'Before',
            }),
        });
        expect(create.statusCode).toBe(200);
        id = (0, http_js_1.jsonBody)(create, expect).id;
    }));
    it('updates fields on existing teacher', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext: adminRC,
            path: `/api/teachers/${id}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'After update' }),
        });
        expect(res.statusCode).toBe(200);
        const body = (0, http_js_1.jsonBody)(res, expect);
        expect(body.id).toBe(id);
        expect(body.title).toBe('After update');
    }));
});
