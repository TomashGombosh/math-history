import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getSpecialties } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (_ctx: Engine) => {
	const rows = await getSpecialties();
	return ResponseWriter.Success(rows);
};
