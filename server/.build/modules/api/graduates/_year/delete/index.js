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
const graduate_service_1 = require("../../../../../services/graduate-service");
const handler = (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const yearNum = Number(ctx.req.params.year);
    if (!yearNum || Number.isNaN(yearNum)) {
        return response_writer_1.ResponseWriter.BadRequest({ message: 'Некоректний рік у URL' });
    }
    const res = yield (0, graduate_service_1.deleteGraduateByYear)(yearNum);
    if (!res) {
        return response_writer_1.ResponseWriter.NotFound({ message: `Випуск за ${yearNum} рік не знайдено` });
    }
    for (const url of res.imageUrls) {
        yield (0, image_s3_1.deleteImageFiles)(url);
    }
    return response_writer_1.ResponseWriter.Success({ ok: res.ok, year: res.year, id: res.ids[0] });
});
exports.handler = handler;
