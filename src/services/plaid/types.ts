import { Account, Transaction } from '@/types/models';

/** An institution the user can search for and link. */
export interface Institution {
  id: string;
  name: string;
  logo: string; // emoji stand-in for a real logo asset
  color: string;
}

/** Result of a completed link flow. */
export interface LinkResult {
  itemId: string;
  institution: Institution;
  accounts: Account[];
}

/**
 * BankSyncService is the seam between the app and any bank-aggregation
 * provider (Plaid, Tink, TrueLayer, MX, ...). The UI depends ONLY on this
 * interface, so providers can be swapped without touching screens.
 */
export interface BankSyncService {
  /** Search institutions the user can connect. */
  searchInstitutions(query: string): Promise<Institution[]>;

  /**
   * Run the link flow for an institution and return the linked item.
   * In a real Plaid integration this opens Plaid Link with a link_token
   * fetched from your backend, then exchanges the public_token server-side.
   */
  linkInstitution(institutionId: string): Promise<LinkResult>;

  /** Pull the latest transactions for a linked item since the last sync. */
  syncTransactions(itemId: string): Promise<Transaction[]>;

  /** Refresh balances for a linked item. */
  refreshBalances(itemId: string): Promise<Account[]>;

  /** Disconnect a linked item. */
  unlink(itemId: string): Promise<void>;
}
