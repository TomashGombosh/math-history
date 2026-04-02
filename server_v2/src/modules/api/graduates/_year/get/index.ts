import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getGraduateYearDetail } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const yearNum = Number(ctx.req.params.year);
	if (Number.isNaN(yearNum)) {
		return ResponseWriter.BadRequest({ message: 'Invalid year' });
	}
	const data = await getGraduateYearDetail(yearNum);
	return ResponseWriter.Success(data);
};
