# Migration — remaining steps

This document lists **gaps** versus `MIGRATION_DAY_BY_DAY_PLAN.md` and the old stack (`server/` Nuxt API, `app/` Vue). For each item: **what is missing** and **what to do**.

---

## 1. Authentication — client and API contract

**Missing:** The React app still calls `POST /api/auth/login` with username/password and stores a token in a cookie. `server_v2` has no such route; protected APIs expect **Cognito JWT** (HTTP API authorizer + `admin-auth`).

**What to do:**

- Replace the login flow with **Cognito** (Hosted UI or `InitiateAuth` / SRP in the browser using the AWS Amplify Auth SDK or a thin wrapper).
- After login, obtain **ID or access JWT** and send it on admin/API calls as `Authorization: Bearer <token>` (extend `client/src/lib/api.ts` helpers for authenticated requests).
- Align **admin group / role** checks with Cognito claims (`cognito:groups` or custom claims) and what `server_v2` `admin-auth` expects.
- Remove or gate any dead code paths that assume the old custom JWT from `server/utils/auth.js`.
- Document required env vars for the client (Cognito domain, client id, region, redirect URIs).

---

## 2. Admin UI — full parity

**Missing:** Under `client/src/router/routes.tsx`, routes such as `/admin/teachers`, `/admin/teachers/create`, `/admin/teachers/:id/edit`, `/admin/teachers/layout`, `/admin/graduates`, etc. render **`AdminPlaceholderPage`** only. The old Vue app had real forms and lists (`AdminTeacher*`, `AdminGraduate*`, `AdminLayoutSettings.vue`, etc.).

**What to do:**

- Port **teachers** admin: list, create, edit, delete, publications, image upload UX (using presigned PUT + stored URLs).
- Port **graduates** admin: list by year, create year, edit year, merge/replace photos, specialty/section grouping consistent with API.
- Port **layout settings** UI and wire to `GET/PUT /api/layout`.
- Reuse shared patterns (loading/error states, validation) from the old components where behavior is known.
- Ensure every mutating action uses **authenticated** `fetch` with the Cognito token.

---

## 3. Graduate year page — photos and lightbox

**Done (React):** `client/src/views/GraduatesYearPage.tsx` matches `app/pages/graduates/[year].vue`: images are **bucketed by `img.specialty`** and shown under each student group after the list; thumbnails use **`picture` + webp** via `graduateImageWebpUrl` (same `/images/` → `/images-webp/` rule as Nuxt, plus `graduates_img/images` → `images-webp`). **`LightboxGallery`** (`client/src/components/LightboxGallery.tsx`) provides prev/next, overlay close, swipe, and **keyboard** (←/→/Escape). Body scroll lock while open.

**Verify in staging:** WebP URLs must resolve on CloudFront/S3 (e.g. `…/images-webp/graduates/…`) if you rely on webp in production.

---

## 4. Sitemap and SEO endpoints

**Missing:** Old `server/routes/sitemap.xml.get.js` generated XML from teachers and graduates. `server_v2` has no equivalent **sitemap** route (plan Day 13).

**What to do:**

- Implement `GET` **sitemap** (XML), either as a Lambda route (e.g. `/sitemap.xml` or `/api/sitemap`) or as a **static build step** uploaded to S3 — pick one and keep URLs stable for search engines.
- Include the same URL set as before: home, teachers list, each teacher slug, graduates list, each year, and correct `lastmod` if available from Dynamo.
- Point `robots.txt` to the sitemap URL if needed.

---

## 5. Image upload pipeline — derivatives (webp / thumbs)

**Missing:** Legacy `server/api/upload-image.post.js` used **sharp** to write originals + webp + thumbs. `server_v2` uses **presigned PUT** to S3; comments in `upload-service` note webp paths may not exist until processing exists. Plan Days 11–12 expected robust processing and cleanup.

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

| Area | Status | Action |
|------|--------|--------|
| Cognito login + Bearer on API calls | Missing | §1 |
| Admin teachers/graduates/layout UIs | Missing | §2 |
| Graduate year photos + lightbox | Done | §3 |
| Sitemap XML | Missing | §4 |
| Webp/thumb pipeline after upload | Missing/incomplete | §5 |
| Cron/queue deployment | Stub | §6 |
| Layout/data verification | Verify | §7 |
| Deploy + QA + cutover | Process | §8 |
