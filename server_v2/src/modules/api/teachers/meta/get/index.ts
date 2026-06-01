import type { Engine } from '@interfaces/types';
import { ResponseWriter } from '@lib/response-writer';
import { getTeacherMetaAdmin } from '@services/teacher-service';

export const handler = async (_ctx: Engine) => {
	const { positions, degrees } = await getTeacherMetaAdmin();
	return ResponseWriter.Success({ positions, degrees });
};
