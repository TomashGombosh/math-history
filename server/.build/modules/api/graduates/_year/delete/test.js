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
const consts_1 = require("../../../../../tests/consts");
const http_js_1 = require("../../../../../tests/helpers/http.js");
module.exports = (wrapped, expect, requestContext) => describe('DELETE /api/graduates/:year', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_DELETE}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        const post = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/graduates',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: consts_1.TEST_GRADUATE_YEAR_DELETE,
                students: [{ name: 'ToDelete' }],
            }),
        });
        expect(post.statusCode).toBe(200);
    }));
    it('removes the year cohort', () => __awaiter(void 0, void 0, void 0, function* () {
        const del = yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_DELETE}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(del.statusCode).toBe(200);
        const again = yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_DELETE}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(again.statusCode).toBe(404);
    }));
});
