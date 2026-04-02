import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getTeacherById } from '@services/teacher-service';

export const handler = async (ctx: Engine) => {
	const id = Number(ctx.req.params.id);
	const teacher = await getTeacherById(id);
	if (!teacher) {
		return ResponseWriter.NotFound({ message: 'Teacher not found' });
	}
	return ResponseWriter.Success(teacher);
};
