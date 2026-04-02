import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getYearsSummary } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (_ctx: Engine) => {
	const rows = await getYearsSummary();
	return ResponseWriter.Success(rows);
};
