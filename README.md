# web-template

Production-ready starting point for web products: Next.js 16 + React 19, SCSS design tokens, next-intl, TanStack Query, Zod, strict TypeScript 7, Biome, Vitest, Playwright + axe, lefthook, Docker and CI/CD, plus rules for coding agents.

## New project from this template

```bash
git clone https://github.com/maslakovSaveliy/web-template.git my-project
cd my-project && rm -rf .git
pnpm install
pnpm template:init --name "My Project" --description "What it does" --url https://my-project.com \
  --locale en --ci github --keep-recipes postgres-drizzle,payments
git init -b main && git add -A && git commit -m "chore: init from web-template"
cp .env.example .env.local && pnpm dev
```

`template:init` options: `--name` (required), `--title`, `--description`, `--url`, `--locale` (default `en`), `--ci github|gitlab`, `--keep-recipes all|none|a,b`, `--dry-run`, `--force`. It renames the package, site config, messages, compose container, writes a fresh README and decision D-001, removes the unused CI pipeline and recipes, and deletes itself.

Or let the `product-architect` skill pick the stack for a whole product and scaffold this template for the web part.

## What is inside

| Area      | Choice                                                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16 App Router, RSC, `output: 'standalone'`, typed routes                                                                                      |
| Structure | `app → views → features → components → ui` (see CLAUDE.md)                                                                                            |
| Styling   | SCSS Modules on CSS-variable tokens, light/dark themes, `:where()` reset, reduced motion                                                              |
| Texts     | next-intl, single locale, all strings in `messages/`, swappable source for CMS texts                                                                  |
| Data      | TanStack Query + typed `apiFetch` + Zod, one `ApiError` model                                                                                         |
| Forms     | react-hook-form + Zod (shared schema with route handler)                                                                                              |
| Env       | Zod-validated: public at build, server at startup                                                                                                     |
| Quality   | Biome, TypeScript 7 strict, Vitest + Testing Library, Playwright (Chromium + WebKit) + axe, knip                                                      |
| Git       | lefthook (Biome, secretlint, i18n, commitlint, pre-push typecheck/tests/main guard)                                                                   |
| Security  | CSP + security headers, supply-chain guards in `pnpm-workspace.yaml`                                                                                  |
| Delivery  | Multi-stage Docker (non-root, healthcheck), GitHub Actions (CI, GHCR release by sha, manual deploy with rollback), GitLab alternative                 |
| Agents    | `CLAUDE.md` (canonical), `AGENTS.md`, `.cursor/rules`, `.claude/settings.json`, task + handoff templates                                              |
| Recipes   | Postgres (Drizzle/Prisma), OpenAPI client, Supabase, auth, payments, locales, CMS texts, analytics consent, PWA, admin, Telegram Mini App, strict CSP |

## Commands

| Command       | What it does                                |
| ------------- | ------------------------------------------- |
| `pnpm dev`    | Dev server on http://localhost:3000         |
| `pnpm verify` | Lint + i18n check, types, unit tests, build |
| `pnpm e2e`    | Playwright against a production build       |
| `pnpm knip`   | Unused files, exports, dependencies         |

Docs: [CLAUDE.md](CLAUDE.md) · [architecture](docs/architecture.md) · [decisions](docs/decisions.md) · [deploy](docs/deploy.md) · [recipes](docs/recipes/README.md)
