"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.schema = zod_1.default
    .object({
    page: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).optional(),
    limit: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).optional(),
    search: zod_1.default.string().optional(),
    sortBy: zod_1.default.enum(['position', 'degree', 'name']).optional(),
    sortDir: zod_1.default.string().optional(),
    positions: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]).optional(),
    degrees: zod_1.default.union([zod_1.default.string(), zod_1.default.array(zod_1.default.string())]).optional(),
})
    .passthrough();
