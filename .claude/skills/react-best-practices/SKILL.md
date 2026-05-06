---
name: react-best-practices
description: React 19 + React Router architecture rules for the new SPA in `client/`. Use when writing or modifying `.jsx`/`.tsx` components, hooks, routes, or `client/src/services/api`. Reinforces vertical-slice migration of the legacy Nuxt pages in `app/`.
---

# React 19 + React Router best practices

- Build UI with **small, single-purpose components**. Pages are composition layers; feature components carry UI logic; hooks carry reusable behavior.
- Centralize routing. Define route paths in **one place** and reuse the constants — do not duplicate path strings inline.
- Use **route-level code splitting** (`lazy` + `Suspense`) for every major page (home, teachers list, teacher detail, graduates list, graduates year, admin pages, login).
- Guard protected routes with clear auth checks and predictable redirects. Mirror the legacy admin guard semantics from `app/middleware/admin.js` (404 over 401 for the public surface, unless explicitly changed).
- Separate concerns: `components/` for rendering, `hooks/` for reusable logic, `services/api/` for network access. Never inline `fetch` calls inside page components.
- Forms: keep them controlled and validated before submit. Show actionable errors.
- Handle **loading, empty, and error** states explicitly on every async screen. Add error boundaries around route trees and async-heavy screens.
- Use stable identity-based keys when rendering lists; never use array index when an `id`/`slug` exists.
- Prefer composition over inheritance; avoid deep prop drilling — use context only when justified.
- Keep side effects inside `useEffect` with correct dependency arrays. Prefer event handlers over effects for user-triggered work.
- Avoid premature abstraction. Extract only after repetition is real and stable.
- Token storage / auth: handle in one place (auth provider/hook), with explicit expiry handling.
