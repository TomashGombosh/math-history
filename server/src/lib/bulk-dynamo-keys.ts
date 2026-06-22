import { createHash } from 'node:crypto';
import { normalizeName } from '@services/bulk-extract-service';

export const LOCK_PK = 'LOCK#GLOBAL';
export const LOCK_SK = '#LOCK';

export function jobPk(jobId: string): string {
	return `JOB#${jobId}`;
}

export function jobMetaSk(): string {
	return '#META';
}

export function teacherCandidateSk(normHash: string): string {
	return `CAND#TEACHER#${normHash}`;
}

export function graduateCandidateSk(year: number, normHash: string): string {
	return `CAND#GRAD#${year}#${normHash}`;
}

export function yearCandidateSk(year: number): string {
	return `CAND#YEAR#${year}`;
}

/** Deterministic hash for candidate de-dup (sha1 of normalized name). */
export function normHash(name: string): string {
	return createHash('sha1').update(normalizeName(name), 'utf8').digest('hex');
}
