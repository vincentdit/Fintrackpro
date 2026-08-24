import { CurrencyCode } from '@/types/models';

export interface CurrencyMeta {
  code: CurrencyCode;
  /** English display name. */
  name: string;
  /** Swahili display name. */
  nameSw: string;
  /** Country flag emoji for quick scanning. */
  flag: string;
  /** Fraction digits to show. Regional shillings/francs are shown whole. */
  decimals: 0 | 2;
  /** Locale used for Intl number formatting. */
  locale: string;
}

/** East African Community currencies plus USD, in display order. */
export const CURRENCIES: CurrencyMeta[] = [
  { code: 'TZS', name: 'Tanzanian Shilling', nameSw: 'Shilingi ya Tanzania', flag: '🇹🇿', decimals: 0, locale: 'sw-TZ' },
  { code: 'KES', name: 'Kenyan Shilling', nameSw: 'Shilingi ya Kenya', flag: '🇰🇪', decimals: 0, locale: 'en-KE' },
  { code: 'UGX', name: 'Ugandan Shilling', nameSw: 'Shilingi ya Uganda', flag: '🇺🇬', decimals: 0, locale: 'en-UG' },
  { code: 'RWF', name: 'Rwandan Franc', nameSw: 'Faranga ya Rwanda', flag: '🇷🇼', decimals: 0, locale: 'rw-RW' },
  { code: 'BIF', name: 'Burundian Franc', nameSw: 'Faranga ya Burundi', flag: '🇧🇮', decimals: 0, locale: 'fr-BI' },
  { code: 'SSP', name: 'South Sudanese Pound', nameSw: 'Pauni ya Sudan Kusini', flag: '🇸🇸', decimals: 2, locale: 'en-SS' },
  { code: 'CDF', name: 'Congolese Franc', nameSw: 'Faranga ya Kongo', flag: '🇨🇩', decimals: 2, locale: 'fr-CD' },
  { code: 'SOS', name: 'Somali Shilling', nameSw: 'Shilingi ya Somalia', flag: '🇸🇴', decimals: 0, locale: 'so-SO' },
  { code: 'USD', name: 'US Dollar', nameSw: 'Dola ya Marekani', flag: '🇺🇸', decimals: 2, locale: 'en-US' },
];

const byCode = new Map<CurrencyCode, CurrencyMeta>(CURRENCIES.map((c) => [c.code, c]));

const FALLBACK: CurrencyMeta = CURRENCIES[0]!;

export function currencyMeta(code: CurrencyCode): CurrencyMeta {
  return byCode.get(code) ?? FALLBACK;
}
