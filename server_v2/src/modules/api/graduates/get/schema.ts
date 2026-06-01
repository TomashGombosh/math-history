import z from 'zod';

export const schema = z
	.object({
		year: z.string().optional(),
		cursor: z.union([z.string(), z.number()]).optional(),
		exclusiveStartKey: z.string().optional(),
		limit: z.union([z.string(), z.number()]).optional(),
	})
	.passthrough();
