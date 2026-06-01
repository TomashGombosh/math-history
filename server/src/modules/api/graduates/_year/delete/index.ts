import type { Engine } from '@interfaces/types';
import { deleteImageFiles } from '@lib/image-s3';
import { ResponseWriter } from '@lib/response-writer';
import { deleteGraduateByYear } from '@services/graduate-service';

export const handler = async (ctx: Engine) => {
	const yearNum = Number(ctx.req.params.year);
	if (!yearNum || Number.isNaN(yearNum)) {
		return ResponseWriter.BadRequest({ message: 'Некоректний рік у URL' });
	}
	const res = await deleteGraduateByYear(yearNum);
	if (!res) {
		return ResponseWriter.NotFound({ message: `Випуск за ${yearNum} рік не знайдено` });
	}
	for (const url of res.imageUrls) {
		await deleteImageFiles(url);
	}
	return ResponseWriter.Success({ ok: res.ok, year: res.year, id: res.ids[0] });
};
