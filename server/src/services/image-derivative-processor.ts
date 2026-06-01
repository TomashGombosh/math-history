import { buffer as streamToBuffer } from 'node:stream/consumers';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { logException, logInfo } from '@lib/lambda-log';
import { derivativeKeysFromOriginalKey } from '@lib/image-derivative-keys';
import { getS3BucketName, getS3Client } from '@lib/s3-client';

const WEBP_MAX_W = 800;
const WEBP_MAX_H = 1000;
const WEBP_QUALITY = 80;
const THUMB_SIZE = 250;
const THUMB_QUALITY = 80;

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

export async function processUploadedOriginalKey(bucket: string, originalKey: string): Promise<void> {
	const keys = derivativeKeysFromOriginalKey(originalKey);
	if (!keys) {
		logInfo('image_derivatives:skip_key', { bucket, key: originalKey });
		return;
	}

	const s3 = getS3Client();
	const getOut = await s3.send(
		new GetObjectCommand({
			Bucket: bucket,
			Key: originalKey,
		}),
	);
	const bodyBuf = await getObjectBodyBuffer(getOut.Body);
	if (!bodyBuf.length) {
		logInfo('image_derivatives:empty_object', { bucket, key: originalKey });
		return;
	}

	const webpBuffer = await sharp(bodyBuf)
		.resize(WEBP_MAX_W, WEBP_MAX_H, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: WEBP_QUALITY })
		.toBuffer();

	const thumbBuffer = await sharp(bodyBuf)
		.resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'entropy' })
		.webp({ quality: THUMB_QUALITY })
		.toBuffer();

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: keys.webpKey,
			Body: webpBuffer,
			ContentType: 'image/webp',
			CacheControl: 'public, max-age=31536000, immutable',
		}),
	);
	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: keys.thumbWebpKey,
			Body: thumbBuffer,
			ContentType: 'image/webp',
			CacheControl: 'public, max-age=31536000, immutable',
		}),
	);

	logInfo('image_derivatives:written', {
		bucket,
		originalKey,
		webpKey: keys.webpKey,
		thumbWebpKey: keys.thumbWebpKey,
	});
}

/** For tests / local scripts */
export async function processUploadedOriginalKeyFromEnv(originalKey: string): Promise<void> {
	await processUploadedOriginalKey(getS3BucketName(), originalKey);
}

export async function handleS3ObjectCreatedEvent(bucket: string | undefined, key: string | undefined): Promise<void> {
	if (!bucket || !key) return;
	try {
		await processUploadedOriginalKey(bucket, key);
	} catch (e: unknown) {
		logException('image_derivatives:failed', e, { bucket, key });
		throw e;
	}
}
