import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import { acquireGlobalLock, createJob, getJob, upsertCandidate } from '@services/bulk-import-service';
import { findTeacherBySlug } from '@services/teacher-service';
import { slugify } from '@services/slug';
import { withCognitoAdminAuthorizer, jsonBody } from '@tests/helpers/http.js';
import {
	bulkHttpSkipReason,
	ddbAdmin,
	ensureBulkHttpTable,
	markJobReady,
	resetBulkHttpTable,
	useBulkHttpTableEnv,
} from '@tests/helpers/bulk-import-http.js';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
const MAIN_TABLE = 'math-history-ddb-bulk-http-commit-test';

let integrationReady = false;

const mainDdbAdmin =
	DYNAMODB_ENDPOINT &&
	new DynamoDBClient({
		region: process.env.AWS_REGION || 'eu-north-1',
		endpoint: DYNAMODB_ENDPOINT,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
			secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local',
		},
	});

async function ensureMainTable(): Promise<void> {
	if (!mainDdbAdmin) return;
	try {
		await mainDdbAdmin.send(new DescribeTableCommand({ TableName: MAIN_TABLE }));
		return;
	} catch {
		// create
	}
	await mainDdbAdmin.send(
		new CreateTableCommand({
			TableName: MAIN_TABLE,
			BillingMode: 'PAY_PER_REQUEST',
			AttributeDefinitions: [
				{ AttributeName: 'pk', AttributeType: 'S' },
				{ AttributeName: 'sk', AttributeType: 'S' },
				{ AttributeName: 'gsi1pk', AttributeType: 'S' },
				{ AttributeName: 'gsi1sk', AttributeType: 'S' },
			],
			KeySchema: [
				{ AttributeName: 'pk', KeyType: 'HASH' },
				{ AttributeName: 'sk', KeyType: 'RANGE' },
			],
			GlobalSecondaryIndexes: [
				{
					IndexName: 'GSI1',
					KeySchema: [
						{ AttributeName: 'gsi1pk', KeyType: 'HASH' },
						{ AttributeName: 'gsi1sk', KeyType: 'RANGE' },
					],
					Projection: { ProjectionType: 'ALL' },
				},
			],
		}),
	);
	for (let i = 0; i < 30; i += 1) {
		const desc = await mainDdbAdmin.send(new DescribeTableCommand({ TableName: MAIN_TABLE }));
		if (desc.Table?.TableStatus === 'ACTIVE') return;
		await new Promise((r) => setTimeout(r, 200));
	}
}

async function resetMainTable(): Promise<void> {
	if (!mainDdbAdmin) return;
	try {
		await mainDdbAdmin.send(new DeleteTableCommand({ TableName: MAIN_TABLE }));
	} catch {
		// ok
	}
	await ensureMainTable();
}

function commitJob(wrapped: any, requestContext: any, jobId: string) {
	return wrapped.run({
		requestContext,
		path: `/api/admin/bulk-imports/${jobId}/commit`,
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	});
}

module.exports = (wrapped: any, expect: any, requestContext: any) =>
	describe('POST /api/admin/bulk-imports/:id/commit', () => {
		const adminRC = withCognitoAdminAuthorizer(requestContext);
		const originalMainTable = process.env.DYNAMODB_TABLE_NAME;

		beforeAll(async () => {
			if (!DYNAMODB_ENDPOINT || !ddbAdmin || !mainDdbAdmin) return;
			try {
				await ensureBulkHttpTable();
				await ensureMainTable();
				integrationReady = true;
			} catch {
				integrationReady = false;
			}
		});

		beforeEach(async () => {
			if (!integrationReady) return;
			useBulkHttpTableEnv();
			process.env.DYNAMODB_TABLE_NAME = MAIN_TABLE;
			await resetBulkHttpTable();
			await resetMainTable();
		});

		afterAll(() => {
			if (originalMainTable) {
				process.env.DYNAMODB_TABLE_NAME = originalMainTable;
			} else {
				delete process.env.DYNAMODB_TABLE_NAME;
			}
		});

		it('writes candidates to main table and purges temp job', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import commit HTTP: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await acquireGlobalLock({ jobId: job.jobId, createdBy: 'admin' });
			await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Commit Teacher' });
			await markJobReady(job.jobId);

			const res = await commitJob(wrapped, adminRC, job.jobId);
			expect(res.statusCode).toBe(200);
			jsonBody(res, expect);

			expect(await getJob(job.jobId)).toBeNull();
			const slug = slugify('Commit Teacher');
			expect(await findTeacherBySlug(slug!)).toBeTruthy();
		});

		it('returns 409 when job is not ready', async () => {
			if (!integrationReady) {
				console.warn(`SKIPPED bulk-import commit HTTP: ${bulkHttpSkipReason}`);
				return;
			}

			const job = await createJob({ createdBy: 'admin' });
			await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'Grad', year: 2015 });

			const res = await commitJob(wrapped, adminRC, job.jobId);
			expect(res.statusCode).toBe(409);
		});
	});
