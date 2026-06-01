import { listGraduateYearsForSitemap } from '@services/graduate-service';
import { listTeacherSlugsForSitemap } from '@services/teacher-service';

function escapeXml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function headerCi(headers: Record<string, string | undefined>, name: string): string | undefined {
	const want = name.toLowerCase();
	for (const [k, v] of Object.entries(headers)) {
		if (k.toLowerCase() === want && typeof v === 'string' && v.trim() !== '') {
			return v.trim();
		}
	}
	return undefined;
}

/**
 * Canonical public site origin for `<loc>` URLs. Order: `SITE_URL` (deploy),
 * CloudFront origin custom header `X-Public-Site-Base`, then `X-Forwarded-Host` / `Host`.
 */
export function resolvePublicSiteBase(headers: Record<string, string | undefined>): string {
	const fromEnv = process.env.SITE_URL?.trim();
	if (fromEnv) {
		return fromEnv.replace(/\/$/, '');
	}

	const fromCf = headerCi(headers, 'x-public-site-base');
	if (fromCf) {
		try {
			const u = new URL(fromCf);
			if (u.protocol === 'http:' || u.protocol === 'https:') {
				return `${u.protocol}//${u.host}`;
			}
		} catch {
			/* ignore */
		}
	}

	const hostRaw =
		headerCi(headers, 'x-forwarded-host') ??
		headers.host ??
		headers.Host;
	const host = typeof hostRaw === 'string' ? hostRaw.split(',')[0].trim() : '';
	if (!host) {
		return 'http://localhost:5173';
	}

	const protoRaw = headerCi(headers, 'x-forwarded-proto') ?? 'https';
	const proto = String(protoRaw).split(',')[0].trim().toLowerCase();
	const safeProto = proto === 'http' || proto === 'https' ? proto : 'https';
	return `${safeProto}://${host}`;
}

export async function buildSitemapXml(headers: Record<string, string | undefined>): Promise<string> {
	const base = resolvePublicSiteBase(headers);

	const [teachers, years] = await Promise.all([listTeacherSlugsForSitemap(), listGraduateYearsForSitemap()]);

	type Entry = { loc: string; lastmod?: string; changefreq: string; priority: string };
	const urls: Entry[] = [];

	const add = (e: Omit<Entry, 'changefreq' | 'priority'> & Partial<Pick<Entry, 'changefreq' | 'priority'>>) => {
		urls.push({
			loc: e.loc,
			lastmod: e.lastmod,
			changefreq: e.changefreq ?? 'weekly',
			priority: e.priority ?? '0.8',
		});
	};

	add({ loc: `${base}/`, changefreq: 'weekly', priority: '1.0' });
	add({ loc: `${base}/teachers`, changefreq: 'weekly', priority: '0.9' });
	add({ loc: `${base}/graduates`, changefreq: 'weekly', priority: '0.7' });

	for (const { slug } of teachers) {
		if (!slug) continue;
		add({
			loc: `${base}/teacher/${encodeURIComponent(slug)}`,
			changefreq: 'monthly',
			priority: '0.9',
		});
	}

	for (const { year, lastmod } of years) {
		add({
			loc: `${base}/graduates/${year}`,
			lastmod,
			changefreq: 'yearly',
			priority: '0.7',
		});
	}

	const body = urls
		.map((u) => {
			const loc = escapeXml(u.loc);
			const last = u.lastmod ? `\n    <lastmod>${escapeXml(u.lastmod)}</lastmod>` : '';
			return `  <url>
    <loc>${loc}</loc>${last}
    <changefreq>${escapeXml(u.changefreq)}</changefreq>
    <priority>${escapeXml(u.priority)}</priority>
  </url>`;
		})
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}
