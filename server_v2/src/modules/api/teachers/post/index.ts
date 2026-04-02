import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { createTeacher } from '@services/teacher-service';

export const handler = async (ctx: Engine) => {
	try {
		const teacher = await createTeacher(ctx.req.body);
		return ResponseWriter.Success(teacher);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'NAME_REQUIRED') {
			return ResponseWriter.BadRequest({ message: "Поле name є обов'язковим" });
		}
		if (msg === 'SLUG_CONFLICT') {
			return ResponseWriter.BadRequest({ message: 'Викладач із таким slug уже існує' });
		}
		console.error('Create teacher error:', e);
		return ResponseWriter.InternalServerError({ message: 'Error creating teacher' });
	}
};
