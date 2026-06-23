import { jobMetaSk, jobPk } from '@lib/bulk-dynamo-keys';
import { updateBulkItem } from '@lib/bulk-dynamo';
import { logException, logInfo, logWarn } from '@lib/lambda-log';
import {
	cleanupJob,
	getJob,
	listCandidates,
	type BulkCandidate,
} from '@services/bulk-import-service';
import {
	appendGraduatesToYearInSession,
	createGraduateCommitSessionFromRows,
	ensureYearShellInSession,
} from '@services/graduate-commit-session';
import { queryAllGraduateItems } from '@services/graduate-service';
import { createTeacherForBulkImport, loadTeacherSlugSet } from '@services/teacher-service';

const COMMIT_PAGE_SIZE = 100;

function isConditionalFailure(err: unknown): boolean {
	return (
		typeof err === 'object' &&
		err !== null &&
		'name' in err &&
		(err as { name: string }).name === 'ConditionalCheckFailedException'
	);
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

async function commitTeacherWithSlugSet(
	slugSet: Set<string>,
	name: string,
	jobId: string,
): Promise<void> {
	try {
		await createTeacherForBulkImport(slugSet, name);
	} catch (err) {
		if (err instanceof Error && err.message === 'SLUG_CONFLICT') {
			logWarn('bulk commit skipped existing teacher', { jobId, name });
			return;
		}
		throw err;
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

function groupGraduatesByYear(candidates: BulkCandidate[]): Map<number, string[]> {
	const byYear = new Map<number, string[]>();
	for (const candidate of candidates) {
		if (candidate.entity !== 'graduate' || candidate.year == null || !candidate.name?.trim()) {
			throw new Error('CANDIDATE_INVALID');
		}
		const list = byYear.get(candidate.year) ?? [];
		list.push(candidate.name);
		byYear.set(candidate.year, list);
	}
	return byYear;
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

		// One graduate table read + one teacher slug scan — not once per candidate.
		const [graduateRows, teacherSlugSet] = await Promise.all([
			queryAllGraduateItems(),
			loadTeacherSlugSet(),
		]);
		const graduateSession = createGraduateCommitSessionFromRows(graduateRows);

		for (const candidate of years) {
			if (candidate.year == null) {
				throw new Error('CANDIDATE_INVALID');
			}
			await ensureYearShellInSession(graduateSession, candidate.year);
		}

		for (const [year, names] of groupGraduatesByYear(graduates)) {
			await appendGraduatesToYearInSession(graduateSession, year, names);
		}

		for (const candidate of teachers) {
			if (!candidate.name?.trim()) {
				throw new Error('CANDIDATE_INVALID');
			}
			await commitTeacherWithSlugSet(teacherSlugSet, candidate.name, jobId);
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
