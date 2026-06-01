import z from 'zod';

export const schema = z.object({
	year: z.coerce.number(),
	cursor: z.union([z.string(), z.number()]).optional(),
	exclusiveStartKey: z.string().optional(),
	limit: z.union([z.string(), z.number()]).optional(),
});
