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
module.exports = (wrapped, expect, requestContext) => describe('PUT /api/graduates/:year', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_UPDATE}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        const post = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/graduates',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: consts_1.TEST_GRADUATE_YEAR_UPDATE,
                students: [{ name: 'BeforePut', specialty: 'Physics' }],
            }),
        });
        expect(post.statusCode).toBe(200);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_UPDATE}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
    }));
    it('updates cohort students in place', () => __awaiter(void 0, void 0, void 0, function* () {
        const put = yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_UPDATE}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: consts_1.TEST_GRADUATE_YEAR_UPDATE,
                title: 'Updated title',
                students: [{ name: 'AfterPut', specialty: 'Physics' }],
            }),
        });
        expect(put.statusCode).toBe(200);
        const body = (0, http_js_1.jsonBody)(put, expect);
        expect(body.ok).toBe(true);
        expect(body.year).toBe(consts_1.TEST_GRADUATE_YEAR_UPDATE);
        const get = yield wrapped.run({
            requestContext,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_UPDATE}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(get.statusCode).toBe(200);
        const detail = (0, http_js_1.jsonBody)(get, expect);
        expect(detail.students.some((s) => s.name === 'AfterPut')).toBe(true);
    }));
});
