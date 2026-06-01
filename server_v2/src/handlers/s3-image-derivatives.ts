import type { S3Event, S3Handler } from 'aws-lambda';
import { handleS3ObjectCreatedEvent } from '@services/image-derivative-processor';

export const handler: S3Handler = async (event: S3Event) => {
	for (const rec of event.Records ?? []) {
		const bucket = rec.s3?.bucket?.name;
		const key = rec.s3?.object?.key ? decodeURIComponent(rec.s3.object.key.replace(/\+/g, ' ')) : undefined;
		await handleS3ObjectCreatedEvent(bucket, key);
	}
};
