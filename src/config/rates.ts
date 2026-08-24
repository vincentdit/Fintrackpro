import { RatesTable } from '@/services/fx/types';

/**
 * Bundled fallback exchange rates (units per 1 USD), used before the first
 * live fetch and whenever the network is unavailable. Approximate values —
 * they are refreshed from a live source at runtime (see FxService).
 */
export const FALLBACK_RATES: RatesTable = {
  USD: 1,
  TZS: 2600,
  KES: 129,
  UGX: 3750,
  RWF: 1300,
  BIF: 2900,
  SSP: 1300,
  CDF: 2700,
  SOS: 571,
};
