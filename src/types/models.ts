/**
 * Core domain models for FinTrackPro.
 * These are the single source of truth for the shapes used across the app,
 * the state store, and the service layer.
 */

export type ID = string;

/**
 * Supported currencies: the East African Community members plus USD, which is
 * widely used across the region.
 */
export type CurrencyCode =
  | 'TZS' // Tanzanian Shilling
  | 'KES' // Kenyan Shilling
  | 'UGX' // Ugandan Shilling
  | 'RWF' // Rwandan Franc
  | 'BIF' // Burundian Franc
  | 'SSP' // South Sudanese Pound
  | 'CDF' // Congolese Franc
  | 'SOS' // Somali Shilling
  | 'USD'; // US Dollar

/** UI language. */
export type Language = 'en' | 'sw';

export type TransactionType = 'income' | 'expense';

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment';

/**
 * Fields every syncable record carries. `updatedAt` (ISO) is stamped on each
 * local mutation and drives last-write-wins during sync; `deleted` is a
 * soft-delete tombstone so deletions propagate to other devices.
 */
export interface Syncable {
  updatedAt?: string;
  deleted?: boolean;
}

/** The syncable entity kinds, used as the sync record `kind`. */
export type EntityKind = 'account' | 'transaction' | 'budget' | 'goal' | 'category';

/** A financial account, either created manually or linked via a bank aggregator. */
export interface Account extends Syncable {
  id: ID;
  name: string;
  institution: string;
  type: AccountType;
  /** Current balance in minor units (cents) to avoid floating-point drift. */
  balanceMinor: number;
  currency: CurrencyCode;
  /** Present only for accounts linked through the aggregator (e.g. Plaid). */
  linkedItemId?: string;
  /** Last 4 digits, for display only. */
  mask?: string;
  isLinked: boolean;
  createdAt: string; // ISO date
}

export interface Category extends Syncable {
  id: ID;
  name: string;
  /** Emoji or icon key used for quick visual scanning. */
  icon: string;
  color: string;
  kind: TransactionType;
  /** Manual sort position within its kind (lower = earlier). */
  order?: number;
}

export interface Transaction extends Syncable {
  id: ID;
  accountId: ID;
  categoryId: ID;
  type: TransactionType;
  /** Signed amount in minor units. Positive for income, positive magnitude for expense. */
  amountMinor: number;
  currency: CurrencyCode;
  description: string;
  merchant?: string;
  date: string; // ISO date
  /** True when imported from a linked account rather than entered by hand. */
  isImported: boolean;
  /** When linked, the aggregator's stable transaction id (for de-duplication). */
  externalId?: string;
  notes?: string;
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget extends Syncable {
  id: ID;
  categoryId: ID;
  /** Budgeted limit in minor units for one period. */
  limitMinor: number;
  period: BudgetPeriod;
  currency: CurrencyCode;
  createdAt: string;
}

export interface Goal extends Syncable {
  id: ID;
  name: string;
  icon: string;
  targetMinor: number;
  savedMinor: number;
  currency: CurrencyCode;
  /** Optional target date (ISO). */
  targetDate?: string;
  createdAt: string;
}

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  baseCurrency: CurrencyCode;
  language: Language;
  biometricEnabled: boolean;
}

/** Snapshot of computed budget health for a single category/period. */
export interface BudgetStatus {
  budget: Budget;
  category: Category;
  spentMinor: number;
  remainingMinor: number;
  /** 0..1+, where > 1 means over budget. */
  ratio: number;
}
