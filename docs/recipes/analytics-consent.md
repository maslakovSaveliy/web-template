# Recipe: analytics behind consent

## When to use

Any analytics, pixels or session replay.

## Verify first

`/context7` for the analytics SDK (PostHog, Plausible, Umami, Yandex Metrika, GA4). `/legal-kit` for the market's consent rules.

## Packages

Analytics SDK only; prefer self-hosted / privacy-friendly tools.

## Files

- `src/features/consent/`: `consent-store.ts` (zustand, persisted: `{ analytics: boolean, marketing: boolean, decidedAt, version }`), `ConsentBanner.tsx` (equal-weight Accept / Reject / Settings), `ConsentSettings.tsx`.
- `src/features/analytics/AnalyticsLoader.tsx`: client component that loads scripts with `next/script` **only** after the matching consent flag is true; one loader per provider behind its own env flag.
- `messages/*.json`: banner and settings texts.
- CSP: add the provider's script/connect origins in `next.config.ts`.

## Env vars

`NEXT_PUBLIC_ANALYTICS_<PROVIDER>_ID` per provider (public), empty = disabled.

## Rules to append to CLAUDE.md

- No analytics request before consent. Consent changes take effect without reload; withdrawal is as easy as giving consent.
- Do not send personal data (emails, names) as analytics properties.

## Tests to add

E2E: first visit makes zero requests to analytics origins (check `page.on('request')`); after Accept they load; after Reject they never load; choice persists across reloads.

## Pitfalls

- Loading the script and "disabling" it via SDK flag still sends a request: do not load at all.
- Banner must not block keyboard users or cover focus.
