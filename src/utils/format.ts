import { CurrencyCode } from '@/types/models';
import { currencyMeta } from '@/config/currencies';

/** Minor units (cents) -> major units. */
export function toMajor(amountMinor: number): number {
  return amountMinor / 100;
}

/** Major units -> minor units, rounded to avoid float drift. */
export function toMinor(amountMajor: number): number {
  return Math.round(amountMajor * 100);
}

export function formatCurrency(
  amountMinor: number,
  currency: CurrencyCode,
  opts: { signed?: boolean } = {},
): string {
  const meta = currencyMeta(currency);
  const value = toMajor(Math.abs(amountMinor));
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(value);
  } catch {
    // Some runtimes lack ICU data for a locale/currency; fall back gracefully.
    formatted = `${currency} ${value.toLocaleString(undefined, {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    })}`;
  }

  if (opts.signed) {
    const sign = amountMinor < 0 ? '-' : '+';
    return `${sign}${formatted}`;
  }
  return amountMinor < 0 ? `-${formatted}` : formatted;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
