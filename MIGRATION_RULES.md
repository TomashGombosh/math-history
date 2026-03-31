# Migration Rules and Best Practices

## 1) Core Migration Rules (Nuxt/Vue -> React/Lambda/AWS)

- Preserve behavior before refactoring; no feature changes during parity phase.
- Migrate in vertical slices (API + UI for one feature) to reduce integration risk.
- Keep API contracts explicit and versioned (`/api/v1` preferred if changes are needed).
- Every migrated endpoint must have:
  - input validation,
  - explicit error mapping,
  - auth/authorization checks (if admin),
  - observable logs.
- Never use local filesystem writes for runtime state in Lambda.
- Replace all mutable local files (example: layout config) with DynamoDB/S3.
- Make all env-dependent values configurable via stage env vars.
- All routes must support direct browser reload in CloudFront SPA setup.
- Keep rollback always possible:
  - infra rollback,
  - app rollback,
  - data migration rollback plan.

## 2) React + React Router Best Practices

- Use route-based code splitting (`lazy` + `Suspense`) for each major page.
- Keep route definitions centralized and typed where possible.
- Use loaders/actions only when they simplify data flow; avoid over-engineering.
- Keep components small:
  - page components = orchestration,
  - feature components = UI logic,
  - hooks = reusable behavior.
- Do not store server state in random local state trees; use a consistent data-fetching strategy.
- Keep API clients isolated (`api/` layer), never inline fetch logic everywhere.
- Handle auth in one place:
  - token storage strategy,
  - guarded routes,
  - expired token handling.
- Prefer controlled forms for admin workflows; validate before submit.
- Keep styling strategy consistent (CSS modules, scoped CSS, or utility-first; choose one).
- Add error boundaries for route trees and async-heavy screens.

## 3) SEO Best Practices (for React SPA + CloudFront)

- Ensure each page sets:
  - unique `<title>`,
  - meta description,
  - canonical URL.
- Maintain OpenGraph + Twitter tags for shareable pages.
- Keep semantic structure (`h1` once per page, meaningful heading hierarchy).
- Generate and serve `sitemap.xml` dynamically or from build artifacts.
- Keep `robots.txt` explicit and environment-aware.
- Preserve structured data (JSON-LD) for:
  - organization/site,
  - breadcrumbs,
  - entity pages (teachers, graduates).
- Avoid client-only rendering for critical indexable metadata where possible.
- Use stable, human-readable URLs (`/teacher/:slug`, `/graduates/:year`).
- Optimize media:
  - use modern formats,
  - width/height hints,
  - lazy loading where appropriate.

## 4) DynamoDB + JavaScript/TypeScript Best Practices

- Design from access patterns first; never start from relational table shapes.
- Prefer single-table design unless team complexity/cognition cost is too high.
- Define strict key conventions:
  - `PK` with entity namespace,
  - `SK` for item type/version/order.
- Add GSIs only for proven query needs; every GSI has cost impact.
- Use `PAY_PER_REQUEST` initially for low/variable traffic.
- Keep item size small; offload heavy blobs/media to S3.
- Enforce schema at application layer:
  - runtime validation (Zod/Valibot/etc),
  - typed repository interfaces.
- Always paginate reads (`LastEvaluatedKey`), never assume full scan/read.
- Avoid scans in request path; use key queries and precomputed aggregates.
- Implement idempotency for write endpoints where retries are possible.
- Use conditional writes for uniqueness and race-safety.
- Log DynamoDB consumed capacity in staging for cost tuning.
- Use TTL only for truly ephemeral items (sessions/temp tokens), not core entities.

## 5) Free-Tier / Low-Cost AWS Rules

- Prefer CloudFront + S3 for all static delivery.
- Prefer Lambda Function URL behind CloudFront for cheapest API front door unless API Gateway features are required.
- Keep Lambda package size minimal to reduce cold starts.
- Reuse SDK clients outside handler scope.
- Set conservative Lambda memory/timeouts; tune with real metrics.
- Cache aggressively at CloudFront for static and media paths.
- Use S3 lifecycle policies for old temporary artifacts.
- Add budget alarms from day one; enforce spend thresholds per environment.

## 6) Quality Gates (Mandatory Before Cutover)

- Route parity: all public/admin routes reachable and reload-safe.
- Endpoint parity: all existing API behaviors validated.
- Auth parity: login, protected routes, token expiry behavior.
- Upload parity: create/read/delete images and derived assets.
- SEO parity: metadata, sitemap, robots, canonical correctness.
- Cost sanity: estimated monthly spend within budget target.
