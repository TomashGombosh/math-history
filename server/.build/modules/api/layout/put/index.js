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
const layout_service_1 = require("../../../../services/layout-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const body = ctx.req.body;
    if (!body || !Array.isArray(body.headerFields) || !Array.isArray(body.sections)) {
        return response_writer_1.ResponseWriter.BadRequest({ message: 'Invalid config format' });
    }
    try {
        yield (0, layout_service_1.saveLayoutConfig)(body);
        return response_writer_1.ResponseWriter.Success({ ok: true });
    }
    catch (e) {
        (0, lambda_log_1.logException)('layout:put_failed', e, ctx.correlationIds);
        return response_writer_1.ResponseWriter.InternalServerError({ message: 'Cannot save layout config' });
    }
});
exports.handler = handler;
