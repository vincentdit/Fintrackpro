import { CurrencyCode } from '@/types/models';

/**
 * Exchange rates expressed as "units of the currency per 1 USD".
 * e.g. { USD: 1, TZS: 2600, KES: 129 } means 1 USD = 2,600 TZS = 129 KES.
 */
export type RatesTable = Record<CurrencyCode, number>;

export interface FxSnapshot {
  rates: RatesTable;
  /** ISO timestamp of when these rates were fetched, or null for bundled. */
  updatedAt: string | null;
}
