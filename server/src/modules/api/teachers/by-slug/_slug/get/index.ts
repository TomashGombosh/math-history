import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { findTeacherBySlug } from '@services/teacher-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const slug = String(ctx.req.params.slug);
	const teacher = await findTeacherBySlug(slug);
	if (!teacher) {
		return ResponseWriter.NotFound({ message: 'Not found' });
	}
	return ResponseWriter.Success(teacher);
};
