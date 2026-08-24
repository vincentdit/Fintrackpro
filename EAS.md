# Development build (EAS) — end the Expo Go SDK treadmill

Expo Go is a shared app on the App/Play Store, so it only ever runs the **latest**
SDK. When Apple/Google push a newer Expo Go, a project on an older SDK stops
loading ("incompatible with this version of Expo Go") — exactly the mismatch you
hit earlier.

A **development build** is your *own* app binary (FinTrackPro) with the Expo dev
tools baked in. It's pinned to the SDK **you** built it with, so a future Expo Go
update can't break it. It also connects to Metro over your LAN, so you don't need
Expo Go or the ngrok tunnel for day-to-day work.

You keep the fast workflow: JS changes still hot-reload from Metro. You only
rebuild when **native** dependencies change.

## One-time setup

You need a free [Expo account](https://expo.dev/signup) and the EAS CLI:

```powershell
npm install -g eas-cli
eas login
eas init          # creates the EAS project and writes projectId into app.json
```

`expo-dev-client` is already a dependency, and `eas.json` (in the project root)
defines the build profiles.

## Point builds at your hosted API (important)

Every build profile in `eas.json` sets `EXPO_PUBLIC_API_BASE_URL` under `env`,
so the API URL is **baked into every mobile build automatically** — no manual
step at build time, and no more typing a LAN IP on the phone.

The placeholder value is `https://fintrackpro-api.onrender.com`. **Replace it
with your real API URL** (from Render/Railway/Fly — see `DEPLOY.md`) in all
three profiles (`development`, `preview`, `production`). If you haven't deployed
the API yet, point the `development` profile's `EXPO_PUBLIC_API_BASE_URL` at your
PC instead — `http://<your-PC-LAN-IP>:4000` — while you develop.

Because `EXPO_PUBLIC_*` values are inlined at build time, the URL a build uses is
whatever its profile's `env` says. To target a different backend, edit that
profile's `env` in `eas.json` (or add another profile) and rebuild. A common
setup: `development` → your PC/staging URL, `production` → your live API URL.

## Build the dev client

**Android (simplest — no developer account needed):**

```powershell
eas build --profile development --platform android
```

EAS builds in the cloud (~10–20 min on the free tier) and gives you a QR/link to
install the **APK** on your phone. Install it — that app is your dev client.

**iOS (physical iPhone):**

```powershell
eas build --profile development --platform ios
```

iOS device builds need an Apple Developer account for provisioning; EAS walks you
through credentials interactively, then gives you an install link. (For the iOS
**Simulator** on a Mac instead, use `--profile development-simulator`.)

## Run it

1. Start Metro for the dev client + backend:

   ```powershell
   docker compose up devclient api
   ```

   The `devclient` service runs `expo start --dev-client`; the `dev` service
   stays on Expo Go. (For the most reliable LAN connection, run Metro on your
   host instead — see `DOCKER.md` → "ngrok-free option".)

2. Open the **FinTrackPro dev build** on your phone (not Expo Go, not the
   Camera app). It shows a launcher; scan the QR from the terminal there, or tap
   **Enter URL manually** and type `http://<your-PC-LAN-IP>:8081`.

> Until you've built the dev client, keep using `docker compose up dev api`
> (Expo Go). A dev-client QR (`exp+fintrackpro://…`) can't be opened by the
> Camera app or Expo Go — only by the installed dev build.

That's it — no Expo Go, no SDK-match requirement, and no ngrok needed when the
phone and PC share a network.

## When to rebuild

- **JS/TS changes** → no rebuild; Metro hot-reloads.
- **Native changes** (new native module, SDK upgrade, app config in `app.json`
  plugins, icons/splash) → rebuild the dev client.

## Going to production later

- `eas build --profile preview` → an internal APK to share with testers.
- `eas build --profile production` → store-ready binaries; `eas submit` uploads
  them to the App Store / Play Store.
