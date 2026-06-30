import type {
	BatchWriteCommandInput,
	DeleteCommandInput,
	GetCommandInput,
	PutCommandInput,
	QueryCommandInput,
	ScanCommandInput,
	UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import {
	BatchWriteCommand,
	DeleteCommand,
	GetCommand,
	PutCommand,
	QueryCommand,
	ScanCommand,
	UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo-client';

function bulkTableName(): string {
	const name = process.env.BULK_DDB_TABLE;
	if (!name) {
		throw new Error('BULK_DDB_TABLE is not set');
	}
	return name;
}

export async function getBulkItem<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<GetCommandInput, 'TableName'> & { TableName?: string },
): Promise<T | undefined> {
	const res = await docClient.send(
		new GetCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
	return res.Item as T | undefined;
}

export async function putBulkItem(input: Omit<PutCommandInput, 'TableName'> & { TableName?: string }): Promise<void> {
	await docClient.send(
		new PutCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
}

export async function deleteBulkItem(
	input: Omit<DeleteCommandInput, 'TableName'> & { TableName?: string },
): Promise<void> {
	await docClient.send(
		new DeleteCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
}

export async function updateBulkItem(input: Omit<UpdateCommandInput, 'TableName'> & { TableName?: string }) {
	return docClient.send(
		new UpdateCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
}

export async function queryBulkItems<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<QueryCommandInput, 'TableName'> & { TableName?: string },
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
	const res = await docClient.send(
		new QueryCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
	return {
		items: (res.Items ?? []) as T[],
		lastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
	};
}

export async function scanBulkItems<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<ScanCommandInput, 'TableName'> & { TableName?: string },
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
	const res = await docClient.send(
		new ScanCommand({
			TableName: bulkTableName(),
			...input,
		}),
	);
	return {
		items: (res.Items ?? []) as T[],
		lastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
	};
}

const BATCH_WRITE_CHUNK = 25;

export async function batchWriteBulkItems(
	writeRequests: NonNullable<BatchWriteCommandInput['RequestItems']>[string],
): Promise<void> {
	if (writeRequests.length === 0) return;

	const table = bulkTableName();
	for (let offset = 0; offset < writeRequests.length; offset += BATCH_WRITE_CHUNK) {
		let pending = writeRequests.slice(offset, offset + BATCH_WRITE_CHUNK);
		while (pending.length > 0) {
			const res = await docClient.send(
				new BatchWriteCommand({
					RequestItems: { [table]: pending },
				}),
			);
			pending = res.UnprocessedItems?.[table] ?? [];
		}
	}
}
