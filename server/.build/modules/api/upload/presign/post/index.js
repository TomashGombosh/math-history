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
const lambda_log_1 = require("../../../../../lib/lambda-log");
const response_writer_1 = require("../../../../../lib/response-writer");
const upload_service_1 = require("../../../../../services/upload-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, upload_service_1.createPresignedImageUpload)(ctx.req.body);
        return response_writer_1.ResponseWriter.Success(result);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg === 'UNSUPPORTED_MEDIA_TYPE') {
            return response_writer_1.ResponseWriter.UnsupportedMediaType({ message: 'Непідтримуваний формат зображення' });
        }
        (0, lambda_log_1.logException)('upload:presign_failed', e, ctx.correlationIds);
        return response_writer_1.ResponseWriter.InternalServerError({ message: 'Could not create upload URL' });
    }
});
exports.handler = handler;
