import { PK } from '@lib/dynamo-keys';
import { getItem, putItem } from '@lib/dynamo-operations';
import type { LayoutConfig } from '@models/layout';
import { layoutConfigSchema } from '@models/layout';

const SK_LAYOUT = 'LAYOUT';

const DEFAULT_CONFIG: LayoutConfig = {
	headerFields: [
		{ id: 'title', label: 'Title', visible: true, order: 1 },
		{
			id: 'academicDegree',
			label: 'Науковий ступінь',
			visible: true,
			order: 2,
		},
		{ id: 'position', label: 'Посада', visible: true, order: 3 },
		{ id: 'faculty', label: 'Факультет', visible: true, order: 4 },
	],
	sections: [
		{
			id: 'shortInformation',
			title: 'Коротка інформація',
			visible: true,
			order: 1,
		},
		{ id: 'bio', title: 'Біографія', visible: true, order: 2 },
		{ id: 'publications', title: 'Публікації', visible: true, order: 3 },
	],
};

export async function getLayoutConfig(): Promise<LayoutConfig> {
	const row = await getItem<Record<string, unknown>>({
		Key: { pk: PK.CONFIG, sk: SK_LAYOUT },
	});
	if (!row || !row.payload) {
		await putItem({
			Item: {
				pk: PK.CONFIG,
				sk: SK_LAYOUT,
				entityType: 'Layout',
				payload: DEFAULT_CONFIG,
			},
		});
		return DEFAULT_CONFIG;
	}
	const parsed = layoutConfigSchema.safeParse(row.payload);
	return parsed.success ? parsed.data : DEFAULT_CONFIG;
}

export async function saveLayoutConfig(cfg: LayoutConfig): Promise<void> {
	const parsed = layoutConfigSchema.parse(cfg);
	await putItem({
		Item: {
			pk: PK.CONFIG,
			sk: SK_LAYOUT,
			entityType: 'Layout',
			payload: parsed,
		},
	});
}
