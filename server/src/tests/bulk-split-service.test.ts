import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { S3Event } from 'aws-lambda';

const mockS3Send = jest.fn();
const mockSqsSend = jest.fn();

jest.mock('../lib/s3-client', () => ({
	getS3Client: jest.fn(() => ({ send: mockS3Send })),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
	SendMessageCommand: jest.fn((input: unknown) => ({ input })),
	SQSClient: jest.fn(() => ({ send: mockSqsSend })),
}));

jest.mock('../services/bulk-import-service', () => ({
	getJob: jest.fn(),
	setJobProcessing: jest.fn(),
	markJobFailed: jest.fn(),
}));

import { handler } from '../handlers/s3-bulk-split';
import {
	BULK_CHUNK_MAX_CHARS,
	extractDocxText,
	handleBulkSourceUploaded,
	parseBulkImportSourceKey,
	resetBulkSplitSqsClientForTests,
	splitTextIntoChunks,
} from '@services/bulk-split-service';
import { getJob, markJobFailed, setJobProcessing } from '@services/bulk-import-service';

const fixtureDocxPath = path.join(process.cwd(), 'src/tests/fixtures/minimal-bulk.docx');

describe('bulk-split-service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resetBulkSplitSqsClientForTests();
		process.env.BULK_QUEUE_URL = 'https://sqs.eu-north-1.amazonaws.com/123/bulk-queue';
	});

	describe('parseBulkImportSourceKey', () => {
		it('parses bulk-imports/{jobId}/source/source.docx', () => {
			expect(parseBulkImportSourceKey('bulk-imports/abc-123/source/source.docx')).toEqual({ jobId: 'abc-123' });
		});

		it('returns null for unrelated keys', () => {
			expect(parseBulkImportSourceKey('bulk-imports/abc/chunks/chunk-0.json')).toBeNull();
			expect(parseBulkImportSourceKey('images/teachers/1.jpg')).toBeNull();
		});
	});

	describe('splitTextIntoChunks', () => {
		it('splits on paragraph boundaries when exceeding max chars', () => {
			const paragraph = 'x'.repeat(BULK_CHUNK_MAX_CHARS - 10);
			const text = `${paragraph}\n\n${'y'.repeat(100)}`;
			const chunks = splitTextIntoChunks(text);
			expect(chunks).toHaveLength(2);
			expect(chunks[0]).toBe(paragraph);
			expect(chunks[1]).toBe('y'.repeat(100));
		});

		it('returns empty array for blank text', () => {
			expect(splitTextIntoChunks('   \n\n  ')).toEqual([]);
		});

		it('keeps short multi-paragraph text in one chunk', () => {
			const text = 'Line one.\n\nLine two.\n\nLine three.';
			expect(splitTextIntoChunks(text)).toEqual(['Line one.\n\nLine two.\n\nLine three.']);
		});
	});

	describe('extractDocxText', () => {
		it('reads paragraphs from a minimal docx fixture', async () => {
			const buffer = readFileSync(fixtureDocxPath);
			const text = await extractDocxText(buffer);
			expect(text).toContain('Paragraph one alpha.');
			expect(text).toContain('Paragraph two beta.');
			expect(text).toContain('Paragraph three gamma.');
		});
	});

	describe('handleBulkSourceUploaded', () => {
		const jobId = 'job-001';
		const bucket = 'data-bucket';
		const key = `bulk-imports/${jobId}/source/source.docx`;

		it('writes chunks, sets processing before SQS, and sends one message per chunk', async () => {
			const docxBuffer = readFileSync(fixtureDocxPath);
			const putCalls: Array<{ Bucket: string; Key: string; Body: string }> = [];
			const sendOrder: string[] = [];

			(getJob as jest.Mock).mockResolvedValue({
				jobId,
				status: 'pending',
				totalChunks: 0,
				processedChunks: 0,
			});
			(setJobProcessing as jest.Mock).mockImplementation(async () => {
				sendOrder.push('setJobProcessing');
			});
			(mockSqsSend as jest.Mock).mockImplementation(async () => {
				sendOrder.push('sqs');
			});
			(mockS3Send as jest.Mock).mockImplementation(async (command: { input?: { Body?: string; Key?: string; Bucket?: string } }) => {
				if (command.input?.Body !== undefined) {
					putCalls.push(command.input as { Bucket: string; Key: string; Body: string });
					return {};
				}
				return { Body: { transformToByteArray: async () => docxBuffer } };
			});

			await handleBulkSourceUploaded(bucket, key);

			expect(setJobProcessing).toHaveBeenCalledWith(jobId, 1);
			expect(mockSqsSend).toHaveBeenCalledTimes(1);
			expect(putCalls).toHaveLength(1);
			expect(JSON.parse(putCalls[0].Body)).toMatchObject({ index: 0 });
			expect(sendOrder.indexOf('setJobProcessing')).toBeLessThan(sendOrder.indexOf('sqs'));

			const sqsBody = JSON.parse(
				(mockSqsSend.mock.calls[0][0] as { input: { MessageBody: string } }).input.MessageBody,
			);
			expect(sqsBody).toEqual({
				jobId,
				bucket,
				chunkKey: `bulk-imports/${jobId}/chunks/chunk-0.json`,
				chunkIndex: 0,
			});
		});

		it('marks job failed on error', async () => {
			(getJob as jest.Mock).mockResolvedValue({
				jobId,
				status: 'pending',
				totalChunks: 0,
				processedChunks: 0,
			});
			(mockS3Send as jest.Mock).mockRejectedValue(new Error('S3 read failed'));

			await expect(handleBulkSourceUploaded(bucket, key)).rejects.toThrow('S3 read failed');
			expect(markJobFailed).toHaveBeenCalledWith(jobId, 'S3 read failed');
		});

		it('skips non-source keys', async () => {
			await handleBulkSourceUploaded(bucket, 'bulk-imports/job/chunks/chunk-0.json');
			expect(getJob).not.toHaveBeenCalled();
			expect(mockS3Send).not.toHaveBeenCalled();
		});
	});
});

describe('s3-bulk-split handler', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resetBulkSplitSqsClientForTests();
		process.env.BULK_QUEUE_URL = 'https://sqs.eu-north-1.amazonaws.com/123/bulk-queue';
	});

	it('delegates decoded S3 records to handleBulkSourceUploaded', async () => {
		const docxBuffer = readFileSync(fixtureDocxPath);
		(getJob as jest.Mock).mockResolvedValue({
			jobId: 'job-handler',
			status: 'pending',
			totalChunks: 0,
			processedChunks: 0,
		});
		(mockS3Send as jest.Mock).mockImplementation(async (command: { input?: { Body?: string } }) => {
			if (command.input?.Body !== undefined) return {};
			return { Body: { transformToByteArray: async () => docxBuffer } };
		});

		const event: S3Event = {
			Records: [
				{
					eventVersion: '2.1',
					eventSource: 'aws:s3',
					awsRegion: 'eu-north-1',
					eventTime: '2026-01-01T00:00:00.000Z',
					eventName: 'ObjectCreated:Put',
					userIdentity: { principalId: 'test' },
					requestParameters: { sourceIPAddress: '127.0.0.1' },
					responseElements: {
						'x-amz-request-id': 'req',
						'x-amz-id-2': 'id2',
					},
					s3: {
						s3SchemaVersion: '1.0',
						configurationId: 'test',
						bucket: { name: 'data-bucket', ownerIdentity: { principalId: 'test' }, arn: 'arn:aws:s3:::data-bucket' },
						object: {
							key: 'bulk-imports/job-handler/source/source.docx',
							size: 100,
							eTag: 'etag',
							sequencer: '0',
						},
					},
				},
			],
		};

		await handler(event, {} as never, () => undefined);

		expect(setJobProcessing).toHaveBeenCalledWith('job-handler', 1);
		expect(mockSqsSend).toHaveBeenCalledTimes(1);
	});
});
