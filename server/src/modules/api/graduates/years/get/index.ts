import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getYearsSummary } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const rows = await getYearsSummary(ctx.correlationIds);
	return ResponseWriter.Success(rows);
};
