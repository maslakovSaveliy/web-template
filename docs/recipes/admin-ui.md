# Recipe: admin UI with data tables

## When to use

Internal back office: tables, filters, forms, charts. The owner prefers a ready UI library here instead of custom tokens.

## Verify first

`/context7` → `@mantine/core`, `mantine-datatable`, `@mantine/charts` (or `recharts`); Mantine + Next App Router setup.

## Packages

`@mantine/core`, `@mantine/hooks`, `mantine-datatable`, optional `@mantine/charts`/`recharts`, `@mantine/dates`.

## Files

- Separate route group `src/app/(admin)/admin/...` with its own layout wrapping `MantineProvider` (Mantine CSS imported only there).
- Map Mantine theme colors/radius to the project tokens in `src/features/admin/theme.ts`.
- `features/admin/<entity>/`: table, filters, form, hooks (server-side pagination).

## Env vars

None new (auth required, see `auth.md`).

## Rules to append to CLAUDE.md

- Admin routes are `noIndex`, behind role checks in the data layer, excluded from `sitemap.ts`.
- Mantine is allowed only inside `(admin)`; public UI stays on project tokens.

## Tests to add

Role check (non-admin → 403/redirect), table pagination/filter hooks, form validation; e2e for the main CRUD flow.

## Pitfalls

- Global Mantine CSS leaking into public pages: import it in the admin layout only.
- Large tables: paginate on the server; never fetch everything to the client.
