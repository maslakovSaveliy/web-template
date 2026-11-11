# Decisions

ADR-lite log. One entry per decision that is expensive to reverse. Format:

```
## D-NNN · YYYY-MM-DD · Title
- **Decision:** what we chose.
- **Why:** the constraint or evidence.
- **Alternatives:** what we rejected and why.
- **Revisit when:** the signal that would change this.
```

## Inherited from web-template

| ID   | Decision                                                                                                     | Why                                                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| T-01 | `app → views → features → components → ui` layering                                                          | Thin routes, page composition separate from domain logic, predictable places for agents                                           |
| T-02 | SCSS Modules on CSS-variable tokens, no Tailwind                                                             | Owner's design-system workflow; themeable at runtime; no utility-class sprawl                                                     |
| T-03 | next-intl in core, single locale, swappable message source                                                   | Every product needs editable texts; multi-locale is a recipe                                                                      |
| T-04 | TanStack Query + typed `fetch` (`apiFetch`) + Zod; axios optional                                            | One error model (`ApiError`), no extra HTTP dependency                                                                            |
| T-05 | Biome (lint + format), lefthook, commitlint, secretlint, knip                                                | Fast single tools; hooks without lint-staged                                                                                      |
| T-06 | Vitest + Testing Library, Playwright (Chromium + WebKit) + axe                                               | Owner's test stack; WebKit catches Safari/iOS bugs early                                                                          |
| T-07 | Static CSP in `next.config.ts`; nonce CSP as a recipe                                                        | Nonce CSP forces dynamic rendering of every page                                                                                  |
| T-08 | Docker standalone image built in CI, tagged by sha, manual deploy with health gate                           | Never build on the VPS; reproducible rollbacks                                                                                    |
| T-09 | TypeScript 7 (`tsc` via Next's CLI type checker)                                                             | Verified with `next build` 16.4; fall back to TS 6 if a tool needs the compiler API                                               |
| T-10 | `AGENTS.md` canonical; `CLAUDE.md`/`GEMINI.md` import it; memory in `docs/agents/memory.md`                  | Owner uses several agents; Codex reads only `AGENTS.md` and has no `@` imports; agent-private memory is invisible to other agents |
| T-11 | Performance budgets + measure-first rule (`docs/performance.md`), lab guard in e2e, default request deadline | Speed claims without baseline and percentiles are guesses; a missing deadline lets a stalled upstream hang renders and spinners   |
