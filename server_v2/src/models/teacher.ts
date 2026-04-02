import z from 'zod';

export const publicationSchema = z.object({
	title: z.string().optional(),
	url: z.string().optional(),
	year: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const teacherPublicSchema = z.object({
	id: z.number(),
	name: z.string(),
	title: z.string().nullable().optional(),
	academicDegree: z.string().nullable().optional(),
	position: z.string().nullable().optional(),
	faculty: z.string().nullable().optional(),
	shortInformation: z.string().nullable().optional(),
	bio: z.string().nullable().optional(),
	publications: z.array(z.unknown()).default([]),
	imageUrl: z.string().nullable().optional(),
	slug: z.string(),
});

export const teacherCreateBodySchema = z.object({
	name: z.string().min(1),
	faculty: z.string().optional(),
	position: z.string().optional(),
	title: z.string().optional(),
	academicDegree: z.string().optional(),
	shortInformation: z.string().optional(),
	bio: z.string().optional(),
	imageUrl: z.string().optional(),
	publications: z.array(z.unknown()).optional(),
});

export const teacherUpdateBodySchema = teacherCreateBodySchema.partial();

export type TeacherPublic = z.infer<typeof teacherPublicSchema>;
export type TeacherCreateBody = z.infer<typeof teacherCreateBodySchema>;
export type TeacherUpdateBody = z.infer<typeof teacherUpdateBodySchema>;
