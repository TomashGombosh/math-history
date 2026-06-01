---
name: seo-spa-cloudfront
description: SEO rules for the React 19 SPA delivered via CloudFront. Use when working on page metadata, titles, canonical URLs, sitemap.xml, robots.txt, JSON-LD structured data, OpenGraph/Twitter tags, alt text, or CloudFront/SPA routing behaviors that affect crawlability. The legacy Nuxt app sets metadata via `app/composables/usePageSeo.js` — preserve parity.
---

# SEO best practices (React SPA + CloudFront)

- Set a unique `<title>` and meta description for every indexable route.
- Set canonical URLs for all public pages. Avoid duplicate canonical targets.
- Keep URLs human-readable and stable. Preserve the legacy URL shape: `/teachers`, `/teacher/:slug`, `/graduates`, `/graduates/:year`.
- Keep one clear `h1` per page and a logical heading hierarchy.
- Provide structured data (JSON-LD) for:
  - organization/site,
  - breadcrumbs,
  - entity pages (teachers, graduates).
- Maintain `sitemap.xml` (parity with legacy `server/routes/sitemap.xml.get.js`) and `robots.txt`.
- Ensure CloudFront SPA fallback does **not** break direct URL reload — every route must respond 200 with the SPA shell, while genuinely missing routes still return a usable 404 page.
- Do not block important assets via `robots.txt`.
- Use descriptive `alt` text for meaningful images (teachers, graduates).
- Optimize media: modern formats (webp), explicit `width`/`height`, `loading="lazy"` where appropriate.
- Verify Open Graph and Twitter card metadata for share previews.
- Avoid client-only rendering for critical indexable metadata where possible (server-rendered or build-time-injected meta is preferable).
- Treat SEO metadata as a product requirement, not optional polish.
