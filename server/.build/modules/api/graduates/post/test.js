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
const consts_1 = require("../../../../tests/consts");
const http_js_1 = require("../../../../tests/helpers/http.js");
function deleteYearQuiet(wrapped, adminRC, year) {
    return __awaiter(this, void 0, void 0, function* () {
        yield wrapped.run({
            requestContext: adminRC,
            path: `/api/graduates/${year}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
    });
}
module.exports = (wrapped, expect, requestContext) => describe('POST /api/graduates', () => {
    const adminRC = (0, http_js_1.withCognitoAdminAuthorizer)(requestContext);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteYearQuiet(wrapped, adminRC, consts_1.TEST_GRADUATE_YEAR_CREATE);
        yield deleteYearQuiet(wrapped, adminRC, consts_1.TEST_GRADUATE_YEAR_UPDATE);
        yield deleteYearQuiet(wrapped, adminRC, consts_1.TEST_GRADUATE_YEAR_DELETE);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield deleteYearQuiet(wrapped, adminRC, consts_1.TEST_GRADUATE_YEAR_CREATE);
    }));
    it('creates a cohort and public year detail includes the student', () => __awaiter(void 0, void 0, void 0, function* () {
        const post = yield wrapped.run({
            requestContext: adminRC,
            path: '/api/graduates',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: consts_1.TEST_GRADUATE_YEAR_CREATE,
                title: 'Integration cohort',
                students: [{ name: 'Student A', specialty: 'Math' }],
            }),
        });
        expect(post.statusCode).toBe(200);
        const created = (0, http_js_1.jsonBody)(post, expect);
        expect(created.ok).toBe(true);
        expect(created.year).toBe(consts_1.TEST_GRADUATE_YEAR_CREATE);
        const get = yield wrapped.run({
            requestContext,
            path: `/api/graduates/${consts_1.TEST_GRADUATE_YEAR_CREATE}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(get.statusCode).toBe(200);
        const detail = (0, http_js_1.jsonBody)(get, expect);
        const names = detail.students.map((s) => s.name);
        expect(names).toContain('Student A');
    }));
    it('returns 401 without admin authorizer context', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield wrapped.run({
            requestContext,
            path: '/api/graduates',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                year: 1950,
                students: [{ name: 'NoAuthProbe' }],
            }),
        });
        expect(res.statusCode).toBe(401);
    }));
});
