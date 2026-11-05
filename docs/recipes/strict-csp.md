# Recipe: strict nonce-based CSP

## When to use

High-risk apps (auth, payments, admin) where `'unsafe-inline'` scripts are not acceptable.

## Verify first

`/context7` → Next.js "Content Security Policy" guide (nonce in `src/proxy.ts`, `x-nonce` header, dynamic rendering requirement).

## Packages

None.

## Files

- `src/proxy.ts`: generate a per-request nonce, set `Content-Security-Policy` with `'nonce-<n>' 'strict-dynamic'` on request and response; matcher excludes `api`, `_next/static`, `_next/image`, files and prefetches.
- `next.config.ts`: remove the static CSP header (keep the other security headers).
- Third-party scripts get the nonce via `next/script` (`nonce` prop read from `headers()`).

## Env vars

None.

## Rules to append to CLAUDE.md

- Every page is dynamically rendered under the nonce CSP: account for it in caching and performance decisions.
- New third-party origins are added explicitly to the policy with a reason.

## Tests to add

E2E: response has a CSP with a nonce, no console CSP violations on key pages (`page.on('console')`), inline script without nonce is blocked.

## Pitfalls

- Static pages cannot carry nonces; partial prerendering and full static export are incompatible with this recipe.
- next-themes' inline script needs the nonce (`ThemeProvider nonce`).
