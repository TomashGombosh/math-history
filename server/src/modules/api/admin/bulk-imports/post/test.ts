import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { BULK_DOCX_CONTENT_TYPE } from '@services/bulk-upload-service';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
const BULK_TABLE = process.env.BULK_DDB_TABLE?.trim() || 'math-history-bulkimport-ddb-test';

let integrationReady = false;
let skipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-import POST integration tests.';

const ddbAdmin =
	DYNAMODB_ENDPOINT &&
	new DynamoDBClient({
		region: process.env.AWS_REGION || 'eu-north-1',
		endpoint: DYNAMODB_ENDPOINT,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
		},
	});

async function ensureBulkTable(): Promise<void> {
	if (!ddbAdmin) return;

	try {
		await ddbAdmin.send(new DescribeTableCommand({ TableName: BULK_TABLE }));
		return;
	} catch {
		// create below
	}

	await ddbAdmin.send(
		new CreateTableCommand({
			TableName: BULK_TABLE,
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
			const desc = await ddbAdmin.send(new DescribeTableCommand({ TableName: BULK_TABLE }));
			if (desc.Table?.TableStatus === 'ACTIVE') return;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Bulk table ${BULK_TABLE} did not become ACTIVE in time`);
}

async function resetBulkTable(): Promise<void> {
	if (!ddbAdmin) return;
	try {
		await ddbAdmin.send(new DeleteTableCommand({ TableName: BULK_TABLE }));
	} catch {
		// table may not exist yet
	}
	await ensureBulkTable();
}

function postBulkImport(wrapped: any, requestContext: any) {
	return wrapped.run({
		requestContext,
		path: '/api/admin/bulk-imports',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/admin/bulk-imports', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);

		beforeAll(async () => {
			if (!DYNAMODB_ENDPOINT || !ddbAdmin) {
				return;
			}
			try {
				await ensureBulkTable();
				integrationReady = true;
				process.env.BULK_DDB_TABLE = BULK_TABLE;
			} catch (err) {
				skipReason = err instanceof Error ? err.message : String(err);
			}
		});

		beforeEach(async () => {
			if (!integrationReady) return;
			process.env.BULK_DDB_TABLE = BULK_TABLE;
			await resetBulkTable();
		});

		it('returns jobId and presigned upload on first POST', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import POST integration: ${skipReason}`);
				return;
			}

			const res = await postBulkImport(wrapped, adminRC);
			expect(res.statusCode).toBe(200);

			const body = jsonBody(res, expect) as {
				jobId: string;
				uploadUrl: string;
				headers: Record<string, string>;
			};
			expect(body.jobId).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
			expect(body.uploadUrl).toMatch(/^https?:\/\//);
			expect(body.headers['Content-Type']).toBe(BULK_DOCX_CONTENT_TYPE);
			expect(body.uploadUrl).toContain(`bulk-imports/${body.jobId}/source/source.docx`);
		});

		it('returns 409 when a job is already active', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import POST integration: ${skipReason}`);
				return;
			}

			const first = await postBulkImport(wrapped, adminRC);
			expect(first.statusCode).toBe(200);

			const second = await postBulkImport(wrapped, adminRC);
			expect(second.statusCode).toBe(409);
			const body = jsonBody(second, expect) as { message?: string };
			expect(body.message).toBeTruthy();
		});

		it('requires authentication', async () => {
			const res = await postBulkImport(wrapped, requestContext);
			expect(res.statusCode).toBe(401);
		});
	});
