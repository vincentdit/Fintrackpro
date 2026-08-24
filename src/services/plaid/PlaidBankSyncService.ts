import { Account, Transaction } from '@/types/models';
import { config } from '@/config/env';
import { secureStorage } from '@/data/storage';
import { BankSyncService, Institution, LinkResult } from './types';

/**
 * Real provider implementation that talks to YOUR backend, which in turn
 * talks to Plaid. This class NEVER sees the Plaid client_secret — that lives
 * only on the server. The client flow is:
 *
 *   1. App asks backend for a `link_token`  (POST /plaid/link-token)
 *   2. App opens Plaid Link (react-native-plaid-link-sdk) with that token
 *   3. Plaid Link returns a short-lived `public_token`
 *   4. App sends public_token to backend (POST /plaid/exchange)
 *   5. Backend exchanges it for an access_token, stores it server-side,
 *      and returns a safe `itemId` + account metadata to the app
 *   6. All later syncs go app -> backend -> Plaid, keyed by itemId
 *
 * The methods below implement steps 1 and 4-onward against your backend.
 * Step 2/3 (opening Plaid Link UI) is wired in LinkAccountScreen behind the
 * same interface. This file is intentionally dependency-free so it compiles
 * in the prototype; add `react-native-plaid-link-sdk` when you go live.
 */
export class PlaidBankSyncService implements BankSyncService {
  private base = config.apiBaseUrl;

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await secureStorage.get('ftp.session.token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      ...init,
      headers: { ...(await this.authHeaders()), ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`BankSync request failed (${res.status}): ${body}`);
    }
    return (await res.json()) as T;
  }

  searchInstitutions(query: string): Promise<Institution[]> {
    return this.request<Institution[]>(
      `/plaid/institutions?query=${encodeURIComponent(query)}`,
    );
  }

  /**
   * Requests a link_token from the backend. The actual Plaid Link UI is
   * opened by the screen; on success it calls `exchangePublicToken`.
   */
  async createLinkToken(): Promise<{ linkToken: string }> {
    return this.request<{ linkToken: string }>(`/plaid/link-token`, {
      method: 'POST',
      body: JSON.stringify({ env: config.plaidEnv }),
    });
  }

  async exchangePublicToken(publicToken: string): Promise<LinkResult> {
    return this.request<LinkResult>(`/plaid/exchange`, {
      method: 'POST',
      body: JSON.stringify({ publicToken }),
    });
  }

  /** Not used directly for Plaid (link needs the SDK); throws to signal that. */
  linkInstitution(): Promise<LinkResult> {
    throw new Error(
      'For Plaid, open Plaid Link with createLinkToken(), then call exchangePublicToken().',
    );
  }

  syncTransactions(itemId: string): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/plaid/items/${itemId}/transactions/sync`, {
      method: 'POST',
    });
  }

  refreshBalances(itemId: string): Promise<Account[]> {
    return this.request<Account[]>(`/plaid/items/${itemId}/balances`);
  }

  unlink(itemId: string): Promise<void> {
    return this.request<void>(`/plaid/items/${itemId}`, { method: 'DELETE' });
  }
}
