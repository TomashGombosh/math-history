import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
	ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import { LOCK_PK, LOCK_SK, jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { getBulkItem, updateBulkItem } from '@lib/bulk-dynamo';
import { commitBulkImportJob } from '@services/bulk-commit-service';
import {
	acquireGlobalLock,
	createJob,
	getJob,
	listCandidates,
	upsertCandidate,
} from '@services/bulk-import-service';
import { getCohortByYear } from '@services/graduate-service';
import { findTeacherBySlug, getTeacherById } from '@services/teacher-service';
import { slugify } from '@services/slug';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
/** Isolated bulk table — never delete math-history-ddb-local. */
const BULK_TABLE = 'math-history-ddb-bulk-commit-test';
/** Isolated main table for commit targets — never delete math-history-ddb-local. */
const MAIN_TABLE = 'math-history-ddb-bulk-commit-main-test';

let integrationReady = false;
let skipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-commit-service integration tests.';

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

async function ensureTable(tableName: string, withGsi1: boolean): Promise<void> {
	if (!ddbAdmin) return;

	try {
		await ddbAdmin.send(new DescribeTableCommand({ TableName: tableName }));
		return;
	} catch {
		// create below
	}

	if (withGsi1) {
		await ddbAdmin.send(
			new CreateTableCommand({
				TableName: tableName,
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
	} else {
		await ddbAdmin.send(
			new CreateTableCommand({
				TableName: tableName,
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
	}

	for (let i = 0; i < 30; i += 1) {
		try {
			const desc = await ddbAdmin.send(new DescribeTableCommand({ TableName: tableName }));
			if (desc.Table?.TableStatus === 'ACTIVE') return;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Table ${tableName} did not become ACTIVE in time`);
}

async function resetTable(tableName: string, withGsi1: boolean): Promise<void> {
	if (!ddbAdmin) return;
	try {
		await ddbAdmin.send(new DeleteTableCommand({ TableName: tableName }));
	} catch {
		// table may not exist yet
	}
	await ensureTable(tableName, withGsi1);
}

async function markJobReady(jobId: string): Promise<void> {
	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: 'SET #status = :ready, totalChunks = :one, processedChunks = :one',
		ExpressionAttributeNames: { '#status': 'status' },
		ExpressionAttributeValues: {
			':ready': 'ready',
			':one': 1,
		},
	});
}

function itIntegration(name: string, fn: () => Promise<void>): void {
	it(name, async () => {
		if (!integrationReady) {
			console.warn(`SKIPPED bulk-commit integration: ${skipReason}`);
			return;
		}
		await fn();
	});
}

describe('bulk-commit-service', () => {
	let previousMainTableName: string | undefined;
	let previousBulkTableName: string | undefined;

	beforeAll(async () => {
		if (!DYNAMODB_ENDPOINT || !ddbAdmin) {
			return;
		}
		try {
			await ddbAdmin.send(new ListTablesCommand({ Limit: 1 }));
			previousMainTableName = process.env.DYNAMODB_TABLE_NAME;
			previousBulkTableName = process.env.BULK_DDB_TABLE;
			process.env.DYNAMODB_TABLE_NAME = MAIN_TABLE;
			process.env.BULK_DDB_TABLE = BULK_TABLE;
			await ensureTable(BULK_TABLE, false);
			await ensureTable(MAIN_TABLE, true);
			integrationReady = true;
		} catch {
			skipReason = `DynamoDB Local not reachable at ${DYNAMODB_ENDPOINT}. Start: docker compose -f docker-compose.test.yml up -d dynamodb`;
		}
	});

	afterAll(() => {
		if (previousMainTableName !== undefined) {
			process.env.DYNAMODB_TABLE_NAME = previousMainTableName;
		}
		if (previousBulkTableName !== undefined) {
			process.env.BULK_DDB_TABLE = previousBulkTableName;
		}
	});

	beforeEach(async () => {
		if (!integrationReady) return;
		await resetTable(BULK_TABLE, false);
		await resetTable(MAIN_TABLE, true);
		process.env.DYNAMODB_TABLE_NAME = MAIN_TABLE;
		process.env.BULK_DDB_TABLE = BULK_TABLE;
	});

	itIntegration('commits candidates to main table and purges temp data + lock', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await acquireGlobalLock({ jobId: job.jobId, createdBy: 'admin' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Петренко Марія' });
		await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'Ходос Д.С.', year: 2005 });
		await upsertCandidate({ entity: 'year', jobId: job.jobId, year: 2010 });
		await markJobReady(job.jobId);

		await commitBulkImportJob(job.jobId);

		const slug = slugify('Петренко Марія');
		const teacher = slug ? await findTeacherBySlug(slug) : null;
		expect(teacher?.name).toBe('Петренко Марія');
		expect(teacher?.id).toBeGreaterThan(0);

		const grad2005 = await getCohortByYear(2005);
		expect(grad2005?.year).toBe(2005);
		expect(grad2005?.students).toEqual(
			expect.arrayContaining([expect.objectContaining({ name: 'Ходос Д.С.' })]),
		);

		const grad2010 = await getCohortByYear(2010);
		expect(grad2010?.year).toBe(2010);
		expect(grad2010?.title).toBe('Випуск 2010 року');

		expect(await getJob(job.jobId)).toBeNull();
		expect(await listCandidates({ jobId: job.jobId })).toEqual({ candidates: [] });
		expect(await getBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } })).toBeUndefined();
	});

	itIntegration('appends graduates to an existing cohort for the same year', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'First Grad', year: 2008 });
		await upsertCandidate({ entity: 'graduate', jobId: job.jobId, name: 'Second Grad', year: 2008 });
		await markJobReady(job.jobId);

		await commitBulkImportJob(job.jobId);

		const cohort = await getCohortByYear(2008);
		expect(cohort?.students).toHaveLength(2);
		expect(cohort?.students).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: 'First Grad' }),
				expect.objectContaining({ name: 'Second Grad' }),
			]),
		);
	});

	itIntegration('re-running commit after success is safe', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Unique Teacher' });
		await markJobReady(job.jobId);

		await commitBulkImportJob(job.jobId);
		const teacherAfterFirst = await findTeacherBySlug(slugify('Unique Teacher') || '');

		await expect(commitBulkImportJob(job.jobId)).resolves.toBeUndefined();

		const teacherAfterSecond = await getTeacherById(teacherAfterFirst?.id ?? 0);
		expect(teacherAfterSecond?.name).toBe('Unique Teacher');
	});

	itIntegration('rejects commit when job is not ready', async () => {
		const job = await createJob({ createdBy: 'admin' });
		await upsertCandidate({ entity: 'teacher', jobId: job.jobId, name: 'Pending Teacher' });

		await expect(commitBulkImportJob(job.jobId)).rejects.toThrow('JOB_NOT_READY');
		expect(await getJob(job.jobId)).not.toBeNull();
	});
});
