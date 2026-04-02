import type { Engine } from '@interfaces/types';
import { deleteImageFiles } from '@lib/image-s3';
import { ResponseWriter } from '@lib/response-writer';
import { updateGraduateByYear } from '@services/graduate-service';

export const handler = async (ctx: Engine) => {
	const currentYear = Number(ctx.req.params.year);
	if (!currentYear || Number.isNaN(currentYear)) {
		return ResponseWriter.BadRequest({ message: 'Некоректний параметр year у URL' });
	}
	try {
		const res = await updateGraduateByYear(currentYear, ctx.req.body);
		for (const url of res.removedUrls) {
			await deleteImageFiles(url);
		}
		return ResponseWriter.Success({ ok: res.ok, year: res.year, id: res.id });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : '';
		if (msg === 'INVALID_YEAR') {
			return ResponseWriter.BadRequest({ message: 'Некоректний рік випуску' });
		}
		if (msg === 'STUDENTS_REQUIRED' || msg === 'STUDENTS_EMPTY') {
			return ResponseWriter.BadRequest({ message: 'Потрібно передати хоча б одного студента' });
		}
		if (msg === 'NOT_FOUND') {
			return ResponseWriter.NotFound({ message: `Випуск за ${currentYear} рік не знайдено` });
		}
		if (msg === 'YEAR_EXISTS') {
			return ResponseWriter.Conflict({ message: 'Випуск за цей рік уже існує' });
		}
		console.error(e);
		return ResponseWriter.InternalServerError({ message: 'Error updating graduate' });
	}
};
