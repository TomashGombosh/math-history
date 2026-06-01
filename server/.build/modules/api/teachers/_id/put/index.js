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
const teacher_service_1 = require("../../../../../services/teacher-service");
const DEFAULT_TEACHER_IMAGE_URL = '/profile-icon.webp';
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const id = Number(ctx.req.params.id);
    try {
        const { teacher, oldImageUrl } = yield (0, teacher_service_1.updateTeacher)(id, ctx.req.body);
        const newImageUrl = teacher.imageUrl || null;
        if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl !== DEFAULT_TEACHER_IMAGE_URL) {
            yield (0, image_s3_1.deleteImageFiles)(oldImageUrl);
        }
        return response_writer_1.ResponseWriter.Success(teacher);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'NOT_FOUND') {
            return response_writer_1.ResponseWriter.NotFound({ message: 'Teacher not found' });
        }
        (0, lambda_log_1.logException)('teacher:update_failed', e, ctx.correlationIds);
        return response_writer_1.ResponseWriter.InternalServerError({ message: 'Error updating teacher' });
    }
});
exports.handler = handler;
