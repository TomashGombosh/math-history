import z from 'zod';

export const schema = z.object({}).strict();

export type GetOpenapiRequest = z.infer<typeof schema>;
