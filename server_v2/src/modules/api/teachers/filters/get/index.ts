import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getTeacherFilters } from '@services/teacher-service';

export const publicResource = true;

export const handler = async (_ctx: Engine) => {
	const { positions, degrees } = await getTeacherFilters();
	return ResponseWriter.Success({ positions, degrees });
};
