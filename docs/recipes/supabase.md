# Recipe: Supabase

## When to use

A BaaS is justified: auth + Postgres + storage + realtime needed fast, little custom backend logic, and the data residency of the chosen Supabase deployment (cloud region or self-hosted) fits the target market. Otherwise prefer Postgres + Drizzle.

## Verify first

`/context7` → `@supabase/ssr`, `@supabase/supabase-js` (cookie handling in App Router, `proxy.ts` session refresh). Load `/supabase-postgres-best-practices` before any schema/RLS work.

## Packages

`@supabase/supabase-js`, `@supabase/ssr` · dev: `supabase` (CLI)

## Files

- `src/lib/supabase/server.ts`: `createServerClient` with Next `cookies()`; server-only.
- `src/lib/supabase/browser.ts`: `createBrowserClient` for client components.
- `src/proxy.ts`: session refresh on matching routes.
- `supabase/migrations/*.sql`: schema + RLS policies, committed.

## Env vars

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public) · `SUPABASE_SECRET_KEY` (server only, bypasses RLS).

## Rules to append to AGENTS.md

- RLS on for every table, policies tested. The secret key is used only in server code for admin tasks.
- Migrations are SQL files; the owner applies them.

## Tests to add

RLS tests per policy (allowed / denied user), integration tests for server data functions.

## Pitfalls

- `getSession()` on the server trusts the cookie; use `getUser()`/claims verification for authorization.
- Never expose the secret key via `NEXT_PUBLIC_*`.
- Check where personal data physically lives against the market's data-residency rules (`/legal-kit`).
