import z from 'zod';

export const schema = z
	.object({
		page: z.union([z.string(), z.number()]).optional(),
		limit: z.union([z.string(), z.number()]).optional(),
		search: z.string().optional(),
		sortBy: z.enum(['position', 'degree', 'name']).optional(),
		sortDir: z.string().optional(),
		positions: z.union([z.string(), z.array(z.string())]).optional(),
		degrees: z.union([z.string(), z.array(z.string())]).optional(),
	})
	.passthrough();
