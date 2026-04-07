import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

/** Full public URL for a `teachers/...` object key (CDN or site `/images/` prefix). */
function publicUrlForTeacherObjectKey(relativePath: string): string {
	const normalized = relativePath.replace(/^\/+/, '');
	const base = process.env.TEACHER_IMAGE_CDN_BASE?.trim();
	if (base) {
		return `${base.replace(/\/$/, '')}/${normalized}`;
	}
	const site = process.env.SITE_URL?.trim();
	if (site) {
		return `${site.replace(/\/$/, '')}/images/${normalized}`;
	}
	return `/images/${normalized}`;
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
	/** Predicted webp path (object exists only if you add processing or a second upload) */
	webpUrl: string;
}

export async function createPresignedImageUpload(input: PresignImageUploadInput): Promise<PresignImageUploadResult> {
	const contentType = input.contentType.trim();
	if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
		throw new Error('UNSUPPORTED_MEDIA_TYPE');
	}

	const ext = path.extname(input.originalFileName).toLowerCase() || '.jpg';
	const scope = (input.scope || 'common').toString();

	let key: string;
	let imageUrl: string;
	let webpUrl: string;

	if (scope === 'teacher') {
		const id = randomUUID();
		const fileName = `${id}${ext}`;
		const webpName = `${id}.webp`;
		key = `teachers/${fileName}`;
		imageUrl = publicUrlForTeacherObjectKey(key);
		webpUrl = publicUrlForTeacherObjectKey(`teachers/${webpName}`);
	} else {
		const fileName = `${Date.now()}${ext}`;
		const webpName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');

		const sub = subDirsForScope(scope);

		if (sub.length) {
			const imgSegs = [...sub, 'images'];
			const webpSegs = [...sub, 'images-webp'];
			key = `${imgSegs.join('/')}/${fileName}`;
			imageUrl = `/${imgSegs.join('/')}/${fileName}`;
			webpUrl = `/${webpSegs.join('/')}/${webpName}`;
		} else {
			key = `images/${fileName}`;
			imageUrl = `/images/${fileName}`;
			webpUrl = `/images-webp/${webpName}`;
		}
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
	};
}
