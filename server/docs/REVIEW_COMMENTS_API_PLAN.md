# Plan: Public "component review" API (notify admins by email)

## Goal

Let any visitor submit a short review/comment about a **component on the static
site** (e.g. a teacher card, a graduate photo, a page section) so administrators
can verify that names, photos, and other content are correct. The frontend opens
a modal, collects the input, and POSTs it to a **new public API endpoint**. The
endpoint persists the review (audit trail) and emails **every administrator in
the Cognito User Pool** via **SES**, using a Ukrainian **HTML template**.

This is a target-stack-only feature (`server/` Serverless + DynamoDB + SES +
Cognito). No changes to legacy `app/` or legacy `server/` (Nuxt/Nitro).

---

## 1. API contract

### `POST /api/reviews` — public, unauthenticated

The submitter is an anonymous visitor, so the route is **public** (`publicResource = true`),
mounted under the explicit public list in `serverless.yml` (no Cognito JWT at the gateway),
exactly like `GET /api/gratitudes`.

Request body (JSON):

```jsonc
{
  "email": "visitor@example.com",      // required, commenter email (reply-to target)
  "comment": "Прізвище викладача написане з помилкою.", // required, free text
  "component": {                        // required, what the review is about
    "type": "teacher",                 // "teacher" | "graduate" | "page" | "other"
    "id": "ivanov-ivan",               // optional entity id/slug/year
    "label": "Картка викладача: Іванов Іван", // human-readable, shown in email
    "url": "https://math-history.afj-solution.com/teacher/ivanov-ivan" // optional page URL
  }
}
```

Responses:

| Status | When | Body |
|---|---|---|
| `201 Created` | accepted, persisted, email dispatched (or queued best-effort) | `{ ok: true, id }` |
| `400 Bad Request` | Zod validation failure (missing/empty fields, bad email, too long) | `{ message, errors }` |
| `429 Too Many Requests` | rate limit / spam guard tripped | `{ message }` |
| `500` | unexpected failure | `{ message }` |

Design decisions (KISS):

- **Email send failure does not fail the request** if the review was already
  persisted. We log the failure and still return `201` so the visitor isn't
  blocked by a transient SES issue. (Alternative — fail hard — is noted in Open
  questions; pick one before building.)
- Keep the response minimal; never echo admin emails back to the client.

---

## 2. Data model (DynamoDB, single-table)

Persisting gives an audit trail and decouples "store" from "notify". Reuse the
existing single table and `dynamo-operations` helpers.

Add to `server/src/lib/dynamo-keys.ts`:

```ts
export const PK = {
  TEACHER: 'TEACHER',
  GRADUATE: 'GRADUATE',
  CONFIG: 'CONFIG',
  META: 'META',
  REVIEW: 'REVIEW', // new
} as const;

// sk sorts newest-last by ISO timestamp; id keeps uniqueness within same ms
export function reviewSortKey(createdAtIso: string, id: string): string {
  return `R#${createdAtIso}#${id}`;
}
```

Item shape (`ReviewItem`):

```ts
interface ReviewItem extends Record<string, unknown> {
  pk: 'REVIEW';
  sk: string;            // R#<iso>#<uuid>
  entityType: 'Review';
  id: string;            // uuid (crypto.randomUUID())
  email: string;         // commenter email (PII — see logging rules)
  comment: string;
  componentType: string;
  componentId?: string;
  componentLabel: string;
  componentUrl?: string;
  ip?: string;           // ctx.req.ip, for abuse triage only
  status: 'new';         // reserved for future admin workflow
  createdAt: string;     // ISO
}
```

Notes (dynamodb-best-practices rule):

- `Query` by `pk = REVIEW` with `begins_with(sk, 'R#')` for any future admin list
  view; never `Scan` on a hot path.
- Keep items small; no large blobs.
- Validate at the boundary with **Zod** (`reviewCreateBodySchema`).
- No GSI needed yet (no proven query pattern beyond "list all by recency").

---

## 3. Module layout (filesystem routing)

Follow the existing convention `modules/<route>/<method>/{index.ts,schema.ts,test.ts}`.

```
server/src/modules/api/reviews/post/
  index.ts    # handler: validate (via framework) → createReview() → respond
  schema.ts   # export { schema } = reviewCreateBodySchema
  test.ts     # integration test (lambda-wrapper)
```

`index.ts` mirrors `api/graduates/post/index.ts`: call the service, map known
error codes to `ResponseWriter.*`, log unexpected errors with `logException` +
`ctx.correlationIds`.

```ts
export const publicResource = true;

export const handler = async (ctx: Engine) => {
  try {
    const res = await submitReview(ctx.req.body, {
      ip: ctx.req.ip,
      correlation: ctx.correlationIds,
    });
    return ResponseWriter.Created(res); // { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'NO_ADMIN_RECIPIENTS') {
      // persisted but nobody to notify — still 201, but log a warning
      return ResponseWriter.Created({ ok: true, id: (e as ReviewError).id });
    }
    logException('review:submit_failed', e, ctx.correlationIds);
    return ResponseWriter.InternalServerError({ message: 'Could not submit review' });
  }
};
```

---

## 4. Validation model

`server/src/models/review.ts`:

```ts
import { z } from 'zod';

export const reviewComponentSchema = z.object({
  type: z.enum(['teacher', 'graduate', 'page', 'other']),
  id: z.string().trim().max(200).optional(),
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(500).optional(),
});

export const reviewCreateBodySchema = z.object({
  email: z.string().trim().email().max(254),
  comment: z.string().trim().min(3).max(2000),
  component: reviewComponentSchema,
});

export type ReviewCreateBody = z.infer<typeof reviewCreateBodySchema>;
```

Length caps double as a cheap spam/abuse guard. The framework router already runs
`schema.safeParse(req.body)` for POST and returns `400` on failure, so the handler
gets a typed, clean body.

---

## 5. Services (SOLID — one responsibility each)

### 5.1 `services/review-service.ts` — orchestration + persistence

- `submitReview(body, { ip, correlation })`:
  1. Build `ReviewItem` (uuid, ISO `createdAt`, keys).
  2. `putItem({ Item })` (persist first → audit even if email fails).
  3. Resolve admin recipients (`getAdminRecipients()`).
  4. If recipients exist, `sendReviewNotification(item, recipients)`.
  5. Log a business event (`review:created`) with **non-PII** fields only
     (id, componentType, recipientCount, durationMs). Do **not** log `email`/`comment`
     at info level (lambda-logging-traceability: minimize PII).
  6. Return `{ ok: true, id }`.

### 5.2 `services/admin-directory.ts` — Cognito admin lookup

- `getAdminRecipients(): Promise<{ email: string; name?: string }[]>`
- Uses `@aws-sdk/client-cognito-identity-provider` `ListUsersInGroupCommand`
  for group `admin` in `COGNITO_USER_POOL_ID`.
- Paginate (`NextToken`) until exhausted.
- Keep only users with a **verified** email (`email_verified === 'true'`).
- **Cache** the result in-process via the existing `lib/cache.ts` for ~5 min to
  avoid a Cognito call on every submit (aws-low-cost + cold-start friendliness).
- Reuse the SDK client **outside** the handler scope (module-level singleton),
  same pattern as `dynamo-client.ts` / `s3-client.ts`.

> Why Cognito group, not a hardcoded list: the requirement is "all administrators
> in the Cognito User Pool". The `admin` group already exists in
> `infra/modules/app-cognito/main.tf` and is the source of truth for admin
> identity (`cognito:groups` is what the API authorizer checks).

### 5.3 `services/email-service.ts` — SES transport

- `sendReviewNotification(item, recipients)`:
  - Build subject + HTML + plaintext via the template builder (5.4).
  - `@aws-sdk/client-sesv2` `SendEmailCommand`:
    - `FromEmailAddress`: `SES_SENDER` (verified identity, e.g. `no-reply@afj-solution.com`).
    - `Destination.BccAddresses`: admin emails (BCC so admins don't see each other; To = sender).
    - `ReplyToAddresses`: `[item.email]` so an admin can reply directly to the visitor.
    - `Content.Simple.Subject/Body.Html/Body.Text` with `Charset: 'UTF-8'` (Cyrillic).
  - Module-level SES client singleton.
  - On failure: throw a typed error caught by `review-service` (which decides
    whether to swallow per the "email failure ≠ request failure" decision).

### 5.4 `services/review-email-template.ts` — Ukrainian HTML template

- `buildReviewEmail(item) => { subject, html, text }`.
- Pure function, no I/O → trivially unit-testable.
- **Escape all user input** (`email`, `comment`, `componentLabel`, `componentUrl`)
  before interpolating into HTML to prevent HTML/CSS injection in the admin inbox.
- Subject (uk): `Новий відгук про сайт: <componentLabel>`.
- HTML body (uk), inline styles only (email clients strip `<style>`/external CSS):

```
Заголовок: Новий відгук на сайті «Математики УжНУ»
Компонент: <componentLabel> (<componentType>)  [посилання, якщо є url]
Коментар: <comment>
Контакт автора: <email>  (кнопка/посилання "Відповісти")
Дата: <createdAt у форматі дд.мм.рррр гг:хв, Europe/Kyiv>
Підпис: Це автоматичне повідомлення системи модерації контенту.
```

- Provide a **plaintext** fallback (`text`) with the same content for clients
  that don't render HTML and for deliverability.

---

## 6. Serverless config (`server/serverless.yml`)

### 6.1 Route (public)

Add under the public `httpApi` events for the `api` function (before the catch-all
`/{proxy+}` authorizer route), next to `/api/gratitudes`:

```yaml
      - httpApi:
          path: /api/reviews
          method: POST
```

### 6.2 Environment variables

Add to `provider.environment`:

```yaml
    COGNITO_USER_POOL_ID: ${env:COGNITO_USER_POOL_ID, ''}
    SES_SENDER: ${env:SES_SENDER, ''}
    SES_REGION: ${env:SES_REGION, '${aws:region}'}  # if SES identity lives in another region
    REVIEW_NOTIFY_FALLBACK: ${env:REVIEW_NOTIFY_FALLBACK, ''} # optional comma list if Cognito empty
```

Register the same keys in `server/src/config/env.ts` (`envSchema`) using
`optionalTrimmed()`, and require them only when `NODE_ENV` is a real AWS env
(extend the existing `superRefine` so local/test don't need SES/Cognito).
Update `server/.env.example` accordingly.

### 6.3 IAM (least-privilege — aws-low-cost rule)

Add to `provider.iam.role.statements`:

```yaml
        - Effect: Allow
          Action:
            - ses:SendEmail
          Resource: "*"   # SES SendEmail does not support resource-level ARN for the identity in all cases;
                          # scope via Condition on ses:FromAddress where possible:
          Condition:
            StringEquals:
              ses:FromAddress: ${env:SES_SENDER}
        - Effect: Allow
          Action:
            - cognito-idp:ListUsersInGroup
          Resource:
            Fn::Sub:
              - 'arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${PoolId}'
              - PoolId: ${env:COGNITO_USER_POOL_ID}
```

> Keep these scoped. No wildcard Cognito; constrain SES to the verified sender
> via the `ses:FromAddress` condition.

### 6.4 (Optional) API Gateway throttling

`serverless-api-gateway-throttling` is already a dependency. Apply a low
`maxRequestsPerSecond` / `maxConcurrentRequests` to `POST /api/reviews` to blunt
abuse of a public, email-sending endpoint.

---

## 7. Infrastructure (Terraform, `infra/`)

SES is not yet provisioned. Add a small SES setup (new `infra/ses/` module or a
block in an existing stack):

- **Verified identity** for the sender domain or address (`SES_SENDER`).
- Prefer **domain identity** with DKIM (`aws_sesv2_email_identity` +
  `aws_sesv2_email_identity_mail_from_attributes`) for deliverability; an email
  identity works for a quick start.
- Note the **SES sandbox**: until production access is granted, SES can only send
  **to verified recipients**. Admin emails must be verified, or request
  production access. Document this as a deploy prerequisite.
- Confirm **SES is enabled in the chosen region** (`eu-north-1` is supported; if
  using a different SES region, set `SES_REGION` and point the SES client at it).
- Export the sender/identity ARN as a Terraform output; wire `SES_SENDER` and
  `COGNITO_USER_POOL_ID` (already an output of `infra/cognito`) into the deploy
  env (GitHub Actions / SSM), consistent with how table/bucket names are passed.

---

## 8. Logging & traceability (lambda-logging rule)

- Use `logInfo` / `logWarn` / `logException` with `ctx.correlationIds`.
- Emit `review:created` (info) with: `id`, `componentType`, `componentId`,
  `recipientCount`, `durationMs`, `service: 'math-history-server'`.
- Emit `review:email_failed` (warn/error) with `id`, `recipientCount`, `err` —
  **never** the recipient addresses or the comment body.
- **Do not log** `email`, `comment`, or full `event` (PII). IP is for abuse
  triage only; keep it out of info-level business logs if possible.

---

## 9. Security & abuse considerations

- Public endpoint that sends email → prime abuse target. Mitigations:
  - Strict Zod caps (email format, comment length 3–2000, label/url caps).
  - API Gateway throttling (§6.4).
  - Optional honeypot field from the modal (reject if filled) — cheap bot filter.
  - Consider a simple per-IP rate limit (DynamoDB counter w/ TTL) only if abuse
    is observed (don't pre-build — KISS).
- Escape all user input in the HTML template (§5.4).
- `ReplyToAddresses` uses the **unverified** visitor email — that's fine (reply-to
  doesn't require verification); the **From** must be the verified `SES_SENDER`.
- CORS: endpoint is hit from the SPA origin; the existing `httpApi.cors` config
  already allows `POST` from the site origin.

---

## 10. Testing

### 10.1 Integration test (`modules/api/reviews/post/test.ts`)

Follow `serverless-lambda-integration-tests` rule:

- Add `'api/reviews/post'` to the default `TESTS` array in `src/tests/app.ts`.
- Mock SES + Cognito SDK clients (the test env has no real SES/Cognito):
  - Use `aws-sdk-client-mock` (add as devDep) **or** module-mock the
    `email-service` / `admin-directory` functions, so the handler path is
    exercised without real network calls.
- Cases:
  - `201` on a valid body (assert `{ ok: true, id }`, assert SES send called once
    with expected recipients/subject).
  - `400` on missing/invalid email, empty comment, missing component.
  - `201` (with warning) when Cognito returns no admins (no send).
  - Route is reachable **without** auth (public) — plain `requestContext`.

### 10.2 Unit test (template)

- `services/review-email-template` pure-function test: subject contains the
  component label; HTML escapes a `<script>`/`<` in comment; plaintext present;
  Ukrainian strings present; date formatted for Europe/Kyiv.

### 10.3 Commands

- `cd server && npm test` (Jest, in-band against `.build/`).
- `cd server && npm run lint`.

---

## 11. OpenAPI

Add a `POST /api/reviews` entry to `modules/api/openapi/get/index.ts` and to the
"Public API surface" table so the contract is documented (tag `Public`,
`security: []`, request body schema summary, `201` response).

---

## 12. Frontend touchpoints (out of scope for this API, listed for alignment)

- The modal posts to `POST /api/reviews` via the existing public API client
  (`client/src/services/api.ts` — public, no auth header needed).
- Fields: `email`, `comment`, and a `component` object the modal builds from the
  current page/entity (type, id/slug/year, label, url).
- Show explicit loading / success / error states (react-best-practices).
- No SEO/AI-discovery surface change: `/api/*` is already `Disallow` in
  `client/public/robots.txt`; no sitemap/llms.txt change needed.

---

## 13. File checklist

New:

- `server/src/models/review.ts`
- `server/src/modules/api/reviews/post/index.ts`
- `server/src/modules/api/reviews/post/schema.ts`
- `server/src/modules/api/reviews/post/test.ts`
- `server/src/services/review-service.ts`
- `server/src/services/admin-directory.ts`
- `server/src/services/email-service.ts`
- `server/src/services/review-email-template.ts`
- `server/src/services/__tests__` or `src/tests/review-email-template.test.ts`
- `infra/ses/` (or SES block in an existing stack) + outputs — **implemented**

Modified:

- `server/src/lib/dynamo-keys.ts` (add `REVIEW` + `reviewSortKey`)
- `server/serverless.yml` (route, env, IAM, optional throttling)
- `server/src/config/env.ts` (+ `.env.example`)
- `server/src/tests/app.ts` (add to `TESTS`)
- `server/src/modules/api/openapi/get/index.ts` (document endpoint)
- `server/package.json` (deps: `@aws-sdk/client-sesv2`,
  `@aws-sdk/client-cognito-identity-provider`; dev: `aws-sdk-client-mock`)

---

## 14. Step-by-step build order (vertical slice)

1. Model + keys: `review.ts`, `dynamo-keys.ts`.
2. Template builder + unit test (pure, no AWS).
3. `admin-directory.ts` (Cognito list + cache) and `email-service.ts` (SES).
4. `review-service.ts` (persist → resolve admins → send → log).
5. Module `index.ts` + `schema.ts` (wire into router; `publicResource = true`).
6. `serverless.yml`: route, env, IAM, (optional) throttling; `env.ts` + `.env.example`.
7. Integration test + add to `TESTS`; `npm test` + `npm run lint`.
8. OpenAPI doc entry.
9. Terraform SES identity + outputs; pass `SES_SENDER` / `COGNITO_USER_POOL_ID`
   through deploy env. **Done:** `infra/ses/` + `infra/modules/app-ses/`; CI job
   `deploy-ses`; Serverless deploy receives `SES_SENDER`, `SES_REGION`,
   `COGNITO_USER_POOL_ID`.
10. Verify SES identity, exit sandbox (or verify admin recipients), deploy.

---

## 15. Open questions (decide before building)

1. **Email failure semantics**: return `201` even if SES fails (persist-first,
   best-effort notify) — *recommended* — or fail `502` so the visitor retries?
2. **Sender identity**: domain identity (`no-reply@afj-solution.com`, DKIM) vs a
   single verified email address for the first iteration?
3. **SES region**: keep in `eu-north-1` (same as stack) or a dedicated SES region?
4. **Recipient strategy**: strictly the Cognito `admin` group, or also a static
   `REVIEW_NOTIFY_FALLBACK` list when the group is empty?
5. **Persistence**: store reviews in DynamoDB (audit, recommended) or notify-only
   (no table writes)?
6. **Spam hardening now or later**: ship with throttling + caps only, add per-IP
   rate limiting only if abuse appears?
