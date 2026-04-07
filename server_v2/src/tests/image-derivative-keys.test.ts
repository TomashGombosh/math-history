import { derivativeKeysFromOriginalKey, isOriginalUploadObjectKey, webpBasenameFromOriginalName } from '@lib/image-derivative-keys';

describe('image-derivative-keys', () => {
	it('webpBasenameFromOriginalName', () => {
		expect(webpBasenameFromOriginalName('123.jpg')).toBe('123.webp');
		expect(webpBasenameFromOriginalName('x.PNG')).toBe('x.webp');
	});

	it('isOriginalUploadObjectKey', () => {
		expect(isOriginalUploadObjectKey('images/1.jpg')).toBe(true);
		expect(isOriginalUploadObjectKey('teachers_img/images/1.jpg')).toBe(true);
		expect(isOriginalUploadObjectKey('graduates_img/images/x.webp')).toBe(true);
		expect(isOriginalUploadObjectKey('images-webp/x.webp')).toBe(false);
		expect(isOriginalUploadObjectKey('teachers_img/images-webp/x.webp')).toBe(false);
	});

	it('derivativeKeysFromOriginalKey', () => {
		expect(derivativeKeysFromOriginalKey('images/a.jpeg')).toEqual({
			webpKey: 'images-webp/a.webp',
			thumbWebpKey: 'images-thumbs-webp/a.webp',
		});
		expect(derivativeKeysFromOriginalKey('teachers_img/images/b.jpg')).toEqual({
			webpKey: 'teachers_img/images-webp/b.webp',
			thumbWebpKey: 'teachers_img/images-thumbs-webp/b.webp',
		});
	});
});
