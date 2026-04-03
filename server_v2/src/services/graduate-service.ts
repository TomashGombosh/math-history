import { PK, graduateSortKey } from '@lib/dynamo-keys';
import { logInfo, type CorrelationIds } from '@lib/lambda-log';
import { deleteItem, getItem, putItem, queryItems } from '@lib/dynamo-operations';
import type { GraduateCreateBody } from '@models/graduate';
import { nextGraduateCohortId } from '@services/counters';

export interface GraduateItem extends Record<string, unknown> {
	pk: string;
	sk: string;
	entityType: 'Graduate';
	id: number;
	year: number;
	number?: number | null;
	title?: string | null;
	students: unknown[];
	images: unknown[];
	totalStudents: number;
	totalWithHonours: number;
	createdAt?: string;
	updatedAt?: string;
}

async function queryAllGraduateItems(correlation?: CorrelationIds): Promise<GraduateItem[]> {
	const t0 = Date.now();
	const base = { ...correlation, service: 'math-history-server' as const };
	logInfo('graduate:queryAll:start', {
		...base,
		dynamoTable: process.env.DYNAMODB_TABLE_NAME ?? 'unset',
		durationMs: 0,
	});
	const out: GraduateItem[] = [];
	let exclusiveStartKey: Record<string, unknown> | undefined;
	let page = 0;
	do {
		const pageStart = Date.now();
		page += 1;
		const { items, lastEvaluatedKey } = await queryItems<GraduateItem>({
			KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
			ExpressionAttributeValues: {
				':pk': PK.GRADUATE,
				':pfx': 'Y#',
			},
			ExclusiveStartKey: exclusiveStartKey,
		});
		logInfo('graduate:queryAll:page', {
			...base,
			page,
			itemCount: items.length,
			hasMore: Boolean(lastEvaluatedKey),
			pageDurationMs: Date.now() - pageStart,
			durationMs: Date.now() - t0,
		});
		out.push(...items);
		exclusiveStartKey = lastEvaluatedKey;
	} while (exclusiveStartKey);
	logInfo('graduate:queryAll:done', {
		...base,
		totalItems: out.length,
		pages: page,
		durationMs: Date.now() - t0,
	});
	return out;
}

export async function listGraduateRows(
	yearFilter: number | null,
	correlation?: CorrelationIds,
): Promise<GraduateItem[]> {
	const all = await queryAllGraduateItems(correlation);
	let rows = all;
	if (yearFilter && !Number.isNaN(yearFilter)) {
		rows = all.filter((g) => g.year === yearFilter);
	}
	rows.sort((a, b) => {
		if (a.year !== b.year) return a.year - b.year;
		if ((a.number ?? 0) !== (b.number ?? 0)) return (a.number ?? 0) - (b.number ?? 0);
		return a.id - b.id;
	});
	return rows;
}

export async function getGraduateYearDetail(yearNum: number): Promise<{
	year: number;
	title: string;
	images: unknown[];
	students: Array<{
		id: number;
		index: number;
		name: string;
		specialty: string;
		section: string;
		honorsDegree: boolean;
	}>;
}> {
	const cohorts = await listGraduateRows(yearNum);
	if (!cohorts.length) {
		return {
			year: yearNum,
			title: `Випуск ${yearNum} року`,
			images: [],
			students: [],
		};
	}

	const mainTitle = cohorts[0].title || `Випуск ${yearNum} року`;
	const images: unknown[] = [];
	const allStudents: Array<{
		id: number;
		index: number;
		name: string;
		specialty: string;
		section: string;
		honorsDegree: boolean;
	}> = [];
	let nextGeneratedId = 1;

	for (const cohort of cohorts) {
		const c = cohort;
		if (Array.isArray(c.images)) {
			for (const img of c.images) {
				images.push(img);
			}
		}
		if (Array.isArray(c.students)) {
			for (const st of c.students as Record<string, unknown>[]) {
				let id = (st.id ?? st.index2) as number | null;
				if (id == null) {
					id = nextGeneratedId++;
				}
				const honors =
					st.honorsDegree === true || st.honorsDegree === 'true' || st.isBold === true || st.isBold === 'true';

				allStudents.push({
					id: Number(id),
					index: Number(st.index ?? st.index1 ?? 0),
					name: String(st.name ?? st.text ?? ''),
					specialty: String(st.specialty || ''),
					section: String(st.section || ''),
					honorsDegree: Boolean(honors),
				});
			}
		}
	}

	return {
		year: yearNum,
		title: String(mainTitle),
		images,
		students: allStudents,
	};
}

export async function getYearsSummary(
	correlation?: CorrelationIds,
): Promise<
	Array<{
		year: number;
		totalStudents: number;
		totalWithHonours: number;
		cohortsCount: number;
	}>
> {
	const rows = await queryAllGraduateItems(correlation);
	const byYear = new Map<number, { totalStudents: number; totalWithHonours: number; cohortsCount: number }>();

	for (const g of rows) {
		const cur = byYear.get(g.year) ?? { totalStudents: 0, totalWithHonours: 0, cohortsCount: 0 };
		cur.totalStudents += g.totalStudents;
		cur.totalWithHonours += g.totalWithHonours;
		cur.cohortsCount += 1;
		byYear.set(g.year, cur);
	}

	return Array.from(byYear.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([year, v]) => ({
			year,
			totalStudents: v.totalStudents,
			totalWithHonours: v.totalWithHonours,
			cohortsCount: v.cohortsCount,
		}));
}

export async function getSpecialties(correlation?: CorrelationIds): Promise<string[]> {
	const rows = await queryAllGraduateItems(correlation);
	const set = new Set<string>();
	for (const g of rows) {
		const list = Array.isArray(g.students) ? g.students : [];
		for (const st of list as Record<string, unknown>[]) {
			if (st && typeof st.specialty === 'string') {
				const val = st.specialty.trim();
				if (val) set.add(val);
			}
		}
	}
	return Array.from(set).sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' }));
}

async function getMaxStudentId(): Promise<number> {
	const rows = await queryAllGraduateItems();
	let maxId = 0;
	for (const g of rows) {
		const arr = Array.isArray(g.students) ? g.students : [];
		for (const st of arr as Record<string, unknown>[]) {
			const idNum = Number(st.id);
			if (!Number.isNaN(idNum) && idNum > maxId) {
				maxId = idNum;
			}
		}
	}
	return maxId;
}

async function yearHasAnyCohort(yearNum: number): Promise<boolean> {
	const { items } = await queryItems({
		KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
		ExpressionAttributeValues: {
			':pk': PK.GRADUATE,
			':pfx': `Y#${yearNum}#`,
		},
		Limit: 1,
	});
	return items.length > 0;
}

export async function createGraduate(body: GraduateCreateBody): Promise<{ ok: boolean; id: number; year: number }> {
	const yearNum = Number(body.year);
	if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
		throw new Error('INVALID_YEAR');
	}

	const title = (body.title || '').toString().trim();
	const images = Array.isArray(body.images) ? body.images : [];
	const studentsRaw = Array.isArray(body.students) ? body.students : [];

	if (!studentsRaw.length) {
		throw new Error('STUDENTS_REQUIRED');
	}

	if (await yearHasAnyCohort(yearNum)) {
		throw new Error('YEAR_EXISTS');
	}

	const maxExistingId = await getMaxStudentId();
	let nextId = maxExistingId + 1;

	const students: Array<{
		id: number;
		index: number;
		name: string;
		specialty: string;
		section: string;
		year: number;
		honorsDegree: boolean;
	}> = [];

	for (const s of studentsRaw as Record<string, unknown>[]) {
		const name = (s.name || '').toString().trim();
		if (!name) continue;

		const specialty = (s.specialty || '').toString().trim();
		const section = (s.section || '').toString().trim();
		const honors = !!s.honorsDegree;

		const indexVal = Number(s.index);
		const index = !Number.isNaN(indexVal) && indexVal > 0 ? indexVal : students.length + 1;

		const incomingId = Number(s.id);
		const id = Number.isInteger(incomingId) && incomingId > maxExistingId ? incomingId : nextId++;

		students.push({
			id,
			index,
			name,
			specialty,
			section,
			year: yearNum,
			honorsDegree: honors,
		});
	}

	if (!students.length) {
		throw new Error('STUDENTS_EMPTY');
	}

	const totalStudents = students.length;
	const totalWithHonours = students.filter((s) => s.honorsDegree).length;

	const cohortId = await nextGraduateCohortId();
	const sk = graduateSortKey(yearNum, cohortId);

	const item: GraduateItem = {
		pk: PK.GRADUATE,
		sk,
		entityType: 'Graduate',
		id: cohortId,
		year: yearNum,
		number: null,
		title,
		images,
		students,
		totalStudents,
		totalWithHonours,
	};

	await putItem({ Item: item });

	return { ok: true, id: cohortId, year: yearNum };
}

export async function getCohortsForYear(yearNum: number): Promise<GraduateItem[]> {
	const all = await queryAllGraduateItems();
	return all.filter((g) => g.year === yearNum).sort((a, b) => a.id - b.id);
}

export async function getCohortByYear(yearNum: number): Promise<GraduateItem | null> {
	const rows = await getCohortsForYear(yearNum);
	const row = rows[0];
	return row?.entityType === 'Graduate' ? row : null;
}

export async function updateGraduateByYear(
	currentYear: number,
	body: GraduateCreateBody,
): Promise<{ ok: boolean; year: number; id: number; removedUrls: string[] }> {
	const yearNum = Number(body.year);
	if (!yearNum || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
		throw new Error('INVALID_YEAR');
	}

	const title = (body.title || '').toString().trim();
	const images = Array.isArray(body.images) ? body.images : [];
	const studentsRaw = Array.isArray(body.students) ? body.students : [];

	if (!studentsRaw.length) {
		throw new Error('STUDENTS_REQUIRED');
	}

	const grad = await getCohortByYear(currentYear);
	if (!grad) {
		throw new Error('NOT_FOUND');
	}

	const oldImages = Array.isArray(grad.images) ? grad.images : [];
	const oldUrls = new Set(oldImages.map((img: unknown) => (img as { url?: string })?.url).filter(Boolean) as string[]);

	if (yearNum !== currentYear) {
		const exists = await yearHasAnyCohort(yearNum);
		if (exists) {
			throw new Error('YEAR_EXISTS');
		}
	}

	const maxExistingId = await getMaxStudentId();
	let nextId = maxExistingId + 1;

	const students: Array<{
		id: number;
		index: number;
		name: string;
		specialty: string;
		section: string;
		year: number;
		honorsDegree: boolean;
	}> = [];

	for (const s of studentsRaw as Record<string, unknown>[]) {
		const name = (s.name || '').toString().trim();
		if (!name) continue;

		const specialty = (s.specialty || '').toString().trim();
		const section = (s.section || '').toString().trim();
		const honors = !!s.honorsDegree;

		const indexVal = Number(s.index);
		const index = !Number.isNaN(indexVal) && indexVal > 0 ? indexVal : students.length + 1;

		const incomingId = Number(s.id);
		const id = Number.isInteger(incomingId) && incomingId > maxExistingId ? incomingId : nextId++;

		students.push({
			id,
			index,
			name,
			specialty,
			section,
			year: yearNum,
			honorsDegree: honors,
		});
	}

	if (!students.length) {
		throw new Error('STUDENTS_EMPTY');
	}

	const totalStudents = students.length;
	const totalWithHonours = students.filter((s) => s.honorsDegree).length;

	const newUrls = new Set(images.map((img: unknown) => (img as { url?: string })?.url).filter(Boolean) as string[]);
	const removedUrls = [...oldUrls].filter((url) => !newUrls.has(url));

	const newSk = graduateSortKey(yearNum, grad.id as number);
	const updated: GraduateItem = {
		...grad,
		sk: newSk,
		year: yearNum,
		title,
		images,
		students,
		totalStudents,
		totalWithHonours,
	};

	if (newSk !== grad.sk) {
		await deleteItem({ Key: { pk: PK.GRADUATE, sk: grad.sk as string } });
	}
	await putItem({ Item: updated });

	return { ok: true, year: yearNum, id: grad.id as number, removedUrls };
}

export async function deleteGraduateByYear(yearNum: number): Promise<{
	ok: boolean;
	year: number;
	ids: number[];
	imageUrls: string[];
} | null> {
	const rows = await getCohortsForYear(yearNum);
	if (!rows.length) {
		return null;
	}

	const imageUrls: string[] = [];
	const ids: number[] = [];

	for (const grad of rows) {
		ids.push(grad.id);
		const images = Array.isArray(grad.images) ? grad.images : [];
		for (const img of images) {
			const url = (img as { url?: string })?.url;
			if (url) imageUrls.push(url);
		}
		await deleteItem({
			Key: { pk: PK.GRADUATE, sk: grad.sk as string },
		});
	}

	return { ok: true, year: yearNum, ids, imageUrls };
}

export function graduateToJson(g: GraduateItem): Record<string, unknown> {
	return {
		id: g.id,
		year: g.year,
		number: g.number ?? null,
		title: g.title ?? null,
		students: g.students,
		images: g.images,
		totalStudents: g.totalStudents,
		totalWithHonours: g.totalWithHonours,
		createdAt: g.createdAt ?? null,
		updatedAt: g.updatedAt ?? null,
	};
}
