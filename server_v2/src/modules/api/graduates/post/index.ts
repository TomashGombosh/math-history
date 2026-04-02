import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { createGraduate } from '@services/graduate-service';

export const handler = async (ctx: Engine) => {
	try {
		const res = await createGraduate(ctx.req.body);
		return ResponseWriter.Success(res);
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'INVALID_YEAR') {
			return ResponseWriter.BadRequest({ message: 'Некоректний рік випуску' });
		}
		if (msg === 'STUDENTS_REQUIRED' || msg === 'STUDENTS_EMPTY') {
			return ResponseWriter.BadRequest({ message: 'Потрібно передати хоча б одного студента' });
		}
		if (msg === 'YEAR_EXISTS') {
			return ResponseWriter.Conflict({ message: 'Випуск за цей рік уже існує' });
		}
		console.error(e);
		return ResponseWriter.InternalServerError({ message: 'Error creating graduate' });
	}
};
