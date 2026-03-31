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
const response_writer_1 = require("../../../../../lib/response-writer");
const teacher_service_1 = require("../../../../../services/teacher-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = Number(ctx.req.params.id);
    const teacher = yield (0, teacher_service_1.deleteTeacher)(id);
    if (!teacher) {
        return response_writer_1.ResponseWriter.NotFound({ message: 'Teacher not found' });
    }
    yield (0, image_s3_1.deleteImageFiles)((_a = teacher.imageUrl) !== null && _a !== void 0 ? _a : null);
    return response_writer_1.ResponseWriter.Success({ message: 'Deleted' });
});
exports.handler = handler;
