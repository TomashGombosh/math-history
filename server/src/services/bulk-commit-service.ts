import { jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { updateBulkItem } from '@lib/bulk-dynamo';
import { logException, logInfo, logWarn } from '@lib/lambda-log';
import {
	cleanupJob,
	getJob,
	listCandidates,
	type BulkCandidate,
} from '@services/bulk-import-service';
import { normalizeName } from '@services/bulk-extract-service';
import { createGraduate, getCohortByYear, updateGraduateByYear } from '@services/graduate-service';
import { createTeacher } from '@services/teacher-service';

const COMMIT_PAGE_SIZE = 100;

function isConditionalFailure(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'name' in err &&
		(err as { name: string }).name === 'ConditionalCheckFailedException'
	);
}

function yearTitle(year: number): string {
	return `Випуск ${year} року`;
}

function graduateNameExists(students: unknown[], name: string): boolean {
	const normalizedNew = normalizeName(name).toLowerCase();
	return students.some((st) => {
		const raw = (st as Record<string, unknown>).name ?? (st as Record<string, unknown>).text ?? '';
		return normalizeName(String(raw)).toLowerCase() === normalizedNew;
	});
}

async function tryBeginCommit(jobId: string): Promise<boolean> {
	const job = await getJob(jobId);
	if (!job) {
		return false;
	}

	if (job.status === 'committed') {
		return false;
	}

	if (job.status === 'committing') {
		return true;
	}

	if (job.status !== 'ready') {
		throw new Error('JOB_NOT_READY');
	}

	try {
		await updateBulkItem({
			Key: { pk: jobPk(jobId), sk: jobMetaSk() },
			UpdateExpression: 'SET #status = :committing',
			ConditionExpression: '#status = :ready',
			ExpressionAttributeNames: { '#status': 'status' },
			ExpressionAttributeValues: {
				':committing': 'committing',
				':ready': 'ready',
			},
		});
		return true;
	} catch (err) {
		if (!isConditionalFailure(err)) {
			throw err;
		}
		const refreshed = await getJob(jobId);
		if (!refreshed) {
			return false;
		}
		if (refreshed.status === 'committing') {
			return true;
		}
		if (refreshed.status === 'committed') {
			return false;
		}
		throw new Error('JOB_NOT_READY');
	}
}

async function commitTeacher(name: string, jobId: string): Promise<void> {
	try {
		await createTeacher({ name });
	} catch (err) {
		if (err instanceof Error && err.message === 'SLUG_CONFLICT') {
			logWarn('bulk commit skipped existing teacher', { jobId, name });
			return;
		}
		throw err;
	}
}

async function commitGraduate(name: string, year: number, jobId: string): Promise<void> {
	const existing = await getCohortByYear(year);
	if (!existing) {
		await createGraduate({
			year,
			title: yearTitle(year),
			students: [{ name, specialty: '', section: '' }],
		});
		return;
	}

	const currentStudents = Array.isArray(existing.students) ? existing.students : [];
	if (graduateNameExists(currentStudents, name)) {
		return;
	}

	await updateGraduateByYear(year, {
		year,
		title: String(existing.title || yearTitle(year)),
		images: Array.isArray(existing.images) ? existing.images : [],
		students: [...currentStudents, { name, specialty: '', section: '' }],
	});
}

async function commitYearOnly(year: number): Promise<void> {
	if (await getCohortByYear(year)) {
		return;
	}

	// createGraduate requires at least one student; year-only creates a shell cohort with minimal title.
	await createGraduate({
		year,
		title: yearTitle(year),
		students: [{ name: '\u200B', specialty: '', section: '' }],
	});
}

async function commitCandidate(candidate: BulkCandidate, jobId: string): Promise<void> {
	switch (candidate.entity) {
		case 'teacher': {
			if (!candidate.name?.trim()) {
				throw new Error('CANDIDATE_INVALID');
			}
			await commitTeacher(candidate.name, jobId);
			break;
		}
		case 'graduate': {
			if (!candidate.name?.trim() || candidate.year == null) {
				throw new Error('CANDIDATE_INVALID');
			}
			await commitGraduate(candidate.name, candidate.year, jobId);
			break;
		}
		case 'year': {
			if (candidate.year == null) {
				throw new Error('CANDIDATE_INVALID');
			}
			await commitYearOnly(candidate.year);
			break;
		}
	}
}

async function listAllCandidates(jobId: string): Promise<BulkCandidate[]> {
	const all: BulkCandidate[] = [];
	let exclusiveStartKey: Record<string, unknown> | undefined;

	do {
		const page = await listCandidates({
			jobId,
			limit: COMMIT_PAGE_SIZE,
			exclusiveStartKey,
		});
		all.push(...page.candidates);
		exclusiveStartKey = page.lastEvaluatedKey;
	} while (exclusiveStartKey);

	return all;
}

export async function commitBulkImportJob(jobId: string): Promise<void> {
	logInfo('bulk commit started', { jobId });

	const shouldProceed = await tryBeginCommit(jobId);
	if (!shouldProceed) {
		logInfo('bulk commit skipped (already done or missing job)', { jobId });
		return;
	}

	try {
		const candidates = await listAllCandidates(jobId);
		const teachers = candidates.filter((c) => c.entity === 'teacher');
		const graduates = candidates.filter((c) => c.entity === 'graduate');
		const years = candidates.filter((c) => c.entity === 'year');

		for (const candidate of teachers) {
			await commitCandidate(candidate, jobId);
		}
		for (const candidate of graduates) {
			await commitCandidate(candidate, jobId);
		}
		for (const candidate of years) {
			await commitCandidate(candidate, jobId);
		}

		await updateBulkItem({
			Key: { pk: jobPk(jobId), sk: jobMetaSk() },
			UpdateExpression: 'SET #status = :committed',
			ExpressionAttributeNames: { '#status': 'status' },
			ExpressionAttributeValues: { ':committed': 'committed' },
		});

		await cleanupJob(jobId);
		logInfo('bulk commit completed', {
			jobId,
			committedTeachers: teachers.length,
			committedGraduates: graduates.length,
			committedYears: years.length,
		});
	} catch (err) {
		logException('bulk commit failed', err, { jobId });
		throw err;
	}
}
