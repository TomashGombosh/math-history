import z from 'zod';

export const schema = z.object({
	scope: z.enum(['teacher', 'graduate', 'graduates', 'common']).optional(),
	contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
	originalFileName: z.string().min(1),
});
