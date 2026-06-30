import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { updateBulkItem } from '@lib/bulk-dynamo';
import { createJob, upsertCandidate } from '@services/bulk-import-service';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
const BULK_TABLE = process.env.BULK_DDB_TABLE?.trim() || 'math-history-bulkimport-ddb-test';

let integrationReady = false;
let skipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-import GET integration tests.';

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

async function markJobReady(jobId: string): Promise<void> {
	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: 'SET #status = :ready',
		ExpressionAttributeNames: { '#status': 'status' },
		ExpressionAttributeValues: { ':ready': 'ready' },
	});
}

function getBulkImport(
	wrapped: any,
	requestContext: any,
	jobId: string,
	queryStringParameters?: Record<string, string>,
) {
	return wrapped.run({
		requestContext,
		path: `/api/admin/bulk-imports/${jobId}`,
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		queryStringParameters,
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('GET /api/admin/bulk-imports/:id', () => {
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

		it('returns in_progress with empty candidates while job is pending', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import GET integration: ${skipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Hidden Teacher' });

			const res = await getBulkImport(wrapped, adminRC, job.jobId);
			expect(res.statusCode).toBe(200);

			const body = jsonBody(res, expect) as {
				status: string;
				counts: { teachers: number };
				candidates: unknown[];
			};
			expect(body.status).toBe('in_progress');
			expect(body.counts.teachers).toBe(1);
			expect(body.candidates).toEqual([]);
		});

		it('returns candidates when job is ready', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import GET integration: ${skipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher Alpha' });
			await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'Grad Beta', year: 2005 });
			await markJobReady(job.jobId);

			const res = await getBulkImport(wrapped, adminRC, job.jobId);
			expect(res.statusCode).toBe(200);

			const body = jsonBody(res, expect) as {
				status: string;
				counts: { teachers: number; graduates: number };
				candidates: Array<{ entity: string; name?: string }>;
			};
			expect(body.status).toBe('success');
			expect(body.counts.teachers).toBe(1);
			expect(body.counts.graduates).toBe(1);
			expect(body.candidates).toHaveLength(2);
			expect(body.candidates.map((c) => c.entity).sort()).toEqual(['graduate', 'teacher']);
		});

		it('respects limit pagination when job is ready', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import GET integration: ${skipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher One' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher Two' });
			await upsertCandidate({ entity: 'year', jobId: job.jobId, year: 2010 });
			await markJobReady(job.jobId);

			const page1 = await getBulkImport(wrapped, adminRC, job.jobId, { limit: '2' });
			expect(page1.statusCode).toBe(200);

			const body1 = jsonBody(page1, expect) as {
				candidates: unknown[];
				lastEvaluatedKey?: string;
			};
			expect(body1.candidates).toHaveLength(2);
			expect(body1.lastEvaluatedKey).toBeTruthy();

			const page2 = await getBulkImport(wrapped, adminRC, job.jobId, {
				limit: '2',
				exclusiveStartKey: body1.lastEvaluatedKey!,
			});
			expect(page2.statusCode).toBe(200);

			const body2 = jsonBody(page2, expect) as { candidates: unknown[]; lastEvaluatedKey?: string };
			expect(body2.candidates).toHaveLength(1);
			expect(body2.lastEvaluatedKey).toBeUndefined();
		});

		it('returns 404 when job is missing', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import GET integration: ${skipReason}`);
				return;
			}

			const res = await getBulkImport(
				wrapped,
				adminRC,
				'00000000-0000-4000-8000-000000000000',
			);
			expect(res.statusCode).toBe(404);
		});
	});
