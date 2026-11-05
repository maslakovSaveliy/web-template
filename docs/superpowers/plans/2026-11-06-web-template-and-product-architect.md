# web-template + product-architect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `web-template` Next.js repo (`~/DEV/web-template`) and the `product-architect` skill repo (`~/DEV/SKILLS/product-architect`) described in the spec.

**Architecture:** Part A is a single Next.js 16 App Router app with neutral SCSS tokens, backend-agnostic data layer, full quality tooling, CI/CD and agent docs, plus an `init` script that turns the template into a project. Part B is a tool-agnostic skill (SKILL.md + references + template registry + zero-dependency scaffold script) that decomposes a product idea and scaffolds parts from registered templates.

**Tech Stack:** Next 16.4.5, React 19.3.1, TypeScript 7.0.2 (fallback 6.x), SCSS Modules, TanStack Query 5, Zustand 5, Zod 4, RHF 7, motion 14, lucide-react 1, Biome 2.6, Vitest 5 + RTL + jsdom, Playwright 1.64 + axe, lefthook 2, commitlint 21, secretlint, knip 6, Docker (node:24-alpine), GitHub Actions + GHCR. Skill: Markdown + Node 24 ESM script.

> **Rev. 2 (2026-11-06):** owner feedback applied — i18n core (next-intl, single locale), views/+features/ combined, Postgres+Prisma/Drizzle recipes, handoff rules. Task order/numbering as in `~/.claude/plans/reply-6-melodic-cupcake.md` (A1–A12, B1–B5).

**Spec:** `docs/superpowers/specs/2026-11-06-web-template-and-product-architect-design.md`

## Global Constraints

- Repo content English only. No RU-specific legal defaults anywhere in Part A.
- Node 24 LTS (`.nvmrc` = `24`), `packageManager: pnpm@<installed 12.x>`, `engines.node >=24`.
- No Tailwind, no inline styles, no ESLint/Prettier, no axios, no Supabase in core.
- Every SCSS value comes from a token; resets wrapped in `:where()`; `prefers-reduced-motion` respected.
- TypeScript: `strict`, `noUncheckedIndexedAccess`; no `any`/`as`/`!` without justifying comment; explicit return types on exports; files ≤400 lines, functions ≤50.
- No secrets in `NEXT_PUBLIC_*`; Docker image contains no `.env`.
- Images tagged by commit sha, never `latest`; Next never built on the VPS.
- Placeholders live in one file: `src/config/site.ts` (+ `package.json` name, `docker-compose.yml` service/container names, README title).
- Commits are local only; nothing is pushed, no remote is created, no global install/symlink without owner's explicit yes.
- Banned UI patterns: gradients, gradient text, glow blobs, glassmorphism, eyebrow kickers, identical icon-card grids, em dashes in UI copy.

## Review Focus

1. Missing/invalid public env at build, or missing server env at server start → fails fast with a message naming the variable (not an opaque crash). Tests in Task A3.
2. API client on non-JSON error body, empty 204 body, network failure, schema mismatch → typed `ApiError`, never an uncaught JSON parse error. Tests in Task A3.
3. JSON-LD containing `</script>` or `<!--` → escaped, no HTML injection. Test in Task A3.
4. `init` run twice, on a dirty tree, or with a non-slug name (`My App`) → refuses or normalizes; never half-applies. Tests in Task A9.
5. Dark theme + WebKit + reduced motion: no axe violations, no stuck animations, `/api/health` never cached (`cache-control: no-store`). Tests in Tasks A5/A6.

---

## Part A — web-template (`~/DEV/web-template`)

### Task A1: Repo scaffold, toolchain, TypeScript decision

**Files:**

- Create: `package.json`, `pnpm-workspace.yaml` (pnpm settings only: `onlyBuiltDependencies`, `minimumReleaseAge: 1440`), `.npmrc` (`engine-strict=true`), `.nvmrc`, `tsconfig.json`, `biome.json`, `next.config.ts`, `.gitignore`, `.editorconfig`, `src/app/layout.tsx`, `src/app/page.tsx` (temporary)
- Keep: `docs/superpowers/**`

**Interfaces:**

- Produces: scripts `dev` (port 3000), `build`, `start`, `check`, `check:fix`, `typecheck` (`tsc --noEmit`), `test`, `test:watch`, `e2e`, `knip`, `verify` (`pnpm check && pnpm typecheck && pnpm test && pnpm build`), `template:init`. Path alias `@/*` → `src/*`.

- [ ] **Step 1:** `git init -b main`; write files. Dependencies at spec §6.1 versions (exact for next/react/react-dom/typescript, caret elsewhere). `next.config.ts`: `output: 'standalone'`, `poweredByHeader: false`, `typedRoutes: true`, `reactStrictMode: true`, `sassOptions.loadPaths=['src']` + `additionalData: '@use "styles/abstracts" as *;'`, `images.formats ['image/avif','image/webp']`, security headers incl. static CSP (`default-src 'self'; script-src 'self' 'unsafe-inline'` (+`'unsafe-eval'` in dev); `style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`), HSTS, nosniff, Referrer-Policy, Permissions-Policy (camera/mic/geolocation off). Biome: `recommended: true` + `noExplicitAny: error`, `noNonNullAssertion: error`, `noConsole: warn` (allow error/warn), `useImportType`, `noUnusedImports/Variables: error`, organize imports on; formatter 2 spaces, width 100, single quotes, semicolons, trailing commas `all`.
- [ ] **Step 2:** `pnpm install` → succeeds; `pnpm typecheck` and `pnpm build` on a one-line page → PASS with TS 7. If TS 7 fails in build or Biome/Vitest, pin `typescript@6` and record why in `docs/decisions.md` (D-002).
- [ ] **Step 3:** `pnpm check` → no errors.
- [ ] **Step 4:** Commit `chore: scaffold next 16 template toolchain`.

### Task A2: Design tokens and global styles

**Files:**

- Create: `src/styles/tokens/{_palette,_themes,_space,_radius,_typography,_motion,_z,_shadow}.scss`, `src/styles/abstracts/{_index,_breakpoints,_mixins}.scss`, `src/styles/{_reset,_base,globals}.scss`
- Delete: nothing (fresh repo)

**Interfaces:**

- Produces: CSS vars `--color-{bg,bg-subtle,surface,text,text-muted,border,accent,accent-contrast,danger,success,warning,focus}`, `--space-{0,1,2,3,4,5,6,8,10,12,16,20,24}` (4px scale), `--radius-{sm,md,lg,full}`, `--font-{body,display,mono}`, `--text-{xs,sm,md,lg,xl,2xl,3xl,4xl}` + line-heights, `--duration-{fast,normal,slow}`, `--ease-{standard,emphasized}`, `--z-{base,dropdown,sticky,overlay,modal,toast}`, `--shadow-{sm,md,lg}`. Dark theme under `[data-theme='dark']`. Mixins: `bp.up($name)`, `bp.down($name)` for `sm 480, md 768, lg 1024, xl 1280, 2xl 1536`; `focus-ring`, `visually-hidden`, `reset-button`, `truncate`, `line-clamp($n)`. Global: `@media (prefers-reduced-motion: reduce)` sets durations to `0.01ms`.

- [ ] **Step 1:** Write files; neutral palette (greys + one muted accent, no gradients); `_reset.scss` element rules wrapped in `:where()`.
- [ ] **Step 2:** `pnpm build` → PASS (SCSS compiles, `additionalData` resolves).
- [ ] **Step 3:** Commit `feat: add neutral scss design tokens`.

### Task A3: Core lib — env, api client, seo, site config (TDD)

**Files:**

- Create: `vitest.config.ts` (jsdom, `src/test/setup.ts`, include `src/**/*.test.{ts,tsx}`, coverage v8), `src/test/{setup.ts,render.tsx}`
- Create: `src/config/site.ts`, `src/lib/env/{client.ts,server.ts,schema.ts}`, `src/lib/api/{client.ts,errors.ts,index.ts}`, `src/lib/seo/{metadata.ts,json-ld.tsx,index.ts}`, `src/lib/utils/cn.ts`
- Test: `src/lib/env/env.test.ts`, `src/lib/api/client.test.ts`, `src/lib/seo/seo.test.tsx`

**Interfaces:**

- `siteConfig: { name: string; shortName: string; description: string; url: string; locale: string; themeColor: string }` (url from `clientEnv.NEXT_PUBLIC_SITE_URL`).
- `parseClientEnv(source: Record<string, string | undefined>): ClientEnv`, `clientEnv: ClientEnv` (`NEXT_PUBLIC_SITE_URL: url`, `NEXT_PUBLIC_API_URL: url | '/'` default `'/'`).
- `parseServerEnv(source): ServerEnv`, `getServerEnv(): ServerEnv` (memoized; `NODE_ENV`, `APP_PORT` default 3000; `import 'server-only'` in `server.ts`). Errors: `EnvValidationError` listing every invalid key.
- `class ApiError extends Error { status: number; code: 'network' | 'http' | 'parse' | 'validation'; details?: unknown }`.
- `apiFetch<T>(path: string, options?: { method?; body?: unknown; headers?; schema?: ZodType<T>; signal?; baseUrl?: string }): Promise<T>` — JSON body encode, 204 → `undefined`, non-2xx → `ApiError('http')` with parsed body if JSON else text.
- `createPageMetadata(input: { title?: string; description?: string; path: string; image?: string; noIndex?: boolean }): Metadata`.
- `<JsonLd data={object} />` server component; `serializeJsonLd(data: unknown): string` escapes `<`, `>`, `&`, U+2028/2029.
- `cn(...inputs: ClassValue[]): string` (clsx).

- [ ] **Step 1:** Write failing tests:
  - env: valid source parses; missing `NEXT_PUBLIC_SITE_URL` throws `EnvValidationError` whose message contains `NEXT_PUBLIC_SITE_URL`; two bad keys → both named.
  - api: 200 JSON returns data; 204 returns `undefined`; 500 with text body → `ApiError{status:500, code:'http', details:'boom'}`; `fetch` rejects → `code:'network'`; invalid JSON on 200 → `code:'parse'`; schema mismatch → `code:'validation'`; body object sent as JSON with `content-type: application/json`.
  - seo: `createPageMetadata({path:'/about', title:'About'})` → `alternates.canonical === '/about'`, `openGraph.url === '/about'`; `noIndex:true` → `robots.index === false`; `serializeJsonLd({x:'</script><!--'})` contains no `</script>` and no `<!--`.
- [ ] **Step 2:** `pnpm test` → FAIL (modules missing).
- [ ] **Step 3:** Implement the interfaces above.
- [ ] **Step 4:** `pnpm test` → PASS; `pnpm typecheck` → PASS.
- [ ] **Step 5:** Commit `feat: add env validation, api client and seo helpers`.

### Task A4: UI primitives (TDD)

**Files:**

- Create: `src/ui/{Button,TextField,Spinner,VisuallyHidden}/{X.tsx,X.module.scss,X.test.tsx,index.ts}`, `src/ui/index.ts`

**Interfaces:**

- `Button(props: ButtonHTMLAttributes & { variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'|'lg'; isLoading?: boolean; asChild?: never })` — default `type="button"`, `isLoading` → `disabled` + `aria-busy` + Spinner.
- `TextField(props: InputHTMLAttributes & { label: string; hint?: string; error?: string })` — forwards ref (React 19 `ref` prop), `useId` links label/hint/error via `aria-describedby`, `aria-invalid` when error.
- `Spinner({ label?: string = 'Loading' })` role `status`. `VisuallyHidden({ children })`.

- [ ] **Step 1:** Failing tests: Button default type is `button`; loading → disabled + `aria-busy="true"` + status role present; TextField label is accessible name (`getByLabelText`); error text is in `aria-describedby` and `aria-invalid="true"`.
- [ ] **Step 2:** `pnpm test src/ui` → FAIL. **Step 3:** implement with tokens only. **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: add accessible ui primitives`.

### Task A5: App shell, example feature, health endpoint

**Files:**

- Create: `src/providers/{AppProviders.tsx,QueryProvider.tsx,ThemeProvider.tsx,index.ts}`, `src/components/{SiteHeader,SiteFooter,Container}/…`, `src/components/ThemeToggle/…`, `src/store/ui-store.ts`
- Create: `src/app/{layout.tsx,page.tsx,page.module.scss,loading.tsx,error.tsx,global-error.tsx,not-found.tsx,sitemap.ts,robots.ts,manifest.ts,opengraph-image.tsx,icon.svg}`, `src/app/api/health/route.ts`, `src/instrumentation.ts`
- Create: `src/features/contact/{schema.ts,ContactForm.tsx,ContactForm.module.scss,use-send-contact.ts,ContactForm.test.tsx}`, `src/app/api/contact/route.ts`, `src/app/api/contact/route.test.ts`
- Create: `.env.example`

**Interfaces:**

- `GET /api/health` → `200 {status:'ok', uptime:number}` with `cache-control: no-store`, `export const dynamic = 'force-dynamic'`.
- `instrumentation.ts` `register()` calls `getServerEnv()` when `NEXT_RUNTIME === 'nodejs'`.
- `contactSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.email(), message: z.string().trim().min(10).max(2000) })`; `POST /api/contact` → 400 `{error:'validation', issues}` on bad body, 200 `{ok:true}` otherwise (no persistence; TODO pointer to recipes).
- `useUiStore`: `{ isNavOpen: boolean; setNavOpen(v: boolean): void }` (not persisted).
- `ThemeProvider` = next-themes with `attribute="data-theme"`, `defaultTheme="system"`.

- [ ] **Step 1:** Failing tests: contact route returns 400 with `error:'validation'` for `{email:'x'}` and 200 for a valid body; ContactForm shows field errors on empty submit and calls mutation with parsed values (mock `fetch`).
- [ ] **Step 2:** FAIL. **Step 3:** implement; home page = plain project placeholder (name, one sentence, links to docs), no hero clichés. **Step 4:** PASS.
- [ ] **Step 5:** `pnpm build` → PASS; `pnpm start` + `curl -i localhost:3000/api/health` → 200, `cache-control: no-store`.
- [ ] **Step 6:** Commit `feat: add app shell, contact example and health endpoint`.

### Task A6: E2E and accessibility

**Files:**

- Create: `playwright.config.ts` (projects `chromium`, `webkit`, `mobile-webkit` (iPhone 15); `use.reducedMotion: 'reduce'`, `webServer: pnpm build && pnpm start` on 3000 in CI / `pnpm dev` locally, `retries: CI ? 2 : 0`), `e2e/smoke.spec.ts`, `e2e/a11y.spec.ts`

- [ ] **Step 1:** Specs: home has `<html lang>`, title from `siteConfig`, one `h1`; unknown route renders 404 page with status 404; `/api/health` 200; contact form shows validation error then success message; axe (`wcag2a, wcag2aa, wcag21aa, wcag22aa`) zero violations on `/` in light and dark (`page.emulateMedia({colorScheme:'dark'})`) and on 404.
- [ ] **Step 2:** `pnpm exec playwright install chromium webkit` then `pnpm e2e` → PASS on all projects.
- [ ] **Step 3:** Commit `test: add playwright smoke and axe checks`.

### Task A7: Git hooks and repo hygiene

**Files:**

- Create: `lefthook.yml`, `commitlint.config.mjs`, `.secretlintrc.json`, `knip.json`, `scripts/guard-main-push.sh`

**Interfaces:**

- pre-commit (parallel): `biome check --write --no-errors-on-unmatched {staged_files}` with `stage_fixed: true`; `secretlint {staged_files}`. commit-msg: `commitlint --edit {1}`. pre-push: `scripts/guard-main-push.sh` (exit 1 when pushing `refs/heads/main`, override `ALLOW_MAIN_PUSH=1`), `pnpm typecheck`, `pnpm test`.

- [ ] **Step 1:** Write files; `pnpm exec lefthook install`.
- [ ] **Step 2:** Verify: staged file with fake `AKIA…` key → commit blocked; message `bad message` → blocked; `feat: x` → accepted. `pnpm knip` → no unused files/deps (configure entries for Next/Vitest/Playwright).
- [ ] **Step 3:** Commit `chore: add lefthook, commitlint, secretlint and knip`.

### Task A8: Docker, compose, CI/CD

**Files:**

- Create: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/{ci.yml,release.yml,deploy.yml}`, `.github/pull_request_template.md`, `.gitlab-ci.yml`, `docs/deploy.md`

**Interfaces:**

- Dockerfile stages `deps` → `build` → `runner` (`node:24-alpine`, `corepack enable`, `pnpm install --frozen-lockfile`, build args `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`; runner copies `.next/standalone`, `.next/static`, `public`; `USER node`; `HEALTHCHECK` via `wget -qO- localhost:3000/api/health`; `CMD ["node","server.js"]`).
- compose service `web`: `image: ${IMAGE}:${TAG}`, `env_file: .env`, `ports: ["127.0.0.1:${APP_PORT:-3000}:3000"]`, `restart: unless-stopped`, healthcheck; Loki logging block commented.
- ci.yml: triggers PR + push to main, `paths-ignore: ['**.md','docs/**']`, `concurrency: ci-${{ github.ref }}` cancel-in-progress; job `verify` (setup node from `.nvmrc`, pnpm cache, `.next/cache` cache, `pnpm check`, `typecheck`, `test`, `build`); job `e2e` only on `pull_request` (chromium + webkit).
- release.yml: `workflow_run` of CI on main with `conclusion == success` → build & push `ghcr.io/${{ github.repository }}:${{ sha }}`, `permissions: packages: write`, build args from `vars.*`.
- deploy.yml: `workflow_dispatch` input `sha` (default latest main sha), environment `production`; SSH (`secrets.DEPLOY_HOST/USER/KEY`, `vars.DEPLOY_PATH`): login GHCR, retag current `:previous`, `TAG=<sha> docker compose up -d`, poll `/api/health` 30×2s, on failure redeploy `:previous` and fail.
- `.gitlab-ci.yml`: stages `verify` (same commands), `release` (build/push to `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA` on default branch), `deploy` (manual stub with the same script).

- [ ] **Step 1:** Write files. **Step 2:** `docker build --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 -t web-template:test .` → success; `docker run -d -p 3100:3000 web-template:test` → `/api/health` 200; `docker image inspect` shows no `.env` in `/app`.
- [ ] **Step 3:** Validate workflows with `actionlint` if installed (`brew list actionlint`), else YAML parse via `node -e` + manual review.
- [ ] **Step 4:** Commit `ci: add docker image, github actions and gitlab pipeline`.

### Task A9: `template:init` script (TDD)

**Files:**

- Create: `scripts/init/{index.mjs,transform.mjs,transform.test.mjs}` (Node built-ins only), `package.json` script `"template:init": "node scripts/init/index.mjs"`

**Interfaces:**

- CLI: `--name <slug>` (required; normalized `My App` → `my-app`, rejects empty/invalid), `--title <string>`, `--url <https url>`, `--description <string>`, `--ci github|gitlab` (default github), `--keep-recipes a,b|all|none` (default all), `--dry-run`, `--force`.
- `transform.mjs` pure functions: `normalizeSlug(input: string): string`, `applySiteConfig(source: string, values: SiteValues): string`, `applyPackageName(json: string, slug: string): string`, `applyCompose(source: string, slug: string): string`, `planInit(options): InitPlan` (`{ writes: {path, content}[], deletes: string[] }`).
- Behavior: refuses if `git status --porcelain` non-empty unless `--force`; refuses if `.template-initialized` marker exists (second run); applies plan; writes fresh `README.md` (project title + commands) and `docs/decisions.md` D-001 "Project created from web-template@<sha>"; deletes unused CI file, unkept `docs/recipes/*`, `scripts/init/`, removes `template:init` script; writes marker; prints next steps (legal-kit for market, impeccable for brand).

- [ ] **Step 1:** Failing tests (`node --test scripts/init`): slug normalization (`'My App'→'my-app'`, `''` throws, `'../x'` throws); `applySiteConfig` replaces name/title/url/description only; `planInit({ci:'gitlab'})` deletes `.github/workflows/*` and keeps `.gitlab-ci.yml`; `keepRecipes:['payments']` deletes every other recipe.
- [ ] **Step 2:** FAIL. **Step 3:** implement. **Step 4:** PASS. Add `node --test scripts` to `pnpm test` chain (`test` = `vitest run && node --test scripts`).
- [ ] **Step 5:** Smoke: `git clone . /tmp-scratch/demo && cd demo && pnpm i && pnpm template:init --name demo --title Demo --url https://demo.example --ci github --keep-recipes payments && pnpm verify` → PASS; second run → refuses.
- [ ] **Step 6:** Commit `feat: add template init script`.

### Task A10: Agent docs, recipes, README

**Files:**

- Create: `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/{styling.mdc,react-next.mdc,testing.mdc}`, `.claude/settings.json`, `docs/{architecture.md,decisions.md,deploy.md(exists),tasks/_template.md}`, `docs/recipes/{supabase,postgres-drizzle,api-client-openapi,auth,payments,i18n,analytics-consent,pwa-push,admin-ui,telegram-mini-app}.md`, `README.md`

**Interfaces:**

- CLAUDE.md sections (in order): Project, Commands (exact scripts), Structure, Invariants, Needs owner approval, Forbidden, Code rules, Styling rules, Testing policy, Git rules, Done report format, Skill map table, Recipes index. ≤ ~200 lines.
- `.claude/settings.json`: `permissions.allow` pnpm scripts + read-only git; `permissions.deny`: `git push --force*`, `git push * main`, `rm -rf /*`, `docker compose * down -v`, `* --prod*` deploy scripts. No hooks that call network.
- Each recipe: When to use / Verify first (context7 libs) / Packages / Files / Env vars / Rules to append to CLAUDE.md / Tests to add / Pitfalls.
- `payments.md`: provider-agnostic checkout + webhook route (raw body signature check, idempotency key table, append-only ledger, integer minor units), provider notes Stripe / LemonSqueezy / Paddle / YooKassa / T-Bank and "market decides" pointer to product-architect `markets.md`.

- [ ] **Step 1:** Write docs (use skills: engineering:documentation for structure, security-best-practices for invariants, next-best-practices + vercel-react-best-practices for rules).
- [ ] **Step 2:** Verify every command named in CLAUDE.md exists in `package.json` (`node -e` script check) and every recipe has all 8 headings (grep).
- [ ] **Step 3:** Commit `docs: add agent rules, architecture, decisions and recipes`.

### Task A11: Full verification and fresh review

- [ ] **Step 1:** `pnpm install --frozen-lockfile && pnpm verify && pnpm e2e && pnpm knip` → all PASS; record output.
- [ ] **Step 2:** Fresh-context reviewer (read-only, base = first commit, target = HEAD): security/config/CI review with severity, file:line, failure scenario. Fix confirmed findings, re-run Step 1.
- [ ] **Step 3:** Commit fixes `fix: address template review findings`.

---

## Part B — product-architect skill (`~/DEV/SKILLS/product-architect`)

### Task B1: Registry and scaffold script (TDD)

**Files:**

- Create: `templates/registry.json`, `scripts/scaffold.mjs`, `scripts/lib/{registry.mjs,plan.mjs}`, `scripts/lib/plan.test.mjs`, `package.json` (`type: module`, `test: node --test scripts`, no deps), `.gitignore`

**Interfaces:**

- registry entry: `{ id: 'web-next', part: 'web', name, description, source: { git: 'https://github.com/maslakovSaveliy/web-template.git', local: '~/DEV/web-template' }, init: 'pnpm install && pnpm template:init --name {slug} --title "{title}" --url {url} --ci {ci} --keep-recipes {recipes}', provides: string[], recipes: string[], status: 'stable' }`.
- `loadRegistry(path): Registry`; `findTemplate(registry, part): Template | undefined`.
- `planScaffold({ productRoot, parts: [{ part, slug, title, url, ci, recipes }], registry, preferLocal }): Step[]` where `Step = { kind: 'mkdir'|'clone'|'rm-git'|'git-init'|'run'|'write', cwd, args }`; parts without a template produce a `write` step for `<part>/README.md` with "build from defaults" note.
- CLI: `node scripts/scaffold.mjs --plan plan.json [--execute]` — prints steps (default dry-run), executes only with `--execute`; refuses if target dir exists and is non-empty.

- [ ] **Step 1:** Failing tests: web part with local source → steps `mkdir, clone(local), rm-git, run(init), git-init`; unknown part `bot` → single `write` step; existing non-empty target → throws.
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS.
- [ ] **Step 5:** Smoke: dry-run plan for a product with `web` + `bot` into scratch dir prints 6 steps; `--execute` against local web-template succeeds and the generated `web/` passes `pnpm typecheck`.
- [ ] **Step 6:** `git init -b main`; commit `feat: add template registry and scaffold script`.

### Task B2: References

**Files:**

- Create: `references/{intake-questions,decision-rules,owner-defaults,markets,output-templates}.md`

- [ ] **Step 1:** Write from spec §5/§7 and wiki sources: decision rules with explicit triggers (Russell session rule for SPA vs SSR, monolith-first, BaaS vs NestJS, Drizzle vs Prisma, realtime only for collaboration/offline, queues = BullMQ when jobs > request lifetime, mobile: Expo greenfield / Capacitor wrap SPA / Flutter when native maps / Swift iOS-only, bot = grammY thin client, admin = Mantine, hosting by budget + jurisdiction); owner defaults per part with "deviate when"; markets: RU / EU / US / global → stack-affecting constraints + `legal-kit` invocation; output templates: product `architecture.md`, ADR-lite entry, manual-mode instruction format, handoff prompt.
- [ ] **Step 2:** Check each decision rule has a trigger and a default (grep for "Default:" / "Choose when:").
- [ ] **Step 3:** Commit `docs: add decision references`.

### Task B3: SKILL.md and README

**Files:**

- Create: `SKILL.md`, `README.md`

- [ ] **Step 1:** Load `writing-skills` + `anthropic-skills:skill-creator`; write SKILL.md (frontmatter `name: product-architect`, description with triggers: "new product idea", "pick a stack", "start a new project", "architecture for an app/bot/SaaS", Russian triggers "новый проект", "подбери стек"); workflow per spec §7.2; hard rules (never push/deploy/apply migrations/create remotes without explicit yes); tool-agnostic with "if available" notes; ≤ ~300 lines, references loaded on demand.
- [ ] **Step 2:** Validate frontmatter (name/description present, description ≤1024 chars), every referenced file exists.
- [ ] **Step 3:** Commit `feat: add product-architect skill`.

### Task B4: Evals

**Files:**

- Create: `evals/scenarios.json` (3 scenarios with `prompt`, `answers` to intake questions, `expected` decisions), `evals/README.md`

Scenarios: (1) coffee-shop landing with contact form, EU → web only, SSR/static, no backend, no auth; (2) B2B SaaS with subscriptions, global → web (Next) + Postgres + Drizzle or NestJS per rules, Stripe/LemonSqueezy, auth, admin later; (3) loyalty mini-app for bars, RU → web mini-app + NestJS backend + grammY bot, RU payments, legal-kit RU.

- [ ] **Step 1:** Run each scenario with a fresh subagent loaded with the skill (if available; else manual walk-through), compare decisions with `expected`.
- [ ] **Step 2:** Fix SKILL/references where decisions diverge for a wrong reason; re-run failing scenario.
- [ ] **Step 3:** Commit `test: add skill eval scenarios`.

### Task B5: Install (owner OK required)

- [ ] **Step 1:** Ask owner. On yes: `ln -s ~/DEV/SKILLS/product-architect ~/.agents/skills/product-architect` and `ln -s ../../.agents/skills/product-architect ~/.claude/skills/product-architect`.
- [ ] **Step 2:** Verify the skill appears in a new session's skill list.
