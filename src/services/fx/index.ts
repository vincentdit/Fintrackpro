import { useStore } from '@/store/useStore';
import { FxService } from './FxService';

/**
 * Fetches the latest rates and writes them into the store. Returns true on
 * success; on any failure the existing (bundled or last-fetched) rates are
 * kept and false is returned. Never throws.
 */
export async function refreshRates(): Promise<boolean> {
  try {
    const rates = await FxService.fetchRates();
    useStore.getState().setRates(rates);
    return true;
  } catch {
    return false;
  }
}

export { FxService } from './FxService';
export * from './types';
