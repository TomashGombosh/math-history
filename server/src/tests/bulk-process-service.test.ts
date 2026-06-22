import type { SQSEvent } from 'aws-lambda';

const mockS3Send = jest.fn();
const mockGetJob = jest.fn();
const mockIncrementProcessedChunks = jest.fn();
const mockUpsertCandidate = jest.fn();
const mockFilterNewBulkEntities = jest.fn();
const mockExtractFromChunkText = jest.fn();
const mockSendBulkImportCompleteNotification = jest.fn();

jest.mock('../lib/s3-client', () => ({
	getS3Client: jest.fn(() => ({ send: mockS3Send })),
}));

jest.mock('../services/bulk-import-service', () => ({
	getJob: (...args: unknown[]) => mockGetJob(...args),
	incrementProcessedChunks: (...args: unknown[]) => mockIncrementProcessedChunks(...args),
	upsertCandidate: (...args: unknown[]) => mockUpsertCandidate(...args),
}));

jest.mock('../services/bulk-compare-service', () => ({
	filterNewBulkEntities: (...args: unknown[]) => mockFilterNewBulkEntities(...args),
}));

jest.mock('../services/bulk-extract-service', () => ({
	extractFromChunkText: (...args: unknown[]) => mockExtractFromChunkText(...args),
}));

jest.mock('../services/email-service', () => ({
	sendBulkImportCompleteNotification: (...args: unknown[]) => mockSendBulkImportCompleteNotification(...args),
}));

import { handler } from '../handlers/sqs-bulk-process';
import { processChunkMessage } from '@services/bulk-process-service';

const baseMessage = {
	jobId: 'job-1',
	bucket: 'data-bucket',
	chunkKey: 'bulk-imports/job-1/chunks/chunk-0.json',
	chunkIndex: 0,
};

describe('bulk-process-service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockGetJob.mockResolvedValue({
			jobId: 'job-1',
			status: 'processing',
			totalChunks: 3,
			processedChunks: 0,
			counts: { teachers: 0, graduates: 0, years: 0 },
		});
		mockS3Send.mockResolvedValue({
			Body: {
				transformToByteArray: async () => Buffer.from(JSON.stringify({ text: 'Teacher One' }), 'utf8'),
			},
		});
		mockExtractFromChunkText.mockReturnValue({
			teachers: ['Teacher One'],
			graduates: [],
			years: [],
		});
		mockFilterNewBulkEntities.mockImplementation(async (input: unknown) => input);
		mockIncrementProcessedChunks.mockResolvedValue({ processedChunks: 1 });
		mockUpsertCandidate.mockResolvedValue({});
		mockSendBulkImportCompleteNotification.mockResolvedValue(undefined);
	});

	it('no-ops when job is cancelled', async () => {
		mockGetJob.mockResolvedValue({ jobId: 'job-1', status: 'cancelled' });

		await processChunkMessage(baseMessage);

		expect(mockS3Send).not.toHaveBeenCalled();
		expect(mockIncrementProcessedChunks).not.toHaveBeenCalled();
	});

	it('processes chunk and upserts filtered candidates', async () => {
		mockFilterNewBulkEntities.mockResolvedValue({
			teachers: ['Teacher One'],
			graduates: [{ name: 'Grad One', year: 2020 }],
			years: [2021],
		});

		await processChunkMessage(baseMessage);

		expect(mockUpsertCandidate).toHaveBeenCalledTimes(3);
		expect(mockIncrementProcessedChunks).toHaveBeenCalledWith('job-1');
	});

	it('sends completion email when job becomes ready', async () => {
		mockIncrementProcessedChunks.mockResolvedValue({ processedChunks: 3, status: 'ready' });
		mockGetJob
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'processing',
				counts: { teachers: 1, graduates: 0, years: 0 },
			})
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'ready',
				counts: { teachers: 1, graduates: 0, years: 0 },
			});

		await processChunkMessage(baseMessage);

		expect(mockSendBulkImportCompleteNotification).toHaveBeenCalledWith('job-1', {
			teachers: 1,
			graduates: 0,
			years: 0,
		});
	});

	it('marks only the last chunk as ready across three messages', async () => {
		mockGetJob.mockResolvedValue({
			jobId: 'job-1',
			status: 'processing',
			totalChunks: 3,
			processedChunks: 0,
			counts: { teachers: 0, graduates: 0, years: 0 },
		});
		mockIncrementProcessedChunks
			.mockResolvedValueOnce({ processedChunks: 1 })
			.mockResolvedValueOnce({ processedChunks: 2 })
			.mockResolvedValueOnce({ processedChunks: 3, status: 'ready' });
		mockGetJob
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'processing',
				counts: { teachers: 0, graduates: 0, years: 0 },
			})
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'processing',
				counts: { teachers: 0, graduates: 0, years: 0 },
			})
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'processing',
				counts: { teachers: 0, graduates: 0, years: 0 },
			})
			.mockResolvedValueOnce({
				jobId: 'job-1',
				status: 'ready',
				counts: { teachers: 0, graduates: 0, years: 0 },
			});

		for (let i = 0; i < 3; i += 1) {
			await processChunkMessage({ ...baseMessage, chunkIndex: i });
		}

		expect(mockSendBulkImportCompleteNotification).toHaveBeenCalledTimes(1);
	});

	describe('sqs-bulk-process handler', () => {
		it('reports batchItemFailures when a message throws', async () => {
			mockGetJob.mockRejectedValueOnce(new Error('ddb down'));

			const event: SQSEvent = {
				Records: [
					{
						messageId: 'msg-1',
						receiptHandle: 'rh-1',
						body: JSON.stringify(baseMessage),
						attributes: {
							ApproximateReceiveCount: '1',
							SentTimestamp: '1',
							SenderId: 'sender',
							ApproximateFirstReceiveTimestamp: '1',
						},
						messageAttributes: {},
						md5OfBody: 'md5',
						eventSource: 'aws:sqs',
						eventSourceARN: 'arn:aws:sqs:eu-north-1:123:queue',
						awsRegion: 'eu-north-1',
					},
				],
			};

			const res = (await handler(event, {} as never, () => undefined)) as { batchItemFailures: { itemIdentifier: string }[] };
			expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'msg-1' }]);
		});
	});
});
