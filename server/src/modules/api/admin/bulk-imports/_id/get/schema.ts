import z from 'zod';

export const schema = z
	.object({
		id: z.string().uuid(),
		limit: z.union([z.string(), z.number()]).optional(),
		exclusiveStartKey: z.string().optional(),
	})
	.passthrough();
