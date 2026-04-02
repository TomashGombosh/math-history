/** Single-table key helpers (pk / sk / GSI1 for slug lookup). */

export const PK = {
	TEACHER: 'TEACHER',
	GRADUATE: 'GRADUATE',
	CONFIG: 'CONFIG',
	META: 'META',
} as const;

export function teacherSortKey(id: number): string {
	return `T#${String(id).padStart(9, '0')}`;
}

export function parseTeacherIdFromSk(sk: string): number | null {
	const m = /^T#(\d+)$/.exec(sk);
	if (!m) return null;
	return Number(m[1]);
}

export function graduateSortKey(year: number, cohortId: number): string {
	return `Y#${year}#${String(cohortId).padStart(9, '0')}`;
}

export function parseGraduateYearCohort(sk: string): { year: number; cohortId: number } | null {
	const m = /^Y#(\d+)#(\d+)$/.exec(sk);
	if (!m) return null;
	return { year: Number(m[1]), cohortId: Number(m[2]) };
}

export function gsi1SlugKeys(slug: string, teacherSk: string): { gsi1pk: string; gsi1sk: string } {
	return { gsi1pk: `SLUG#${slug}`, gsi1sk: teacherSk };
}
