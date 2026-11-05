# Recipe: PWA and web push

## When to use

Users return often from mobile, need an app-like icon, offline shell or notifications.

## Verify first

`/context7` → Next.js PWA guide (manifest, service worker in `public/`), `web-push`. Check current iOS web push requirements (installed to home screen).

## Packages

`web-push` (server)

## Files

- `src/app/manifest.ts` (exists): add icons 192/512 + maskable.
- `public/sw.js`: minimal service worker (push + notificationclick; optional offline shell). Served with `Cache-Control: no-cache` and a strict `Service-Worker-Allowed` scope.
- `src/features/push/`: subscribe button (asks permission only after a user action), hooks.
- `src/app/api/push/subscribe/route.ts`: stores subscriptions (DB recipe).

## Env vars

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (server).

## Rules to append to CLAUDE.md

- Never request notification permission on page load.
- Marketing pushes need explicit consent (see `/legal-kit`).

## Tests to add

Unit: subscription payload validation. E2E (Chromium): manifest valid, service worker registers, permission prompt only after click.

## Pitfalls

- Aggressive SW caching serves stale HTML after deploys: do not cache navigations unless you version and clean caches.
