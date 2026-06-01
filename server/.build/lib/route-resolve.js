"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeApiSegments = normalizeApiSegments;
exports.resolveModulePath = resolveModulePath;
function normalizeApiSegments(segments) {
    const idx = segments.indexOf('api');
    if (idx >= 0) {
        return segments.slice(idx);
    }
    return segments;
}
function resolveModulePath(segments, method) {
    const m = method.toLowerCase();
    const joined = segments.join('/');
    if (joined === 'openapi' && m === 'get') {
        return { modulePath: 'openapi/get', pathParams: {} };
    }
    if (joined === 'sitemap.xml' && m === 'get') {
        return { modulePath: 'sitemap.xml/get', pathParams: {} };
    }
    const bySlug = /^api\/teachers\/by-slug\/([^/]+)$/.exec(joined);
    if (bySlug && m === 'get') {
        return { modulePath: 'api/teachers/by-slug/_slug/get', pathParams: { slug: bySlug[1] } };
    }
    const teacherRest = /^api\/teachers\/([^/]+)$/.exec(joined);
    if (teacherRest) {
        const seg = teacherRest[1];
        if (!['filters', 'meta'].includes(seg) && ['get', 'put', 'delete'].includes(m)) {
            return { modulePath: `api/teachers/_id/${m}`, pathParams: { id: seg } };
        }
    }
    const gradRest = /^api\/graduates\/([^/]+)$/.exec(joined);
    if (gradRest) {
        const seg = gradRest[1];
        if (!['years', 'specialties'].includes(seg) && ['get', 'put', 'delete'].includes(m)) {
            return { modulePath: `api/graduates/_year/${m}`, pathParams: { year: seg } };
        }
    }
    if (!joined || !m) {
        return null;
    }
    return { modulePath: `${joined}/${m}`, pathParams: {} };
}
