---
name: solid-kiss-dry
description: Baseline design principles for any code change in this repo. Use whenever writing or refactoring code in `app/`, `server/`, `client/`, `server/`, or `infra/`. Reinforces SOLID / KISS / DRY without permitting speculative abstraction.
---

# SOLID / KISS / DRY rules

- Prefer simple, readable solutions over clever or compressed code.
- Write code for maintainers first: clear names, clear flow, clear intent.

## SOLID
- **Single Responsibility** — each module/function has one reason to change.
- **Open/Closed** — extend behavior via composition, not fragile in-place rewrites.
- **Liskov Substitution** — derived behavior must preserve the expected contract.
- **Interface Segregation** — expose small, focused interfaces, not broad ones.
- **Dependency Inversion** — depend on abstractions, not concrete low-level details (e.g. inject the repository, not a raw DynamoDB client).

## KISS
- Choose the smallest solution that fully solves the problem.
- Avoid speculative abstractions and premature optimization.
- Reduce branching complexity with guard clauses and explicit invariants.

## DRY
- Eliminate repeated business logic, validation rules, and mapping code.
- Extract shared logic only when repetition is real and stable (rule of three, not rule of two).
- Keep one source of truth for constants, route paths, env keys, and schemas.

## Migration discipline
- Every refactor must keep behavior stable unless explicitly requested otherwise.
- During the legacy → target migration, do not refactor speculatively in the legacy stack — port behavior to the new stack instead.
