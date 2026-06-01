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
exports.handler = void 0;
const image_s3_1 = require("../../../../../lib/image-s3");
const lambda_log_1 = require("../../../../../lib/lambda-log");
const response_writer_1 = require("../../../../../lib/response-writer");
const graduate_service_1 = require("../../../../../services/graduate-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = Number(ctx.req.params.year);
    if (!currentYear || Number.isNaN(currentYear)) {
        return response_writer_1.ResponseWriter.BadRequest({ message: 'Некоректний параметр year у URL' });
    }
    try {
        const res = yield (0, graduate_service_1.updateGraduateByYear)(currentYear, ctx.req.body);
        for (const url of res.removedUrls) {
            yield (0, image_s3_1.deleteImageFiles)(url);
        }
        return response_writer_1.ResponseWriter.Success({ ok: res.ok, year: res.year, id: res.id });
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'INVALID_YEAR') {
            return response_writer_1.ResponseWriter.BadRequest({ message: 'Некоректний рік випуску' });
        }
        if (msg === 'STUDENTS_REQUIRED' || msg === 'STUDENTS_EMPTY') {
            return response_writer_1.ResponseWriter.BadRequest({ message: 'Потрібно передати хоча б одного студента' });
        }
        if (msg === 'NOT_FOUND') {
            return response_writer_1.ResponseWriter.NotFound({ message: `Випуск за ${currentYear} рік не знайдено` });
        }
        if (msg === 'YEAR_EXISTS') {
            return response_writer_1.ResponseWriter.Conflict({ message: 'Випуск за цей рік уже існує' });
        }
        (0, lambda_log_1.logException)('graduate:update_failed', e, ctx.correlationIds);
        return response_writer_1.ResponseWriter.InternalServerError({ message: 'Error updating graduate' });
    }
});
exports.handler = handler;
