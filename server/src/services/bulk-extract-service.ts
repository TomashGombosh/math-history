export type BulkExtractResult = {
	teachers: string[];
	graduates: Array<{ name: string; year: number }>;
	years: number[];
};

type ParseMode = 'neutral' | 'teachers' | 'graduates';

const VALID_YEAR_MIN = 1900;
const VALID_YEAR_MAX = 2099;

const YEAR_IN_TEXT = /\b(19\d{2}|20\d{2})\b/g;

const GRADUATE_YEAR_HEADER =
	/(?:\d[\-–—.]?\s*(?:ий|ій|й|th)?\s*)?випуск(?:\s*\([^)]*\))?\s*[\(\[]?\s*(19\d{2}|20\d{2})\s*(?:р\.?)?[\)\]]?/iu;

const GRADUATE_LINE_WITH_YEAR =
	/^(.+?)\s*[,–—\-]\s*(19\d{2}|20\d{2})\s*(?:р\.?)?\s*$/u;

const TEACHER_SECTION = /^\s*(?:викладач(?:і|и|а)?|teachers?)\s*:?\s*$/iu;

const GRADUATE_SECTION = /^\s*(?:випускник(?:и|ів|а)?|graduates?)\s*:?\s*$/iu;

/** Surname + initials, e.g. «Броді С.М.», «Мойсей А-Є.П.», «Повхан (Карольї) М.Ф.» */
const GRADUATE_NAME_SHORT =
	/^[А-ЯІЇЄҐA-Z][а-яіїєґa-z\-]+(?:\s*\([^)]+\))?\s+[А-ЯІЇЄҐA-Z](?:[\-.][А-ЯІЇЄҐA-Z])+\.?$/u;

/** Full name (2–4 capitalized words), e.g. «Іванов Іван», «Petrov John Michael» */
const TEACHER_NAME_FULL =
	/^[А-ЯІЇЄҐA-Z][а-яіїєґa-z\-]+(?:\s+[А-ЯІЇЄҐA-Z][а-яіїєґa-z\-]+){1,3}$/u;

const NOISE_LINE =
	/(?:студент|факультет|університет|узн[уd]|ужд[уd]|математич|відділен|спеціальн|група|заочн|денн|середн|школ)/iu;

function isValidYear(year: number): boolean {
	return year >= VALID_YEAR_MIN && year <= VALID_YEAR_MAX;
}

function parseYear(raw: string): number | null {
	const year = Number.parseInt(raw, 10);
	return isValidYear(year) ? year : null;
}

export function normalizeName(name: string): string {
	return name.trim().replace(/\s+/g, ' ');
}

function normalizeForDedup(name: string): string {
	return normalizeName(name).toLowerCase();
}

function isNoiseLine(line: string): boolean {
	if (line.length > 120) return true;
	if (NOISE_LINE.test(line)) return true;
	if (/^\d+$/.test(line)) return true;
	return false;
}

function extractYearFromLine(line: string): number | null {
	const headerMatch = line.match(GRADUATE_YEAR_HEADER);
	if (headerMatch?.[1]) {
		return parseYear(headerMatch[1]);
	}
	const years = [...line.matchAll(YEAR_IN_TEXT)].map((m) => parseYear(m[1])).filter((y): y is number => y !== null);
	return years.length === 1 ? years[0] : null;
}

function looksLikeGraduateShortName(line: string): boolean {
	return GRADUATE_NAME_SHORT.test(line);
}

function looksLikeTeacherFullName(line: string): boolean {
	if (!TEACHER_NAME_FULL.test(line)) return false;
	if (looksLikeGraduateShortName(line)) return false;
	return true;
}

function dedupeTeachers(names: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const name of names) {
		const normalized = normalizeName(name);
		if (!normalized) continue;
		const key = normalizeForDedup(normalized);
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(normalized);
	}
	return out;
}

function dedupeGraduates(items: Array<{ name: string; year: number }>): Array<{ name: string; year: number }> {
	const seen = new Set<string>();
	const out: Array<{ name: string; year: number }> = [];
	for (const item of items) {
		const normalized = normalizeName(item.name);
		if (!normalized) continue;
		const key = `${normalizeForDedup(normalized)}|${item.year}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push({ name: normalized, year: item.year });
	}
	return out;
}

function dedupeYears(years: number[]): number[] {
	return [...new Set(years)].sort((a, b) => a - b);
}

/**
 * Deterministic chunk parser: Ukrainian/Latin names, graduation years, «випуск YYYY» headers.
 */
export function parseChunkText(text: string): BulkExtractResult {
	const teachers: string[] = [];
	const graduates: Array<{ name: string; year: number }> = [];
	const years: number[] = [];

	let mode: ParseMode = 'neutral';
	let currentYear: number | null = null;

	const lines = text.split(/\r?\n/);

	for (const rawLine of lines) {
		const line = normalizeName(rawLine);
		if (!line) continue;

		if (TEACHER_SECTION.test(line)) {
			mode = 'teachers';
			continue;
		}
		if (GRADUATE_SECTION.test(line)) {
			mode = 'graduates';
			continue;
		}

		const yearFromHeader = extractYearFromLine(line);
		if (yearFromHeader !== null && GRADUATE_YEAR_HEADER.test(line)) {
			currentYear = yearFromHeader;
			years.push(yearFromHeader);
			mode = 'graduates';
			continue;
		}

		if (isNoiseLine(line)) {
			if (yearFromHeader !== null) {
				currentYear = yearFromHeader;
				years.push(yearFromHeader);
			}
			continue;
		}

		const explicitGradMatch = line.match(GRADUATE_LINE_WITH_YEAR);
		if (explicitGradMatch) {
			const name = normalizeName(explicitGradMatch[1]);
			const year = parseYear(explicitGradMatch[2]);
			if (name && year !== null) {
				graduates.push({ name, year });
				years.push(year);
				currentYear = year;
			}
			continue;
		}

		if (mode === 'teachers' || (mode === 'neutral' && looksLikeTeacherFullName(line))) {
			if (looksLikeTeacherFullName(line)) {
				teachers.push(line);
				if (mode === 'neutral') mode = 'teachers';
			}
			continue;
		}

		const gradYear = currentYear ?? yearFromHeader;
		if (gradYear !== null && (mode === 'graduates' || looksLikeGraduateShortName(line))) {
			if (looksLikeGraduateShortName(line)) {
				graduates.push({ name: line, year: gradYear });
				if (yearFromHeader !== null) years.push(yearFromHeader);
			}
		}
	}

	return {
		teachers: dedupeTeachers(teachers),
		graduates: dedupeGraduates(graduates),
		years: dedupeYears(years),
	};
}

export function isBulkBedrockEnabled(): boolean {
	const flag = process.env.BULK_BEDROCK_ENABLED?.trim().toLowerCase();
	return flag === 'true' || flag === '1' || flag === 'yes';
}

/** Bedrock extraction stub — not implemented yet. */
export function extractWithBedrock(_text: string): BulkExtractResult {
	throw new Error('BEDROCK_NOT_IMPLEMENTED');
}

/** Parse chunk text; routes to Bedrock when `BULK_BEDROCK_ENABLED` is truthy. */
export function extractFromChunkText(text: string): BulkExtractResult {
	if (isBulkBedrockEnabled()) {
		return extractWithBedrock(text);
	}
	return parseChunkText(text);
}
