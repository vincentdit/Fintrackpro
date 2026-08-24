import { formatCurrency, toMajor, toMinor } from '@/utils/format';
import {
  budgetStatuses,
  expenseByCategory,
  monthlyExpenses,
  monthlyIncome,
  monthlyTrend,
  totalBalance,
} from '@/store/selectors';
import { Budget, Category, Transaction } from '@/types/models';
import { FALLBACK_RATES } from '@/config/rates';
import { formatISO } from 'date-fns';

const today = formatISO(new Date(), { representation: 'date' });
const R = FALLBACK_RATES;

const categories: Category[] = [
  { id: 'c-food', name: 'Food', icon: '🍎', color: '#000', kind: 'expense' },
  { id: 'c-pay', name: 'Pay', icon: '💼', color: '#000', kind: 'income' },
];

function expense(id: string, cat: string, major: number): Transaction {
  return {
    id,
    accountId: 'a1',
    categoryId: cat,
    type: 'expense',
    amountMinor: toMinor(major),
    currency: 'USD',
    description: id,
    date: today,
    isImported: false,
  };
}
function income(id: string, cat: string, major: number): Transaction {
  return { ...expense(id, cat, major), type: 'income' };
}

describe('money math', () => {
  test('minor/major conversions round-trip without float drift', () => {
    expect(toMinor(19.99)).toBe(1999);
    expect(toMajor(1999)).toBeCloseTo(19.99, 5);
    expect(toMinor(0.1 + 0.2)).toBe(30); // 0.30, not 0.30000000000000004
  });

  test('currency formatting is signed correctly', () => {
    expect(formatCurrency(-1999, 'USD')).toBe('-$19.99');
    expect(formatCurrency(1999, 'USD', { signed: true })).toBe('+$19.99');
  });

  test('zero-decimal currency (TZS) has no cents', () => {
    expect(formatCurrency(toMinor(1500), 'TZS')).not.toContain('.');
  });
});

describe('account + monthly aggregates', () => {
  test('totalBalance sums signed balances', () => {
    expect(
      totalBalance(
        [
          { balanceMinor: 5000, currency: 'USD' },
          { balanceMinor: -1500, currency: 'USD' },
        ],
        'USD',
        R,
      ),
    ).toBe(3500);
  });

  test('monthly income and expenses only count the current month', () => {
    const txns = [income('i1', 'c-pay', 100), expense('e1', 'c-food', 40)];
    expect(monthlyIncome(txns, 'USD', R)).toBe(toMinor(100));
    expect(monthlyExpenses(txns, 'USD', R)).toBe(toMinor(40));
  });
});

describe('budget health', () => {
  test('ratio and remaining reflect spend against the limit', () => {
    const budgets: Budget[] = [
      { id: 'b1', categoryId: 'c-food', limitMinor: toMinor(100), period: 'monthly', currency: 'USD', createdAt: today },
    ];
    const txns = [expense('e1', 'c-food', 60), expense('e2', 'c-food', 60)];
    const [status] = budgetStatuses(budgets, categories, txns, 'USD', R);
    expect(status).toBeDefined();
    expect(status!.spentMinor).toBe(toMinor(120));
    expect(status!.remainingMinor).toBe(toMinor(-20));
    expect(status!.ratio).toBeCloseTo(1.2, 5);
  });
});

describe('reporting selectors', () => {
  test('expenseByCategory ratios sum to ~1', () => {
    const txns = [expense('e1', 'c-food', 30), expense('e2', 'c-food', 70)];
    const slices = expenseByCategory(txns, categories, 'USD', R);
    const sum = slices.reduce((s, x) => s + x.ratio, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  test('monthlyTrend returns the requested number of buckets', () => {
    expect(monthlyTrend([], 'USD', R, 6)).toHaveLength(6);
  });
});
