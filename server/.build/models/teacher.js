"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherUpdateBodySchema = exports.teacherCreateBodySchema = exports.teacherPublicSchema = exports.publicationSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.publicationSchema = zod_1.default
    .object({
    title: zod_1.default.string().optional(),
    url: zod_1.default.string().optional(),
    year: zod_1.default.union([zod_1.default.string(), zod_1.default.number()]).optional(),
})
    .passthrough();
exports.teacherPublicSchema = zod_1.default.object({
    id: zod_1.default.number(),
    name: zod_1.default.string(),
    title: zod_1.default.string().nullable().optional(),
    academicDegree: zod_1.default.string().nullable().optional(),
    position: zod_1.default.string().nullable().optional(),
    faculty: zod_1.default.string().nullable().optional(),
    shortInformation: zod_1.default.string().nullable().optional(),
    bio: zod_1.default.string().nullable().optional(),
    publications: zod_1.default.array(zod_1.default.unknown()).default([]),
    imageUrl: zod_1.default.string().nullable().optional(),
    slug: zod_1.default.string(),
});
exports.teacherCreateBodySchema = zod_1.default.object({
    name: zod_1.default.string().min(1),
    faculty: zod_1.default.string().optional(),
    position: zod_1.default.string().optional(),
    title: zod_1.default.string().optional(),
    academicDegree: zod_1.default.string().optional(),
    shortInformation: zod_1.default.string().optional(),
    bio: zod_1.default.string().optional(),
    imageUrl: zod_1.default.string().optional(),
    publications: zod_1.default.array(zod_1.default.unknown()).optional(),
});
exports.teacherUpdateBodySchema = exports.teacherCreateBodySchema.partial();
