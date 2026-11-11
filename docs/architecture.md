# Architecture

What this app is made of, where boundaries are, and what must stay true. Update it when a boundary changes.

## Shape

One Next.js App Router application (modular monolith). The web app may own simple backend work through route handlers (forms, webhooks, small CRUD with Postgres). A separate backend service is added only when there is a stable domain boundary, a separate team, or non-HTTP workloads (queues, bots, heavy jobs); then this app talks to it through a typed client (`docs/recipes/api-client-openapi.md`).

```
Browser ──► Next.js (RSC + route handlers) ──► [optional] Postgres / backend API / third parties
              │
              ├─ app/      routing, metadata, server data fetch
              ├─ views/    page composition
              ├─ features/ domain slices (UI + hooks + schemas + api)
              ├─ components/, ui/   shared blocks and primitives
              └─ lib/, i18n/, providers/, store/, server/
```

## Layers and dependency direction

`app → views → features → components → ui`; everything may use `lib/`, `i18n/`, `styles/`. Never the reverse:

- `ui/` knows nothing about features or i18n namespaces (labels come in as props).
- `features/` do not import other features' internals; share through `lib/` or a feature barrel.
- `server/` and `lib/env/server.ts` are server-only (`import 'server-only'` makes a client import fail the build).

## Rendering

- Static by default; dynamic only where a route needs request data. Caching is explicit (`'use cache'`, `revalidateTag`) when added.
- Auth, redirects and 404 decisions happen before streaming.
- Client JS budget: interactive islands only; avoid marking whole pages `'use client'`.

## Data

- Server data: Server Components / route handlers. Client server-state: TanStack Query hooks inside features, `apiFetch` with Zod schemas.
- Errors cross the network boundary as `ApiError { code, status, details }` (`network`, `timeout`, `http`, `parse`, `validation`). Every request has a deadline (`timeoutMs`, default 10 s).
- UI state: Zustand (not persisted unless harmless).
- Persistence is not part of the template. Preferred: Postgres + Drizzle (in-app) or Prisma (in a NestJS backend). See recipes.

## Texts and i18n

next-intl without locale routing (single locale, no prefix). All texts in `messages/<locale>.json`, loaded through `loadMessages()`; swapping that one function moves texts to a CMS/DB. More locales: `docs/recipes/i18n-multi-locale.md`.

## Configuration

- `src/lib/env/schema.ts` is the only place env vars are declared.
- Public env is inlined at build (one image per environment). Server env is validated at server start (`src/instrumentation.ts`).

## Security baseline

Security headers + CSP in `next.config.ts`; Zod at every boundary; no secrets in client code; dependency guard (`minimumReleaseAge`, `allowBuilds` in `pnpm-workspace.yaml`); secretlint in pre-commit. Nonce CSP: `docs/recipes/strict-csp.md`.

## Delivery

PR → CI (check, types, unit, knip, build; e2e on PRs) → image per commit sha in a registry → manual deploy with health gate and rollback. See `docs/deploy.md`.

## Quality bars

WCAG 2.2 AA (axe in CI + manual keyboard pass on key flows), Core Web Vitals at p75 (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), home first-load JS ≤ 200 KB compressed. Budgets, the measurement method and caching rules: `docs/performance.md`.
