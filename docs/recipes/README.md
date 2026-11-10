# Recipes

Opt-in additions. Each recipe has the same sections: When to use, Verify first, Packages, Files, Env vars, Rules to append to AGENTS.md, Tests to add, Pitfalls.

**Always start with "Verify first":** library APIs change fast; look them up with `/context7` before writing code. Adding packages, schemas or migrations needs owner approval (AGENTS.md).

| Recipe                                      | Use for                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| [postgres-drizzle](postgres-drizzle.md)     | Postgres inside this app (route handlers / server actions)   |
| [postgres-prisma](postgres-prisma.md)       | Postgres via Prisma, usually in a separate NestJS backend    |
| [api-client-openapi](api-client-openapi.md) | Typed client for a separate backend that publishes OpenAPI   |
| [api-client](api-client.md)                 | Swapping `apiFetch` to axios (interceptors, upload progress) |
| [supabase](supabase.md)                     | Supabase (self-hosted or cloud) when a BaaS is justified     |
| [auth](auth.md)                             | Sessions, login methods, protecting routes                   |
| [payments](payments.md)                     | Checkout, webhooks, subscriptions, provider by market        |
| [i18n-multi-locale](i18n-multi-locale.md)   | Second language, locale routing, hreflang                    |
| [remote-messages](remote-messages.md)       | Editable texts from a CMS or database                        |
| [analytics-consent](analytics-consent.md)   | Analytics behind cookie consent                              |
| [pwa-push](pwa-push.md)                     | Installable app, offline shell, web push                     |
| [admin-ui](admin-ui.md)                     | Internal admin with data tables (Mantine)                    |
| [telegram-mini-app](telegram-mini-app.md)   | This web app as a Telegram Mini App                          |
| [strict-csp](strict-csp.md)                 | Nonce-based CSP via `src/proxy.ts`                           |
