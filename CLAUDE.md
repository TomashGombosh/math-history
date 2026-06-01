# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status: late-stage migration on `development`

Two parallel codebases coexist; most new work happens on the **target stack**.

| | Legacy (frozen, parity-only) | Target (active) |
|---|---|---|
| Frontend | Nuxt 4 + Vue 3 in `app/`, Nitro server views | **React 19** + React Router 7 + Vite + MUI v7 in `client/` |
| Backend | Nitro + Sequelize/Postgres in `server/` | **Serverless Framework** (TypeScript Lambdas) in `server/` |
| Storage | Postgres (`docker-compose.yml`, `migrations/teachers_db_dump.sql`) + local `public/` files | **DynamoDB** + **S3** (with CloudFront) |
| Auth | JWT in `server/utils/auth.js` | **AWS Cognito** (Amplify SRP on the client; `cognito:groups` claim on the API) |
| Delivery | Nitro server, local Postgres | S3 (SPA) + CloudFront, Lambda for API/sitemap |
| IaC | n/a | Terraform in `infra/` (`cloudfront`, `cloudfront-assets`, `cognito`, `dynamodb`, `s3-data`, `modules`) |

The migration plan is `MIGRATION_DAY_BY_DAY_PLAN.md`; **current status & remaining work** is `MIGRATION_REMAINING_STEPS.md` (auth, sitemap, image derivatives = done; cron/queues = stubs; data migration via `.github/workflows/migrate-dynamodb.yml`). Hard rules in `MIGRATION_RULES.md`.

**Default rule:** new features go on the target stack. Do not extend `app/` or `server/`. The Nuxt root keeps running for parity comparison and emergency rollback only.

## Layout (top-level)

| Path | Stack | Purpose |
|---|---|---|
| `app/` | legacy | Nuxt 4 + Vue 3 pages, components, composables |
| `server/` | legacy | Nitro + Sequelize REST API; image upload writes to local `public/` |
| `client/` | target | React 19 SPA (Vite, React Router 7, MUI, Amplify, Vitest) |
| `server/` | target | TypeScript Lambdas (Serverless Framework, DynamoDB, S3, Zod, Jest) |
| `infra/` | target | Terraform: `cloudfront/`, `cloudfront-assets/`, `cognito/`, `dynamodb/`, `s3-data/`, `modules/` |
| `migrations/` | data | SQL dump for legacy Postgres (`teachers_db_dump.sql`) |
| `scripts/` | data | `generate-thumbs.mjs` (legacy webp thumbnails) |
| `graduates.xml` | data | Source for legacy `server/scripts/importGraduatesFromXml.js` |
| `.github/workflows/` | ops | `deploy.yml`, `migrate-dynamodb.yml`, `validate.yml` |

## Common commands

### Whole stack (Docker)
- `docker compose up --build` — Nuxt @ `:3000`, React (Vite) @ `:5173`, Postgres @ `:5432`. Vite proxies `/api/*` to `nuxt:3000` so the React app talks to the legacy Nuxt API in dev.
- `docker compose -f docker-compose.test.yml up` — test-stack variant.

### Legacy Nuxt root
- `npm run dev` — Nuxt @ `:3000`
- `npm run build` / `npm run start` / `npm run generate`
- `npm run thumbs` — regenerate webp thumbnails for `public/teachers_img/images-webp`
- `node server/scripts/importGraduatesFromXml.js` — seed graduates from `graduates.xml`

### React SPA — `client/`
- `cd client && npm install`
- `npm run dev` — Vite dev server @ `:5173`
- `npm run build` — `tsc -b && vite build` → `client/dist/`
- `npm run test:run` — Vitest one-shot (CI uses this)
- `npm run test` — Vitest watch
- `npm run lint` — ESLint
- `npm run preview` — preview built artifacts
- `npm run deploy` — `build` then `serverless deploy` (uploads `dist/` to S3 + invalidates CloudFront)

### Serverless API — `server/`
- `cd server && npm install`
- `npm run dev` — concurrent `tsc -w` + `sls offline` (region `eu-north-1`)
- `npm run build` — `tsc && tsc-alias`
- `npm run test` — Jest, runs in band against `.build/`
- `npm run lint` / `npm run format`
- `npm run seed:teachers:local` / `seed:graduates:local` / `seed:layout:local` — local DynamoDB seeders
- `npm run seed:teachers:generate` / `seed:graduates:generate` — generate seed JSON from legacy data
- Production seeding goes through `.github/workflows/migrate-dynamodb.yml` (manual dispatch, choose `teachers` / `graduates` / `layout` / `all`).

## Target architecture (the part that matters)

### React SPA (`client/`)
- React 19, React Router 7, Vite 8, MUI 7, AWS Amplify (Cognito SRP).
- Routes (single source of truth in `client/src/router/paths.ts`): `/`, `/teachers`, `/teacher/:slug`, `/graduates`, `/graduates/:year`, `/login`, `/admin/*`. Wired in `client/src/router/routes.tsx` with `lazy(() => import …)` per page and `RequireAdmin` for the admin tree.
- Auth: `client/src/lib/cognito-auth.ts` + `cognito-config.ts`; `client/src/state/AuthContext.tsx` exposes `loginWithEmailPassword`, `confirmNewPassword`, `logout`, `isAuthed`, `authReady`. Bearer Cognito ID token is attached by `client/src/services/api.ts` `*Authed` helpers via `fetchAuthSession`.
- API client: `client/src/services/api.ts` (thin wrapper) and `client/src/lib/api.ts` (Cognito-token-aware fetch). DTOs in `client/src/lib/apiTypes.ts`.
- SEO: **`client/src/lib/seo.tsx`** is the live `<Seo>` component (uses `react-helmet-async`, escapes `</` in JSON-LD). **`client/src/lib/seoHelpers.ts`** provides `getSiteUrl`, `breadcrumbJsonLd`, `organizationJsonLd`, `teacherPersonJsonLd`, `graduateYearEventJsonLd`, `buildTeacherMetaDescription`, `truncateForMeta`, `absoluteUrlForSeo`. Every public view emits `<Seo …>` with breadcrumb + entity JSON-LD; `LoginPage` sets `noindex, nofollow`.
- Tests: Vitest + Testing Library + happy-dom. Test files live in `client/src/test/**`.
- MUI theme + CssBaseline + HelmetProvider are mounted in `client/src/main.tsx`.

### Serverless API (`server/`)
- TypeScript Lambdas with custom routing under `src/modules/<route>/<method>/index.ts` (filesystem maps to URL).
- Public modules: `api/teachers`, `api/graduates`, `api/layout`, `api/upload`, `api/upload-image`, `api/gratitudes`, `api/openapi`, and the top-level **`sitemap.xml/get/`** (public, edge-cached for 3600s).
- Services in `src/services/`: `teacher-service.ts`, `graduate-service.ts`, `layout-service.ts`, `sitemap-service.ts` (`buildSitemapXml` + `resolvePublicSiteBase`), `upload-service.ts`, `slug.ts`, `teacher-slug.ts`, `counters.ts`, `image-derivative-processor.ts`.
- Image pipeline: S3 `ObjectCreated` on originals (`images/`, `teachers_img/images/`, `graduates_img/images/`) triggers `src/handlers/s3-image-derivatives.ts`, which uses `sharp` to write `images-webp/` and `images-thumbs-webp/` siblings. `POST /api/upload/presign` returns `webpUrl` and `thumbUrl`. Docs: `server/docs/IMAGE_UPLOAD_DERIVATIVES.md`.
- Auth: API Gateway Cognito authorizer; admin routes verify the `cognito:groups` claim contains `admin`.
- Logging: structured logs via `src/lib/lambda-log.ts` with correlation IDs propagated through `Engine` context.
- Config: `src/config/env.ts`. Stage env mostly via Serverless config + SSM.
- Tests: Jest, run in-band against compiled `.build/`. Test trees alongside handlers (`get/test.ts`).

### Sitemap (Lambda-owned)
- Handler: `server/src/modules/sitemap.xml/get/index.ts`. Edge-cached `Cache-Control: public, max-age=3600, s-maxage=3600`.
- Builder: `server/src/services/sitemap-service.ts#buildSitemapXml` enumerates static routes, then `listTeacherSlugsForSitemap()` and `listGraduateYearsForSitemap()` from DynamoDB.
- Origin resolution: `resolvePublicSiteBase()` reads `SITE_URL` env, then `X-Public-Site-Base` CloudFront origin custom header, then `X-Forwarded-Host` / `Host`.
- CloudFront routes `/sitemap.xml` to the API origin (see `infra/cloudfront/`).
- **Do not ship a static `client/public/sitemap.xml`** — it would shadow this handler.

### Migration constraints (still in force)
- Behavior parity first; no feature changes during parity.
- Migrate in vertical slices (API + UI for one feature).
- No filesystem writes for runtime state in Lambda — DynamoDB or S3 only.
- All env-dependent values come from stage env vars / SSM.
- All routes must reload-safely under CloudFront SPA.
- Version API contracts (`/api/v1`) when breaking changes are unavoidable.
- Keep rollback viable across infra, app, and data.

## Conventions

Detailed coding standards live as **project skills** under `.claude/skills/` (auto-loaded by Claude when relevant). Cursor users see the same content under `.cursor/rules/`.

- `aws-low-cost` — free-tier-first AWS architecture (CloudFront/Lambda/DynamoDB cost rules).
- `dynamodb-best-practices` — single-table design, GSIs, conditional writes, pagination for JS/TS.
- `react-best-practices` — React + React Router structure (routes, hooks, services).
- `seo-spa-cloudfront` — general SEO for the React SPA (titles, canonicals, sitemap, JSON-LD).
- `serverless-framework` — Serverless config, per-function IAM, stage isolation.
- `solid-kiss-dry` — baseline design principles.
- `ai-llm-discovery` — generative-engine optimization (GEO/LLMO): AI-crawler permissions in `client/public/robots.txt`, `/llms.txt` manifest, `@graph`-linked JSON-LD with stable `@id`, FAQPage schema, static-shell fallback in `client/index.html`. Sitemap is Lambda-owned in `server`.

Additional Cursor-only rules cover topics not yet ported to skills: `client-vitest-unit-tests`, `github-actions`, `lambda-logging-traceability`, `math-history-images-s3-cloudfront`, `serverless-lambda-integration-tests`, `terraform`. See `.cursor/rules/`.

`AGENTS.md` is the short brief shared with all coding agents. Read it for the quick local-dev recipe before doing anything stack-spanning.
