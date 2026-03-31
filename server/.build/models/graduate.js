"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.graduateUpdateBodySchema = exports.graduateCreateBodySchema = exports.graduateCohortSchema = exports.graduateImageSchema = exports.graduateStudentSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.graduateStudentSchema = zod_1.default
    .object({
    id: zod_1.default.number().optional(),
    index: zod_1.default.number().optional(),
    name: zod_1.default.string(),
    specialty: zod_1.default.string().optional(),
    section: zod_1.default.string().optional(),
    year: zod_1.default.number().optional(),
    honorsDegree: zod_1.default.boolean().optional(),
})
    .passthrough();
exports.graduateImageSchema = zod_1.default
    .object({
    url: zod_1.default.string().optional(),
})
    .passthrough();
exports.graduateCohortSchema = zod_1.default.object({
    id: zod_1.default.number(),
    year: zod_1.default.number(),
    number: zod_1.default.number().nullable().optional(),
    title: zod_1.default.string().nullable().optional(),
    students: zod_1.default.array(zod_1.default.unknown()).default([]),
    images: zod_1.default.array(zod_1.default.unknown()).default([]),
    totalStudents: zod_1.default.number(),
    totalWithHonours: zod_1.default.number(),
    createdAt: zod_1.default.string().optional(),
    updatedAt: zod_1.default.string().optional(),
});
exports.graduateCreateBodySchema = zod_1.default.object({
    year: zod_1.default.number(),
    title: zod_1.default.string().optional(),
    images: zod_1.default.array(zod_1.default.unknown()).optional(),
    students: zod_1.default.array(zod_1.default.unknown()),
});
exports.graduateUpdateBodySchema = exports.graduateCreateBodySchema;
