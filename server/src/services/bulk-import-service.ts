import { randomUUID } from 'node:crypto';
import {
	graduateCandidateSk,
	jobMetaSk,
	jobPk,
	LOCK_PK,
	LOCK_SK,
	normHash,
	teacherCandidateSk,
	yearCandidateSk,
} from '@lib/bulk-dynamo-keys';
import {
	batchWriteBulkItems,
	deleteBulkItem,
	getBulkItem,
	putBulkItem,
	queryBulkItems,
	updateBulkItem,
} from '@lib/bulk-dynamo';
import { slugify } from '@services/slug';
import { normalizeName } from '@services/bulk-extract-service';

const TTL_SECONDS = 48 * 3600;

export type BulkJobInternalStatus =
	| 'pending'
	| 'splitting'
	| 'processing'
	| 'ready'
	| 'committing'
	| 'committed'
	| 'cancelled'
	| 'failed';

export type BulkJobExternalStatus = 'in_progress' | 'success' | 'cancelled' | 'failed';

export interface BulkJobCounts {
	teachers: number;
	graduates: number;
	years: number;
}

export interface BulkJobMeta {
	jobId: string;
	status: BulkJobInternalStatus;
	totalChunks: number;
	processedChunks: number;
	counts: BulkJobCounts;
	createdBy: string;
	sourceKey?: string;
	error?: string;
	createdAt: string;
	ttl: number;
}

export type BulkCandidateEntity = 'teacher' | 'graduate' | 'year';

export interface BulkCandidate {
	id: string;
	entity: BulkCandidateEntity;
	name?: string;
	slug?: string;
	year?: number;
	sourceChunk?: number;
}

interface BulkJobMetaItem extends Record<string, unknown> {
	pk: string;
	sk: string;
	jobId: string;
	status: BulkJobInternalStatus;
	totalChunks: number;
	processedChunks: number;
	counts: BulkJobCounts;
	createdBy: string;
	sourceKey?: string;
	error?: string;
	createdAt: string;
	ttl: number;
}

interface BulkLockItem extends Record<string, unknown> {
	pk: string;
	sk: string;
	jobId: string;
	createdBy: string;
	ttl: number;
}

interface BulkCandidateItem extends Record<string, unknown> {
	pk: string;
	sk: string;
	entity: BulkCandidateEntity;
	name?: string;
	slug?: string;
	year?: number;
	sourceChunk?: number;
}

function defaultCounts(): BulkJobCounts {
	return { teachers: 0, graduates: 0, years: 0 };
}

function ttlEpoch(): number {
	return Math.floor(Date.now() / 1000) + TTL_SECONDS;
}

function isConditionalFailure(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'name' in err &&
		(err as { name: string }).name === 'ConditionalCheckFailedException'
	);
}

function toJobMeta(item: BulkJobMetaItem): BulkJobMeta {
	return {
		jobId: item.jobId,
		status: item.status,
		totalChunks: item.totalChunks ?? 0,
		processedChunks: item.processedChunks ?? 0,
		counts: item.counts ?? defaultCounts(),
		createdBy: item.createdBy,
		sourceKey: item.sourceKey,
		error: item.error,
		createdAt: item.createdAt,
		ttl: item.ttl,
	};
}

function toCandidate(item: BulkCandidateItem): BulkCandidate {
	return {
		id: item.sk,
		entity: item.entity,
		name: item.name,
		slug: item.slug,
		year: item.year,
		sourceChunk: item.sourceChunk,
	};
}

export function mapInternalStatusToExternal(status: BulkJobInternalStatus): BulkJobExternalStatus {
	switch (status) {
		case 'ready':
			return 'success';
		case 'cancelled':
			return 'cancelled';
		case 'failed':
			return 'failed';
		default:
			return 'in_progress';
	}
}

export interface CreateJobInput {
	createdBy: string;
	sourceKey?: string;
}

export async function createJob(input: CreateJobInput): Promise<BulkJobMeta> {
	const jobId = randomUUID();
	const createdAt = new Date().toISOString();
	const item: BulkJobMetaItem = {
		pk: jobPk(jobId),
		sk: jobMetaSk(),
		jobId,
		status: 'pending',
		totalChunks: 0,
		processedChunks: 0,
		counts: defaultCounts(),
		createdBy: input.createdBy,
		sourceKey: input.sourceKey,
		createdAt,
		ttl: ttlEpoch(),
	};

	await putBulkItem({ Item: item });
	return toJobMeta(item);
}

export async function getJob(jobId: string): Promise<BulkJobMeta | null> {
	const item = await getBulkItem<BulkJobMetaItem>({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
	});
	return item ? toJobMeta(item) : null;
}

export async function setJobProcessing(jobId: string, totalChunks: number): Promise<void> {
	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: 'SET #status = :processing, totalChunks = :total',
		ExpressionAttributeNames: { '#status': 'status' },
		ExpressionAttributeValues: {
			':processing': 'processing',
			':total': totalChunks,
		},
	});
}

export async function markJobFailed(jobId: string, error?: string): Promise<void> {
	const updates: Omit<Parameters<typeof updateBulkItem>[0], 'Key'> = error
		? {
				UpdateExpression: 'SET #status = :failed, #error = :error',
				ExpressionAttributeNames: { '#status': 'status', '#error': 'error' },
				ExpressionAttributeValues: { ':failed': 'failed', ':error': error },
			}
		: {
				UpdateExpression: 'SET #status = :failed',
				ExpressionAttributeNames: { '#status': 'status' },
				ExpressionAttributeValues: { ':failed': 'failed' },
			};

	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		...updates,
	});
}

export interface AcquireGlobalLockInput {
	jobId: string;
	createdBy: string;
}

export async function acquireGlobalLock(input: AcquireGlobalLockInput): Promise<void> {
	try {
		await putBulkItem({
			Item: {
				pk: LOCK_PK,
				sk: LOCK_SK,
				jobId: input.jobId,
				createdBy: input.createdBy,
				ttl: ttlEpoch(),
			},
			ConditionExpression: 'attribute_not_exists(pk)',
		});
	} catch (err) {
		if (isConditionalFailure(err)) {
			throw new Error('JOB_ACTIVE');
		}
		throw err;
	}
}

export async function releaseGlobalLock(jobId?: string): Promise<void> {
	if (jobId) {
		const lock = await getBulkItem<BulkLockItem>({
			Key: { pk: LOCK_PK, sk: LOCK_SK },
		});
		if (lock && lock.jobId !== jobId) {
			return;
		}
	}
	await deleteBulkItem({ Key: { pk: LOCK_PK, sk: LOCK_SK } });
}

async function incrementCount(jobId: string, entity: BulkCandidateEntity): Promise<void> {
	const field =
		entity === 'teacher' ? 'counts.teachers' : entity === 'graduate' ? 'counts.graduates' : 'counts.years';
	await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: `ADD ${field} :one`,
		ExpressionAttributeValues: { ':one': 1 },
	});
}

export interface UpsertTeacherCandidateInput {
	jobId: string;
	name: string;
	sourceChunk?: number;
}

export async function upsertTeacherCandidate(input: UpsertTeacherCandidateInput): Promise<BulkCandidate> {
	const hash = normHash(input.name);
	const sk = teacherCandidateSk(hash);
	const pk = jobPk(input.jobId);
	const existing = await getBulkItem<BulkCandidateItem>({ Key: { pk, sk } });

	const item: BulkCandidateItem = {
		pk,
		sk,
		entity: 'teacher',
		name: normalizeName(input.name),
		slug: slugify(input.name) || 'teacher',
		sourceChunk: input.sourceChunk,
	};

	await putBulkItem({ Item: item });
	if (!existing) {
		await incrementCount(input.jobId, 'teacher');
	}
	return toCandidate(item);
}

export interface UpsertGraduateCandidateInput {
	jobId: string;
	name: string;
	year: number;
	sourceChunk?: number;
}

export async function upsertGraduateCandidate(input: UpsertGraduateCandidateInput): Promise<BulkCandidate> {
	const hash = normHash(input.name);
	const sk = graduateCandidateSk(input.year, hash);
	const pk = jobPk(input.jobId);
	const existing = await getBulkItem<BulkCandidateItem>({ Key: { pk, sk } });

	const item: BulkCandidateItem = {
		pk,
		sk,
		entity: 'graduate',
		name: normalizeName(input.name),
		year: input.year,
		sourceChunk: input.sourceChunk,
	};

	await putBulkItem({ Item: item });
	if (!existing) {
		await incrementCount(input.jobId, 'graduate');
	}
	return toCandidate(item);
}

export interface UpsertYearCandidateInput {
	jobId: string;
	year: number;
	sourceChunk?: number;
}

export async function upsertYearCandidate(input: UpsertYearCandidateInput): Promise<BulkCandidate> {
	const sk = yearCandidateSk(input.year);
	const pk = jobPk(input.jobId);
	const existing = await getBulkItem<BulkCandidateItem>({ Key: { pk, sk } });

	const item: BulkCandidateItem = {
		pk,
		sk,
		entity: 'year',
		year: input.year,
		sourceChunk: input.sourceChunk,
	};

	await putBulkItem({ Item: item });
	if (!existing) {
		await incrementCount(input.jobId, 'year');
	}
	return toCandidate(item);
}

export type UpsertCandidateInput =
	| ({ entity: 'teacher' } & UpsertTeacherCandidateInput)
	| ({ entity: 'graduate' } & UpsertGraduateCandidateInput)
	| ({ entity: 'year' } & UpsertYearCandidateInput);

export async function upsertCandidate(input: UpsertCandidateInput): Promise<BulkCandidate> {
	switch (input.entity) {
		case 'teacher':
			return upsertTeacherCandidate(input);
		case 'graduate':
			return upsertGraduateCandidate(input);
		case 'year':
			return upsertYearCandidate(input);
	}
}

export interface ListCandidatesInput {
	jobId: string;
	limit?: number;
	exclusiveStartKey?: Record<string, unknown>;
}

export interface ListCandidatesResult {
	candidates: BulkCandidate[];
	lastEvaluatedKey?: Record<string, unknown>;
}

export async function listCandidates(input: ListCandidatesInput): Promise<ListCandidatesResult> {
	const { items, lastEvaluatedKey } = await queryBulkItems<BulkCandidateItem>({
		KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
		ExpressionAttributeValues: {
			':pk': jobPk(input.jobId),
			':pfx': 'CAND#',
		},
		Limit: input.limit,
		ExclusiveStartKey: input.exclusiveStartKey,
	});

	return {
		candidates: items.map(toCandidate),
		lastEvaluatedKey,
	};
}

export async function updateCandidateName(jobId: string, candidateSk: string, name: string): Promise<BulkCandidate> {
	const pk = jobPk(jobId);
	const existing = await getBulkItem<BulkCandidateItem>({ Key: { pk, sk: candidateSk } });
	if (!existing) {
		throw new Error('NOT_FOUND');
	}
	if (existing.entity === 'year') {
		throw new Error('NAME_NOT_EDITABLE');
	}

	const normalizedName = normalizeName(name);
	const updates: BulkCandidateItem = {
		...existing,
		name: normalizedName,
	};
	if (existing.entity === 'teacher') {
		updates.slug = slugify(normalizedName) || 'teacher';
	}

	await putBulkItem({ Item: updates });
	return toCandidate(updates);
}

export async function deleteCandidate(jobId: string, candidateSk: string): Promise<void> {
	const pk = jobPk(jobId);
	const existing = await getBulkItem<BulkCandidateItem>({ Key: { pk, sk: candidateSk } });
	if (!existing) {
		throw new Error('NOT_FOUND');
	}

	await deleteBulkItem({ Key: { pk, sk: candidateSk } });

	const field =
		existing.entity === 'teacher'
			? 'counts.teachers'
			: existing.entity === 'graduate'
				? 'counts.graduates'
				: 'counts.years';
	await updateBulkItem({
		Key: { pk, sk: jobMetaSk() },
		UpdateExpression: `ADD ${field} :dec`,
		ExpressionAttributeValues: { ':dec': -1 },
	});
}

async function deleteJobS3Artifacts(_jobId: string): Promise<void> {
	// TODO(SRV-5+): delete objects under bulk-imports/{jobId}/ via ListObjectsV2 + DeleteObjects
	// when split/process handlers write chunk artifacts to S3.
}

export async function cleanupJob(jobId: string): Promise<void> {
	const pk = jobPk(jobId);
	const deleteKeys: Array<{ pk: string; sk: string }> = [];
	let exclusiveStartKey: Record<string, unknown> | undefined;

	do {
		const { items, lastEvaluatedKey } = await queryBulkItems<{ pk: string; sk: string }>({
			KeyConditionExpression: 'pk = :pk',
			ExpressionAttributeValues: { ':pk': pk },
			ExclusiveStartKey: exclusiveStartKey,
		});
		for (const item of items) {
			deleteKeys.push({ pk: item.pk, sk: item.sk });
		}
		exclusiveStartKey = lastEvaluatedKey;
	} while (exclusiveStartKey);

	if (deleteKeys.length > 0) {
		await batchWriteBulkItems(deleteKeys.map((Key) => ({ DeleteRequest: { Key } })));
	}

	await releaseGlobalLock(jobId);
	await deleteJobS3Artifacts(jobId);
}

export async function incrementProcessedChunks(jobId: string): Promise<{ processedChunks: number; status?: BulkJobInternalStatus }> {
	const res = await updateBulkItem({
		Key: { pk: jobPk(jobId), sk: jobMetaSk() },
		UpdateExpression: 'ADD processedChunks :one',
		ExpressionAttributeValues: { ':one': 1 },
		ReturnValues: 'UPDATED_NEW',
	});

	const processedChunks = Number(res.Attributes?.processedChunks ?? 0);
	const totalChunks = Number(res.Attributes?.totalChunks ?? 0);

	if (totalChunks > 0 && processedChunks >= totalChunks) {
		try {
			await updateBulkItem({
				Key: { pk: jobPk(jobId), sk: jobMetaSk() },
				UpdateExpression: 'SET #status = :ready',
				ConditionExpression: '#status = :processing',
				ExpressionAttributeNames: { '#status': 'status' },
				ExpressionAttributeValues: {
					':ready': 'ready',
					':processing': 'processing',
				},
			});
			return { processedChunks, status: 'ready' };
		} catch (err) {
			if (!isConditionalFailure(err)) {
				throw err;
			}
		}
	}

	return { processedChunks };
}
