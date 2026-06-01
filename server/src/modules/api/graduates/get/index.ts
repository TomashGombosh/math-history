import type { Engine } from '@interfaces/types';
import { decodeExclusiveStartKey, encodeExclusiveStartKey } from '@lib/pagination-cursor';
import { ResponseWriter } from '@lib/response-writer';
import { graduateToJson, listGraduateRows, listGraduateRowsPage } from '@services/graduate-service';

export const publicResource = true;

export const handler = async (ctx: Engine) => {
	const q = ctx.req.params;
	const yearRaw = q.year;
	const parsed = yearRaw !== undefined && yearRaw !== '' ? Number(yearRaw) : null;
	const yearFilter = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

	const useCursor = String(q.cursor) === '1' || Boolean(q.exclusiveStartKey);
	if (useCursor) {
		const limit = parseInt(String(q.limit ?? '50'), 10) || 50;
		const exclusiveStartKey = decodeExclusiveStartKey(
			q.exclusiveStartKey ? String(q.exclusiveStartKey) : undefined,
		);
		const { rows, lastEvaluatedKey } = await listGraduateRowsPage(
			yearFilter,
			{ limit, exclusiveStartKey },
			ctx.correlationIds,
		);
		return ResponseWriter.Success({
			graduates: rows.map(graduateToJson),
			lastEvaluatedKey: encodeExclusiveStartKey(lastEvaluatedKey),
		});
	}

	const rows = await listGraduateRows(yearFilter, ctx.correlationIds);
	return ResponseWriter.Success(rows.map(graduateToJson));
};
