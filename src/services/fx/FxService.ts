import { CurrencyCode } from '@/types/models';
import { FALLBACK_RATES } from '@/config/rates';
import { RatesTable } from './types';

const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const ALL_CODES = Object.keys(FALLBACK_RATES) as CurrencyCode[];

interface ErApiResponse {
  result: string;
  rates: Record<string, number>;
}

/**
 * Fetches live USD-based exchange rates from a free, key-less provider
 * (open.er-api.com). Only the currencies the app supports are kept; any the
 * provider omits (or the whole request, on failure) fall back to bundled
 * rates so conversion always works offline.
 */
export const FxService = {
  async fetchRates(signal?: AbortSignal): Promise<RatesTable> {
    const res = await fetch(ENDPOINT, { signal });
    if (!res.ok) throw new Error(`FX request failed: ${res.status}`);
    const json = (await res.json()) as ErApiResponse;
    if (json.result !== 'success' || !json.rates) {
      throw new Error('FX response malformed');
    }
    const out = { ...FALLBACK_RATES };
    for (const code of ALL_CODES) {
      const rate = json.rates[code];
      if (typeof rate === 'number' && rate > 0) out[code] = rate;
    }
    return out;
  },
};
