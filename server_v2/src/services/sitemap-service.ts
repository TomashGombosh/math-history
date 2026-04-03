import { listGraduateYearsForSitemap } from '@services/graduate-service';
import { listTeacherSlugsForSitemap } from '@services/teacher-service';

function escapeXml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Canonical public site origin for `<loc>` URLs. Prefer `SITE_URL` when set (deploy),
 * else `X-Forwarded-*` / `Host` from API Gateway or CloudFront.
 */
export function resolvePublicSiteBase(headers: Record<string, string | undefined>): string {
	const fromEnv = process.env.SITE_URL?.trim();
	if (fromEnv) {
		return fromEnv.replace(/\/$/, '');
	}

	const hostRaw =
		headers['x-forwarded-host'] ??
		headers['X-Forwarded-Host'] ??
		headers.host ??
		headers.Host;
	const host = typeof hostRaw === 'string' ? hostRaw.split(',')[0].trim() : '';
	if (!host) {
		return 'http://localhost:5173';
	}

	const protoRaw = headers['x-forwarded-proto'] ?? headers['X-Forwarded-Proto'] ?? 'https';
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
