"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.schema = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
