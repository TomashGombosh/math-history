import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { logException } from '@lib/lambda-log';
import { getS3BucketName, getS3Client } from './s3-client';

function basenameFromUrl(imageUrl: string): string {
	try {
		const u = imageUrl.startsWith('http') ? new URL(imageUrl) : null;
		const pathname = u ? u.pathname : imageUrl;
		const parts = pathname.split('/').filter(Boolean);
		return parts[parts.length - 1] || '';
	} catch {
		return '';
	}
}

/**
 * Deletes original + webp + thumb variants for a stored image URL (parity with old local file cleanup).
 */
export async function deleteImageFiles(imageUrl: string | null | undefined): Promise<void> {
	if (!imageUrl) return;

	const fileName = basenameFromUrl(imageUrl);
	if (!fileName) return;

	const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');

	const prefixes = [
		['images', fileName],
		['images-webp', webpName],
		['images-thumbs-webp', webpName],
		['teachers', fileName],
		['teachers-webp', webpName],
		['teachers-thumbs-webp', webpName],
		['teachers_img', 'images', fileName],
		['teachers_img', 'images-webp', webpName],
		['teachers_img', 'images-thumbs-webp', webpName],
		['graduates_img', 'images', fileName],
		['graduates_img', 'images-webp', webpName],
		['graduates_img', 'images-thumbs-webp', webpName],
	];

	const keys = prefixes.map((segs) => segs.join('/'));
	const s3 = getS3Client();
	const bucket = getS3BucketName();

	await Promise.all(
		keys.map((Key) =>
			s3
				.send(
					new DeleteObjectCommand({
						Bucket: bucket,
						Key,
					}),
				)
				.catch((e: { name?: string }) => {
					if (e?.name !== 'NotFound' && e?.name !== 'NoSuchKey') {
						logException('s3:deleteObject_failed', e, { s3Key: Key });
					}
				}),
		),
	);
}
