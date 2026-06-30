import type { SQSBatchResponse, SQSEvent, SQSHandler } from 'aws-lambda';
import { logException } from '@lib/lambda-log';
import { processChunkMessage } from '@services/bulk-process-service';
import type { BulkChunkQueueMessage } from '@services/bulk-split-service';

export const handler: SQSHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
	const batchItemFailures: { itemIdentifier: string }[] = [];

	for (const record of event.Records ?? []) {
		try {
			const message = JSON.parse(record.body) as BulkChunkQueueMessage;
			await processChunkMessage(message);
		} catch (err) {
			logException('bulk_process:message_failed', err, { messageId: record.messageId });
			batchItemFailures.push({ itemIdentifier: record.messageId });
		}
	}

	return { batchItemFailures };
};
