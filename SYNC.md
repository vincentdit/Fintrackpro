# Cross-device sync (accounts + backend)

FinTrackPro can run purely on-device, or with a **self-hosted backend** that
gives every user an account and keeps their data in sync across devices — edit
your salary on your phone, and it shows up on the web.

## What you get

- **Accounts**: email/password sign-up and login (JWT, bcrypt-hashed passwords).
- **Per-user data**: each account's accounts/transactions/budgets/goals and
  settings are private to that user.
- **Delta sync**: the app pushes local changes and pulls remote ones — on
  launch, when it returns to the foreground, every ~30s, and shortly after each
  edit. Conflicts resolve **last-write-wins** by edit time.
- **Offline-first**: the app keeps working with no network; changes queue and
  sync when you're back online.

## Run the full stack

The backend is two extra services in `docker-compose.yml`: `db` (Postgres) and
`api` (Node/Express). Bring the app and API up together:

```powershell
cd "C:\Users\USER\My Drive\FinTrackPro"
docker compose up dev api
```

- App: http://localhost:8081 (and the Expo Go QR for your phone)
- API: http://localhost:4000  (Postgres starts automatically as a dependency)

First run builds the API image and initializes the database schema.

### Point the app at the API

The app reads the API URL from `EXPO_PUBLIC_API_BASE_URL`.

- **Web (browser on this PC)**: `http://localhost:4000` — the default, works out
  of the box.
- **Phone (Expo Go)**: `localhost` means the phone itself, so set `API_URL` to
  your PC's LAN IP before starting (phone and PC on the same Wi-Fi):

  ```powershell
  $env:API_URL="http://192.168.1.20:4000"   # your PC's IPv4 from `ipconfig`
  docker compose up dev api
  ```

  (Windows Firewall must allow inbound 4000. A public tunnel for the API also
  works if you prefer.)

## Using it

1. Open the app → **Create account** (name, email, password). Your current data
   is uploaded to the new account.
2. On another device (or the web), **Log in** with the same email/password —
   your data downloads and stays in sync from then on.
3. **Accounts → Sync** shows the last sync time and a manual **Sync now** button.
   **Sign out** clears the device back to the demo state.

## How it works (short version)

- Client mutations stamp an `updatedAt` and mark the record "pending". The sync
  engine sends pending records to `POST /sync` with a cursor (`lastPulledAt`),
  and applies whatever the server returns.
- The server stores every entity in one `records` table keyed by
  `(user_id, kind, id)`, with two timestamps: the client's `updated_at`
  (drives last-write-wins) and a server clock `server_updated_at` (the pull
  cursor, so syncing never depends on device clock accuracy).
- Deletions are soft-deletes (tombstones) so they propagate to other devices.

See `ARCHITECTURE.md` for the layering and `server/src/` for the API.

## Production notes

- Set a strong `JWT_SECRET` (compose reads `${JWT_SECRET}`); the default is a
  placeholder for local dev only.
- Use TLS in front of the API and a managed Postgres with backups.
- Access tokens here last 30 days for convenience; add refresh-token rotation
  and rate limiting before real deployment.
