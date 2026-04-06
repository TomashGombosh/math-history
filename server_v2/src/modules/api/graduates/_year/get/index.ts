import type { Engine } from '@interfaces/types';
import { decodeExclusiveStartKey } from '@lib/pagination-cursor';
import { ResponseWriter } from '@lib/response-writer';
import { getGraduateYearDetail } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const q = ctx.req.params;
	const yearNum = Number(q.year);
	if (Number.isNaN(yearNum)) {
		return ResponseWriter.BadRequest({ message: 'Invalid year' });
	}

	const useStudentCursor = String(q.cursor) === '1' || Boolean(q.exclusiveStartKey);
	if (useStudentCursor) {
		const limit = parseInt(String(q.limit ?? '100'), 10) || 100;
		let offset = 0;
		if (q.exclusiveStartKey) {
			const decoded = decodeExclusiveStartKey(String(q.exclusiveStartKey));
			const o = decoded?.offset;
			offset = typeof o === 'number' && !Number.isNaN(o) ? o : 0;
		}
		const data = await getGraduateYearDetail(yearNum, { limit, offset });
		return ResponseWriter.Success(data);
	}

	const data = await getGraduateYearDetail(yearNum);
	return ResponseWriter.Success(data);
};
