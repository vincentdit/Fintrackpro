import {
  eachMonthOfInterval,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  subMonths,
} from 'date-fns';
import {
  Account,
  Budget,
  BudgetStatus,
  Category,
  CurrencyCode,
  Transaction,
} from '@/types/models';
import { RatesTable } from '@/services/fx/types';
import { convert } from '@/utils/convert';

/**
 * All aggregate selectors convert each record from its own currency into the
 * user's `base` currency using `rates`, so totals across mixed-currency
 * accounts and transactions are correct.
 */

/** Sum of all (non-deleted) account balances, converted to the base currency. */
export function totalBalance(
  accounts: Pick<Account, 'balanceMinor' | 'currency' | 'deleted'>[],
  base: CurrencyCode,
  rates: RatesTable,
): number {
  return accounts
    .filter((a) => !a.deleted)
    .reduce((sum, a) => sum + convert(a.balanceMinor, a.currency, base, rates), 0);
}

/** Active (non-deleted) transactions — the base for every aggregate. */
function active(transactions: Transaction[]): Transaction[] {
  return transactions.filter((t) => !t.deleted);
}

function inCurrentMonth(dateISO: string): boolean {
  return isSameMonth(new Date(dateISO), new Date());
}

export function monthlyIncome(
  transactions: Transaction[],
  base: CurrencyCode,
  rates: RatesTable,
): number {
  return active(transactions)
    .filter((t) => t.type === 'income' && inCurrentMonth(t.date))
    .reduce((s, t) => s + convert(t.amountMinor, t.currency, base, rates), 0);
}

export function monthlyExpenses(
  transactions: Transaction[],
  base: CurrencyCode,
  rates: RatesTable,
): number {
  return active(transactions)
    .filter((t) => t.type === 'expense' && inCurrentMonth(t.date))
    .reduce((s, t) => s + convert(t.amountMinor, t.currency, base, rates), 0);
}

/** Spend for a budget's category/period, converted to the base currency. */
function spentForBudget(
  budget: Budget,
  transactions: Transaction[],
  base: CurrencyCode,
  rates: RatesTable,
): number {
  const now = new Date();
  return active(transactions)
    .filter((t) => {
      if (t.categoryId !== budget.categoryId || t.type !== 'expense') return false;
      const d = new Date(t.date);
      if (budget.period === 'monthly') return isSameMonth(d, now);
      if (budget.period === 'yearly') return d.getFullYear() === now.getFullYear();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return isWithinInterval(d, { start: weekAgo, end: now });
    })
    .reduce((s, t) => s + convert(t.amountMinor, t.currency, base, rates), 0);
}

export function budgetStatuses(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  base: CurrencyCode,
  rates: RatesTable,
): BudgetStatus[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  return budgets
    .filter((b) => !b.deleted)
    .map((budget) => {
      const category = catById.get(budget.categoryId);
      if (!category) return null;
      const spentMinor = spentForBudget(budget, transactions, base, rates);
      const limitMinor = convert(budget.limitMinor, budget.currency, base, rates);
      const remainingMinor = limitMinor - spentMinor;
      const ratio = limitMinor > 0 ? spentMinor / limitMinor : 0;
      // Report the budget in base currency so the UI shows a single currency.
      const budgetInBase: Budget = { ...budget, limitMinor, currency: base };
      return { budget: budgetInBase, category, spentMinor, remainingMinor, ratio };
    })
    .filter((x): x is BudgetStatus => x !== null)
    .sort((a, b) => b.ratio - a.ratio);
}

export interface CategorySlice {
  category: Category;
  amountMinor: number;
  ratio: number;
}

/** Expense breakdown by category (current month), converted to base. */
export function expenseByCategory(
  transactions: Transaction[],
  categories: Category[],
  base: CurrencyCode,
  rates: RatesTable,
): CategorySlice[] {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();
  for (const t of active(transactions)) {
    if (t.type !== 'expense' || !inCurrentMonth(t.date)) continue;
    const amt = convert(t.amountMinor, t.currency, base, rates);
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + amt);
  }
  const grand = Array.from(totals.values()).reduce((s, v) => s + v, 0) || 1;
  return Array.from(totals.entries())
    .map(([catId, amountMinor]) => {
      const category = catById.get(catId);
      if (!category) return null;
      return { category, amountMinor, ratio: amountMinor / grand };
    })
    .filter((x): x is CategorySlice => x !== null)
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

export interface MonthlyPoint {
  label: string;
  income: number;
  expense: number;
}

/** Income vs expense trend over the last `months` months, converted to base. */
export function monthlyTrend(
  transactions: Transaction[],
  base: CurrencyCode,
  rates: RatesTable,
  months = 6,
): MonthlyPoint[] {
  const end = new Date();
  const start = startOfMonth(subMonths(end, months - 1));
  const buckets = eachMonthOfInterval({ start, end });
  const tx = active(transactions);
  return buckets.map((monthDate) => {
    const inMonth = tx.filter((t) => isSameMonth(new Date(t.date), monthDate));
    const income = inMonth
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + convert(t.amountMinor, t.currency, base, rates), 0);
    const expense = inMonth
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + convert(t.amountMinor, t.currency, base, rates), 0);
    return {
      label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      income,
      expense,
    };
  });
}
