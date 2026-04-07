/**
 * S3 keys for admin uploads: originals live under `.../images/<file>`;
 * derivatives use `.../images-webp/` and `.../images-thumbs-webp/` (see `image-s3.ts` delete paths).
 */

const IMAGE_SEGMENT = 'images';

export function webpBasenameFromOriginalName(fileName: string): string {
	return fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
}

/** True for keys produced by presigned PUT to `images/`, `teachers_img/images/`, `graduates_img/images/`. */
export function isOriginalUploadObjectKey(key: string): boolean {
	const segs = key.split('/').filter(Boolean);
	if (segs.length < 2) return false;
	if (segs[segs.length - 2] !== IMAGE_SEGMENT) return false;
	const base = segs[segs.length - 1] ?? '';
	return /\.(jpe?g|png|webp)$/i.test(base);
}

export interface DerivativeKeys {
	webpKey: string;
	thumbWebpKey: string;
}

export function derivativeKeysFromOriginalKey(originalKey: string): DerivativeKeys | null {
	if (!isOriginalUploadObjectKey(originalKey)) return null;
	const segs = originalKey.split('/').filter(Boolean);
	const fileName = segs.pop()!;
	const _images = segs.pop();
	if (_images !== IMAGE_SEGMENT) return null;
	const prefix = segs;
	const webpName = webpBasenameFromOriginalName(fileName);
	return {
		webpKey: [...prefix, 'images-webp', webpName].join('/'),
		thumbWebpKey: [...prefix, 'images-thumbs-webp', webpName].join('/'),
	};
}
