import { S3Client } from '@aws-sdk/client-s3';
import { awsSdkLogger } from './aws-sdk-logger';

let client: S3Client | null = null;

export function getS3Client(): S3Client {
	if (!client) {
		const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-north-1';
		const endpoint = process.env.S3_ENDPOINT?.trim();
		const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
		const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
		const localCreds = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

		client = new S3Client({
			region,
			logger: awsSdkLogger,
			...(endpoint
				? {
						endpoint,
						forcePathStyle: true,
						...(localCreds ? { credentials: localCreds } : {}),
					}
				: {}),
		});
	}
	return client;
}

export function getS3BucketName(): string {
	const b = process.env.S3_DATA_BUCKET;
	if (!b) {
		throw new Error('S3_DATA_BUCKET is not set');
	}
	return b;
}
