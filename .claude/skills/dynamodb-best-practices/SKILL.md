---
name: dynamodb-best-practices
description: DynamoDB modeling and JS/TS implementation rules. Use when writing or modifying DynamoDB code in `server_v2/` or `infra/dynamodb/` — repositories, key schemas, GSIs, Get/Query/Put/Update/Delete, pagination, conditional writes, idempotency, runtime validation. Replaces relational/Sequelize patterns from the legacy `server/`.
---

# DynamoDB + JavaScript/TypeScript best practices

- Design tables from **access patterns first**, not from relational schema habits. Translate the legacy Sequelize/Postgres queries to explicit access patterns before picking keys.
- Prefer single-table design unless the cognitive cost outweighs the benefit.
- Define explicit key naming conventions: `PK` with entity namespace (e.g. `TEACHER#<slug>`), `SK` for item type / version / order.
- Create **GSIs only for proven query needs**; every GSI carries cost and write amplification.
- Prefer `Query` by key over `Scan`. **Never** put scans on hot request paths.
- Keep items small; offload large blobs/media to S3 and store only S3 references in DynamoDB.
- Validate at runtime with **Zod** (or equivalent) at API boundaries; expose typed repository interfaces.
- Use **conditional writes** for uniqueness (e.g. unique slug) and race safety.
- Implement **idempotency** for retryable write operations (idempotency key in PK or attribute + conditional write).
- Always paginate list endpoints with `LastEvaluatedKey`; never assume a full read in a single call.
- Handle reserved words via `ExpressionAttributeNames` and parameterize values via `ExpressionAttributeValues`.
- Log consumed capacity in staging for cost tuning; remove that logging in prod.
- Use TTL only for ephemeral data (sessions, temp tokens), never for core entities.
