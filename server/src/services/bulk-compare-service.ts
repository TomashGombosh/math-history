import { PK } from '@lib/dynamo-keys';
import { queryItems } from '@lib/dynamo-operations';
import type { BulkExtractResult } from '@services/bulk-extract-service';
import { normalizeName } from '@services/bulk-extract-service';
import { queryAllGraduateItemsForYear, type GraduateItem } from '@services/graduate-service';
import { slugify } from '@services/slug';
import { teacherSlugExists } from '@services/teacher-slug';

function normalizeGraduateName(name: string): string {
	return normalizeName(name).toLowerCase();
}

function collectGraduateNamesForYear(cohorts: GraduateItem[]): Set<string> {
	const names = new Set<string>();
	for (const cohort of cohorts) {
		const students = Array.isArray(cohort.students) ? cohort.students : [];
		for (const st of students as Record<string, unknown>[]) {
			const raw = st.name ?? st.text ?? '';
			const normalized = normalizeGraduateName(String(raw));
			if (normalized) names.add(normalized);
		}
	}
	return names;
}

async function graduateYearExists(year: number): Promise<boolean> {
	const { items } = await queryItems({
		KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
		ExpressionAttributeValues: {
			':pk': PK.GRADUATE,
			':pfx': `Y#${year}#`,
		},
		Limit: 1,
	});
	return items.length > 0;
}

async function filterNewTeachers(teachers: string[]): Promise<string[]> {
	const out: string[] = [];
	for (const name of teachers) {
		const slug = slugify(name);
		if (!slug) {
			out.push(name);
			continue;
		}
		const exists = await teacherSlugExists(slug);
		if (!exists) out.push(name);
	}
	return out;
}

async function filterNewGraduates(
	graduates: Array<{ name: string; year: number }>,
): Promise<Array<{ name: string; year: number }>> {
	if (!graduates.length) return [];

	const years = [...new Set(graduates.map((g) => g.year))];
	const existingByYear = new Map<number, Set<string>>();

	await Promise.all(
		years.map(async (year) => {
			const cohorts = await queryAllGraduateItemsForYear(year);
			existingByYear.set(year, collectGraduateNamesForYear(cohorts));
		}),
	);

	return graduates.filter((g) => {
		const existing = existingByYear.get(g.year);
		if (!existing || existing.size === 0) return true;
		return !existing.has(normalizeGraduateName(g.name));
	});
}

async function filterNewYears(years: number[]): Promise<number[]> {
	if (!years.length) return [];

	const existence = await Promise.all(
		years.map(async (year) => ({
			year,
			exists: await graduateYearExists(year),
		})),
	);

	return existence.filter((e) => !e.exists).map((e) => e.year);
}

/** Drop entities already present in the main DynamoDB table (query-only). */
export async function filterNewBulkEntities(extracted: BulkExtractResult): Promise<BulkExtractResult> {
	const [teachers, graduates, years] = await Promise.all([
		filterNewTeachers(extracted.teachers),
		filterNewGraduates(extracted.graduates),
		filterNewYears(extracted.years),
	]);

	return { teachers, graduates, years };
}
