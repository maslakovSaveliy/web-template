# Recipe: editable texts from a CMS or database

## When to use

Non-developers must change site copy without a deploy.

## Verify first

`/context7` for the CMS SDK; Next.js `'use cache'`, `cacheTag`, `revalidateTag`.

## Packages

CMS SDK if any (or plain `fetch`).

## Files

- `src/i18n/messages.ts`: add a `remoteMessageSource` implementing `MessageSource.load(locale)`:
  1. fetch the remote dictionary (cached with tag `messages:<locale>`);
  2. deep-merge it **over** the local JSON (local file stays the fallback and the type source);
  3. validate shape (unknown keys ignored, non-string values dropped).
     Switch `activeSource` to it.
- `src/app/api/revalidate/messages/route.ts`: POST with a shared secret → `revalidateTag('messages:<locale>')`; called by a CMS webhook.

## Env vars

`MESSAGES_API_URL`, `MESSAGES_API_TOKEN`, `REVALIDATE_SECRET` (server only).

## Rules to append to AGENTS.md

- Keys are defined in `messages/<locale>.json` first (types come from it); the CMS can only override existing keys.
- A CMS outage must not break pages: on error, fall back to local messages and log.

## Tests to add

`loadMessages` merges remote over local; remote failure → local messages; unknown remote keys ignored; revalidate route rejects a wrong secret.

## Pitfalls

- Remote text with ICU syntax errors throws at render: validate with `IntlMessageFormat` before accepting.
- Texts can contain HTML-like content: render via `t.rich`, never `dangerouslySetInnerHTML`.
