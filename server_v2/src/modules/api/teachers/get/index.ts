import type { Engine } from '@interfaces/types';
import { decodeExclusiveStartKey, encodeExclusiveStartKey } from '@lib/pagination-cursor';
import { ResponseWriter } from '@lib/response-writer';
import {
	canTeachersUseDynamoCursor,
	listTeachers,
	listTeachersDynamoPage,
} from '@services/teacher-service';

export const publicResource = true;

function normalizeToArray(v: unknown): string[] {
	if (!v) return [];
	if (Array.isArray(v)) return v.filter(Boolean).map(String);
	if (typeof v === 'string') {
		return v
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

export const handler = async (ctx: Engine) => {
	const q = ctx.req.params;
	let page = parseInt(String(q.page ?? '1'), 10) || 1;
	let limit = parseInt(String(q.limit ?? '24'), 10) || 24;
	const search = String(q.search ?? '');
	const sortBy = q.sortBy ? String(q.sortBy) : undefined;
	const sortDir = String(q.sortDir ?? 'asc');

	const positionsParam = q.positions ?? q['positions[]'];
	const degreesParam = q.degrees ?? q['degrees[]'];
	const positionsArr = normalizeToArray(positionsParam);
	const degreesArr = normalizeToArray(degreesParam);

	const useDynamoCursor =
		canTeachersUseDynamoCursor({
			search,
			sortBy,
			sortDir,
			positions: positionsArr,
			degrees: degreesArr,
		}) &&
		(String(q.cursor) === '1' || Boolean(q.exclusiveStartKey));

	if (useDynamoCursor) {
		const exclusiveStartKey = decodeExclusiveStartKey(
			q.exclusiveStartKey ? String(q.exclusiveStartKey) : undefined,
		);
		const { teachers, lastEvaluatedKey } = await listTeachersDynamoPage({
			limit,
			exclusiveStartKey,
		});
		return ResponseWriter.Success({
			teachers,
			lastEvaluatedKey: encodeExclusiveStartKey(lastEvaluatedKey),
		});
	}

	const result = await listTeachers({
		page,
		limit,
		search,
		sortBy,
		sortDir,
		positions: positionsArr,
		degrees: degreesArr,
	});

	return ResponseWriter.Success(result);
};
