import { useStore } from '@/store/useStore';
import { ApiClient } from '@/services/api/ApiClient';
import { AuthUser } from './types';

/**
 * Orchestrates auth + delta sync between the local store and the backend.
 *
 * Flow:
 *  - register(): upload the current local data to the new account, then pull.
 *  - login():    clear local data, then pull the account's data.
 *  - syncNow():  push everything still pending, then apply what the server
 *                returns. Guarded so only one sync runs at a time.
 */
let inFlight: Promise<boolean> | null = null;

function applyAuthUserSettings(user: AuthUser): void {
  // If the server already knows this user's settings, adopt them locally.
  if (!user.settings) return;
  const s = useStore.getState();
  const patch: Record<string, unknown> = {};
  if (user.settings.baseCurrency) patch.baseCurrency = user.settings.baseCurrency;
  if (user.settings.language) patch.language = user.settings.language;
  if (Object.keys(patch).length) {
    // Set without marking dirty: this reflects server state, not a local edit.
    useStore.setState((st) => ({ user: { ...st.user, ...patch } }));
  }
}

export const SyncEngine = {
  async syncNow(): Promise<boolean> {
    if (!(await ApiClient.hasSession())) return false;
    if (inFlight) return inFlight;

    inFlight = (async () => {
      const store = useStore.getState();
      store.setSyncing(true);
      try {
        const changes = store.collectPending();
        const pushedKeys = changes.records.map((r) => `${r.kind}:${r.id}`);
        const profilePushed = !!changes.profile;

        const res = await ApiClient.sync(store.lastPulledAt, changes);

        // Apply server changes first, then clear what we pushed + advance cursor.
        useStore.getState().applyServerChanges(res.changes);
        useStore.getState().markSynced(pushedKeys, profilePushed, res.serverTime);
        return true;
      } catch (e) {
        useStore.getState().setSyncError(e instanceof Error ? e.message : 'sync failed');
        return false;
      } finally {
        useStore.getState().setSyncing(false);
        inFlight = null;
      }
    })();

    return inFlight;
  },

  async register(email: string, password: string, name: string): Promise<void> {
    const user = await ApiClient.register(email, password, name);
    // New account: push the user's current local data up, then reconcile.
    useStore.getState().markAllPending();
    useStore.getState().setAuth(user);
    await this.syncNow();
  },

  async login(email: string, password: string): Promise<void> {
    const user = await ApiClient.login(email, password);
    // Existing account: replace local data with what the server has.
    useStore.getState().clearForLogin();
    useStore.getState().setAuth(user);
    applyAuthUserSettings(user);
    await this.syncNow();
  },

  async logout(): Promise<void> {
    await ApiClient.logout();
    useStore.getState().clearForLogout();
  },

  /** Called on app launch: if a session exists, refresh and sync. */
  async bootstrap(): Promise<void> {
    if (!(await ApiClient.hasSession())) return;
    try {
      const user = await ApiClient.me();
      useStore.getState().setAuth(user);
    } catch {
      // Session invalid/expired — drop it and fall back to logged-out mode.
      await ApiClient.clearTokens();
      useStore.getState().setAuth(null);
      return;
    }
    await this.syncNow();
  },
};
