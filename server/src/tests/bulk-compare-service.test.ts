import {
	CreateTableCommand,
	DeleteTableCommand,
	DescribeTableCommand,
	DynamoDBClient,
	ListTablesCommand,
} from '@aws-sdk/client-dynamodb';
import { PK, gsi1SlugKeys, graduateSortKey, teacherSortKey } from '@lib/dynamo-keys';
import { putItem } from '@lib/dynamo-operations';
import { filterNewBulkEntities } from '@services/bulk-compare-service';
import type { BulkExtractResult } from '@services/bulk-extract-service';
import { slugify } from '@services/slug';

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT?.trim();
/** Isolated from CI `math-history-ddb-local` (app.js integration) — never delete the shared table. */
const MAIN_TABLE = 'math-history-ddb-bulk-compare-test';

let integrationReady = false;
let skipReason =
	'Set DYNAMODB_ENDPOINT and start DynamoDB Local (docker compose -f docker-compose.test.yml up -d dynamodb) to run bulk-compare-service integration tests.';

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

async function ensureMainTable(): Promise<void> {
	if (!ddbAdmin) return;

	try {
		await ddbAdmin.send(new DescribeTableCommand({ TableName: MAIN_TABLE }));
		return;
	} catch {
		// create below
	}

	await ddbAdmin.send(
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
		try {
			const desc = await ddbAdmin.send(new DescribeTableCommand({ TableName: MAIN_TABLE }));
			if (desc.Table?.TableStatus === 'ACTIVE') return;
		} catch {
			// retry
		}
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`Main table ${MAIN_TABLE} did not become ACTIVE in time`);
}

async function resetMainTable(): Promise<void> {
	if (!ddbAdmin) return;
	try {
		await ddbAdmin.send(new DeleteTableCommand({ TableName: MAIN_TABLE }));
	} catch {
		// table may not exist yet
	}
	await ensureMainTable();
}

async function seedExistingTeacher(name: string, id = 1): Promise<void> {
	const slug = slugify(name);
	const sk = teacherSortKey(id);
	const gsi = gsi1SlugKeys(slug, sk);
	await putItem({
		Item: {
			pk: PK.TEACHER,
			sk,
			entityType: 'Teacher',
			id,
			name,
			slug,
			gsi1pk: gsi.gsi1pk,
			gsi1sk: gsi.gsi1sk,
			publications: [],
			imageUrl: '/profile-icon.webp',
		},
	});
}

async function seedExistingGraduateYear(
	year: number,
	students: Array<{ name: string }>,
	cohortId = 1,
): Promise<void> {
	await putItem({
		Item: {
			pk: PK.GRADUATE,
			sk: graduateSortKey(year, cohortId),
			entityType: 'Graduate',
			id: cohortId,
			year,
			number: null,
			title: `Випуск ${year} року`,
			students: students.map((s, i) => ({
				id: i + 1,
				index: i + 1,
				name: s.name,
				specialty: '',
				section: '',
				year,
				honorsDegree: false,
			})),
			images: [],
			totalStudents: students.length,
			totalWithHonours: 0,
		},
	});
}

function itIntegration(name: string, fn: () => Promise<void>): void {
	it(name, async () => {
		if (!integrationReady) {
			console.warn(`SKIPPED bulk-compare integration: ${skipReason}`);
			return;
		}
		await fn();
	});
}

describe('bulk-compare-service', () => {
	let previousMainTableName: string | undefined;

	beforeAll(async () => {
		if (!DYNAMODB_ENDPOINT || !ddbAdmin) {
			return;
		}
		try {
			await ddbAdmin.send(new ListTablesCommand({ Limit: 1 }));
			previousMainTableName = process.env.DYNAMODB_TABLE_NAME;
			process.env.DYNAMODB_TABLE_NAME = MAIN_TABLE;
			await ensureMainTable();
			integrationReady = true;
		} catch {
			skipReason = `DynamoDB Local not reachable at ${DYNAMODB_ENDPOINT}. Start: docker compose -f docker-compose.test.yml up -d dynamodb`;
		}
	});

	afterAll(() => {
		if (previousMainTableName !== undefined) {
			process.env.DYNAMODB_TABLE_NAME = previousMainTableName;
		}
	});

	beforeEach(async () => {
		if (!integrationReady) return;
		await resetMainTable();
		process.env.DYNAMODB_TABLE_NAME = MAIN_TABLE;
	});

	itIntegration('returns empty result for empty input', async () => {
		const input: BulkExtractResult = { teachers: [], graduates: [], years: [] };
		await expect(filterNewBulkEntities(input)).resolves.toEqual(input);
	});

	itIntegration('filters existing teachers by slug and keeps new ones', async () => {
		await seedExistingTeacher('Іванов Іван');

		const input: BulkExtractResult = {
			teachers: ['Іванов Іван', 'Петренко Марія', '  Іванов   Іван  '],
			graduates: [],
			years: [],
		};

		const result = await filterNewBulkEntities(input);
		expect(result.teachers).toEqual(['Петренко Марія']);
	});

	itIntegration('filters existing graduates by normalized name within year', async () => {
		await seedExistingGraduateYear(2005, [{ name: 'Броді С.М.' }, { name: 'Шулла І.Й.' }]);

		const input: BulkExtractResult = {
			teachers: [],
			graduates: [
				{ name: 'Броді С.М.', year: 2005 },
				{ name: '  Броді   С.М.  ', year: 2005 },
				{ name: 'Ходос Д.С.', year: 2005 },
				{ name: 'Броді С.М.', year: 2006 },
			],
			years: [],
		};

		const result = await filterNewBulkEntities(input);
		expect(result.graduates).toEqual([
			{ name: 'Ходос Д.С.', year: 2005 },
			{ name: 'Броді С.М.', year: 2006 },
		]);
	});

	itIntegration('filters years that already have cohorts', async () => {
		await seedExistingGraduateYear(1999, [{ name: 'Student One' }]);

		const input: BulkExtractResult = {
			teachers: [],
			graduates: [],
			years: [1999, 2000, 2001],
		};

		const result = await filterNewBulkEntities(input);
		expect(result.years).toEqual([2000, 2001]);
	});

	itIntegration('filters mixed entities in one pass', async () => {
		await seedExistingTeacher('Existing Teacher');
		await seedExistingGraduateYear(2010, [{ name: 'Grad A' }]);

		const input: BulkExtractResult = {
			teachers: ['Existing Teacher', 'New Teacher'],
			graduates: [
				{ name: 'Grad A', year: 2010 },
				{ name: 'Grad B', year: 2010 },
			],
			years: [2010, 2015],
		};

		const result = await filterNewBulkEntities(input);
		expect(result).toEqual({
			teachers: ['New Teacher'],
			graduates: [{ name: 'Grad B', year: 2010 }],
			years: [2015],
		});
	});
});
