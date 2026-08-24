# FinTrackPro

[![CI](https://github.com/vincentdit/Fintrackpro/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentdit/Fintrackpro/actions/workflows/ci.yml)

A cross-platform (iOS + Android) personal finance app built with **Expo + React Native + TypeScript**, with a self-hosted Node + Postgres backend for user accounts and cross-device sync. It covers the four pillars of personal money management:

- **Expense & income tracking** — add, edit, categorize, and browse transactions; balances update automatically.
- **Budgets & goals** — set per-category budgets with live health bars, and track savings goals with contributions.
- **Bank / account sync** — link institutions and import transactions through a provider-agnostic service layer (Plaid-ready, backed by a working mock so the whole flow runs with no backend).
- **Reports & insights** — monthly income-vs-expense trend, category donut breakdown, savings rate.

This is an **enterprise-grade prototype**: strict TypeScript, a clean feature-based architecture, a swappable service layer, secure on-device storage, and biometric app-lock.

---

## Quick start

You need [Node 20.19+ or 22](https://nodejs.org) (required by Expo SDK 54) and the Expo tooling.

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template (defaults to the offline mock data source)
cp .env.example .env

# 3. Start the dev server
npm start
```

Then:

- Press **i** for the iOS simulator (macOS + Xcode), **a** for an Android emulator, or **w** to open it in a browser.
- Or scan the QR code with the **Expo Go** app on a physical device.

The app ships with realistic seed data, so every screen is populated on first launch. All data persists on-device between launches; **Accounts → Settings → Reset demo data** restores the sample set.

## Run with Docker

Prefer containers? A full Docker setup is included — browser preview or Expo Go
on a phone via tunnel, no host Node/Expo needed:

```bash
docker compose up dev        # app (web at :8081 + Expo Go QR)
docker compose up dev api    # app + sync backend (API at :4000, Postgres auto)
```

See [`DOCKER.md`](./DOCKER.md) for details and Windows notes. (Native iOS/Android
*simulators* can't run in a container — use the host steps above for those.)

## Cross-device sync

With the `api` service running, the app supports **user accounts and
cross-device sync** — sign up, then log in on any device and your data follows
you. See [`SYNC.md`](./SYNC.md) for setup (including how the phone reaches the
API) and how it works. Without the backend, the app runs fully on-device.

## Deploy

To host it in the cloud (API + Postgres + web), see [`DEPLOY.md`](./DEPLOY.md) —
this repo includes a Render blueprint (`render.yaml`) that provisions all three
from one file. Mobile distribution is in [`EAS.md`](./EAS.md).

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm start`         | Start the Expo dev server                     |
| `npm run ios`       | Start and open the iOS simulator              |
| `npm run android`   | Start and open the Android emulator           |
| `npm run web`       | Run in the browser via react-native-web       |
| `npm run typecheck` | `tsc --noEmit` — strict type-check (passes ✔) |
| `npm test`          | Run the finance-logic unit tests (passes ✔)   |

## What works in this prototype

Everything except **real** bank connections runs fully, offline, on-device:

- Add / edit / delete income and expenses, with automatic account-balance math (money is stored in integer minor units to avoid floating-point drift).
- Create and edit budgets; the dashboard and Budgets screen show live spent / remaining / over-budget states.
- Create savings goals and add or withdraw contributions.
- Reports compute from your actual data (donut + bar charts drawn with `react-native-svg`, no chart library).
- "Link a bank" runs the complete link → import flow against a **mock provider** that simulates Plaid's latency and data shape.

## Going live with real bank sync (Plaid)

Bank aggregation requires credentials and a backend — the Plaid `client_secret` must **never** live in the app. The code is already structured for this; see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full flow. In short:

1. Stand up a small backend that holds your Plaid secret and exposes the endpoints in `PlaidBankSyncService`.
2. Add `react-native-plaid-link-sdk` and open Plaid Link in `LinkAccountScreen`.
3. Set `EXPO_PUBLIC_DATA_SOURCE=plaid` and `EXPO_PUBLIC_API_BASE_URL` in `.env`.

No screen or store code changes — the app depends only on the `BankSyncService` interface.

## Project layout

```
src/
  components/      Reusable UI (Card, Button, Text, charts, …)
  config/          Typed runtime configuration from env
  data/            Secure + persisted storage, seed data
  features/        One folder per screen area (dashboard, transactions, …)
  navigation/      Root stack + bottom tabs + auth gate
  services/
    auth/          Session + biometric unlock
    plaid/         BankSyncService interface, mock + Plaid implementations
  store/           Zustand store + pure derived selectors
  theme/           Design tokens + light/dark provider
  types/           Domain models (single source of truth)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the design rationale, data model, and security notes.
