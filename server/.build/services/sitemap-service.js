"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePublicSiteBase = resolvePublicSiteBase;
exports.buildSitemapXml = buildSitemapXml;
const graduate_service_1 = require("./graduate-service");
const teacher_service_1 = require("./teacher-service");
function escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function headerCi(headers, name) {
    const want = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === want && typeof v === 'string' && v.trim() !== '') {
            return v.trim();
        }
    }
    return undefined;
}
function resolvePublicSiteBase(headers) {
    var _a, _b, _c, _d;
    const fromEnv = (_a = process.env.SITE_URL) === null || _a === void 0 ? void 0 : _a.trim();
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
        }
        catch (_e) {
        }
    }
    const hostRaw = (_c = (_b = headerCi(headers, 'x-forwarded-host')) !== null && _b !== void 0 ? _b : headers.host) !== null && _c !== void 0 ? _c : headers.Host;
    const host = typeof hostRaw === 'string' ? hostRaw.split(',')[0].trim() : '';
    if (!host) {
        return 'http://localhost:5173';
    }
    const protoRaw = (_d = headerCi(headers, 'x-forwarded-proto')) !== null && _d !== void 0 ? _d : 'https';
    const proto = String(protoRaw).split(',')[0].trim().toLowerCase();
    const safeProto = proto === 'http' || proto === 'https' ? proto : 'https';
    return `${safeProto}://${host}`;
}
function buildSitemapXml(headers) {
    return __awaiter(this, void 0, void 0, function* () {
        const base = resolvePublicSiteBase(headers);
        const [teachers, years] = yield Promise.all([(0, teacher_service_1.listTeacherSlugsForSitemap)(), (0, graduate_service_1.listGraduateYearsForSitemap)()]);
        const urls = [];
        const add = (e) => {
            var _a, _b;
            urls.push({
                loc: e.loc,
                lastmod: e.lastmod,
                changefreq: (_a = e.changefreq) !== null && _a !== void 0 ? _a : 'weekly',
                priority: (_b = e.priority) !== null && _b !== void 0 ? _b : '0.8',
            });
        };
        add({ loc: `${base}/`, changefreq: 'weekly', priority: '1.0' });
        add({ loc: `${base}/teachers`, changefreq: 'weekly', priority: '0.9' });
        add({ loc: `${base}/graduates`, changefreq: 'weekly', priority: '0.7' });
        for (const { slug } of teachers) {
            if (!slug)
                continue;
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
    });
}
