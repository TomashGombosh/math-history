import z from 'zod';

export const schema = z.object({}).passthrough();

export type GetOpenapiRequest = z.infer<typeof schema>;
