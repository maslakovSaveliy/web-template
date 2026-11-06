# Recipe: Postgres + Prisma

## When to use

A separate backend (NestJS) owns the data, or the team prefers Prisma's schema-first workflow and generated client. Inside this Next app Drizzle is lighter; Prisma here is fine for medium CRUD apps.

## Verify first

`/context7` → `prisma` (Prisma 7: driver adapters, `prisma.config.ts`, generator output path), `@prisma/adapter-pg`. Also `/nestjs-best-practices` when used in NestJS.

## Packages

`@prisma/client`, `@prisma/adapter-pg`, `pg` · dev: `prisma`

## Files

- `prisma/schema.prisma` (+ `prisma.config.ts`): models with `@id @default(uuid(7))`, `Decimal` or integer minor units for money, `BigInt` for Telegram ids.
- `prisma/migrations/`: committed SQL from `prisma migrate dev --create-only`.
- `src/server/db/prisma.ts`: `import 'server-only'`; singleton client with the pg adapter, cached on `globalThis` in dev.
- In NestJS: a `@Global()` `PrismaModule` exporting `PrismaService`.
- `docker-compose.dev.yml`: `postgres:17` on port 5433.

## Env vars

`DATABASE_URL` (server only; add to `serverEnvSchema`).

## Rules to append to AGENTS.md

- Create migrations with `--create-only`, review the SQL, commit. `prisma migrate deploy` runs only in the deploy entrypoint, never by an agent (denied in `.claude/settings.json`).
- Never `prisma db push` against shared databases.
- `prisma generate` must run in CI before typecheck (CI needs a dummy `DATABASE_URL`).

## Tests to add

Integration tests on a real Postgres (testcontainers or the dev compose DB with a per-run schema). For APIs: e2e per endpoint covering 200/400/401/403 (IDOR) cases.

## Pitfalls

- Generated client path changed in Prisma 7: import from the configured output, not `@prisma/client` defaults.
- CI silently skipping tests because `prisma generate` failed without `DATABASE_URL` happened before: make the step fail loudly.
- Two migrations with the same number from parallel branches: always regenerate after rebasing.
