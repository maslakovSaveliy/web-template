# Recipe: authentication

## When to use

Accounts, private pages or per-user data.

## Verify first

`/context7` for the chosen option. `/security-best-practices` before writing any session code. `/legal-kit` for allowed login methods and consent in the target market.

## Packages

Pick one (decision goes to `docs/decisions.md`):

- Backend owns auth (NestJS etc.): no package here; BFF route handlers proxy and set httpOnly cookies.
- In-app: `better-auth` (email/password, OTP, OAuth providers, Drizzle/Prisma adapters).
- BaaS: Supabase Auth (`supabase.md`).

## Files

- `src/server/auth/*.ts`: session read/verify helpers (`getSession()`, `requireUser()`), server-only.
- `src/proxy.ts`: optimistic redirect for signed-out users on private segments (real checks stay in the data layer).
- `src/app/(auth)/...`: sign-in/up routes; `src/app/(app)/...`: private segment with `noIndex` metadata.
- `features/auth/`: forms, schemas, hooks.

## Env vars

Provider secrets and session secret (server only), e.g. `AUTH_SECRET`, OAuth client ids/secrets.

## Rules to append to CLAUDE.md

- Authorization is checked in the data access function for every read/write (IDOR), not only in `proxy.ts` or the UI.
- Sessions in httpOnly, Secure, SameSite=Lax cookies; no tokens in `localStorage` or persisted stores.
- Rate-limit login, OTP and password reset; return 429 with `Retry-After`.

## Tests to add

Sign-in happy path (e2e), wrong password, expired session redirect, access to another user's resource returns 403/404, rate limit triggers.

## Pitfalls

- Redirect decisions after streaming starts cannot change the status code: decide before rendering.
- Some markets restrict which identity providers may be offered: confirm with `/legal-kit`.
