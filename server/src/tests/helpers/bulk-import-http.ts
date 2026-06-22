import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { updateBulkItem } from '@lib/bulk-dynamo';

export const BULK_HTTP_TEST_TABLE = 'math-history-bulkimport-http-test';

export const bulkHttpSkipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-import HTTP integration tests.';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();

export const ddbAdmin =
	DYNAMODB_ENDPOINT &&
	new DynamoDBClient({
		region: process.env.AWS_REGION || 'eu-north-1',
		endpoint: DYNAMODB_ENDPOINT,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
		},
	});

export async function ensureBulkHttpTable(): Promise<void> {
	if (!ddbAdmin) return;

	try {
		await ddbAdmin.send(new DescribeTableCommand({ TableName: BULK_HTTP_TEST_TABLE }));
		return;
	} catch {
		// create below
	}

	await ddbAdmin.send(
		new CreateTableCommand({
			TableName: BULK_HTTP_TEST_TABLE,
			BillingMode: 'PAY_PER_REQUEST',
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
			],
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' },
			],
		}),
	);

	for (let i = 0; i < 30; i += 1) {
		try {
			const desc = await ddbAdmin.send(new DescribeTableCommand({ TableName: BULK_HTTP_TEST_TABLE }));
			if (desc.Table?.TableStatus === 'ACTIVE') return;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Bulk table ${BULK_HTTP_TEST_TABLE} did not become ACTIVE in time`);
}

export async function resetBulkHttpTable(): Promise<void> {
	if (!ddbAdmin) return;
	try {
		await ddbAdmin.send(new DeleteTableCommand({ TableName: BULK_HTTP_TEST_TABLE }));
	} catch {
		// table may not exist yet
	}
	await ensureBulkHttpTable();
}

export async function markJobReady(jobId: string): Promise<void> {
	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: 'SET #status = :ready',
		ExpressionAttributeNames: { '#status': 'status' },
		ExpressionAttributeValues: { ':ready': 'ready' },
	});
}

export function useBulkHttpTableEnv(): void {
	process.env.BULK_DDB_TABLE = BULK_HTTP_TEST_TABLE;
}
