import { buffer as streamToBuffer } from 'node:stream/consumers';
import { Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { logException, logInfo } from '@lib/lambda-log';
import { getS3Client } from '@lib/s3-client';
import {
	getJob,
	incrementProcessedChunks,
	upsertCandidate,
	type BulkJobInternalStatus,
} from '@services/bulk-import-service';
import { filterNewBulkEntities } from '@services/bulk-compare-service';
import { extractFromChunkText } from '@services/bulk-extract-service';
import { sendBulkImportCompleteNotification } from '@services/email-service';
import type { BulkChunkQueueMessage } from '@services/bulk-split-service';

const SKIP_STATUSES: ReadonlySet<BulkJobInternalStatus> = new Set(['cancelled', 'failed', 'committed']);

async function getObjectBodyString(body: unknown): Promise<string> {
	if (!body) return '';
	const anyBody = body as { transformToByteArray?: () => Promise<Uint8Array> };
	if (typeof anyBody.transformToByteArray === 'function') {
		return Buffer.from(await anyBody.transformToByteArray()).toString('utf8');
	}
	if (body instanceof Readable) {
		return (await streamToBuffer(body)).toString('utf8');
	}
	return '';
}

async function readChunkText(bucket: string, chunkKey: string): Promise<string> {
	const s3 = getS3Client();
	const out = await s3.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: chunkKey,
		}),
	);
	const raw = await getObjectBodyString(out.Body);
	if (!raw.trim()) {
		return '';
	}

	const parsed = JSON.parse(raw) as { text?: string };
	return typeof parsed.text === 'string' ? parsed.text : '';
}

async function persistFilteredCandidates(
	jobId: string,
	chunkIndex: number,
	filtered: Awaited<ReturnType<typeof filterNewBulkEntities>>,
): Promise<void> {
	for (const name of filtered.teachers) {
		await upsertCandidate({ entity: 'teacher', jobId, name, sourceChunk: chunkIndex });
	}
	for (const graduate of filtered.graduates) {
		await upsertCandidate({
			entity: 'graduate',
			jobId,
			name: graduate.name,
			year: graduate.year,
			sourceChunk: chunkIndex,
		});
	}
	for (const year of filtered.years) {
		await upsertCandidate({ entity: 'year', jobId, year, sourceChunk: chunkIndex });
	}
}

export async function processChunkMessage(message: BulkChunkQueueMessage): Promise<void> {
	const { jobId, bucket, chunkKey, chunkIndex } = message;

	const job = await getJob(jobId);
	if (!job) {
		logInfo('bulk_process:job_not_found', { jobId, chunkKey });
		return;
	}
	if (SKIP_STATUSES.has(job.status)) {
		logInfo('bulk_process:skip_terminal_job', { jobId, status: job.status, chunkKey });
		return;
	}

	const text = await readChunkText(bucket, chunkKey);
	const extracted = extractFromChunkText(text);
	const filtered = await filterNewBulkEntities(extracted);

	await persistFilteredCandidates(jobId, chunkIndex, filtered);

	const progress = await incrementProcessedChunks(jobId);
	if (progress.status === 'ready') {
		const refreshed = await getJob(jobId);
		if (refreshed) {
			try {
				await sendBulkImportCompleteNotification(jobId, refreshed.counts);
			} catch (err) {
				logException('bulk_process:completion_email_failed', err, { jobId });
			}
		}
	}

	logInfo('bulk_process:chunk_done', {
		jobId,
		chunkIndex,
		chunkKey,
		processedChunks: progress.processedChunks,
		status: progress.status,
	});
}
