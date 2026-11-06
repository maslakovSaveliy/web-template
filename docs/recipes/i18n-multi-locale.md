# Recipe: more locales and locale routing

## When to use

A second language is needed.

## Verify first

`/context7` → `next-intl` routing (`defineRouting`, `createNavigation`, `localePrefix: 'as-needed'`, proxy/middleware matcher, `setRequestLocale` for static rendering).

## Packages

None new.

## Files

- `src/i18n/config.ts`: add the locale to `locales`.
- `messages/<locale>.json`: full copy of the default file, translated (`pnpm check` enforces identical keys).
- `src/i18n/routing.ts`: `defineRouting({ locales, defaultLocale, localePrefix: 'as-needed' })`.
- `src/i18n/navigation.ts`: `createNavigation(routing)`; use its `Link`/`redirect` instead of `next/link` for localized routes.
- `src/proxy.ts`: next-intl middleware with a matcher excluding `api`, `_next`, files.
- Move routes under `src/app/[locale]/`; `request.ts` reads `requestLocale`; `generateStaticParams` returns all locales; call `setRequestLocale(locale)` in layouts/pages.
- `createPageMetadata`: add `alternates.languages` (hreflang) for each locale + `x-default`.
- `sitemap.ts`: one entry per locale with `alternates.languages`.

## Env vars

None.

## Rules to append to AGENTS.md

- New keys are added to all locale files in the same change; untranslated text is marked `TODO(<locale>)` in the value, never left missing.

## Tests to add

E2E: `/` serves default locale, `/<locale>/` serves the other with correct `html[lang]`; hreflang links present; language switcher keeps the current path.

## Pitfalls

- Forgetting `setRequestLocale` makes pages dynamic.
- Do not detect locale from IP; use `Accept-Language` once, then the explicit choice (cookie).
