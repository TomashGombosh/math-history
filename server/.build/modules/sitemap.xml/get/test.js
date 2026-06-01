var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = (wrapped, expect, requestContext) => describe('GET /sitemap.xml', () => {
    it('returns 200 XML urlset without auth', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const res = yield wrapped.run({
            requestContext,
            path: '/sitemap.xml',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                host: 'example.com',
                'x-forwarded-proto': 'https',
            },
        });
        expect(res.statusCode).toBe(200);
        expect(((_a = res.headers) === null || _a === void 0 ? void 0 : _a['Content-Type']) || ((_b = res.headers) === null || _b === void 0 ? void 0 : _b['content-type'])).toContain('application/xml');
        const body = String((_c = res.body) !== null && _c !== void 0 ? _c : '');
        expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        expect(body).toContain('<loc>https://example.com/</loc>');
        expect(body).toContain('<loc>https://example.com/teachers</loc>');
        expect(body).toContain('<loc>https://example.com/graduates</loc>');
    }));
    it('prefers X-Public-Site-Base over execute-api Host (CloudFront + AllViewerExceptHostHeader)', () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield wrapped.run({
            requestContext,
            path: '/sitemap.xml',
            method: 'GET',
            headers: {
                host: 'abc.execute-api.eu-north-1.amazonaws.com',
                'x-forwarded-proto': 'https',
                'x-public-site-base': 'https://math-history.example.org',
            },
        });
        expect(res.statusCode).toBe(200);
        const body = String((_a = res.body) !== null && _a !== void 0 ? _a : '');
        expect(body).toContain('<loc>https://math-history.example.org/</loc>');
        expect(body).not.toContain('execute-api.eu-north-1.amazonaws.com');
    }));
});
