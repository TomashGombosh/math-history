---
name: serverless-framework
description: Serverless Framework deployment and operational standards for `server_v2/` (and any `serverless.yml`/`serverless.ts`). Use when editing the Serverless config, function handlers, IAM, stage variables, or deploy artifacts. Stages are `dev`, `staging`, `prod`.
---

# Serverless Framework rules

- Keep `serverless` config **deterministic** and **stage-aware** (`dev`, `staging`, `prod`). No environment-dependent branching that breaks reproducibility.
- Centralize shared settings: runtime, region, env, tags, IAM boundaries.
- Use **per-function least-privilege IAM**. Do not grant wildcard `*` resources or actions.
- Keep function handlers small and single-responsibility. One business operation per function where reasonable.
- Set explicit timeouts, memory, and retry behavior **per function** — do not rely on framework defaults.
- Configure dead-letter or explicit failure handling for async/event-driven flows.
- Keep secrets out of source control. Load them from SSM Parameter Store or Secrets Manager via stage config.
- Version APIs safely — prefer `/api/v1` over breaking changes; provide a migration plan when contracts must shift.
- Add structured logging (JSON) and propagate correlation IDs through every handler.
- Validate deployment artifacts in CI before deploy (lint, type-check, package size sanity).
- Make rollback easy: immutable artifacts, isolated stages, documented rollback steps.
- Document every non-obvious infrastructure decision inline (config comments) or in `infra/`.
- Reuse SDK clients **outside** the handler scope (cold-start optimization).
