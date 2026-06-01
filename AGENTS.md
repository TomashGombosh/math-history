# AGENTS.md — guidance for coding agents

This repository is a **Math History** site: a **Nuxt/Vue** app at the repo root, a **React Router (Vite)** migration client in `client/`, a **Serverless Framework** API in `server/`, and **Terraform** under `infra/`. Postgres and local orchestration use **Docker Compose**.

## Repository layout

| Area | Path | Notes |
|------|------|--------|
| Legacy Nuxt app | Root (`app/`, `nuxt.config.ts`, etc.) | Vue/Nuxt 4, Sequelize + Postgres |
| Migration client | `client/` | React 19, React Router 7, Vite; proxies `/api/*` to Nuxt in Docker |
| Serverless API | `server/` | TypeScript Lambdas, DynamoDB, S3, Zod; image derivatives: `server/docs/IMAGE_UPLOAD_DERIVATIVES.md` |
| Infrastructure | `infra/` | Terraform modules (CloudFront, Cognito, S3, etc.) |
| DB migrations | `migrations/` | SQL migrations |

## Local development

- **Full stack (recommended):** from repo root, `docker compose up --build` — Nuxt at `http://localhost:3000`, React at `http://localhost:5173`, Postgres at `localhost:5432`.
- **React client only:** `cd client && npm install && npm run dev` (expects API on configured proxy target).
- **Serverless API locally:** `cd server && npm install && npm run dev` (uses `sls offline`; see `server` scripts and env).

## Tests and quality

- **Client:** `cd client && npm run test:run` (Vitest); `npm run lint` for ESLint.
- **API:** `cd server && npm test` (Jest); `npm run lint` for ESLint.

Run the relevant commands after changes that affect those packages.

## Conventions agents should follow

- **Scope:** Change only what the task requires. Do not refactor unrelated code or add documentation files unless asked.
- **Style:** Match existing patterns in the touched files (imports, naming, error handling). Prefer small, readable changes (SOLID, KISS, DRY — see `.cursor/rules/solid-kiss-dry-rules.mdc`).
- **Stack-specific rules:** Additional Cursor rules live under `.cursor/rules/` (e.g. React Router, Terraform, Serverless, DynamoDB, SEO/CloudFront). Apply the rules that match the files you edit.
- **Images and CDN:** User and migrated media flow through S3/CloudFront; URL shapes (`/images/*`), presigned upload keys, and client helpers must stay aligned. See `.cursor/rules/math-history-images-s3-cloudfront.mdc` before changing image URLs, uploads, or CloudFront behavior.
- **Cost and AWS:** Prefer lean Lambdas, caching, and least-privilege IAM where you touch infrastructure or server code (see `.cursor/rules/aws-free-tier-low-cost-rules.mdc`).

## Git workflow

- Base ongoing work from the project’s main development branch (e.g. `development`) unless instructed otherwise.
- Use focused commits with clear messages; push to the assigned feature branch only.

When in doubt, prefer explicit loading/error states in UI, validated inputs on the API, and tests for non-trivial logic.
