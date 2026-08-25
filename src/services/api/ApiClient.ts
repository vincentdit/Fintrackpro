import { config } from '@/config/env';
import { secureStorage } from '@/data/storage';
import { AuthUser, SyncChanges, SyncPullResponse } from '@/services/sync/types';

const ACCESS_KEY = 'ftp.session.token';
const REFRESH_KEY = 'ftp.refresh.token';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await secureStorage.set(ACCESS_KEY, accessToken);
  await secureStorage.set(REFRESH_KEY, refreshToken);
}

async function rawFetch<T>(
  path: string,
  body?: unknown,
  accessToken?: string | null,
  method?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(json?.error || `Request failed (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json as T;
}

/** Exchange the stored refresh token for a fresh access + refresh pair. */
async function refreshAccess(): Promise<boolean> {
  const refreshToken = await secureStorage.get(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const r = await rawFetch<TokenPair>('/auth/refresh', { refreshToken });
    await storeTokens(r.accessToken, r.refreshToken);
    return true;
  } catch {
    // Refresh failed (expired/reused) — the session is over.
    await secureStorage.remove(ACCESS_KEY);
    await secureStorage.remove(REFRESH_KEY);
    return false;
  }
}

/** Authenticated request with one automatic refresh-and-retry on 401. */
async function authed<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const access = await secureStorage.get(ACCESS_KEY);
  try {
    return await rawFetch<T>(path, body, access, method);
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 401 && (await refreshAccess())) {
      const fresh = await secureStorage.get(ACCESS_KEY);
      return rawFetch<T>(path, body, fresh, method);
    }
    throw e;
  }
}

/**
 * Typed client for the FinTrackPro API. Access + refresh tokens live in
 * SecureStore; access tokens are short-lived and transparently refreshed.
 */
export const ApiClient = {
  async clearTokens(): Promise<void> {
    await secureStorage.remove(ACCESS_KEY);
    await secureStorage.remove(REFRESH_KEY);
  },
  /** A session exists if we hold a refresh token. */
  async hasSession(): Promise<boolean> {
    return (await secureStorage.get(REFRESH_KEY)) !== null;
  },

  async register(email: string, password: string, name: string): Promise<AuthUser> {
    const r = await rawFetch<TokenPair>('/auth/register', { email, password, name });
    await storeTokens(r.accessToken, r.refreshToken);
    return r.user;
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const r = await rawFetch<TokenPair>('/auth/login', { email, password });
    await storeTokens(r.accessToken, r.refreshToken);
    return r.user;
  },

  async logout(): Promise<void> {
    const refreshToken = await secureStorage.get(REFRESH_KEY);
    if (refreshToken) {
      await rawFetch('/auth/logout', { refreshToken }).catch(() => {});
    }
    await this.clearTokens();
  },

  me(): Promise<AuthUser> {
    return authed<{ user: AuthUser }>('/auth/me').then((r) => r.user);
  },

  /** Permanently delete the account on the server, then clear local tokens. */
  async deleteAccount(): Promise<void> {
    await authed('/auth/account', undefined, 'DELETE');
    await this.clearTokens();
  },

  sync(lastPulledAt: string | null, changes: SyncChanges): Promise<SyncPullResponse> {
    return authed<SyncPullResponse>('/sync', { lastPulledAt, changes });
  },
};
