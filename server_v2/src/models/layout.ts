import z from 'zod';

export const layoutFieldSchema = z.object({
	id: z.string(),
	label: z.string(),
	visible: z.boolean(),
	order: z.number(),
});

export const layoutSectionSchema = z.object({
	id: z.string(),
	title: z.string(),
	visible: z.boolean(),
	order: z.number(),
});

export const layoutConfigSchema = z.object({
	headerFields: z.array(layoutFieldSchema),
	sections: z.array(layoutSectionSchema),
});

export type LayoutConfig = z.infer<typeof layoutConfigSchema>;
