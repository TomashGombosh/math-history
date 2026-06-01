import { queryItems } from '@lib/dynamo-operations';

export async function teacherSlugExists(slug: string): Promise<boolean> {
	const { items } = await queryItems({
		IndexName: 'GSI1',
		KeyConditionExpression: 'gsi1pk = :p',
		ExpressionAttributeValues: {
			':p': `SLUG#${slug}`,
		},
		Limit: 1,
	});
	return items.length > 0;
}
