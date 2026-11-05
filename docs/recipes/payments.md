# Recipe: payments and subscriptions

## When to use

Selling goods, services or subscriptions from the web app.

## Verify first

`/context7` for the provider SDK/API. `/security-best-practices`. `/legal-kit` for offer/terms, receipts and subscription rules in the target market. Provider is chosen by market (product-architect `markets.md`): e.g. Stripe / Paddle / LemonSqueezy (merchant of record) internationally; YooKassa / T-Bank / CloudPayments in Russia.

## Packages

Provider SDK only if it adds value over plain `fetch` (signature helpers). Nothing else.

## Files

- `src/features/payments/`: checkout button/form, price display (formatter), hooks.
- `src/app/api/payments/checkout/route.ts`: creates a provider checkout session server-side from **server-side prices** (never trust client amounts); idempotency key per attempt.
- `src/app/api/payments/webhook/route.ts`: reads the raw body, verifies the signature (and source IP allowlist if the provider publishes one), stores the event id (unique) before processing, returns 200 fast.
- `src/server/payments/ledger.ts`: append-only ledger of payment events; order/subscription state derived from it.
- DB tables (see a Postgres recipe): `payment_events(provider, event_id unique, payload, received_at)`, `orders`/`subscriptions` with integer minor-unit amounts + currency.

## Env vars

`PAYMENTS_PROVIDER`, `PAYMENTS_SECRET_KEY`, `PAYMENTS_WEBHOOK_SECRET` (server only); publishable key as `NEXT_PUBLIC_*` only if the provider requires it.

## Rules to append to CLAUDE.md

- Amounts are integers in minor units + ISO currency; no floats.
- Webhooks are idempotent and verified; never mark paid from the browser redirect alone.
- Real payments and live keys only with explicit owner approval; development uses test mode keys.
- Subscription cancel must be possible in-app; no pre-ticked paid add-ons.

## Tests to add

Webhook: valid signature → state change; invalid signature → 400 and no change; duplicate event → processed once; out-of-order events. Checkout: price comes from server config, tampered client amount ignored. E2E in provider test mode.

## Pitfalls

- Some banks' APIs use certificate chains not in default trust stores (e.g. Russian Trusted Root CA): configure `NODE_EXTRA_CA_CERTS` in the container.
- Fiscal receipts / VAT invoices may be mandatory (market-specific, via provider or a fiscal service).
- Do not log full webhook payloads containing personal data.
