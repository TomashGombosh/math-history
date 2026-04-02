import { PK } from '@lib/dynamo-keys';
import { updateItem } from '@lib/dynamo-operations';

export async function nextTeacherId(): Promise<number> {
	const res = await updateItem({
		Key: { pk: PK.META, sk: 'SEQ#TEACHER' },
		UpdateExpression: 'ADD #s :one',
		ExpressionAttributeNames: { '#s': 'seq' },
		ExpressionAttributeValues: { ':one': 1 },
		ReturnValues: 'UPDATED_NEW',
	});
	return Number((res as { Attributes?: { seq?: number } }).Attributes?.seq ?? 0);
}

export async function nextGraduateCohortId(): Promise<number> {
	const res = await updateItem({
		Key: { pk: PK.META, sk: 'SEQ#GRADUATE' },
		UpdateExpression: 'ADD #s :one',
		ExpressionAttributeNames: { '#s': 'seq' },
		ExpressionAttributeValues: { ':one': 1 },
		ReturnValues: 'UPDATED_NEW',
	});
	return Number((res as { Attributes?: { seq?: number } }).Attributes?.seq ?? 0);
}
