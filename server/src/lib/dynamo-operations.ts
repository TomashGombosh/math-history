import type {
	DeleteCommandInput,
	GetCommandInput,
	PutCommandInput,
	QueryCommandInput,
	ScanCommandInput,
	UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import type { TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import {
	DeleteCommand,
	GetCommand,
	PutCommand,
	QueryCommand,
	ScanCommand,
	TransactWriteCommand,
	UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from './dynamo-client';

function tableName(): string {
	const name = process.env.DYNAMODB_TABLE_NAME;
	if (!name) {
		throw new Error('DYNAMODB_TABLE_NAME is not set');
	}
	return name;
}

export async function getItem<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<GetCommandInput, 'TableName'> & { TableName?: string },
): Promise<T | undefined> {
	const res = await docClient.send(
		new GetCommand({
			TableName: tableName(),
			...input,
		}),
	);
	return res.Item as T | undefined;
}

export async function putItem(input: Omit<PutCommandInput, 'TableName'> & { TableName?: string }): Promise<void> {
	await docClient.send(
		new PutCommand({
			TableName: tableName(),
			...input,
		}),
	);
}

export async function deleteItem(input: Omit<DeleteCommandInput, 'TableName'> & { TableName?: string }): Promise<void> {
	await docClient.send(
		new DeleteCommand({
			TableName: tableName(),
			...input,
		}),
	);
}

export async function updateItem(input: Omit<UpdateCommandInput, 'TableName'> & { TableName?: string }) {
	return docClient.send(
		new UpdateCommand({
			TableName: tableName(),
			...input,
		}),
	);
}

export async function queryItems<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<QueryCommandInput, 'TableName'> & { TableName?: string },
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
	const res = await docClient.send(
		new QueryCommand({
			TableName: tableName(),
			...input,
		}),
	);
	return {
		items: (res.Items ?? []) as T[],
		lastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
	};
}

export async function scanItems<T extends Record<string, unknown> = Record<string, unknown>>(
	input: Omit<ScanCommandInput, 'TableName'> & { TableName?: string },
): Promise<{ items: T[]; lastEvaluatedKey?: Record<string, unknown> }> {
	const res = await docClient.send(
		new ScanCommand({
			TableName: tableName(),
			...input,
		}),
	);
	return {
		items: (res.Items ?? []) as T[],
		lastEvaluatedKey: res.LastEvaluatedKey as Record<string, unknown> | undefined,
	};
}

export async function transactWrite(input: TransactWriteCommandInput) {
	return docClient.send(new TransactWriteCommand(input));
}
