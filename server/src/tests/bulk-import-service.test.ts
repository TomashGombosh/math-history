import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
	ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import { LOCK_PK, LOCK_SK, normHash, teacherCandidateSk } from '@lib/bulk-dynamo-keys';
import { getBulkItem } from '@lib/bulk-dynamo';
import {
	acquireGlobalLock,
	cleanupJob,
	createJob,
	getJob,
	incrementProcessedChunks,
	listCandidates,
	mapInternalStatusToExternal,
	releaseGlobalLock,
	setJobProcessing,
	upsertCandidate,
	upsertTeacherCandidate,
} from '@services/bulk-import-service';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
const BULK_TABLE = process.env.BULK_DDB_TABLE?.trim() || 'math-history-bulkimport-ddb-test';

let integrationReady = false;
let skipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-import-service integration tests.';

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

function itIntegration(name: string, fn: () => Promise<void>): void {
	it(name, async () => {
		if (!integrationReady) {
			console.warn(`SKIPPED bulk-import integration: ${skipReason}`);
			return;
		}
		await fn();
	});
}

describe('bulk-import-service', () => {
	beforeAll(async () => {
		if (!DYNAMODB_ENDPOINT || !ddbAdmin) {
			return;
		}
		try {
			await ddbAdmin.send(new ListTablesCommand({ Limit: 1 }));
			process.env.BULK_DDB_TABLE = BULK_TABLE;
			await ensureBulkTable();
			integrationReady = true;
		} catch {
			skipReason = `DynamoDB Local not reachable at ${DYNAMODB_ENDPOINT}. Start: docker compose -f docker-compose.test.yml up -d dynamodb`;
		}
	});

	beforeEach(async () => {
		if (!integrationReady) return;
		await resetBulkTable();
		process.env.BULK_DDB_TABLE = BULK_TABLE;
	});

	itIntegration('acquireGlobalLock rejects when another job holds the lock', async () => {
		const jobA = await createJob({ createdBy: 'admin-a' });
		await acquireGlobalLock({ jobId: jobA.jobId, createdBy: 'admin-a' });

		const jobB = await createJob({ createdBy: 'admin-b' });
		await expect(acquireGlobalLock({ jobId: jobB.jobId, createdBy: 'admin-b' })).rejects.toThrow('JOB_ACTIVE');
	});

	itIntegration('deduplicates teacher candidates by deterministic SK', async () => {
		const job = await createJob({ createdBy: 'admin' });
		const first = await upsertTeacherCandidate({ jobId: job.jobId, name: 'Іванов Іван', sourceChunk: 1 });
		const second = await upsertTeacherCandidate({ jobId: job.jobId, name: '  Іванов   Іван  ', sourceChunk: 2 });

		expect(second.id).toBe(first.id);
		expect(second.id).toBe(teacherCandidateSk(normHash('Іванов Іван')));

		const { candidates } = await listCandidates({ jobId: job.jobId });
		expect(candidates).toHaveLength(1);
		expect(candidates[0]?.sourceChunk).toBe(2);

		const meta = await getJob(job.jobId);
		expect(meta?.counts.teachers).toBe(1);
	});

	itIntegration('lists candidates with pagination', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher One' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Teacher Two' });
		await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'Grad One', year: 2001 });
		await upsertCandidate({ entity: 'year', jobId: job.jobId, year: 2002 });

		const page1 = await listCandidates({ jobId: job.jobId, limit: 2 });
		expect(page1.candidates).toHaveLength(2);
		expect(page1.lastEvaluatedKey).toBeDefined();

		const page2 = await listCandidates({
			jobId: job.jobId,
			limit: 2,
			exclusiveStartKey: page1.lastEvaluatedKey,
		});
		expect(page2.candidates.length).toBeGreaterThanOrEqual(1);
		expect(page1.candidates[0]?.id).not.toBe(page2.candidates[0]?.id);
	});

	itIntegration('cleanupJob removes job items and releases the global lock', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await acquireGlobalLock({ jobId: job.jobId, createdBy: 'admin' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'To Delete' });

		await cleanupJob(job.jobId);

		expect(await getJob(job.jobId)).toBeNull();
		expect(await getBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } })).toBeUndefined();
		expect(await listCandidates({ jobId: job.jobId })).toEqual({ candidates: [] });

		await expect(acquireGlobalLock({ jobId: job.jobId, createdBy: 'admin' })).resolves.toBeUndefined();
	});

	itIntegration('flips status to ready once the final chunk is processed', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await setJobProcessing(job.jobId, 3);

		const first = await incrementProcessedChunks(job.jobId);
		expect(first.processedChunks).toBe(1);
		expect(first.status).toBeUndefined();

		const second = await incrementProcessedChunks(job.jobId);
		expect(second.processedChunks).toBe(2);
		expect(second.status).toBeUndefined();

		const third = await incrementProcessedChunks(job.jobId);
		expect(third.processedChunks).toBe(3);
		expect(third.status).toBe('ready');

		const meta = await getJob(job.jobId);
		expect(meta?.status).toBe('ready');
	});

	it('maps internal statuses to external statuses', () => {
		expect(mapInternalStatusToExternal('pending')).toBe('in_progress');
		expect(mapInternalStatusToExternal('splitting')).toBe('in_progress');
		expect(mapInternalStatusToExternal('processing')).toBe('in_progress');
		expect(mapInternalStatusToExternal('committing')).toBe('in_progress');
		expect(mapInternalStatusToExternal('ready')).toBe('success');
		expect(mapInternalStatusToExternal('cancelled')).toBe('cancelled');
		expect(mapInternalStatusToExternal('failed')).toBe('failed');
	});

	itIntegration('releaseGlobalLock is scoped to the owning jobId', async () => {
		const jobA = await createJob({ createdBy: 'admin-a' });
		await acquireGlobalLock({ jobId: jobA.jobId, createdBy: 'admin-a' });

		await releaseGlobalLock('other-job-id');
		expect(await getBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } })).toBeDefined();

		await releaseGlobalLock(jobA.jobId);
		expect(await getBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } })).toBeUndefined();
	});
});
