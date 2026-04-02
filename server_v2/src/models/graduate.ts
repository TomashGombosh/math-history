import z from 'zod';

export const graduateStudentSchema = z.object({
	id: z.number().optional(),
	index: z.number().optional(),
	name: z.string(),
	specialty: z.string().optional(),
	section: z.string().optional(),
	year: z.number().optional(),
	honorsDegree: z.boolean().optional(),
}).passthrough();

export const graduateImageSchema = z
	.object({
		url: z.string().optional(),
	})
	.passthrough();

export const graduateCohortSchema = z.object({
	id: z.number(),
	year: z.number(),
	number: z.number().nullable().optional(),
	title: z.string().nullable().optional(),
	students: z.array(z.unknown()).default([]),
	images: z.array(z.unknown()).default([]),
	totalStudents: z.number(),
	totalWithHonours: z.number(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export const graduateCreateBodySchema = z.object({
	year: z.number(),
	title: z.string().optional(),
	images: z.array(z.unknown()).optional(),
	students: z.array(z.unknown()),
});

export const graduateUpdateBodySchema = graduateCreateBodySchema;

export type GraduateCohort = z.infer<typeof graduateCohortSchema>;
export type GraduateCreateBody = z.infer<typeof graduateCreateBodySchema>;
