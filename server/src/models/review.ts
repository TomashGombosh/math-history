import { z } from 'zod';

export const reviewComponentSchema = z.object({
	type: z.enum(['teacher', 'graduate', 'page', 'other']),
	id: z.string().trim().max(200).optional(),
	label: z.string().trim().min(1).max(200),
	url: z.string().trim().url().max(500).optional(),
});

export const reviewCreateBodySchema = z.object({
	email: z.string().trim().email().max(254),
	comment: z.string().trim().min(3).max(2000),
	component: reviewComponentSchema,
});

export type ReviewCreateBody = z.infer<typeof reviewCreateBodySchema>;
