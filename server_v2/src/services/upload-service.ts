import path from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { webpBasenameFromOriginalName } from '@lib/image-derivative-keys';
import { getS3BucketName, getS3Client } from '@lib/s3-client';

const PRESIGN_EXPIRES_SEC = 3600;

const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function subDirsForScope(scope: string): string[] {
	if (scope === 'teacher') {
		return ['teachers_img'];
	}
	if (scope === 'graduate' || scope === 'graduates') {
		return ['graduates_img'];
	}
	return [];
}

export interface PresignImageUploadInput {
	/** Same as legacy `scope` / `type` query: teacher | graduate | graduates | common */
	scope?: string;
	contentType: string;
	originalFileName: string;
}

export interface PresignImageUploadResult {
	/** PUT this URL with the file body */
	uploadUrl: string;
	expiresIn: number;
	method: 'PUT';
	/** Headers the browser must send on PUT (signature matches Content-Type) */
	headers: { 'Content-Type': string };
	s3: { bucket: string; key: string };
	/** Store on teacher/graduate records after upload succeeds */
	imageUrl: string;
	/** Predicted WebP path (filled asynchronously by S3-triggered Lambda after PUT completes) */
	webpUrl: string;
	/** Predicted thumb WebP path (same pipeline as `webpUrl`) */
	thumbUrl: string;
}

export async function createPresignedImageUpload(input: PresignImageUploadInput): Promise<PresignImageUploadResult> {
	const contentType = input.contentType.trim();
	if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
		throw new Error('UNSUPPORTED_MEDIA_TYPE');
	}

	const ext = path.extname(input.originalFileName).toLowerCase() || '.jpg';
	const fileName = `${Date.now()}${ext}`;
	const webpName = webpBasenameFromOriginalName(fileName);

	const scope = (input.scope || 'common').toString();
	const sub = subDirsForScope(scope);

	let key: string;
	let imageUrl: string;
	let webpUrl: string;
	let thumbUrl: string;

	if (sub.length) {
		const imgSegs = [...sub, 'images'];
		const webpSegs = [...sub, 'images-webp'];
		const thumbSegs = [...sub, 'images-thumbs-webp'];
		key = `${imgSegs.join('/')}/${fileName}`;
		imageUrl = `/${imgSegs.join('/')}/${fileName}`;
		webpUrl = `/${webpSegs.join('/')}/${webpName}`;
		thumbUrl = `/${thumbSegs.join('/')}/${webpName}`;
	} else {
		key = `images/${fileName}`;
		imageUrl = `/images/${fileName}`;
		webpUrl = `/images-webp/${webpName}`;
		thumbUrl = `/images-thumbs-webp/${webpName}`;
	}

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
		imageUrl,
		webpUrl,
		thumbUrl,
	};
}
