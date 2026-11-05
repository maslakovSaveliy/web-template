# CLAUDE.md

Canonical rules for humans and coding agents. `AGENTS.md` and `.cursor/rules/*` point here.
Keep it short: add a rule only after a real, repeated failure.

## Project

<!-- TEMPLATE:project -->

Stack: Next.js 16 (App Router, RSC) · React 19 · TypeScript 7 strict · SCSS Modules on CSS-variable tokens · next-intl · TanStack Query · Zustand (UI only) · Zod · react-hook-form · Biome · Vitest + Testing Library · Playwright + axe · pnpm · Node 24 · Docker.

## Commands

| Task                       | Command                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| Install                    | `pnpm install` (also installs git hooks)                                     |
| Dev server                 | `pnpm dev` → http://localhost:3000 (needs `.env.local`, copy `.env.example`) |
| Lint + format + i18n check | `pnpm check` / fix: `pnpm check:fix`                                         |
| Types                      | `pnpm typecheck`                                                             |
| Unit tests (all)           | `pnpm test` · one file: `pnpm vitest run src/path/file.test.tsx`             |
| E2E (prod build)           | `pnpm e2e` · one project: `pnpm e2e --project=chromium`                      |
| Unused code/deps           | `pnpm knip`                                                                  |
| Everything before PR       | `pnpm verify`                                                                |

Locally run the tests you touched; CI runs the full suite.

## Structure

```
src/app/            routes only: params, metadata, server data fetch → render a view
src/views/          page composition from features + components. No logic, no data hooks, no API calls
src/features/<x>/   domain slice: components, hooks, zod schemas, api calls, tests (barrel: index.ts)
src/components/     shared composite blocks (header, footer, container)
src/ui/             primitives (Button, TextField, ...). No domain knowledge
src/lib/            env, api client, seo, utils
src/i18n/           next-intl config + loadMessages() (swappable text source)
src/providers/      app-wide providers
src/store/          zustand stores, client UI state only
src/server/         server-only code (`import 'server-only'`)
src/styles/         tokens, abstracts (mixins, breakpoints), reset
messages/           UI texts per locale
docs/               architecture, decisions, deploy, recipes, tasks, agents
```

Flow: `app/contact/page.tsx` → `views/ContactView` → `features/contact/ContactForm` + `components/*` + `ui/*`.
Import features through their barrel (`@/features/contact`), never deep paths from outside the feature.

## Invariants

- Every user-facing string comes from `messages/<locale>.json` via `useTranslations`/`getTranslations`. `pnpm check` fails on hardcoded JSX text.
- Every SCSS value comes from a token (`var(--space-4)`, `var(--color-text)`). Missing value → add a semantic token in `src/styles/tokens/` first. No Tailwind, no inline styles, no hex in modules.
- Server state lives in TanStack Query; Zustand holds UI state only; never persist tokens or personal data in client stores.
- `NEXT_PUBLIC_*` = public and inlined at build. Secrets only in server env (`src/lib/env/schema.ts`), validated at server start.
- Validate all external input with Zod at the boundary (route handlers, server actions, API responses via `apiFetch({ schema })`).
- Auth, redirects and `notFound()` are decided before any streamed UI (status codes cannot change after the shell is sent).
- Security headers and CSP live in `next.config.ts`. Loosening them needs owner approval.

## Needs owner approval (ask first)

New dependencies · database schema or migrations · public API/URL changes · auth, payments, personal data flows · security headers/CSP · CI/CD, Docker, deploy scripts · deleting tests or weakening assertions.

## Forbidden without an explicit "yes" for that exact action

Deploying · applying migrations anywhere · using production credentials · real payments · `git push` to `main`, force push, rewriting history · commits, pushes and merges in general (owner says when).

## Code rules

- TypeScript strict + `noUncheckedIndexedAccess`. No `any`, `as`, `!` unless a comment explains why it is safe.
- Explicit return types on exported functions and components.
- Files ≤ 400 lines, functions ≤ 50 lines. Constants instead of magic numbers. Comments explain why, not what.
- Server Components by default; `'use client'` only for state, effects, browser APIs or handlers, as low in the tree as possible.
- `next/link` for internal links, `next/image` for images (LCP image gets `priority`, never lazy).
- Native elements before ARIA. Every interactive element is keyboard reachable with a visible focus ring.

## Styling rules

Details: `.cursor/rules/styling.mdc`. Tokens in `src/styles/tokens`, mixins `bp-up(md)`, `bp-down(lg)`, `focus-ring`, `visually-hidden` are available in every module. Respect `prefers-reduced-motion`. Banned: gradients and gradient text, glow blobs, glassmorphism, eyebrow labels above headings, identical icon-card grids, em dashes in UI copy.

## Testing policy

- Every feature and bugfix ships with tests. Bugfix: first a test that fails on the old behavior.
- Expected values come from requirements, not from the implementation.
- Unit/component: Vitest + Testing Library (`renderWithProviders` from `@/test/render`). Query by role/label, not test ids.
- E2E: Playwright against the production build, Chromium + WebKit, axe in light and dark.
- Never weaken an assertion, add `.skip`, or edit fixtures to make a test pass without saying why.

## Git

- Branches `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. `main` only through a PR with green CI.
- Conventional Commits (`feat: ...`, `fix(scope): ...`), enforced by commitlint. No AI attribution lines.
- Hooks (lefthook): pre-commit Biome + secretlint + i18n; commit-msg commitlint; pre-push typecheck + tests + main guard.

## Done report (end of every task)

1. What changed (files, behavior). 2. Commands actually run and their results. 3. Acceptance cases covered by tests. 4. Known gaps, risks, follow-ups. Never claim "works" without having run the check.

## Handoff to the next agent

When the owner asks for an onboarding prompt, follow `docs/agents/handoff.md`: one ```text block in chat (not a file), facts verified with git first, no secrets.

## Skill map

| When                                | Skill                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| New feature or behavior change      | `/superpowers:brainstorming` → `/superpowers:writing-plans` → `/superpowers:test-driven-development` |
| Bug                                 | `/superpowers:systematic-debugging`                                                                  |
| Before saying "done"                | `/superpowers:verification-before-completion`                                                        |
| Any library API                     | `/context7` (versions change fast; do not code from memory)                                          |
| Next.js / React code                | `/next-best-practices`, `/vercel-react-best-practices`, `/vercel-composition-patterns`               |
| UI design, tokens, polish           | `/impeccable`, `/frontend-design`, `/web-design-guidelines`, `/make-interfaces-feel-better`          |
| E2E tests                           | `/playwright-best-practices`                                                                         |
| Auth, input handling, secrets       | `/security-best-practices`                                                                           |
| Legal pages, consent, personal data | `/legal-kit` (plan mode first, for the target market)                                                |
| Architecture decision               | `/engineering:architecture` (append to `docs/decisions.md`)                                          |
| Unknown task type                   | `/find-skills`                                                                                       |

## Recipes

`docs/recipes/` (database, auth, payments, more locales, editable texts from CMS, analytics consent, PWA, admin UI, Telegram Mini App, strict CSP). Each starts with "verify current API via context7".
