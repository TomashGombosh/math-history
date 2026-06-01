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
const response_writer_1 = require("../../../../../lib/response-writer");
const graduate_service_1 = require("../../../../../services/graduate-service");
exports.publicResource = true;
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, graduate_service_1.getYearsSummary)(ctx.correlationIds);
    return response_writer_1.ResponseWriter.Success(rows);
});
exports.handler = handler;
