# Performance

Rules for making this app fast without guessing. Every technique below is a hypothesis until a measurement on this app confirms it: a skeleton, a stream or an optimistic update can improve perceived speed without shortening the real work, and a queue returns acceptance, not the result.

## Budgets

| What                                | Budget                                    | Where it is checked                                     |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| LCP, field, p75 of page views       | ≤ 2.5 s                                   | RUM (see Observability)                                 |
| INP, field, p75                     | ≤ 200 ms                                  | RUM                                                     |
| CLS, field, p75                     | ≤ 0.1                                     | RUM; lab guard in `e2e/performance.spec.ts`             |
| Home page first-load JS, compressed | ≤ 200 KB (template baseline 161 KB)       | `e2e/performance.spec.ts` (Chromium, prefetch excluded) |
| Hashed static assets                | `Cache-Control: ... immutable`            | `e2e/performance.spec.ts`                               |
| API p95 per endpoint                | set per project in `docs/architecture.md` | server metrics / traces                                 |

Thresholds: [web.dev Core Web Vitals](https://web.dev/articles/vitals). Raising a budget needs a row in `docs/decisions.md` with the measured reason. Never compare compressed with uncompressed bytes.

## How to claim a speedup

1. Name the scenario and the user goal. Measure a baseline: field data if the app is live, otherwise lab under fixed conditions (same build, throttling profile, cold and warm cache measured separately).
2. Find the bottleneck from a trace or waterfall before choosing a fix. Typical order for a content page: media, fonts, third-party scripts, client JS. For a slow API: query count and query plans before any cache.
3. Change one thing. Compare control and change under the same conditions with percentiles (p75 for Web Vitals, p95/p99 for server latency), never means; state sample size and period. One run is not evidence.
4. Check errors, accessibility and data freshness too. No measured win: revert. Win: keep it and record before/after in the PR.

Lab numbers guard against regressions; claims about users need field data. Emulated throttling is approximate: before claiming an LCP/INP win for mobile, also try a real low-end phone.

## Frontend

- **Images:** `next/image` only, with `width`/`height` or `fill` + `sizes`. Formats are AVIF/WebP (`next.config.ts`). Above-the-fold images: `loading="eager"` and `fetchPriority="high"`; `preload` only for the single known LCP image (`priority` is deprecated in Next 16). Below the fold: default lazy loading.
- **Fonts:** `next/font` (self-hosted at build), at most two families, only the weights in use, subsets for the locales you ship (add `cyrillic` when a locale needs it). Keep the generated fallback metrics so swapping does not shift layout.
- **Third-party scripts:** `next/script` with `lazyOnload`, or load on interaction or after consent (`docs/recipes/analytics-consent.md`). Check long tasks and INP with and without the script; the page must work when the script is blocked.
- **Client JS:** interactive islands only. Barrels leak: a route importing a views barrel, or a client component importing a barrel with side effects, ships other routes' code (measured +45 KB on the home page; see `docs/agents/memory.md`). Load heavy, rarely used widgets with `next/dynamic`. Before adding a client dependency, check whether the platform already does it (`<dialog>`, popover, view transitions, CSS scroll animations) and state its compressed size in the PR.
- **Server data:** start independent fetches together (`Promise.all`), not one after another. Put slow data under `<Suspense>` so the shell streams first; to stream into a client component, pass the promise and read it with `use()`.
- **Client data (TanStack Query):** identical queries share one request by key, so the key must contain every parameter plus the user/tenant scope. Pass the query `signal` to `apiFetch` so stale requests are cancelled. Debounce search/autocomplete input (start around 300 ms) and ignore out-of-order answers.
- **Optimistic UI:** only for reversible actions that almost always succeed. Mark the pending state, roll back on error, block double submits. Never show a payment or order as confirmed before the server says so.
- **Skeletons:** same size as the final content (no CLS), an accessible busy status, an error state, no fake progress and no endless animation under `prefers-reduced-motion`.
- **Long lists:** paginate first. Virtualize only a list measured as slow, and keep keyboard focus, screen reader access and in-page search working.
- **Re-renders:** profile (React Profiler) before adding `memo`/`useMemo`; move state down before memoizing.

## Backend (route handlers or a separate API)

- Every outbound call has a deadline. `apiFetch` defaults to 10 s (`timeoutMs`) and throws `ApiError('timeout')`; a timeout does not cancel the remote operation, so retry only idempotent requests (or send an idempotency key).
- Lists: server-side pagination with a stable sort (unique tie-breaker) and a maximum page size; cursor pagination when rows are inserted while users page.
- No N+1: load relations in a batch or join. A test asserts the query count does not grow with list size.
- Select the columns you need (including the ones authorization needs). Add indexes for real filters and joins, justified by `EXPLAIN ANALYZE` on realistic data; each index costs writes.
- Connection pool: pool size × replicas (+ migrations and jobs) stays below the database connection limit; always release on error.
- Work that outlives a request goes to a queue with a status the user can see, idempotent handlers, retries with backoff and dead-letter handling (separate backend, see `docs/architecture.md`).
- Rate limits answer `429` with `Retry-After`. An in-process limiter protects one instance only; with several replicas use a shared store.

## Caching and privacy

- Hashed `/_next/static/*` assets are `public, max-age=31536000, immutable` (Next default, checked in e2e). Files in `public/` are not hashed: version their URL before giving them a long max-age.
- Personal or tenant data: `Cache-Control: private, no-store` (or `private, no-cache` when revalidation is enough). It must never reach a shared cache or CDN. Do not send `no-store` on public pages: it disables the back/forward cache.
- Server-side cache keys contain user/tenant, permissions and every parameter; invalidate on permission or data change. Test with two users and after logout.
- Redis (cache-aside) only after pagination, queries and indexes are fixed and a repeated read is measured as the bottleneck; plan for stampedes and for the cache being down.

## Infrastructure

- Compression: Next gzips responses (`compress: true`). Caddy `encode` skips responses that are already encoded, so to serve zstd/brotli from the proxy set `compress: false` in `next.config.ts` and measure bytes and CPU.
- Streaming (Suspense, server-sent events): verify the proxy does not buffer streamed responses.
- Run the app in the same region as its database; latency per query multiplies by the number of sequential queries.
- A CDN pays off for a geographically spread audience and public assets; measure hit ratio and TTFB per region. A load balancer or a second instance only after measuring one instance's limit (the database stays shared). HTTP/3 is optional and does not fix a slow server.

## Observability

- **RUM:** `useReportWebVitals` from `next/web-vitals` (no extra dependency) in a small client component that sends LCP, INP, CLS and TTFB to your endpoint with `navigator.sendBeacon`, only after analytics consent. Slice p75 by route, device class, country and release; correlation is not causation.
- **Tracing:** add OpenTelemetry when there is a process boundary (separate API, worker, queue); for a single process a profiler and logs are cheaper. Export through a Collector, sample at the entry point, keep secrets and personal data out of attributes, and let the proxy forward `traceparent`.
