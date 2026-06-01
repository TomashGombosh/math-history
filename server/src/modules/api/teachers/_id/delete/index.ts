import type { Engine } from '@interfaces/types';
import { deleteImageFiles } from '@lib/image-s3';
import { ResponseWriter } from '@lib/response-writer';
import { deleteTeacher } from '@services/teacher-service';

export const handler = async (ctx: Engine) => {
	const id = Number(ctx.req.params.id);
	const teacher = await deleteTeacher(id);
	if (!teacher) {
		return ResponseWriter.NotFound({ message: 'Teacher not found' });
	}
	await deleteImageFiles(teacher.imageUrl ?? null);
	return ResponseWriter.Success({ message: 'Deleted' });
};
