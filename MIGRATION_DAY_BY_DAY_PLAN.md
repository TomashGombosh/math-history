# Migration Plan (Day by Day)

## Goals
- Move from Nuxt/Vue to React + React Router.
- Move backend to AWS Lambda (plain JS/TS) behind API.
- Host client on S3 + CloudFront.
- Keep cost as low as possible (free-tier-first mindset).
- Replace relational DB usage with DynamoDB access patterns.

## Assumptions
- Single engineer execution path.
- Existing behavior must be preserved first, then optimized.
- Priority is low cost over advanced platform features.
- Prefer CloudFront + Lambda Function URL for API if possible; keep API Gateway only if required.

## Week 1
### Day 1
- Freeze scope and create endpoint/feature inventory.
- Define acceptance criteria for public pages, admin pages, auth, uploads, and SEO.
- Set baseline metrics (pages, endpoints, latency target, monthly budget target).

### Day 2
- Define target AWS architecture diagram.
- Decide API front door: API Gateway vs Lambda Function URL (cost decision).
- Define environments: `dev`, `staging`, `prod`.

### Day 3
- Design DynamoDB data model (single-table or split-table).
- Define partition/sort keys and all GSIs needed by current queries.
- Define data access contracts for teachers, graduates, layout config, auth.

### Day 4
- Create Serverless Framework skeleton and stage config.
- Add IAM least-privilege roles, env var structure, and deployment buckets.
- Configure CloudFront behaviors (`/api/*` and SPA fallback).

### Day 5
- Design S3 object strategy for uploads and derived images.
- Define object keys, metadata, caching headers, and invalidation policy.
- Finalize migration rollback strategy.

## Week 2
### Day 6
- Implement shared backend core: request/response wrappers, validation, error format.
- Implement auth token utilities and middleware equivalents.

### Day 7
- Implement DynamoDB repository for `teachers` read paths.
- Add indexes for slug lookup and filter queries.

### Day 8
- Implement `teachers` write paths (create/update/delete).
- Port slug generation and uniqueness strategy.

### Day 9
- Implement `graduates` read/write paths.
- Port aggregation behavior for years and honors counters.

### Day 10
- Implement `layout` config storage in DynamoDB or S3 object.
- Add migration script from existing `layoutConfig.json`.

## Week 3
### Day 11
- Implement image upload Lambda (multipart parsing).
- Store originals/derived assets in S3.

### Day 12
- Port image processing pipeline (webp/thumb generation).
- Add robust error handling and cleanup for failed uploads.

### Day 13
- Implement sitemap endpoint and SEO metadata endpoints.
- Verify URL consistency with new routing.

### Day 14
- Implement remaining admin API endpoints parity.
- Add endpoint-level auth checks and input constraints.

### Day 15
- Backend integration test pass (manual or scripted smoke tests).
- Fix parity regressions before frontend migration.

## Week 4
### Day 16
- Scaffold React + React Router app structure.
- Set layout shell, shared header/footer, route tree.

### Day 17
- Port public home and teachers list pages.
- Port filter, search, and pagination behavior.

### Day 18
- Port teacher detail page and SEO metadata behavior.
- Port graduates list page.

### Day 19
- Port graduate year detail page with grouped rendering and gallery support.
- Verify image URL compatibility with S3/CloudFront.

### Day 20
- Port auth/login and admin guard logic.
- Implement token handling strategy and route protection.

## Week 5
### Day 21
- Port admin teachers list/create flows.
- Port publications and image upload interactions.

### Day 22
- Port admin teachers edit/delete flows.
- Ensure default avatar and remove/replace image logic parity.

### Day 23
- Port admin graduates list/create flows.
- Preserve specialty/section grouping behaviors.

### Day 24
- Port admin graduates edit/delete flows.
- Validate existing/new photo merge logic.

### Day 25
- Port layout settings UI and persistence behavior.
- Final UI parity pass with Nuxt implementation.

## Week 6
### Day 26
- Configure production build/deploy pipeline with Serverless.
- Configure S3 static hosting + CloudFront cache rules.

### Day 27
- Run full QA checklist (public pages, admin flows, uploads, auth, SEO).
- Validate no route breaks and no API contract drift.

### Day 28
- Load/perf sanity checks with low-cost limits.
- Tune Lambda memory/timeouts and DynamoDB capacity mode.

### Day 29
- Staging cutover rehearsal and rollback drill.
- Final docs: runbooks, deploy steps, troubleshooting.

### Day 30
- Production cutover.
- Observe logs, metrics, errors, and costs for 24h.
- Execute post-cutover fixes and close migration.

## Post-Migration (First 2 Weeks)
- Daily cost review (CloudFront, Lambda, DynamoDB, S3 requests).
- Add alarms for error rate, latency, throttling, and spend.
- Backlog hardening: caching, DX cleanup, optional API consolidation.
