import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { createPresignedImageUpload } from '@services/upload-service';

export const handler = async (ctx: Engine) => {
	try {
		const result = await createPresignedImageUpload(ctx.req.body);
		return ResponseWriter.Success(result);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'UNSUPPORTED_MEDIA_TYPE') {
			return ResponseWriter.UnsupportedMediaType({ message: 'Непідтримуваний формат зображення' });
		}
		console.error(e);
		return ResponseWriter.InternalServerError({ message: 'Could not create upload URL' });
	}
};
