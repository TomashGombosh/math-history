import { teacherSlugExists } from '@services/teacher-slug';

const map: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'h',
	ґ: 'g',
	д: 'd',
	е: 'e',
	є: 'ye',
	ж: 'zh',
	з: 'z',
	и: 'y',
	і: 'i',
	ї: 'yi',
	й: 'i',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'kh',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'shch',
	ю: 'yu',
	я: 'ya',
	ъ: '',
	ь: '',
	ё: 'yo',
	э: 'e',
	ы: 'y',
};

export function slugify(str: string): string {
	if (!str) return '';

	const out = String(str)
		.toLowerCase()
		.split('')
		.map((ch) => {
			if (map[ch]) return map[ch];
			if (/[a-z0-9]/.test(ch)) return ch;
			return '-';
		})
		.join('')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	return out;
}

export async function createUniqueSlug(name: string): Promise<string> {
	let base = slugify(name);
	if (!base) base = 'teacher';

	let slug = base;
	let counter = 1;

	while (true) {
		const exists = await teacherSlugExists(slug);
		if (!exists) break;
		counter += 1;
		slug = `${base}-${counter}`;
	}

	return slug;
}
