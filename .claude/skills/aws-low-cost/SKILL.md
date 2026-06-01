---
name: aws-low-cost
description: Free-tier-first AWS architecture rules for this project. Use when designing or modifying Lambda, S3, CloudFront, DynamoDB, or any IAM/cost-impacting infra (`infra/`, `server/serverless.*`, CloudFront behaviors, bundle size, IAM policies, budget alarms). Reinforces "lowest safe cost first; tune from real metrics."
---

# Free-tier / low-cost AWS rules

- Optimize for lowest safe cost first; scale complexity only when metrics justify it.
- Use **S3 + CloudFront** for all static and media delivery.
- Prefer **Lambda Function URL behind CloudFront** as the API front door unless API Gateway features (custom authorizers, usage plans, request validation) are strictly required.
- Prefer managed pay-per-use services for low/variable traffic. Use DynamoDB `PAY_PER_REQUEST` initially.
- Keep Lambda bundles small; minimize dependencies and tree-shake. Cold start time correlates with bundle size.
- Reuse SDK clients **outside** the handler scope so they survive across invocations.
- Set conservative Lambda memory/timeouts, then tune with real metrics, not guesses.
- Cache aggressively at CloudFront for static and media paths. Set `Cache-Control` headers intentionally — never accept accidental `no-cache` defaults.
- Use **least-privilege IAM** for every function/service. No `*` resource grants.
- Create budget alarms and cost-anomaly alerts from day one. Treat cost regressions as production issues.
- Tag every resource by project, environment, and owner for cost visibility.
- Avoid always-on resources unless strictly required. Use S3 lifecycle policies for old temporary artifacts.
