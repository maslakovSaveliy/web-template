# Project memory

Shared memory for every agent and human working here (rules: `AGENTS.md` → "Project memory").
One dated line per fact: `- YYYY-MM-DD: fact. Why it matters / what to do.` Newest last in each section.
No secrets, credentials, personal data or client names.

## Gotchas

- 2026-11-06: `biome-ignore-all` works only as the very first line of a file, above `'use client'`.
- 2026-11-06: Biome skips gitignored files, so a lint fixture or probe file must not be in `.gitignore`.
- 2026-11-06: `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`: a version published less than a day ago fails to resolve. Pick an older version; do not lower the guard.
- 2026-11-06: pnpm 12 allows install scripts via `allowBuilds` in `pnpm-workspace.yaml` (run `pnpm approve-builds`), not `onlyBuiltDependencies`.
- 2026-11-06: CSP `upgrade-insecure-requests` is sent only when `NEXT_PUBLIC_SITE_URL` is https. On http localhost it breaks CSS loading in WebKit e2e runs.
- 2026-11-06: In page metadata, pass no `title` key instead of `title: undefined`; an undefined title overrides the layout default and leaves the page untitled.
- 2026-11-06: Write U+2028/U+2029 in source with `String.fromCharCode`; literal characters get mangled by tools.
- 2026-11-11: Playwright `waitUntil: 'networkidle'` also counts Next router prefetches of linked routes (the `/contact` chunk, ~45 KB). First-load JS measurements block requests with the `next-router-prefetch` header.
- 2026-11-11: A barrel import can pull another route's client components or a module with top-level side effects (`clientEnv` → zod) into every page. Measured on the home page: views barrel +13.9 KB, `isApiError` via `@/lib/api` in `QueryProvider` +30.9 KB compressed first-load JS. Client components and route files import such modules by path; Biome blocks `@/views`.
- 2026-11-11: Locally `reuseExistingServer` makes Playwright test whatever server already listens on port 3100, even an old build (chunks then 404 and before/after numbers are identical). Before measuring, check `lsof -iTCP:3100 -sTCP:LISTEN` is empty.

## Owner decisions not covered by AGENTS.md

## Environment
