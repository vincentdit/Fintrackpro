# Running FinTrackPro with Docker

This project ships a container setup for local development. Use it to run the
Metro bundler and preview the app **in a browser** or **on a physical phone via
Expo Go** — without installing Node/Expo on your host.

> **What Docker can and can't do here**
> A Linux container can run Metro, the Expo web build, and an Expo Go tunnel.
> It **cannot** run the iOS or Android **simulators** — those need the host OS
> (macOS for iOS; Android Studio's emulator on Windows/macOS/Linux). For a
> simulator, run `npm install && npm start` directly on your host instead.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running on Windows.
- This project folder on disk, e.g. `C:\Users\USER\My Drive\FinTrackPro`.

Open a terminal **in the project folder**:

```powershell
cd "C:\Users\USER\My Drive\FinTrackPro"
```

## Option A — Web + phone together (recommended)

One Metro process serves the web app **and** the Expo Go tunnel:

```powershell
docker compose up dev
```

Then open **http://localhost:8081** in a browser, and/or scan the QR from the
terminal with Expo Go. This is the one command that covers both.

> Don't run `web` and `tunnel` at the same time — they would both try to bind
> port 8081. Use `dev` when you want both.

The tunnel uses ngrok, whose free tier can fail to start ("failed to start
tunnel", "remote gone away"). The `dev` and `tunnel` services **auto-retry the
tunnel up to 15 times**, so a flaky start usually heals itself — just wait for
"Tunnel ready". The web app at http://localhost:8081 works regardless.

### If the tunnel still won't come up (ngrok-free option)

Run **Metro on your host** and keep only the backend in Docker. This sidesteps
ngrok and all container-networking quirks; it needs Node 20.19+/22 installed on
Windows (one-time `npm install`).

```powershell
docker compose up api                       # backend + DB in Docker
# second terminal, in the project folder (first time: npm install):
npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://<your-PC-LAN-IP>:4000"
npm start                                    # Metro runs natively
```

Web is at http://localhost:8081; your phone scans the QR and connects over the
LAN automatically (Metro isn't in a container, so it advertises the right IP).

## Option B — Browser preview only

```powershell
docker compose up web
```

First run builds the image and installs dependencies (a few minutes). When you
see the Metro output, open:

```
http://localhost:8081
```

The app runs as a web build. Editing files on your host hot-reloads the page.
Stop with `Ctrl+C`, or `docker compose down`.

## Option C — On your phone with Expo Go only (tunnel)

Best when you want the real native app on a device and don't want to fiddle
with LAN IPs. `@expo/ngrok` is already a dependency, so the tunnel works out of
the box.

```powershell
docker compose up tunnel
```

1. Install **Expo Go** from the App Store / Play Store.
2. Wait for the QR code to appear in the terminal.
3. Scan it (iOS Camera app, or the Expo Go app on Android). The app loads over
   the tunnel from anywhere — the phone doesn't need to be on the same network.

## Option D — On your phone over LAN (advanced)

Faster than a tunnel, but phone and PC must share a network and Windows
Firewall must allow the ports.

```powershell
# Find your PC's IPv4 (look for the 192.168.x.x address):
ipconfig

# Then:
$env:LAN_IP="192.168.1.20"   # replace with your address
docker compose up lan
```

Scan the QR in Expo Go as above.

## Rebuilding after dependency changes

The image installs `node_modules` at build time and keeps them in a container
volume (so your host folder isn't polluted). If you change `package.json`,
rebuild:

```powershell
docker compose build web        # or: docker compose up --build web
```

## Data source / environment

The app defaults to the offline **mock** data source, so nothing else is
needed to run it. To point it at a real Plaid backend, create a `.env` in the
project root (see `.env.example`). Because the project folder is bind-mounted
into the container, Expo reads this `.env` directly and exposes any
`EXPO_PUBLIC_*` values to the app:

```
EXPO_PUBLIC_DATA_SOURCE=plaid
EXPO_PUBLIC_API_BASE_URL=https://api.yourcompany.com
EXPO_PUBLIC_PLAID_ENV=sandbox
```

(Restart the container after editing `.env`.)

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Edits don't hot-reload | Polling is already enabled via `CHOKIDAR_USEPOLLING`/`WATCHPACK_POLLING`. If it still lags, save again or restart the service — Windows bind-mount watching can be slow. |
| `http://localhost:8081` won't load | Make sure the `web` service (not `tunnel`) is up, and no other process is using port 8081. |
| Tunnel QR never appears | Corporate networks sometimes block ngrok. Try Option C (LAN) instead. |
| Port already in use | Stop the old container: `docker compose down`, then retry. |
| Slow first start | Expected — first run installs dependencies. Later starts are fast. |
| Native module error on web (SecureStore/biometrics) | Expected and handled: the app falls back to browser storage and skips biometrics on web. |

## One-off commands in the container

```powershell
docker compose run --rm web npm run typecheck
docker compose run --rm web npm test
```
