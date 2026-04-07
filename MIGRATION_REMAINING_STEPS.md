# Migration — remaining steps

This document tracks **status** versus `MIGRATION_DAY_BY_DAY_PLAN.md` and the old stack (`server/` Nuxt API, `app/` Vue): what is **done**, what is **still missing**, and what to do next.

---

## 1. Authentication — client and API contract

**Done (React + `server_v2`):** Admin login uses **AWS Amplify Auth** (SRP) in the browser (`client/src/lib/cognito-auth.ts`, `client/src/lib/cognito-config.ts`). `client/src/lib/api.ts` uses `fetchAuthSession` for the Cognito **ID token** and sends `Authorization: Bearer <token>` on mutating routes via `client/src/services/api.ts` (`*Authed` helpers). Admin group checks align with Cognito claims (`cognito:groups` / admin) as enforced client-side and by the API authorizer.

**Optional follow-ups:**

- Remove or gate any remaining dead paths that assume the old custom JWT from `server/utils/auth.js` (if any).
- Keep client env documentation in sync (pool id, client id, region — see Vite env / `.env.example` patterns in `client/`).

---

## 2. Admin UI — full parity

**Done (routes):** `client/src/router/routes.tsx` wires real pages (not placeholders): teachers list/create/edit, layout settings, graduates list/create/year edit, with shared admin patterns and **authenticated** API calls.

**Verify as needed:** Spot-check behavior vs legacy Vue (`AdminTeacher*`, `AdminGraduate*`, `AdminLayoutSettings.vue`) for edge cases; `AdminPlaceholderPage` remains only for tests, not production routes.

---

## 3. Graduate year page — photos and lightbox

**Done (React):** `client/src/views/GraduatesYearPage.tsx` matches `app/pages/graduates/[year].vue`: images are **bucketed by `img.specialty`** and shown under each student group after the list; thumbnails use **`picture` + webp** via `graduateImageWebpUrl` (same `/images/` → `/images-webp/` rule as Nuxt, plus `graduates_img/images` → `images-webp`). **`LightboxGallery`** (`client/src/components/LightboxGallery.tsx`) provides prev/next, overlay close, swipe, and **keyboard** (←/→/Escape). Body scroll lock while open.

**Verify in staging:** WebP URLs must resolve on CloudFront/S3 (e.g. `…/images-webp/graduates/…`) if you rely on webp in production.

---

## 4. Sitemap and SEO endpoints

**Done (`server_v2`):** Dynamic **`GET /sitemap.xml`** is implemented (e.g. `server_v2/src/modules/sitemap.xml/get/`, `server_v2/src/services/sitemap-service.ts`), with public URLs for home, teachers, teacher slugs, graduates, and graduate years. **`robots.txt`** should reference the sitemap (e.g. `client/public/robots.txt`); CloudFront can route `/sitemap.xml` to the API (see `infra/cloudfront/main.tf`).

**Optional:** Tune `lastmod` sources if you want them stricter than current Dynamo-derived data.

---

## 5. Image upload pipeline — derivatives (webp / thumbs)

**Implemented (server_v2):** **Option A** — S3 `ObjectCreated` on originals under `images/`, `teachers_img/images/`, `graduates_img/images/` invokes Lambda **`imageDerivatives`** (`server_v2/src/handlers/s3-image-derivatives.ts`), which uses **sharp** (same resize rules as legacy `server/api/upload-image.post.js`) and writes **`images-webp`** + **`images-thumbs-webp`** next to the same prefix. Keys match **`deleteImageFiles`** (`server_v2/src/lib/image-s3.ts`). **`POST /api/upload/presign`** returns **`webpUrl`** and **`thumbUrl`** (path-only URLs; objects appear shortly after the PUT completes).

**Docs:** `server_v2/docs/IMAGE_UPLOAD_DERIVATIVES.md` (deploy, Terraform note for notifications on existing buckets, client URL helpers).

**Optional follow-ups:** retries/DLQ for failed processing; delete partial derivatives on failure (plan Day 12).

---

## 6. Cron / queue placeholders

**Missing:** `server_v2/src/cron/index.ts` and `src/queues/index.ts` are **stubs**; `serverless.yml` does not define scheduled functions or SQS consumers for them.

**What to do:**

- If image processing uses queues (see §5), add **SQS** (or EventBridge) + consumer function in Serverless with IAM and DLQ as needed.
- If you need **scheduled** tasks (cleanup, cache warm, metrics), add `events: schedule` to a real handler and remove dead placeholders or wire them.

---

## 7. Data and layout migration

**Status:** Layout is stored in DynamoDB (`pk=CONFIG`, `sk=LAYOUT`, `payload` matches legacy `layoutConfig.json`). Import script: `server_v2/scripts/load-layout-dynamodb.mjs` with `server_v2/migration/data/layout-seed.json` (kept in sync with repo-root `layoutConfig.json`). Manual workflow **Migrate DynamoDB** can load `layout` alone or with `all`.

**What to do:**

- After importing teachers/graduates/layout for an environment, confirm **`GET /api/layout`** returns the expected `headerFields` / `sections` (admin and public teacher page).
- Run **graduates** then **teachers** then **layout** (or `all`) via `.github/workflows/migrate-dynamodb.yml` in order; `layout` overwrites `CONFIG/LAYOUT` if you need to reset from seed.
- Keep **graduates/teachers** migration scripts (`server/scripts/` for legacy SQL/XML, `server_v2/migration/`, CI `migrate-dynamodb`) and run in the right order per environment.
- After cutover, run **spot checks** (counts, random records, image URLs).

---

## 8. Ops and cutover (plan Weeks 5–6)

**Missing:** These are process items from the plan, not necessarily code in-repo.

**What to do:**

- Production/staging **deploy** pipeline for Serverless + static client + CloudFront behaviors (`/api/*` → API, SPA fallback).
- **QA checklist:** public pages, admin flows, uploads, auth, SEO, no route breaks.
- **Staging rehearsal** and rollback drill; post-cutover **monitoring** (errors, latency, cost).

---

## Summary checklist

| Area | Status | Notes |
|------|--------|--------|
| Cognito login + Bearer on API calls | **Done** | §1 — Amplify SRP, `api.ts` + `*Authed` |
| Admin teachers/graduates/layout UIs | **Done** | §2 — real routes/pages; optional parity QA vs legacy |
| Graduate year photos + lightbox | **Done** | §3 |
| Sitemap XML | **Done** | §4 — `GET /sitemap.xml` in `server_v2`, robots / CloudFront |
| Webp/thumb pipeline after upload | **Done** | §5 — S3 → Lambda + sharp; `server_v2/docs/IMAGE_UPLOAD_DERIVATIVES.md` |
| Cron/queue deployment | **Stub** | §6 |
| Layout/data verification | **Verify** (script + CI) | §7 — `load-layout-dynamodb.mjs` / migrate workflow; spot-check `GET /api/layout` |
| Deploy + QA + cutover | **Process** | §8 |
