import { en, sw, TKey, translate } from '@/i18n/translations';
import { CURRENCIES, currencyMeta } from '@/config/currencies';
import { formatCurrency, toMinor } from '@/utils/format';

describe('i18n catalogs', () => {
  test('Swahili provides every English key, non-empty', () => {
    for (const key of Object.keys(en) as TKey[]) {
      expect(typeof sw[key]).toBe('string');
      expect(sw[key].length).toBeGreaterThan(0);
    }
  });

  test('translate falls back to English for the base language', () => {
    expect(translate('en', 'common.add')).toBe('Add');
    expect(translate('sw', 'common.add')).toBe('Ongeza');
  });

  test('translate interpolates variables', () => {
    expect(translate('en', 'accounts.syncImported', { count: 3 })).toContain('3');
    expect(translate('sw', 'accounts.syncImported', { count: 5 })).toContain('5');
  });
});

describe('East African currencies', () => {
  test('covers the EAC members plus USD', () => {
    const codes = CURRENCIES.map((c) => c.code);
    for (const code of ['TZS', 'KES', 'UGX', 'RWF', 'BIF', 'SSP', 'CDF', 'SOS', 'USD']) {
      expect(codes).toContain(code);
    }
  });

  test('shilling/franc currencies format without decimals', () => {
    expect(currencyMeta('UGX').decimals).toBe(0);
    expect(formatCurrency(toMinor(50000), 'UGX')).not.toContain('.');
    expect(formatCurrency(toMinor(1200), 'KES')).not.toContain('.');
  });

  test('USD keeps two decimals and a leading symbol', () => {
    expect(formatCurrency(toMinor(19.99), 'USD')).toBe('$19.99');
  });
});
