import { buffer as streamToBuffer } from 'node:stream/consumers';
import { Readable } from 'node:stream';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import mammoth from 'mammoth';
import { logException, logInfo } from '@lib/lambda-log';
import { getS3Client } from '@lib/s3-client';
import { awsSdkLogger } from '@lib/aws-sdk-logger';
import { getJob, markJobFailed, setJobProcessing } from '@services/bulk-import-service';

/** Max characters per chunk before starting a new chunk. */
export const BULK_CHUNK_MAX_CHARS = 6000;

/** Max paragraphs per chunk (whichever limit is hit first). */
export const BULK_CHUNK_MAX_PARAGRAPHS = 40;

const SOURCE_KEY_RE = /^bulk-imports\/([^/]+)\/source\/source\.docx$/;

export interface BulkImportSourceKey {
	jobId: string;
}

export interface BulkChunkPayload {
	text: string;
	index: number;
}

export interface BulkChunkQueueMessage {
	jobId: string;
	bucket: string;
	chunkKey: string;
	chunkIndex: number;
}

let sqsClient: SQSClient | null = null;

function getSqsClient(): SQSClient {
	if (!sqsClient) {
		const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';
		sqsClient = new SQSClient({ region, logger: awsSdkLogger });
	}
	return sqsClient;
}

function getBulkQueueUrl(): string {
	const url = process.env.BULK_QUEUE_URL?.trim();
	if (!url) {
		throw new Error('BULK_QUEUE_URL is not set');
	}
	return url;
}

export function parseBulkImportSourceKey(key: string): BulkImportSourceKey | null {
	const match = SOURCE_KEY_RE.exec(key);
	if (!match) {
		return null;
	}
	return { jobId: match[1] };
}

export function bulkImportChunkKey(jobId: string, index: number): string {
	return `bulk-imports/${jobId}/chunks/chunk-${index}.json`;
}

async function getObjectBodyBuffer(body: unknown): Promise<Buffer> {
	if (!body) return Buffer.alloc(0);
	const anyBody = body as { transformToByteArray?: () => Promise<Uint8Array> };
	if (typeof anyBody.transformToByteArray === 'function') {
		return Buffer.from(await anyBody.transformToByteArray());
	}
	if (body instanceof Readable) {
		return streamToBuffer(body);
	}
	return Buffer.alloc(0);
}

export async function extractDocxText(buffer: Buffer): Promise<string> {
	const result = await mammoth.extractRawText({ buffer });
	return result.value.trim();
}

/** Split plain text into chunks by paragraph boundaries and size limits. */
export function splitTextIntoChunks(text: string): string[] {
	const normalized = text.replace(/\r\n/g, '\n').trim();
	if (!normalized) {
		return [];
	}

	const paragraphs = normalized
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean);

	if (paragraphs.length === 0) {
		return [normalized];
	}

	const chunks: string[] = [];
	let currentParagraphs: string[] = [];
	let currentChars = 0;

	const flush = (): void => {
		if (currentParagraphs.length === 0) return;
		chunks.push(currentParagraphs.join('\n\n'));
		currentParagraphs = [];
		currentChars = 0;
	};

	for (const paragraph of paragraphs) {
		const paragraphChars = paragraph.length;
		const separatorChars = currentParagraphs.length > 0 ? 2 : 0;
		const wouldExceedChars =
			currentParagraphs.length > 0 &&
			currentChars + separatorChars + paragraphChars > BULK_CHUNK_MAX_CHARS;
		const wouldExceedParagraphs = currentParagraphs.length >= BULK_CHUNK_MAX_PARAGRAPHS;

		if (wouldExceedChars || wouldExceedParagraphs) {
			flush();
		}

		if (paragraphChars > BULK_CHUNK_MAX_CHARS) {
			for (let offset = 0; offset < paragraph.length; offset += BULK_CHUNK_MAX_CHARS) {
				chunks.push(paragraph.slice(offset, offset + BULK_CHUNK_MAX_CHARS));
			}
			continue;
		}

		currentParagraphs.push(paragraph);
		currentChars += separatorChars + paragraphChars;
	}

	flush();
	return chunks;
}

async function readDocxFromS3(bucket: string, key: string): Promise<Buffer> {
	const s3 = getS3Client();
	const out = await s3.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: key,
		}),
	);
	const body = await getObjectBodyBuffer(out.Body);
	if (!body.length) {
		throw new Error('EMPTY_SOURCE_DOCX');
	}
	return body;
}

async function writeChunkToS3(bucket: string, chunkKey: string, payload: BulkChunkPayload): Promise<void> {
	const s3 = getS3Client();
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: chunkKey,
			Body: JSON.stringify(payload),
			ContentType: 'application/json',
		}),
	);
}

async function enqueueChunkMessage(message: BulkChunkQueueMessage): Promise<void> {
	await getSqsClient().send(
		new SendMessageCommand({
			QueueUrl: getBulkQueueUrl(),
			MessageBody: JSON.stringify(message),
		}),
	);
}

export async function splitBulkImportSource(bucket: string, key: string, jobId: string): Promise<void> {
	const job = await getJob(jobId);
	if (!job) {
		logInfo('bulk_split:job_not_found', { jobId, bucket, key });
		return;
	}
	if (job.status === 'cancelled' || job.status === 'failed' || job.status === 'committed') {
		logInfo('bulk_split:skip_terminal_job', { jobId, status: job.status, bucket, key });
		return;
	}

	let docxBuffer: Buffer | null = await readDocxFromS3(bucket, key);
	let text: string | null = await extractDocxText(docxBuffer);
	// Release the raw docx before splitting/uploading; only the text is needed now.
	docxBuffer = null;

	const chunkTexts = splitTextIntoChunks(text);
	text = null;
	const texts = chunkTexts.length > 0 ? chunkTexts : [''];
	const totalChunks = texts.length;

	for (let index = 0; index < totalChunks; index += 1) {
		const chunkKey = bulkImportChunkKey(jobId, index);
		await writeChunkToS3(bucket, chunkKey, { text: texts[index], index });
	}

	await setJobProcessing(jobId, totalChunks);

	for (let index = 0; index < totalChunks; index += 1) {
		await enqueueChunkMessage({
			jobId,
			bucket,
			chunkKey: bulkImportChunkKey(jobId, index),
			chunkIndex: index,
		});
	}

	logInfo('bulk_split:enqueued', { jobId, bucket, key, totalChunks });
}

export async function handleBulkSourceUploaded(bucket: string | undefined, key: string | undefined): Promise<void> {
	if (!bucket || !key) return;

	const parsed = parseBulkImportSourceKey(key);
	if (!parsed) {
		logInfo('bulk_split:skip_key', { bucket, key });
		return;
	}

	const { jobId } = parsed;
	try {
		await splitBulkImportSource(bucket, key, jobId);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		logException('bulk_split:failed', err, { jobId, bucket, key });
		try {
			await markJobFailed(jobId, message);
		} catch (markErr: unknown) {
			logException('bulk_split:mark_failed_error', markErr, { jobId, bucket, key });
		}
		throw err;
	}
}

/** Test hook: reset module-scoped SQS client between tests. */
export function resetBulkSplitSqsClientForTests(): void {
	sqsClient = null;
}
