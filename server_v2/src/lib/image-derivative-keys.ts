/**
 * S3 keys for admin uploads: originals live under `.../images/<file>` or `teachers/<file>`;
 * derivatives use parallel `*-webp` / `*-thumbs-webp` folders (see `image-s3.ts` delete paths).
 */

const IMAGE_SEGMENT = 'images';

export function webpBasenameFromOriginalName(fileName: string): string {
	return fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
}

/** True for keys produced by presigned PUT to scoped `.../images/<file>` or flat `teachers/<file>`. */
export function isOriginalUploadObjectKey(key: string): boolean {
	const segs = key.split('/').filter(Boolean);
	if (segs.length < 2) return false;
	const base = segs[segs.length - 1] ?? '';
	if (!/\.(jpe?g|png|webp)$/i.test(base)) return false;
	if (segs[0] === 'teachers' && segs.length === 2) return true;
	if (segs[segs.length - 2] === IMAGE_SEGMENT) return true;
	return false;
}

export interface DerivativeKeys {
	webpKey: string;
	thumbWebpKey: string;
}

export function derivativeKeysFromOriginalKey(originalKey: string): DerivativeKeys | null {
	const segs = originalKey.split('/').filter(Boolean);
	if (segs.length < 2) return null;

	const fileName = segs[segs.length - 1]!;
	const parent = segs[segs.length - 2]!;
	const webpName = webpBasenameFromOriginalName(fileName);

	// Flat teacher uploads: teachers/<uuid>.<ext> → teachers-webp/ / teachers-thumbs-webp/
	if (segs[0] === 'teachers' && segs.length === 2 && parent === 'teachers') {
		return {
			webpKey: `teachers-webp/${webpName}`,
			thumbWebpKey: `teachers-thumbs-webp/${webpName}`,
		};
	}

	if (parent !== IMAGE_SEGMENT) return null;
	segs.pop();
	segs.pop();
	const prefix = segs;
	return {
		webpKey: [...prefix, 'images-webp', webpName].join('/'),
		thumbWebpKey: [...prefix, 'images-thumbs-webp', webpName].join('/'),
	};
}
