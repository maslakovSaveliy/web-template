# Design: `web-template` + `product-architect` skill

Date: 2026-11-06
Status: approved by owner 2026-11-06. Remote: personal GitHub (`github.com/maslakovSaveliy/web-template`, private), no push without owner's word.

## 1. Intent

The owner (solo dev, many products per year: SaaS, landings, mini-apps, loyalty platforms, games, VPN cabinet) re-builds the same project core every time and repeats the same mistakes. Two artifacts fix that:

1. **`web-template`** — a ready-to-grow Next.js web app repo that encodes the owner's proven conventions, tooling and agent rules, so neither the owner nor future coding agents think about the core again.
2. **`product-architect`** — a Claude skill that takes a _whole product idea_ (not just the web part), asks a few targeted questions, decomposes the product into parts (web, backend, bot, mobile app, admin, infra), picks a stack per part, and either scaffolds repos from registered templates or tells the user exactly how to do it by hand.

Why now: the previous internal template (3 commits) is stale (Next 16.1, Node 20 EOL, `.env` baked into Docker image, pre-commit runs `git add .`, no tests, no CI, Cursor-only rules), and the owner plans more templates (backend, app, bot) later.

## 2. Goals

- Template: `pnpm i && pnpm dev` works; `pnpm verify` runs lint + types + unit + build; CI gates merges; Docker image builds in CI, never on the VPS.
- Template encodes owner conventions (section 5) so agents follow them by default, with enforcement in tools/CI, not only prose.
- Skill: from an idea, produce a product architecture doc + per-part stack decisions grounded in the owner's defaults and wiki decision rules, then scaffold (default) or instruct (manual mode).
- Skill is template-agnostic: new templates (backend, bot, app) plug in via a registry entry, no SKILL.md rewrite.

## 3. Non-goals

- Template is **web only**. No backend server, bot, mobile code inside it. Future templates are separate repos.
- No monorepo/turborepo in the template.
- No jurisdiction-specific legal content baked in (projects are not RU-only). Legal is delegated to `legal-kit` per market.
- No real design/brand. Template ships neutral tokens; brand comes per project (`impeccable` / `frontend-design`).
- The skill does not deploy, apply migrations, push, or create remote repos without explicit owner "yes".

## 4. Anti-goals (fail even if it "works")

- A template so heavy that every project starts by deleting half of it. Abstractions only for problems every project has (wiki: "an abstraction before its problem costs more than it saves").
- AI-slop UI defaults (gradients, glow blobs, glassmorphism, icon-card grids, eyebrow kickers).
- A skill that interrogates for 20 questions or that silently picks a stack the owner never heard about. Every choice is stated in one plain line and can be overridden.
- Rules that live only in CLAUDE.md with nothing enforcing them.

## 5. Constraints and owner conventions (from 42 past projects + wiki)

Language: repo content English only; chat with owner in Russian.

**Default web stack:** Next.js 16 App Router, React 19, TypeScript strict (+`noUncheckedIndexedAccess`), SCSS Modules on CSS-custom-property tokens (**no Tailwind**, no inline styles), Zustand (UI state only), TanStack Query (server state), Zod, react-hook-form, motion, lucide-react, Biome (no ESLint/Prettier), pnpm pinned via `packageManager`, Node 24 LTS.

**Testing:** Vitest + Testing Library (jsdom), Playwright (Chromium + WebKit, mobile viewport, reduced motion), axe-core smoke. Tests are mandatory per feature; locally run touched tests, full suite in CI.

**Git:** Conventional Commits (commitlint), branches `feat/<slug>` / `fix/<slug>`, `main` only via PR, merge only after green CI, no AI attribution, commit/push/merge only on owner's word.

**Styling rules:** every value from a token; missing value → add a semantic token first; breakpoints are mixins (`bp.up/down`); element resets inside `:where()`; one icon library; reveal effects CSS-only (no JS leaving `opacity: 0`); respect `prefers-reduced-motion`.

**Code rules:** no `any`/`as`/`!` without justifying comment; explicit return types on exported functions; files ≤400 lines, functions ≤50; constants instead of magic numbers; comments explain why; no secrets in `NEXT_PUBLIC_*`; no tokens in persisted stores; money as integer minor units/Decimal; webhooks verify signature + idempotency.

**Agent docs layout:** `CLAUDE.md` canonical; `AGENTS.md` imports it; `.cursor/rules/*.mdc` thin scoped mirrors; `docs/decisions.md` (ADR-lite D-001…), `docs/architecture.md`, `docs/tasks/`, `docs/superpowers/{specs,plans}`; skill-map table in CLAUDE.md; one main implementing agent, subagent only as fresh-context reviewer for risky work.

**Deploy pattern:** `output: 'standalone'`, multi-stage Dockerfile, non-root, image built in CI and pushed to a registry tagged by commit sha (never `latest`), `:previous` tag for rollback, manual deploy trigger with readiness gate on `/api/health`, cheap VPS + Caddy/nginx; Vercel only for throwaway previews.

**Pain points the template must prevent:** missing/invalid env shipped to prod; committed secrets; CI merged while red or not actually running tests; Next build OOM on VPS; flaky WebKit e2e from infinite animations; GitHub Actions minutes burnt; legal pages added last; AI-slop design.

**Supply chain (OWASP 2025 A03):** small dependency tree, pnpm `onlyBuiltDependencies` allowlist, `minimumReleaseAge` delay on new versions, lockfile frozen in CI.

## 6. Artifact 1 — `web-template`

Location: `~/DEV/web-template` (this repo). Successor of the previous internal Next.js template.

### 6.1 Versions (verified against npm on 2026-11-06)

next 16.4.5, react/react-dom 19.3.1, typescript 7.0.2 (fallback 6.x if `next build`/editor tooling breaks — decided during implementation by running the build), @biomejs/biome 2.6.5, @tanstack/react-query 5.106, zustand 5.0, zod 4.6, react-hook-form 7.91 + @hookform/resolvers 7, motion 14.9, lucide-react 1.69, next-themes 0.4.6, sass 1.107, vitest 5.1, @testing-library/react 16.3, jsdom 31, @playwright/test 1.64, @axe-core/playwright 4.14, lefthook 2.2, @commitlint/cli 21, secretlint, knip 6. Node 24 LTS. pnpm pinned via `packageManager`.

### 6.2 Structure

```
src/
  app/              routes, layouts, route handlers (api/health), error/not-found/loading, sitemap, robots, manifest, opengraph-image
  views/            page composition only (no logic)
  i18n/             next-intl config, request config, loadMessages()
  features/<domain>/ feature slices (components, hooks, api, schemas, tests) — one example feature
  components/       shared composite components (layout: Header, Footer, Container)
  ui/               primitives (Button, TextField, VisuallyHidden, Spinner) with tests + a11y
  hooks/            shared hooks
  lib/              env (zod-validated), api client (typed fetch), seo (createPageMetadata, JSON-LD), utils
  providers/        AppProviders (Query, Theme)
  store/            zustand stores (UI only)
  server/           server-only code (`import 'server-only'`)
  styles/           tokens (_palette, _themes, _space, _radius, _fonts, _motion, _z), mixins, breakpoints, reset, global
  types/
  test/             vitest setup, render helpers
e2e/                Playwright specs (smoke + a11y)
docs/               architecture.md, decisions.md, tasks/_template.md, recipes/*.md, superpowers/{specs,plans}
scripts/            init.mjs (template → project), verify helpers
.github/workflows/  ci.yml, release.yml, deploy.yml
.gitlab-ci.yml      equivalent pipeline (deleted by init when unused)
.claude/settings.json  project permissions (allow pnpm scripts; deny force-push, rm -rf, prod commands)
```

### 6.3 Behavior

- **Env:** `src/lib/env.ts` — zod schemas split server/client; build fails on invalid env; `.env.example` documents every var; `NEXT_PUBLIC_*` only for public values.
- **Data layer is backend-agnostic:** typed `fetch` wrapper (no axios) with error types + TanStack Query hooks pattern. Concrete backends (Supabase, Drizzle+Postgres in route handlers, NestJS/OpenAPI client) are **recipes**, not core.
- **SEO:** `createPageMetadata()` per route, canonical, `noindex` for private pages, sitemap/robots/manifest/OG image, JSON-LD helper.
- **Security:** security headers incl. baseline CSP, HSTS, `poweredByHeader: false`; `server-only` boundary; health endpoint exposes nothing sensitive.
- **Design system:** neutral tokens (palette → semantic themes light/dark via `next-themes`), motion tokens, z-index tokens, `:where()` reset, focus-visible, reduced motion. Banned-patterns list in rules. Starter home page is a plain, honest placeholder — not a marketing hero.
- **Tooling scripts:** `dev`, `build`, `start`, `check`, `check:fix`, `typecheck`, `test`, `test:watch`, `e2e`, `knip`, `verify` (= check + typecheck + test + build).
- **Hooks (lefthook):** pre-commit → biome on staged files + secretlint (no `git add .`); commit-msg → commitlint; pre-push → typecheck + unit tests + block direct push to `main`.
- **CI (GitHub Actions):** `ci.yml` on PR/push: install (frozen, cached), check, typecheck, test, build (cache `.next/cache`), e2e on PR only; concurrency cancel; path filters for docs-only changes. `release.yml` after CI green on `main`: build image, push `ghcr.io/<owner>/<repo>:<sha>`. `deploy.yml` manual `workflow_dispatch`: SSH, pull sha, retag current as `:previous`, `docker compose up -d`, readiness gate on `/api/health`, auto-rollback on failure.
- **Docker:** standalone output, `node:24-alpine`, non-root, `HEALTHCHECK`, no `.env` in image (runtime `env_file`), `docker-compose.yml` for prod (image by sha, localhost port, optional Loki logging via commented block).
- **Init script:** `pnpm template:init --name <slug> --title "<Title>" --url <https://...> [--ci github|gitlab] [--keep-recipes a,b]` replaces placeholders (package name, metadata, compose names, README), drops unused CI file and unused recipes, writes a fresh README and D-001 in decisions, deletes itself. Idempotent; refuses to run on a dirty tree unless `--force`.

### 6.4 Recipes (`docs/recipes/`, applied by agent on demand)

supabase (self-hosted or cloud, `@supabase/ssr`, RLS rules), postgres-drizzle (route handlers + Drizzle + migrations rules: write SQL, never apply without owner), api-client-openapi (typed client from a NestJS backend's `openapi.json`), auth (options matrix; delegated to backend/BaaS), payments (provider-agnostic: checkout route, webhook route with signature + idempotency + ledger; provider notes: Stripe, LemonSqueezy, YooKassa/T-Bank chosen by market), i18n-multi-locale, remote-messages, postgres-prisma, api-client (axios), analytics-consent (consent store + gated loaders; PostHog/Metrika/GA notes), pwa-push, admin-ui (Mantine for tables), telegram-mini-app (web part only: initData validation on server, SDK).

Each recipe: when to use, packages, files to add, env vars, rules to append to CLAUDE.md, tests to add.

### 6.5 Agent docs in template

- `CLAUDE.md`: project summary placeholder, real commands, structure, invariants, "needs owner approval" list (deps, schema/migrations, public API, security controls, CI), "forbidden" list (deploys, prod credentials, applying migrations, real payments, force push), done-report format (commands run + results, acceptance coverage, gaps), testing policy, git rules, styling/code rules (short, link to `.cursor/rules`), skill map table (brainstorming, writing-plans, TDD, systematic-debugging, verification-before-completion, context7, next-best-practices, vercel-react-best-practices, vercel-composition-patterns, security-best-practices, impeccable, web-design-guidelines, frontend-design, make-interfaces-feel-better, playwright-best-practices, legal-kit, caveman).
- `AGENTS.md`: `@CLAUDE.md` import + one-line note.
- `.cursor/rules/`: `styling.mdc`, `react-next.mdc`, `testing.mdc` — scoped, short, pointing to CLAUDE.md.

## 7. Artifact 2 — `product-architect` skill

Location: `~/DEV/SKILLS/product-architect` (own git repo). Installed by symlink into `~/.agents/skills/product-architect` (+ `~/.claude/skills` link, matching how other skills are installed) — only after owner OK.

### 7.1 Files

```
SKILL.md                     workflow, ≤ ~300 lines, triggers in description
references/
  intake-questions.md        question bank; ask ≤5, one at a time, skip what the idea already answers
  decision-rules.md          rendering (SSR/MPA vs SPA — session-length rule), monolith-first, BaaS vs custom backend, DB/ORM, auth, realtime/local-first, queues, caching, hosting by cost/jurisdiction, mobile choice (Expo / Capacitor / Flutter / native), bots (grammY), admin (Mantine)
  owner-defaults.md          default stack per part, with "deviate when" notes, from past projects
  markets.md                 jurisdiction → legal-kit invocation + stack-affecting constraints (e.g. RU: PD localization, login methods, local payments; EU: GDPR; US) — loaded only when market applies
  output-templates.md        product architecture doc + ADR format + handoff prompt
templates/registry.json      registered templates: id, part kind, source (git url + local path), init command, provides, recipes
scripts/scaffold.mjs         deterministic: clone template → strip git → run init → git init → first commit (only with owner OK)
evals/                       scenario prompts + expected decisions for regression checks
README.md
```

### 7.2 Workflow

1. **Intake:** restate idea in 3 lines; ask up to ~5 questions only where the answer changes the stack: audience + market/jurisdiction, platforms (web / TG / mobile / desktop), money (payments, subscriptions, which provider region), data sensitivity + auth needs, scale/realtime, hosting budget, deadline/team. "Just pick" → defaults stated aloud.
2. **Decompose** product into parts with responsibilities and boundaries (monolith-first; separate backend only when justified).
3. **Decide stack per part** using decision rules + owner defaults; each choice one line with reason and the alternative rejected.
4. **Match templates** from registry; parts without a template get "build from defaults" with the exact create command and rules to copy.
5. **Write** `docs/product/architecture.md` + `docs/decisions.md` (ADR-lite) in a product root folder; show summary; wait for owner approval.
6. **Scaffold** (default) via `scripts/scaffold.mjs` per part, or **manual mode**: numbered click-by-click/command-by-command instructions.
7. **Handoff:** list next skills per part (legal-kit plan mode for the chosen market, impeccable/frontend-design for brand, brainstorming → writing-plans for first feature), and a ready onboarding prompt in chat.

Never: push, create remote repos, deploy, buy anything, or apply migrations without explicit owner "yes".

## 8. Verification

- Template: `pnpm install` (frozen), `pnpm verify`, `pnpm e2e` (Chromium + WebKit), `docker build`, `pnpm template:init` dry run on a copy, `knip` clean, lefthook hooks fire. Fresh-context review of security/config.
- Skill: structure validation (skill-creator conventions), 3 eval scenarios run by a subagent (e.g. "landing for a coffee shop", "SaaS with subscriptions for EU", "TG mini-app loyalty for RU bars") checked against expected decisions; scaffold script run against the local template in a temp dir.

## 9. Decided by owner

- Template is web-only; other templates later as separate repos. Payments may live in web.
- Skill covers the whole product and can use this and future templates.
- Skill scaffolds itself by default; manual-instructions mode if user wants to do it themselves.
- Skill is its own repo and its own directory in `~/DEV`.
- No RU-specific defaults; repo content English only.

## 10. Builder's calls (owner to check)

- C1: Supabase removed from core → recipe. Preferred backend data: Postgres + Prisma or Drizzle (recipes). Core client stack: TanStack Query + Zod + typed `fetch`; axios optional (recipe). _(owner confirmed)_
- C2: axios dropped for a typed `fetch` wrapper.
- C3: lefthook over husky (newer projects used lefthook; no `git add .`).
- C4: GitHub Actions primary + `.gitlab-ci.yml` alternative, init deletes the unused one.
- C5: **both** `views/` and `features/` _(owner decided)_: `app/**/page.tsx` thin (params, metadata, server fetch) → `views/<Name>View` composes only → `features/<domain>/` holds logic; `components/` shared blocks, `ui/` primitives.
- C6: Node 24 LTS; TypeScript 7 unless the build proves it unusable.
- C7: skill name `product-architect`, path `~/DEV/SKILLS/product-architect`.
- C8: **i18n in core** _(owner decided)_: next-intl without routing, single locale, no prefix; all UI strings in `messages/<locale>.json`; one swappable message source `loadMessages(locale)` (local JSON by default, CMS/DB via recipe) for editable texts; multi-locale is a recipe.
- C15: onboarding/handoff rules for the next agent live in `docs/agents/handoff.md` + CLAUDE.md section (owner's standard).
- C9: **Git host / branch protection.** Personal projects use private GitHub repos on the Free plan (no server-side branch protection), so `main` is protected by the lefthook pre-push guard + CI required in the PR checklist; GitHub Actions on hosted runners → minutes budget matters (concurrency cancel, path filters, e2e only on PR, cache). `.gitlab-ci.yml` covers CI + release (GitLab registry); deploy job is a manual stub.
- C10: **Env model.** `NEXT_PUBLIC_*` validated at build (they are inlined); server env validated at server start via `instrumentation.ts`, not at build — CI never needs prod secrets. One image per target environment (default: single `production`); release workflow passes public vars as build args from CI variables. Staging = same workflow with a different environment.
- C11: **Deploy target.** One VPS per project by default: compose binds `127.0.0.1:<PORT>`, reverse proxy (Caddy) is a documented snippet in `docs/deploy.md`, not shipped config; remote path, host, user, registry login come from CI secrets/vars; Loki logging block present but commented.
- C12: **Product root layout** (skill), matching the owner's recent multi-part products: `~/DEV/<product-slug>/` is a docs-only git repo (`docs/product/architecture.md`, `docs/decisions.md`, `CLAUDE.md` with cross-repo map, `.gitignore` listing sub-repos); each part is its own git repo inside it (`web/`, `backend/`, `bot/`, `app/`, `admin/`). Location asked once, default `~/DEV/<slug>`.
- C13: **Agent portability.** SKILL.md is tool-agnostic (plain questions, plain shell); Claude-only affordances (AskUserQuestion, subagents, Skill handoffs) are "if available" notes, because skills in `~/.agents/skills` are also read by Cursor/Codex.
- C14: **Recipes v1** are prose + minimal snippets with an explicit "verify current API via context7 before applying" step; no recipe code is executed in the template's own tests.

## 11. Sources

- Owner patterns: Claude Code transcripts of the owner's past projects (SaaS, bots, mini-apps, loyalty platforms, games, desktop), summarized during brainstorming 2026-11-06.
- Wiki (`~/wiki/topics/`): `modern-web-app-development` (AI coding workflow 2026-10-26, architecture hub, client JS budget/Russell rule, RSC, security OWASP 2025, CWV, a11y, toolchain 2026), `ru-digital-products-law` (used only via `markets.md` → legal-kit), `tools-catalog`.
- Previous internal Next.js template (3 commits), reviewed 2026-11-06.
