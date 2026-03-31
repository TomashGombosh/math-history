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
const lambda_log_1 = require("../../../../lib/lambda-log");
const response_writer_1 = require("../../../../lib/response-writer");
const teacher_service_1 = require("../../../../services/teacher-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teacher = yield (0, teacher_service_1.createTeacher)(ctx.req.body);
        return response_writer_1.ResponseWriter.Success(teacher);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'NAME_REQUIRED') {
            return response_writer_1.ResponseWriter.BadRequest({ message: "Поле name є обов'язковим" });
        }
        if (msg === 'SLUG_CONFLICT') {
            return response_writer_1.ResponseWriter.BadRequest({ message: 'Викладач із таким slug уже існує' });
        }
        (0, lambda_log_1.logException)('teacher:create_failed', e, ctx.correlationIds);
        return response_writer_1.ResponseWriter.InternalServerError({ message: 'Error creating teacher' });
    }
});
exports.handler = handler;
