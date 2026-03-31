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
exports.handler = exports.publicResource = void 0;
const response_writer_1 = require("../../../../lib/response-writer");
const teacher_service_1 = require("../../../../services/teacher-service");
exports.publicResource = true;
function normalizeToArray(v) {
    if (!v)
        return [];
    if (Array.isArray(v))
        return v.filter(Boolean).map(String);
    if (typeof v === 'string') {
        return v
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const q = ctx.req.params;
    let page = parseInt(String((_a = q.page) !== null && _a !== void 0 ? _a : '1'), 10) || 1;
    let limit = parseInt(String((_b = q.limit) !== null && _b !== void 0 ? _b : '24'), 10) || 24;
    const search = String((_c = q.search) !== null && _c !== void 0 ? _c : '');
    const sortBy = q.sortBy ? String(q.sortBy) : undefined;
    const sortDir = String((_d = q.sortDir) !== null && _d !== void 0 ? _d : 'asc');
    const positionsParam = (_e = q.positions) !== null && _e !== void 0 ? _e : q['positions[]'];
    const degreesParam = (_f = q.degrees) !== null && _f !== void 0 ? _f : q['degrees[]'];
    const positionsArr = normalizeToArray(positionsParam);
    const degreesArr = normalizeToArray(degreesParam);
    const result = yield (0, teacher_service_1.listTeachers)({
        page,
        limit,
        search,
        sortBy,
        sortDir,
        positions: positionsArr,
        degrees: degreesArr,
    });
    return response_writer_1.ResponseWriter.Success(result);
});
exports.handler = handler;
