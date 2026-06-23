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
import { documentXmlToText } from '@services/docx-extract';
import { getJob, markJobFailed, setJobProcessing } from '@services/bulk-import-service';

const fixtureDocxPath = path.join(process.cwd(), 'src/tests/fixtures/minimal-bulk.docx');

/**
 * Serve the docx fixture over the range-request access pattern used by
 * S3ByteSource: HeadObject → ContentLength, ranged GetObject → byte slice.
 * Returns recorded PutObject calls (chunk writes).
 */
function mockS3WithDocxFixture(docxBuffer: Buffer): Array<{ Bucket: string; Key: string; Body: string }> {
	const putCalls: Array<{ Bucket: string; Key: string; Body: string }> = [];
	(mockS3Send as jest.Mock).mockImplementation(
		async (command: { input?: { Body?: string; Range?: string; Key?: string; Bucket?: string } }) => {
			const input = command.input ?? {};
			if (input.Body !== undefined) {
				putCalls.push(input as { Bucket: string; Key: string; Body: string });
				return {};
			}
			if (input.Range) {
				const match = /bytes=(\d+)-(\d+)/.exec(input.Range);
				if (!match) throw new Error(`unexpected Range: ${input.Range}`);
				const start = Number(match[1]);
				const end = Number(match[2]);
				const slice = docxBuffer.subarray(start, end + 1);
				return { Body: { transformToByteArray: async () => slice } };
			}
			return { ContentLength: docxBuffer.length };
		},
	);
	return putCalls;
}

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

	describe('documentXmlToText', () => {
		it('joins runs within a paragraph and separates paragraphs with blank lines', () => {
			const xml =
				'<w:document><w:body>' +
				'<w:p><w:r><w:t>Hello </w:t></w:r><w:r><w:t>world</w:t></w:r></w:p>' +
				'<w:p><w:r><w:t>Second</w:t></w:r></w:p>' +
				'</w:body></w:document>';
			expect(documentXmlToText(xml)).toBe('Hello world\n\nSecond');
		});

		it('unescapes entities and honors xml:space runs, tabs and breaks', () => {
			const xml =
				'<w:p><w:r><w:t xml:space="preserve">A &amp; B</w:t><w:tab/><w:t>C</w:t><w:br/><w:t>D</w:t></w:r></w:p>';
			expect(documentXmlToText(xml)).toBe('A & B\tC\nD');
		});

		it('ignores text outside w:t runs (e.g. field codes)', () => {
			const xml = '<w:p><w:instrText>HYPERLINK foo</w:instrText><w:r><w:t>Keep</w:t></w:r></w:p>';
			expect(documentXmlToText(xml)).toBe('Keep');
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
			const putCalls = mockS3WithDocxFixture(docxBuffer);

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
		mockS3WithDocxFixture(docxBuffer);

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
