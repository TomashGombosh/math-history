import z from 'zod';

export const schema = z
	.object({
		year: z.string().optional(),
	})
	.passthrough();
