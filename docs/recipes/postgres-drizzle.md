# Recipe: Postgres + Drizzle (in this app)

## When to use

The web app owns its data and the backend logic fits in route handlers / server actions (forms, CRUD, webhooks). Default persistence choice for single-app products. For a separate service use `postgres-prisma.md`.

## Verify first

`/context7` → `drizzle-orm`, `drizzle-kit`, `postgres` (postgres.js) or `pg`: current `drizzle()` init, migrations config, `drizzle-kit generate` flags.

## Packages

`drizzle-orm`, `postgres` · dev: `drizzle-kit`

## Files

- `src/server/db/client.ts`: `import 'server-only'`; one pooled client created from `getServerEnv().DATABASE_URL`, reused across hot reloads (`globalThis` cache in dev).
- `src/server/db/schema/<domain>.ts`: tables; ids `uuid` (v7 via `crypto.randomUUID()` or db default); money as integer minor units; `created_at`/`updated_at` timestamptz.
- `drizzle.config.ts`: `schema: './src/server/db/schema'`, `out: './drizzle'`, dialect `postgresql`.
- `drizzle/`: generated SQL migrations (committed, reviewed like code).
- `docker-compose.dev.yml`: `postgres:17` on port **5433** with a named volume (default ports are often taken).
- Feature data access in `src/features/<x>/server/*.ts` (server-only), called from route handlers / server actions.

## Env vars

`DATABASE_URL` (server only) → add to `serverEnvSchema` as `z.url()`; add to `.env.example` with the local 5433 URL.

## Rules to append to AGENTS.md

- Migrations: `pnpm drizzle-kit generate` creates SQL; **never apply to shared/prod databases**: the owner applies them. Never edit a migration that left your machine.
- Every query lives in `features/<x>/server/`; no DB access from components or views.
- Destructive changes are two-step (add new → backfill → switch → drop later).

## Tests to add

Integration tests against a real Postgres (docker compose dev DB, separate database per run), covering each data function: happy path, not found, unique violation, authorization (row belongs to another user).

## Pitfalls

- `drizzle-kit push` skips migrations: dev only, never on shared DBs (denied in `.claude/settings.json`).
- Serverless/edge runtimes need an HTTP driver; this template runs Node, use a pool.
- Do not import the db client into anything reachable from a client component (`server-only` will fail the build, which is the point).
