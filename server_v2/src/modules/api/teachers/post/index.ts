import type { Engine } from '@interfaces/types';
import { logException } from '@lib/lambda-log';
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
		logException('teacher:create_failed', e, ctx.correlationIds);
		return ResponseWriter.InternalServerError({ message: 'Error creating teacher' });
	}
};
