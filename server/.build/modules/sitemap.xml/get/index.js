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
const lambda_log_1 = require("../../../lib/lambda-log");
const response_writer_1 = require("../../../lib/response-writer");
const sitemap_service_1 = require("../../../services/sitemap-service");
exports.publicResource = true;
const XML_HEADERS = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
};
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const t0 = Date.now();
    const xml = yield (0, sitemap_service_1.buildSitemapXml)(ctx.req.headers);
    (0, lambda_log_1.logInfo)('sitemap:built', Object.assign(Object.assign({}, ctx.correlationIds), { service: 'math-history-server', durationMs: Date.now() - t0 }));
    return response_writer_1.ResponseWriter.Success(xml, XML_HEADERS);
});
exports.handler = handler;
