import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3BucketName, getS3Client } from '@lib/s3-client';

const PRESIGN_EXPIRES_SEC = 3600;

export const BULK_DOCX_CONTENT_TYPE =
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function bulkImportSourceKey(jobId: string): string {
	return `bulk-imports/${jobId}/source/source.docx`;
}

export interface PresignBulkDocxUploadResult {
	uploadUrl: string;
	expiresIn: number;
	method: 'PUT';
	headers: { 'Content-Type': string };
	s3: { bucket: string; key: string };
}

export async function createPresignedBulkDocxUpload(jobId: string): Promise<PresignBulkDocxUploadResult> {
	const key = bulkImportSourceKey(jobId);
	const contentType = BULK_DOCX_CONTENT_TYPE;
	const bucket = getS3BucketName();

	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		ContentType: contentType,
	});

	const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: PRESIGN_EXPIRES_SEC });

	return {
		uploadUrl,
		expiresIn: PRESIGN_EXPIRES_SEC,
		method: 'PUT',
		headers: { 'Content-Type': contentType },
		s3: { bucket, key },
	};
}
