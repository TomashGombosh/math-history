import { PK, graduateSortKey } from '@lib/dynamo-keys';
import { deleteItem, putItem } from '@lib/dynamo-operations';
import type { GraduateItem } from '@services/graduate-service';
import { nextGraduateCohortId } from '@services/counters';

/** In-memory graduate state for bulk commit — one table scan instead of per-candidate scans. */
export interface GraduateCommitSession {
	cohortByYear: Map<number, GraduateItem>;
	maxStudentId: number;
}

type StudentRecord = {
	id: number;
	index: number;
	name: string;
	specialty: string;
	section: string;
	year: number;
	honorsDegree: boolean;
};

function yearTitle(year: number): string {
	return `Випуск ${year} року`;
}

function normalizeStudentName(name: string): string {
	return name.trim().replace(/\s+/g, ' ');
}

function graduateNameExists(students: unknown[], name: string): boolean {
	const normalizedNew = normalizeStudentName(name).toLowerCase();
	return students.some((st) => {
		const raw = (st as Record<string, unknown>).name ?? (st as Record<string, unknown>).text ?? '';
		return normalizeStudentName(String(raw)).toLowerCase() === normalizedNew;
	});
}

function buildStudentsFromRaw(
	studentsRaw: unknown[],
	yearNum: number,
	maxExistingId: number,
): { students: StudentRecord[]; nextMaxId: number } {
	let nextId = maxExistingId + 1;
	const students: StudentRecord[] = [];

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

	return { students, nextMaxId: nextId - 1 };
}

export function createGraduateCommitSessionFromRows(rows: GraduateItem[]): GraduateCommitSession {
	const cohortByYear = new Map<number, GraduateItem>();
	let maxStudentId = 0;

	for (const row of rows) {
		if (row.entityType !== 'Graduate') continue;
		if (!cohortByYear.has(row.year)) {
			cohortByYear.set(row.year, row);
		}
		for (const st of Array.isArray(row.students) ? row.students : []) {
			const idNum = Number((st as Record<string, unknown>).id);
			if (!Number.isNaN(idNum) && idNum > maxStudentId) {
				maxStudentId = idNum;
			}
		}
	}

	return { cohortByYear, maxStudentId };
}

async function persistCohortUpdate(session: GraduateCommitSession, cohort: GraduateItem): Promise<GraduateItem> {
	const yearNum = cohort.year;
	const newSk = graduateSortKey(yearNum, cohort.id as number);
	const updated: GraduateItem = { ...cohort, sk: newSk, year: yearNum };

	if (newSk !== cohort.sk) {
		await deleteItem({ Key: { pk: PK.GRADUATE, sk: cohort.sk as string } });
	}
	await putItem({ Item: updated });
	session.cohortByYear.set(yearNum, updated);
	return updated;
}

async function createCohortInSession(
	session: GraduateCommitSession,
	yearNum: number,
	studentsRaw: unknown[],
	title: string,
): Promise<GraduateItem> {
	if (session.cohortByYear.has(yearNum)) {
		throw new Error('YEAR_EXISTS');
	}

	const { students, nextMaxId } = buildStudentsFromRaw(studentsRaw, yearNum, session.maxStudentId);
	if (!students.length) {
		throw new Error('STUDENTS_EMPTY');
	}

	session.maxStudentId = Math.max(session.maxStudentId, nextMaxId);

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
		images: [],
		students,
		totalStudents,
		totalWithHonours,
	};

	await putItem({ Item: item });
	session.cohortByYear.set(yearNum, item);
	return item;
}

export async function ensureYearShellInSession(session: GraduateCommitSession, year: number): Promise<void> {
	if (session.cohortByYear.has(year)) {
		return;
	}

	await createCohortInSession(session, year, [{ name: '\u200B', specialty: '', section: '' }], yearTitle(year));
}

async function updateCohortStudentsInSession(
	session: GraduateCommitSession,
	year: number,
	studentsRaw: unknown[],
): Promise<GraduateItem> {
	const cohort = session.cohortByYear.get(year);
	if (!cohort) {
		throw new Error('NOT_FOUND');
	}

	const title = String(cohort.title || yearTitle(year));
	const images = Array.isArray(cohort.images) ? cohort.images : [];
	const { students, nextMaxId } = buildStudentsFromRaw(studentsRaw, year, session.maxStudentId);
	if (!students.length) {
		throw new Error('STUDENTS_EMPTY');
	}

	session.maxStudentId = Math.max(session.maxStudentId, nextMaxId);

	const updated: GraduateItem = {
		...cohort,
		title,
		images,
		students,
		totalStudents: students.length,
		totalWithHonours: students.filter((s) => s.honorsDegree).length,
	};

	return persistCohortUpdate(session, updated);
}

export async function appendGraduatesToYearInSession(
	session: GraduateCommitSession,
	year: number,
	names: string[],
): Promise<void> {
	const uniqueNames = names.map((n) => normalizeStudentName(n)).filter(Boolean);
	if (!uniqueNames.length) {
		return;
	}

	let cohort = session.cohortByYear.get(year);
	if (!cohort) {
		await createCohortInSession(
			session,
			year,
			[{ name: uniqueNames[0], specialty: '', section: '' }],
			yearTitle(year),
		);
		cohort = session.cohortByYear.get(year)!;
		uniqueNames.shift();
	}

	if (!uniqueNames.length) {
		return;
	}

	const currentStudents = Array.isArray(cohort.students) ? [...cohort.students] : [];
	const toAdd: StudentRecord[] = [];

	for (const name of uniqueNames) {
		if (graduateNameExists(currentStudents, name)) {
			continue;
		}
		const id = ++session.maxStudentId;
		toAdd.push({
			id,
			index: currentStudents.length + toAdd.length + 1,
			name,
			specialty: '',
			section: '',
			year,
			honorsDegree: false,
		});
	}

	if (!toAdd.length) {
		return;
	}

	const mergedStudents = [...currentStudents, ...toAdd];
	await updateCohortStudentsInSession(session, year, mergedStudents);
}
