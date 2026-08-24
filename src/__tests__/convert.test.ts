import { convert } from '@/utils/convert';
import { toMinor } from '@/utils/format';
import { totalBalance, monthlyExpenses } from '@/store/selectors';
import { RatesTable } from '@/services/fx/types';
import { Transaction } from '@/types/models';
import { formatISO } from 'date-fns';

// Simple, exact rates for deterministic assertions: 1 USD = 2500 TZS = 125 KES.
const R: RatesTable = {
  USD: 1,
  TZS: 2500,
  KES: 125,
  UGX: 3750,
  RWF: 1250,
  BIF: 2500,
  SSP: 1000,
  CDF: 2500,
  SOS: 500,
};

describe('currency conversion', () => {
  test('same-currency conversion is identity', () => {
    expect(convert(12345, 'TZS', 'TZS', R)).toBe(12345);
  });

  test('USD -> TZS multiplies by the rate', () => {
    // $100 -> 250,000 TZS
    expect(convert(toMinor(100), 'USD', 'TZS', R)).toBe(toMinor(250000));
  });

  test('TZS -> USD divides by the rate', () => {
    // 250,000 TZS -> $100
    expect(convert(toMinor(250000), 'TZS', 'USD', R)).toBe(toMinor(100));
  });

  test('cross rate TZS -> KES goes via USD', () => {
    // 2500 TZS = $1 = 125 KES
    expect(convert(toMinor(2500), 'TZS', 'KES', R)).toBe(toMinor(125));
  });

  test('missing rate fails safe (passthrough, never zeroes money)', () => {
    const partial = { USD: 1 } as unknown as RatesTable;
    expect(convert(999, 'TZS', 'USD', partial)).toBe(999);
  });
});

describe('mixed-currency aggregates convert to base', () => {
  test('net worth of USD + TZS accounts, shown in TZS', () => {
    const total = totalBalance(
      [
        { balanceMinor: toMinor(100), currency: 'USD' }, // = 250,000 TZS
        { balanceMinor: toMinor(50000), currency: 'TZS' },
      ],
      'TZS',
      R,
    );
    expect(total).toBe(toMinor(300000));
  });

  test('monthly expenses combine currencies into the base', () => {
    const today = formatISO(new Date(), { representation: 'date' });
    const tx = (currency: Transaction['currency'], major: number): Transaction => ({
      id: `${currency}-${major}`,
      accountId: 'a',
      categoryId: 'c',
      type: 'expense',
      amountMinor: toMinor(major),
      currency,
      description: 'x',
      date: today,
      isImported: false,
    });
    // $10 (=25,000 TZS) + 5,000 TZS = 30,000 TZS
    expect(monthlyExpenses([tx('USD', 10), tx('TZS', 5000)], 'TZS', R)).toBe(
      toMinor(30000),
    );
  });
});
