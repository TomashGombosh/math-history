import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { graduateToJson, listGraduateRows } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const yearRaw = ctx.req.params.year;
	const parsed = yearRaw !== undefined && yearRaw !== '' ? Number(yearRaw) : null;
	const yearFilter = parsed !== null && !Number.isNaN(parsed) ? parsed : null;
	const rows = await listGraduateRows(yearFilter);
	return ResponseWriter.Success(rows.map(graduateToJson));
};
