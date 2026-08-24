import { CurrencyCode } from '@/types/models';
import { RatesTable } from '@/services/fx/types';

/**
 * Convert an amount (in minor units) from one currency to another.
 *
 * All amounts in the app are stored as integer minor units scaled by 100,
 * uniformly across currencies, so the ×100 factor cancels and conversion is a
 * pure ratio of the per-USD rates. If a rate is missing the amount passes
 * through unchanged (fail-safe rather than zeroing money).
 */
export function convert(
  amountMinor: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: RatesTable,
): number {
  if (from === to) return amountMinor;
  const rateFrom = rates[from];
  const rateTo = rates[to];
  if (!rateFrom || !rateTo) return amountMinor;
  return Math.round(amountMinor * (rateTo / rateFrom));
}
