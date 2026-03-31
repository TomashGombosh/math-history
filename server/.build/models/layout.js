"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutConfigSchema = exports.layoutSectionSchema = exports.layoutFieldSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.layoutFieldSchema = zod_1.default.object({
    id: zod_1.default.string(),
    label: zod_1.default.string(),
    visible: zod_1.default.boolean(),
    order: zod_1.default.number(),
});
exports.layoutSectionSchema = zod_1.default.object({
    id: zod_1.default.string(),
    title: zod_1.default.string(),
    visible: zod_1.default.boolean(),
    order: zod_1.default.number(),
});
exports.layoutConfigSchema = zod_1.default.object({
    headerFields: zod_1.default.array(exports.layoutFieldSchema),
    sections: zod_1.default.array(exports.layoutSectionSchema),
});
