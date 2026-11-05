# Recipe: axios instead of apiFetch

## When to use

You need interceptors with request retry/refresh flows, upload/download progress, or you are porting code that already uses axios. Otherwise keep `apiFetch` (no dependency).

## Verify first

`/context7` → `axios` (current interceptors API, `AxiosError` shape, fetch adapter).

## Packages

`axios`

## Files

- `src/lib/api/axios.ts`: `axios.create({ baseURL: clientEnv.NEXT_PUBLIC_API_URL, timeout })` + a response interceptor that maps `AxiosError` to `ApiError('http' | 'network', status, message, data)`.
- Keep `apiFetch` signature: re-implement it on top of the instance so feature code does not change.

## Env vars

None new.

## Rules to append to CLAUDE.md

- All HTTP goes through `@/lib/api` (`apiFetch` facade). No direct `axios` imports in features.

## Tests to add

Re-run `src/lib/api/client.test.ts` against the axios implementation (stub the adapter) to prove the same `ApiError` codes.

## Pitfalls

- axios in Server Components adds weight for no gain: server code can keep native `fetch`.
- Do not log full request configs: they contain auth headers.
