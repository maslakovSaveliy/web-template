# Recipe: Telegram Mini App (web part)

## When to use

The product runs inside Telegram as a Mini App. The bot itself is a separate repo (grammY).

## Verify first

`/context7` → `@telegram-apps/sdk-react` (init, theme params, viewport, back button), Telegram docs on validating `initData` (HMAC with bot token, `auth_date` freshness).

## Packages

`@telegram-apps/sdk-react`

## Files

- `src/features/telegram/TelegramProvider.tsx` (client): init SDK, map Telegram theme params to CSS variables (`--color-bg`, `--color-text`, ...) so tokens follow the Telegram theme; expand viewport; respect safe areas.
- `src/app/api/telegram/session/route.ts`: receives raw `initData`, validates the HMAC with `TELEGRAM_BOT_TOKEN` and `auth_date` (e.g. ≤ 24 h), creates an httpOnly session cookie. Never trust `initDataUnsafe` on the server.
- `src/app/(tma)/...`: Mini App routes, `noIndex`.

## Env vars

`TELEGRAM_BOT_TOKEN` (server only), `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.

## Rules to append to CLAUDE.md

- Identity comes only from server-validated `initData`. Telegram ids are stored as bigint.
- Do not rely on Telegram storage for personal data you are obliged to keep yourself.

## Tests to add

`initData` validation: valid signature, tampered field, expired `auth_date`; e2e in a normal browser with a mocked SDK (theme applied, back button handler).

## Pitfalls

- CSP: Telegram loads the app in a WebView/iframe on some clients; `frame-ancestors 'none'` blocks the web client. Allow `https://web.telegram.org` in `frame-ancestors` and drop `X-Frame-Options: DENY` for Mini App routes.
- Digital goods inside Telegram may have to use Telegram Stars (platform rule).
