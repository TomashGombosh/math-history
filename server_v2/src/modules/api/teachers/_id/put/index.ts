import type { Engine } from '@interfaces/types';
import { deleteImageFiles } from '@lib/image-s3';
import { ResponseWriter } from '@lib/response-writer';
import { updateTeacher } from '@services/teacher-service';

const DEFAULT_TEACHER_IMAGE_URL = '/profile-icon.webp';

export const handler = async (ctx: Engine) => {
	const id = Number(ctx.req.params.id);
	try {
		const { teacher, oldImageUrl } = await updateTeacher(id, ctx.req.body);
		const newImageUrl = teacher.imageUrl || null;
		if (
			oldImageUrl &&
			oldImageUrl !== newImageUrl &&
			oldImageUrl !== DEFAULT_TEACHER_IMAGE_URL
		) {
			await deleteImageFiles(oldImageUrl);
		}
		return ResponseWriter.Success(teacher);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NOT_FOUND') {
			return ResponseWriter.NotFound({ message: 'Teacher not found' });
		}
		console.error(e);
		return ResponseWriter.InternalServerError({ message: 'Error updating teacher' });
	}
};
