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

**Missing:** Legacy `server/api/upload-image.post.js` used **sharp** to write originals + webp + thumbs. `server_v2` uses **presigned PUT** to S3; `upload-service` still notes webp paths may not exist until processing exists.

**What to do:**

- Choose one approach and implement end-to-end:
  - **Option A — Lambda on upload:** S3 event → Lambda loads object → sharp → writes `images-webp` / `images-thumbs-webp` (and scoped paths under `teachers_img` / `graduates_img`), then optional Dynamo update if URLs change.
  - **Option B — async queue:** After successful PUT, enqueue a job; worker Lambda runs sharp (same outputs).
- Reuse or mirror **key layout** already assumed by `deleteImageFiles` in `server_v2/src/lib/image-s3.ts` so deletes stay consistent.
- Add **error handling** and retries; optionally delete failed partials (plan Day 12).

---

## 6. Cron / queue placeholders

**Missing:** `server_v2/src/cron/index.ts` and `src/queues/index.ts` are **stubs**; `serverless.yml` does not define scheduled functions or SQS consumers for them.

**What to do:**

- If image processing uses queues (see §5), add **SQS** (or EventBridge) + consumer function in Serverless with IAM and DLQ as needed.
- If you need **scheduled** tasks (cleanup, cache warm, metrics), add `events: schedule` to a real handler and remove dead placeholders or wire them.

---

## 7. Data and layout migration

**Missing (verify):** Plan Day 10 — migration from `layoutConfig.json` into DynamoDB (or S3) and validation that production data matches legacy.

**What to do:**

- Confirm **layout** documents were imported and `GET /api/layout` matches admin expectations.
- Keep **graduates/teachers** migration scripts (`server/scripts/`, `server_v2/migration/`, CI `migrate-dynamodb`) documented and run in the right order for each environment.
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
| Webp/thumb pipeline after upload | **Missing / incomplete** | §5 |
| Cron/queue deployment | **Stub** | §6 |
| Layout/data verification | **Verify** | §7 |
| Deploy + QA + cutover | **Process** | §8 |
