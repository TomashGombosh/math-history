---
name: ai-llm-discovery
description: Generative-engine optimization (GEO/LLMO) rules for the React 19 SPA at math-history.afj-solution.com — make the site discoverable, citable, and linkable by AI search and chat assistants (ChatGPT, Claude, Perplexity, Gemini, You.com, Copilot). Use when editing `client/public/robots.txt`, `client/public/llms.txt`, `client/public/llms-full.txt`, `client/index.html`, `client/src/lib/seo.tsx`, `client/src/lib/seoHelpers.ts`, or any AI-oriented metadata for the React SPA. Audience is Ukrainian-speaking students, alumni, and researchers — Cyrillic primary, Latin transliteration secondary.
---

# AI / LLM discovery (Math History UzhNU)

This site is a public Ukrainian university-heritage resource (Кафедра математики, Ужгородський національний університет). The goal is that a Ukrainian-speaking student, alumnus, or researcher who asks ChatGPT / Claude / Perplexity / Gemini about UzhNU mathematics — in Ukrainian or in English — finds and is correctly cited to this site.

Optimize for **AI discovery, citation, and answerability**, not training-corpus extraction.

## Files this skill governs

| File | Owner | Purpose |
|---|---|---|
| `client/public/robots.txt` | client | Per-bot allow/disallow stance for AI crawlers |
| `client/public/llms.txt` | client | Markdown index for LLM ingestion (Anthropic-proposed convention) |
| `client/public/llms-full.txt` | client | Optional flattened content export for ingestion |
| `client/index.html` | client | Static shell with non-JS-dependent meta + JSON-LD baseline |
| `client/src/lib/seo.tsx` | client | Runtime `<Seo>` component (react-helmet-async) |
| `client/src/lib/seoHelpers.ts` | client | JSON-LD builders, site URL, descriptions |
| `server/src/modules/sitemap.xml/get/index.ts` | server | Lambda handler serving `/sitemap.xml` |
| `server/src/services/sitemap-service.ts` | server | Builds the XML from `listTeacherSlugsForSitemap` + `listGraduateYearsForSitemap` |

## 1) Crawler stance (`robots.txt`)

The current `client/public/robots.txt` only declares `User-agent: *` plus admin/api disallow. Extend it with **explicit, commented allow rules** for each AI crawler. Do not collapse them under `*` — explicitness signals intent and survives future restrictions.

**Allow — search & on-demand answer crawlers** (highest priority for citations):

```
# OpenAI ChatGPT search citation crawler
User-agent: OAI-SearchBot
Allow: /

# OpenAI on-demand fetch when a user pastes a URL into ChatGPT
User-agent: ChatGPT-User
Allow: /

# Perplexity search index + on-demand
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

# Google Gemini / AI Overviews opt-in (separate from Googlebot)
User-agent: Google-Extended
Allow: /

# Apple Intelligence / Siri AI search
User-agent: Applebot-Extended
Allow: /

# You.com
User-agent: YouBot
Allow: /

# Amazon Alexa / Rufus
User-agent: Amazonbot
Allow: /

# Meta AI search & on-demand
User-agent: Meta-ExternalAgent
Allow: /
User-agent: Meta-ExternalFetcher
Allow: /

# Cohere
User-agent: cohere-ai
Allow: /

# Diffbot knowledge-graph extractor
User-agent: Diffbot
Allow: /
```

**Allow — training crawlers** (public university heritage; visibility is the goal):

```
# OpenAI training corpus
User-agent: GPTBot
Allow: /

# Anthropic training & on-demand
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Claude-Web
Allow: /

# Common Crawl — consumed by many LLM training pipelines
User-agent: CCBot
Allow: /
```

**Allow — share-preview crawlers** (Telegram and Viber are critical share surfaces in Ukraine):

```
User-agent: TelegramBot
Allow: /
User-agent: ViberBot
Allow: /
User-agent: facebookexternalhit
Allow: /
User-agent: Twitterbot
Allow: /
```

**Defensive disallow** stays:

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin
Disallow: /login
Disallow: /api/
Disallow: /*?*

Sitemap: https://math-history.afj-solution.com/sitemap.xml
Host: math-history.afj-solution.com
```

If a future change must block a specific bot, narrow per-bot — never collapse all AI bots back under a single denial.

## 2) `/llms.txt` — Markdown manifest for LLM ingestion

Create `client/public/llms.txt`. Anthropic-proposed convention; Perplexity and several AI search vendors honor it. Required structure:

```markdown
# Математики УжНУ

> Історія кафедри математики Ужгородського національного університету: викладачі, випускники, наукові досягнення та розвиток математичних дисциплін у Закарпатті.

## Public pages
- [Головна](https://math-history.afj-solution.com/): огляд проекту, добірки викладачів та років випуску.
- [Викладачі](https://math-history.afj-solution.com/teachers): повний перелік викладачів кафедри математики УжНУ.
- [Роки випуску](https://math-history.afj-solution.com/graduates): покажчик усіх років випуску за списками студентів.

## Reference
- [Sitemap](https://math-history.afj-solution.com/sitemap.xml): машиночитний список усіх публічних URL.
- [Organization JSON-LD](https://math-history.afj-solution.com/#org): ідентифікатор організації для розв'язання сутностей.

## Identity
- Назва: Кафедра математики, Ужгородський національний університет
- Alternate names: Математики УжНУ, UzhNU Mathematics Department
- Parent: Ужгородський національний університет (https://www.uzhnu.edu.ua)
- Locale: uk-UA, Ужгород, Закарпатська область, Україна
```

Optional `client/public/llms-full.txt` ships a flattened Markdown export of stable content (org description, FAQ, current teacher index, graduation-year index). Generate at build time from the API; never hand-maintain.

`llms.txt` MUST be updated in the same PR as any change to the public route set or the canonical site name.

## 3) JSON-LD `@graph` with stable `@id`

The current `client/src/lib/seoHelpers.ts` emits independent JSON-LD blocks per page. Convert these to a **single `@graph`** so AI extractors can resolve cross-references between entities. Use stable `@id` IRIs:

| Entity | `@id` |
|---|---|
| Organization | `https://math-history.afj-solution.com/#org` |
| Website | `https://math-history.afj-solution.com/#website` |
| Homepage WebPage | `https://math-history.afj-solution.com/#webpage` |
| Teacher page WebPage | `${pageUrl}#webpage` |
| Teacher Person | `${pageUrl}#person` |
| Graduate-year WebPage | `${pageUrl}#webpage` |
| Graduate-year Event | `${pageUrl}#event` |
| Breadcrumb | `${pageUrl}#breadcrumb` |

Cross-link by `@id`:

```ts
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollegeOrUniversity",
      "@id": "https://math-history.afj-solution.com/#org",
      "name": "Кафедра математики, Ужгородський національний університет",
      "alternateName": ["Математики УжНУ", "UzhNU Mathematics Department"],
      "inLanguage": "uk",
      "parentOrganization": { "@type": "CollegeOrUniversity", "name": "Ужгородський національний університет", "url": "https://www.uzhnu.edu.ua" }
    },
    {
      "@type": "WebPage",
      "@id": "https://math-history.afj-solution.com/teacher/ivanov#webpage",
      "url": "https://math-history.afj-solution.com/teacher/ivanov",
      "inLanguage": "uk",
      "isPartOf": { "@id": "https://math-history.afj-solution.com/#website" },
      "mainEntity": { "@id": "https://math-history.afj-solution.com/teacher/ivanov#person" },
      "breadcrumb": { "@id": "https://math-history.afj-solution.com/teacher/ivanov#breadcrumb" }
    },
    {
      "@type": "Person",
      "@id": "https://math-history.afj-solution.com/teacher/ivanov#person",
      "name": "Іванов Іван Іванович",
      "inLanguage": "uk",
      "worksFor": { "@id": "https://math-history.afj-solution.com/#org" },
      "affiliation": { "@id": "https://math-history.afj-solution.com/#org" }
    }
  ]
}
```

Implementation: add a `pageGraphJsonLd({ org, website, webpage, mainEntity, breadcrumb })` composer in `client/src/lib/seoHelpers.ts`. Each existing helper (`organizationJsonLd`, `teacherPersonJsonLd`, `graduateYearEventJsonLd`, `breadcrumbJsonLd`) keeps its responsibility but returns a node WITHOUT `@context` (only the composer adds it). Pass the composed graph to `<Seo jsonLd={…} />` as a single object.

**Every node MUST carry `inLanguage: "uk"`**, including Person and Event nodes — the existing helpers omit it for those types.

## 4) FAQPage schema (homepage)

Add a `FAQPage` JSON-LD on `/` with the questions an LLM is most likely to receive in Ukrainian and English:

- Що таке «Математики УжНУ»?
- Де знаходиться кафедра математики УжНУ?
- Як знайти інформацію про викладача математичного факультету УжНУ?
- Як переглянути список випускників за конкретний рік?
- What is the UzhNU Mathematics Department history archive? *(English variant for cross-language LLM matching)*

Each `Question` carries `inLanguage` matching the question's language. Add as `faqJsonLd()` builder in `seoHelpers.ts`; compose into the homepage graph as a separate node.

## 5) Static-shell fallback (`client/index.html`)

The current shell has `lang="uk"` and viewport but no fallback `<title>`, `<meta name="description">`, OG tags, or JSON-LD. LLM crawler JS-rendering varies — without a static-shell baseline, crawlers that skip JS see only `<div id="root"></div>` and produce poor citations.

Add to `client/index.html` `<head>` (must match `SEO_SITE_NAME` and `getSiteUrl()` defaults):

- `<title>` — full default site title.
- `<meta name="description">` — default Ukrainian description.
- `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`.
- `<meta property="og:site_name">`, `og:locale="uk_UA"`, `og:type="website"`, `og:title`, `og:description`, `og:image`.
- `<meta name="twitter:card" content="summary_large_image">` and matching tags.
- `<meta name="theme-color">`, `<meta name="color-scheme">`.
- `<link rel="canonical">` to the site root.
- `<link rel="alternate" hreflang="uk-UA">` self-reference; `<link rel="alternate" hreflang="x-default">`.
- One inline `<script type="application/ld+json">` with the `EducationalOrganization` baseline (same `@id` as runtime).
- `<noscript>` block with Ukrainian fallback text and links to `/teachers`, `/graduates` so JS-less crawlers still get crawlable HTML.

Drift between the static shell and `seoHelpers.ts` defaults breaks canonical / OG matching. Treat this as a single source-of-truth contract.

## 6) On-page AI signals

These are crawler-readable hints that improve LLM extraction quality:

- One `<h1>` per page, Cyrillic primary; never duplicate.
- Wrap years and dates in `<time datetime="YYYY">` — already partially the case for graduate years; extend.
- `<dfn>` once on first occurrence of a defining term ("кафедра", "факультет").
- `<address>` for the organization's postal address on the homepage hero.
- `lang` attribute overrides on Latin-only segments (`<span lang="en">UzhNU</span>`) so AI extractors don't misclassify language.
- Cyrillic-primary `alt` text on every photo, including teacher name and role for portraits.

## 7) Sitemap parity

The dynamic sitemap is **already implemented in `server`**:

- Handler: `server/src/modules/sitemap.xml/get/index.ts` (`publicResource = true`, edge-cached for 3600s).
- Builder: `server/src/services/sitemap-service.ts#buildSitemapXml`.
- Data sources: `listTeacherSlugsForSitemap()` (teacher service) and `listGraduateYearsForSitemap()` (graduate service) — both DynamoDB-backed.
- Origin resolution: `resolvePublicSiteBase()` reads `SITE_URL` env, then `X-Public-Site-Base` CloudFront origin custom header, then `X-Forwarded-Host`/`Host`.

Current emitted shape:

- Static: `/`, `/teachers`, `/graduates`.
- Dynamic: `/teacher/<slug>` per teacher (`encodeURIComponent`'d, monthly changefreq).
- Dynamic: `/graduates/<year>` per year, with `lastmod`.

When extending:

- Add new public routes inside `buildSitemapXml`. Add a matching `list…ForSitemap` service if a new entity type appears.
- Confirm `client/public/robots.txt` still declares `Sitemap: https://math-history.afj-solution.com/sitemap.xml`.
- Mention any new public surface in `client/public/llms.txt`.

**Never ship a static `client/public/sitemap.xml`.** It would either shadow the Lambda response (depending on CloudFront origin priority) or go stale immediately. The sitemap is a Lambda-served, edge-cached resource — leave the SPA origin out of it.

## 8) Forbidden practices

- **Do not cloak.** Same content for users and AI crawlers. No UA-conditional HTML.
- **Do not keyword-stuff** Ukrainian/English variants in meta tags. Use JSON-LD `alternateName` instead.
- **Do not rely solely on JSON-LD** without matching on-page text — AI extractors verify claims against visible content.
- **Do not add per-bot Disallow** without a justification comment in robots.txt.
- **Do not expose PII** (private student records, personal emails, phone numbers) in JSON-LD or `llms-full.txt`.
- **Do not block CSS/JS** in robots.txt — Google needs them to render and rank.

## 9) Definition of done (per change)

When a change touches AI-discovery surface, verify:

- `client/public/robots.txt` lists every relevant AI crawler with an intent comment.
- `client/public/llms.txt` reflects the current public route set.
- The affected page emits a single `@graph`-linked JSON-LD with stable `@id` IRIs and `inLanguage: "uk"` on every node.
- `client/index.html` static shell defaults still match `SEO_SITE_NAME` and `getSiteUrl()`.
- `server/src/services/sitemap-service.ts#buildSitemapXml` includes any new public route (sitemap is Lambda-owned).
- No PII or admin-only content leaks into structured data or `llms*.txt`.
- `cd client && npm run lint && npm run test:run` passes.
