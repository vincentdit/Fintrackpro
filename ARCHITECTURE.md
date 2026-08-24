# FinTrackPro — Architecture

This document explains how the app is structured and the reasoning behind the
enterprise-oriented decisions, so the prototype can grow into a production
product without re-writes.

## Principles

1. **The UI depends on interfaces, not implementations.** Screens talk to a
   `BankSyncService` and an `AuthService`, never to Plaid or a specific IdP
   directly. Swapping providers is a one-line change in a factory.
2. **Money is never a float.** All amounts are stored as integer *minor units*
   (cents). Formatting to a display string happens only at the edge
   (`utils/format.ts`). This eliminates a whole class of rounding bugs.
3. **Domain models are the single source of truth.** `types/models.ts` defines
   every shape; the store, services, and selectors all import from it.
4. **Derived data is computed, not stored.** Budgets health, category
   breakdowns, and trends are pure functions of the transactions
   (`store/selectors.ts`), so they can never drift out of sync.
5. **Secrets never touch the client.** Anything sensitive (Plaid secret, DB
   creds) lives only on a backend. The app holds short-lived tokens in the
   device keychain via `SecureStore`.

## Layers

```
┌──────────────────────────────────────────────┐
│  features/*  (screens)                         │  React components only
├──────────────────────────────────────────────┤
│  store/  (Zustand) + selectors (pure fns)      │  App state + derivations
├──────────────────────────────────────────────┤
│  services/  auth · plaid (BankSyncService)     │  Side-effectful boundaries
├──────────────────────────────────────────────┤
│  data/  storage (SecureStore + AsyncStorage)   │  Persistence
├──────────────────────────────────────────────┤
│  types/  models      config/  env              │  Contracts + configuration
└──────────────────────────────────────────────┘
```

State flows down through hooks (`useStore`, `useAuth`, `useTheme`); side
effects go through the service layer. Nothing in `features/` imports a
provider SDK directly.

## Data model

- **Account** — a checking/savings/credit/cash/investment account, manual or
  linked. Balances in minor units. Linked accounts carry a `linkedItemId`.
- **Transaction** — income or expense, tied to an account and category.
  Imported rows carry an `externalId` for **idempotent de-duplication** on sync.
- **Category** — typed as income or expense, with an icon + color used
  consistently across charts and rows.
- **Budget** — a per-category limit for a weekly/monthly/yearly period.
- **Goal** — a savings target with running progress.

Balance integrity: the store applies a signed delta to the relevant account on
every add/update/delete, and *reverses* the prior effect on edits, so account
balances always equal the sum of their transactions plus the opening balance.

## State management

[Zustand](https://github.com/pmndrs/zustand) with the `persist` middleware.
Chosen over Redux for a prototype because it has near-zero boilerplate while
still being predictable and testable. Persistence is backed by AsyncStorage;
`partialize` controls exactly what is written. `version` + (future) `migrate`
handle schema evolution.

Selectors are **pure functions** kept out of the store so they can be unit
tested with no React or device dependencies — see `src/__tests__/finance.test.ts`.

## Bank sync (Plaid) — the important part

Bank aggregation is the one feature that cannot run entirely client-side. The
`BankSyncService` interface (`services/plaid/types.ts`) is the seam. Two
implementations exist:

- **`MockBankSyncService`** — default. Simulates institution search, the link
  handshake, balance refresh, and transaction sync with realistic latency and
  data shapes. Lets the entire linked-account UX run with no backend.
- **`PlaidBankSyncService`** — talks to *your* backend, which talks to Plaid.

### Production flow (why a backend is mandatory)

```
App                    Your backend                 Plaid
 │  POST /link-token ─────▶ create link_token ─────▶  │
 │  ◀──────── link_token ──┤                          │
 │  open Plaid Link (SDK)                              │
 │  ◀──────── public_token (from Plaid Link UI) ───── │
 │  POST /exchange ───────▶ exchange for access_token │
 │                          store access_token (server-side, encrypted)
 │  ◀──────── itemId + account metadata ──┤           │
 │  POST /items/:id/transactions/sync ───▶ /transactions/sync ─▶
 │  ◀──────── normalized transactions ────┤           │
```

The Plaid **`client_secret` and `access_token` stay on the server forever.**
The app only ever holds an opaque `itemId` and a session bearer token. This is
both a security requirement and Plaid's recommended architecture.

### To enable it

1. Implement the endpoints referenced in `PlaidBankSyncService`
   (`/plaid/link-token`, `/plaid/exchange`, `/plaid/institutions`,
   `/plaid/items/:id/transactions/sync`, `/plaid/items/:id/balances`).
2. Add `react-native-plaid-link-sdk`; open Plaid Link in `LinkAccountScreen`
   using `createLinkToken()`, then call `exchangePublicToken()` on success.
3. Set `EXPO_PUBLIC_DATA_SOURCE=plaid` and `EXPO_PUBLIC_API_BASE_URL`.

De-duplication on import is already handled: `store.importTransactions` skips
any transaction whose `externalId` has been seen.

## Multi-currency & FX conversion

Every record (account, transaction, budget, goal) stores its own `currency`.
The user picks a **base currency** (Settings → Base currency) from the East
African Community currencies plus USD. All aggregates — net worth, monthly
income/expense, budget health, reports, goal progress — are computed by
converting each record into the base currency:

- Rates are held as "units per 1 USD" (`RatesTable`) and any A→B conversion
  goes via USD (`utils/convert.ts`). Because amounts are stored as uniform
  minor units, conversion is a pure ratio and never loses precision to the
  minor-unit scaling.
- `FxService` fetches live rates from a free, key-less provider
  (open.er-api.com) on launch and on demand (Settings → Refresh). On any
  failure it keeps the last-fetched or bundled fallback rates
  (`config/rates.ts`), so conversion always works offline.
- Account cards and individual transactions display in their **own** currency
  (a true multi-currency wallet); only the roll-ups convert to the base.

`convert()` fails safe: a missing rate passes the amount through rather than
zeroing money. Conversion is display-time only — stored amounts are never
rewritten, so changing base currency (or refreshing rates) is non-destructive.

## Localization (i18n)

UI language (English / Swahili, default Swahili) lives in the profile. A typed
catalog (`i18n/translations.ts`) makes the Swahili table a
`Record<TKey, string>`, so a missing translation is a compile error. The pure
`translate()` function is unit-tested; the `useTranslation()` hook subscribes to
the language in the store so switching re-renders the whole app instantly.

## Security

- **Secure storage** — session/refresh tokens go to the iOS Keychain / Android
  Keystore via `expo-secure-store`; only non-secret app state goes to
  AsyncStorage. `data/storage.ts` centralizes this and falls back gracefully on
  web.
- **App lock** — `expo-local-authentication` gates entry behind Face ID /
  fingerprint / passcode (`AuthService.unlock`).
- **Auth seam** — `AuthService.signIn` is where a real OAuth2 / OIDC exchange
  goes. Keep access tokens in memory, refresh tokens in SecureStore.
- **Transport** — all backend calls attach a bearer token and should be TLS-only.

## Theming & accessibility

A single token set (`theme/theme.ts`) drives light and dark palettes, which
follow the OS setting automatically. Colors carry semantic roles
(income/expense/warning) so financial state reads consistently everywhere.

## Testing

`src/__tests__/finance.test.ts` covers the money-critical logic: minor/major
conversions and float-drift avoidance, signed currency formatting,
zero-decimal currencies, balance summation, monthly aggregates, budget ratio /
remaining math, and report selectors. Run with `npm test`. The whole codebase
type-checks under `strict` + `noUncheckedIndexedAccess` (`npm run typecheck`).

## Suggested next steps toward production

- Backend for Plaid + a real identity provider.
- Multi-currency with FX conversion at display time (the model already stores a
  per-record currency).
- Recurring transactions & bill reminders.
- Cloud sync / multi-device via an API, keeping the same store shape.
- Data export (CSV/PDF) and richer analytics.
- E2E tests (Detox) and CI (typecheck + unit + build).
