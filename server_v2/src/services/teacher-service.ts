import { PK, gsi1SlugKeys, teacherSortKey } from '@lib/dynamo-keys';
import { deleteItem, getItem, putItem, queryItems } from '@lib/dynamo-operations';
import type { TeacherCreateBody, TeacherPublic, TeacherUpdateBody } from '@models/teacher';
import { nextTeacherId } from '@services/counters';
import { createUniqueSlug } from '@services/slug';

const DEFAULT_TEACHER_IMAGE_URL = '/profile-icon.webp';

export interface TeacherItem extends Record<string, unknown> {
	pk: string;
	sk: string;
	entityType: 'Teacher';
	id: number;
	name: string;
	title?: string | null;
	academicDegree?: string | null;
	position?: string | null;
	faculty?: string | null;
	shortInformation?: string | null;
	bio?: string | null;
	publications: unknown[];
	imageUrl?: string | null;
	slug: string;
	gsi1pk: string;
	gsi1sk: string;
}

function toPublic(t: TeacherItem): TeacherPublic {
	return {
		id: t.id,
		name: t.name,
		title: t.title ?? null,
		academicDegree: t.academicDegree ?? null,
		position: t.position ?? null,
		faculty: t.faculty ?? null,
		shortInformation: t.shortInformation ?? null,
		bio: t.bio ?? null,
		publications: Array.isArray(t.publications) ? t.publications : [],
		imageUrl: t.imageUrl ?? null,
		slug: t.slug,
	};
}

async function queryAllTeacherItems(): Promise<TeacherItem[]> {
	const out: TeacherItem[] = [];
	let exclusiveStartKey: Record<string, unknown> | undefined;
	do {
		const { items, lastEvaluatedKey } = await queryItems<TeacherItem>({
			KeyConditionExpression: 'pk = :pk AND begins_with(sk, :pfx)',
			ExpressionAttributeValues: {
				':pk': PK.TEACHER,
				':pfx': 'T#',
			},
			ExclusiveStartKey: exclusiveStartKey,
		});
		out.push(...items);
		exclusiveStartKey = lastEvaluatedKey;
	} while (exclusiveStartKey);
	return out;
}

export async function findTeacherBySlug(slug: string): Promise<TeacherPublic | null> {
	const { items } = await queryItems<TeacherItem>({
		IndexName: 'GSI1',
		KeyConditionExpression: 'gsi1pk = :p',
		ExpressionAttributeValues: {
			':p': `SLUG#${slug}`,
		},
		Limit: 1,
	});
	const row = items[0];
	return row ? toPublic(row) : null;
}

export async function getTeacherById(id: number): Promise<TeacherPublic | null> {
	const row = await getItem<TeacherItem>({
		Key: { pk: PK.TEACHER, sk: teacherSortKey(id) },
	});
	return row?.entityType === 'Teacher' ? toPublic(row) : null;
}

function normalizeImageUrl(val: unknown): string {
	if (val == null) return DEFAULT_TEACHER_IMAGE_URL;
	if (typeof val !== 'string') return DEFAULT_TEACHER_IMAGE_URL;
	const trimmed = val.trim();
	return trimmed ? trimmed : DEFAULT_TEACHER_IMAGE_URL;
}

export async function createTeacher(body: TeacherCreateBody): Promise<TeacherPublic> {
	const trimmedName = body.name.trim();
	if (!trimmedName) {
		throw new Error('NAME_REQUIRED');
	}

	let slug = await createUniqueSlug(trimmedName);
	if (!slug) slug = `teacher-${Date.now()}`;

	const id = await nextTeacherId();
	const sk = teacherSortKey(id);
	const gsi = gsi1SlugKeys(slug, sk);

	const publications = Array.isArray(body.publications) ? body.publications : [];

	const item: TeacherItem = {
		pk: PK.TEACHER,
		sk,
		entityType: 'Teacher',
		id,
		name: trimmedName,
		slug,
		faculty: body.faculty ?? '',
		position: body.position ?? '',
		title: body.title ?? '',
		academicDegree: body.academicDegree ?? '',
		shortInformation: body.shortInformation ?? '',
		bio: body.bio ?? '',
		publications,
		imageUrl: normalizeImageUrl(body.imageUrl),
		gsi1pk: gsi.gsi1pk,
		gsi1sk: gsi.gsi1sk,
	};

	try {
		await putItem({
			Item: item,
			ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
		});
	} catch (e: unknown) {
		const name = e && typeof e === 'object' && 'name' in e ? String((e as { name?: string }).name) : '';
		if (name === 'ConditionalCheckFailedException') {
			throw new Error('SLUG_CONFLICT');
		}
		throw e;
	}

	return toPublic(item);
}

export async function updateTeacher(
	id: number,
	body: TeacherUpdateBody,
): Promise<{ teacher: TeacherPublic; oldImageUrl: string | null }> {
	const existing = await getItem<TeacherItem>({
		Key: { pk: PK.TEACHER, sk: teacherSortKey(id) },
	});
	if (!existing || existing.entityType !== 'Teacher') {
		throw new Error('NOT_FOUND');
	}

	const oldImageUrl = (existing.imageUrl as string | null) || null;

	let slug = existing.slug;
	if (body.name && body.name !== existing.name) {
		slug = await createUniqueSlug(body.name);
	}

	const sk = teacherSortKey(id);
	const gsi = gsi1SlugKeys(slug, sk);

	const merged: TeacherItem = {
		...existing,
		name: body.name ?? existing.name,
		faculty: body.faculty ?? existing.faculty,
		position: body.position ?? existing.position,
		title: body.title ?? existing.title,
		academicDegree: body.academicDegree ?? existing.academicDegree,
		shortInformation: body.shortInformation ?? existing.shortInformation,
		bio: body.bio ?? existing.bio,
		publications: Array.isArray(body.publications) ? body.publications : existing.publications,
		imageUrl: body.imageUrl !== undefined ? normalizeImageUrl(body.imageUrl) : existing.imageUrl,
		slug,
		gsi1pk: gsi.gsi1pk,
		gsi1sk: gsi.gsi1sk,
	};

	await putItem({ Item: merged });

	return { teacher: toPublic(merged), oldImageUrl };
}

export async function deleteTeacher(id: number): Promise<TeacherPublic | null> {
	const existing = await getItem<TeacherItem>({
		Key: { pk: PK.TEACHER, sk: teacherSortKey(id) },
	});
	if (!existing || existing.entityType !== 'Teacher') {
		return null;
	}
	const pub = toPublic(existing);
	await deleteItem({
		Key: { pk: PK.TEACHER, sk: teacherSortKey(id) },
	});
	return pub;
}

export interface ListTeachersParams {
	page: number;
	limit: number;
	search: string;
	sortBy?: string;
	sortDir: string;
	positions: string[];
	degrees: string[];
}

export async function listTeachers(params: ListTeachersParams): Promise<{
	teachers: TeacherPublic[];
	total: number;
	totalPages: number;
	currentPage: number;
}> {
	const { page, limit, search, sortBy, sortDir, positions, degrees } = params;
	let rows = await queryAllTeacherItems();
	let list = rows.map(toPublic);

	const q = search.trim().toLowerCase();
	if (q) {
		list = list.filter((t) => t.name.toLowerCase().includes(q));
	}
	if (positions.length) {
		list = list.filter((t) => t.position && positions.includes(String(t.position)));
	}
	if (degrees.length) {
		list = list.filter((t) => t.academicDegree && degrees.includes(String(t.academicDegree)));
	}

	const direction = sortDir.toUpperCase() === 'DESC' ? -1 : 1;
	const byId = (a: TeacherPublic, b: TeacherPublic) => a.id - b.id;
	if (sortBy === 'position') {
		list.sort((a, b) => {
			const cmp = direction * String(a.position ?? '').localeCompare(String(b.position ?? ''), 'uk');
			return cmp !== 0 ? cmp : byId(a, b);
		});
	} else if (sortBy === 'degree') {
		list.sort((a, b) => {
			const cmp = direction * String(a.academicDegree ?? '').localeCompare(String(b.academicDegree ?? ''), 'uk');
			return cmp !== 0 ? cmp : byId(a, b);
		});
	} else if (sortBy === 'name') {
		list.sort((a, b) => {
			const cmp = direction * a.name.localeCompare(b.name, 'uk');
			return cmp !== 0 ? cmp : byId(a, b);
		});
	} else {
		list.sort(byId);
	}

	const total = list.length;
	const totalPages = Math.max(1, Math.ceil(total / limit));
	const offset = (page - 1) * limit;
	const teachers = list.slice(offset, offset + limit);

	return { teachers, total, totalPages, currentPage: page };
}

export async function getTeacherFilters(): Promise<{ positions: string[]; degrees: string[] }> {
	const rows = await queryAllTeacherItems();
	const posSet = new Set<string>();
	const degSet = new Set<string>();
	for (const t of rows) {
		if (t.position) posSet.add(String(t.position));
		if (t.academicDegree) degSet.add(String(t.academicDegree));
	}
	return {
		positions: Array.from(posSet).sort((a, b) => a.localeCompare(b, 'uk')),
		degrees: Array.from(degSet).sort((a, b) => a.localeCompare(b, 'uk')),
	};
}

/** Slugs for public teacher profile URLs (`/teacher/:slug`). */
export async function listTeacherSlugsForSitemap(): Promise<Array<{ slug: string }>> {
	const rows = await queryAllTeacherItems();
	return rows
		.filter((t) => t.slug && String(t.slug).trim())
		.map((t) => ({ slug: String(t.slug).trim() }));
}

export async function getTeacherMetaAdmin(): Promise<{ positions: string[]; degrees: string[] }> {
	const rows = await queryAllTeacherItems();
	const positionsSet = new Set<string>();
	const degreesSet = new Set<string>();

	for (const t of rows) {
		if (t.position) {
			const pos = String(t.position).trim();
			if (pos) positionsSet.add(pos);
		}
		const rawDeg = (t.academicDegree || '').toString();
		if (!rawDeg) continue;
		rawDeg
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
			.forEach((deg) => degreesSet.add(deg));
	}

	const positions = Array.from(positionsSet).sort((a, b) => a.localeCompare(b, 'uk-UA'));
	const degrees = Array.from(degreesSet).sort((a, b) => a.localeCompare(b, 'uk-UA'));
	return { positions, degrees };
}
