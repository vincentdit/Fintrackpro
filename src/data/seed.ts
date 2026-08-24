import { addDays, formatISO, subDays } from 'date-fns';
import {
  Account,
  Budget,
  Category,
  CurrencyCode,
  Goal,
  Transaction,
  UserProfile,
} from '@/types/models';
import { toMinor } from '@/utils/format';

/** Default currency for the app and all seeded sample data. */
export const DEFAULT_CURRENCY: CurrencyCode = 'TZS';

const now = new Date();
const iso = (d: Date) => formatISO(d, { representation: 'date' });

export const seedUser: UserProfile = {
  id: 'user-1',
  name: 'Vincent Maro',
  email: 'vincent@example.com',
  baseCurrency: DEFAULT_CURRENCY,
  language: 'sw',
  biometricEnabled: false,
};

export const seedCategories: Category[] = [
  { id: 'cat-salary', name: 'Salary', icon: '💼', color: '#1AAE6F', kind: 'income' },
  { id: 'cat-freelance', name: 'Freelance', icon: '🧑‍💻', color: '#33C88A', kind: 'income' },
  { id: 'cat-groceries', name: 'Groceries', icon: '🛒', color: '#4C82FF', kind: 'expense' },
  { id: 'cat-dining', name: 'Dining', icon: '🍽️', color: '#E5A00D', kind: 'expense' },
  { id: 'cat-transport', name: 'Transport', icon: '🚗', color: '#8B5CF6', kind: 'expense' },
  { id: 'cat-rent', name: 'Rent', icon: '🏠', color: '#E5484D', kind: 'expense' },
  { id: 'cat-utilities', name: 'Utilities', icon: '💡', color: '#0EA5E9', kind: 'expense' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: '🎬', color: '#EC4899', kind: 'expense' },
  { id: 'cat-health', name: 'Health', icon: '🩺', color: '#14B8A6', kind: 'expense' },
];

export const seedAccounts: Account[] = [
  {
    id: 'acc-checking',
    name: 'Everyday Account',
    institution: 'CRDB Bank',
    type: 'checking',
    balanceMinor: toMinor(3_250_000),
    currency: DEFAULT_CURRENCY,
    mask: '4021',
    isLinked: false,
    createdAt: iso(subDays(now, 120)),
  },
  {
    id: 'acc-savings',
    name: 'Rainy Day Savings',
    institution: 'CRDB Bank',
    type: 'savings',
    balanceMinor: toMinor(8_500_000),
    currency: DEFAULT_CURRENCY,
    mask: '8890',
    isLinked: false,
    createdAt: iso(subDays(now, 120)),
  },
  {
    id: 'acc-credit',
    name: 'Rewards Card',
    institution: 'NMB Bank',
    type: 'credit',
    balanceMinor: toMinor(-420_000),
    currency: DEFAULT_CURRENCY,
    mask: '1177',
    isLinked: false,
    createdAt: iso(subDays(now, 90)),
  },
];

function tx(
  id: string,
  accountId: string,
  categoryId: string,
  type: Transaction['type'],
  amountMajor: number,
  description: string,
  daysAgo: number,
  merchant?: string,
): Transaction {
  return {
    id,
    accountId,
    categoryId,
    type,
    amountMinor: toMinor(amountMajor),
    currency: DEFAULT_CURRENCY,
    description,
    merchant,
    date: iso(subDays(now, daysAgo)),
    isImported: false,
  };
}

export const seedTransactions: Transaction[] = [
  tx('t1', 'acc-checking', 'cat-salary', 'income', 2_800_000, 'Monthly salary', 2, 'Kilimo Ltd'),
  tx('t2', 'acc-checking', 'cat-groceries', 'expense', 85_000, 'Weekly groceries', 3, 'Shoprite'),
  tx('t3', 'acc-credit', 'cat-dining', 'expense', 45_000, 'Dinner out', 4, 'The Slow Leopard'),
  tx('t4', 'acc-checking', 'cat-rent', 'expense', 750_000, 'House rent', 5, 'Masaki Apartments'),
  tx('t5', 'acc-checking', 'cat-transport', 'expense', 60_000, 'Fuel', 6, 'Puma Energy'),
  tx('t6', 'acc-credit', 'cat-entertainment', 'expense', 16_000, 'Streaming', 7, 'Netflix'),
  tx('t7', 'acc-checking', 'cat-utilities', 'expense', 95_000, 'Electricity (LUKU)', 9, 'TANESCO'),
  tx('t8', 'acc-checking', 'cat-freelance', 'income', 650_000, 'Design project', 10, 'Studio Nine'),
  tx('t9', 'acc-credit', 'cat-groceries', 'expense', 54_000, 'Groceries', 11, 'Shoprite'),
  tx('t10', 'acc-checking', 'cat-health', 'expense', 40_000, 'Pharmacy', 12, 'Pharmax'),
  tx('t11', 'acc-credit', 'cat-dining', 'expense', 18_000, 'Lunch', 14, 'Java House'),
  tx('t12', 'acc-checking', 'cat-transport', 'expense', 12_000, 'Ride', 16, 'Bolt'),
];

export const seedBudgets: Budget[] = [
  { id: 'b-groceries', categoryId: 'cat-groceries', limitMinor: toMinor(400_000), period: 'monthly', currency: DEFAULT_CURRENCY, createdAt: iso(subDays(now, 60)) },
  { id: 'b-dining', categoryId: 'cat-dining', limitMinor: toMinor(200_000), period: 'monthly', currency: DEFAULT_CURRENCY, createdAt: iso(subDays(now, 60)) },
  { id: 'b-transport', categoryId: 'cat-transport', limitMinor: toMinor(150_000), period: 'monthly', currency: DEFAULT_CURRENCY, createdAt: iso(subDays(now, 60)) },
  { id: 'b-entertainment', categoryId: 'cat-entertainment', limitMinor: toMinor(80_000), period: 'monthly', currency: DEFAULT_CURRENCY, createdAt: iso(subDays(now, 60)) },
];

export const seedGoals: Goal[] = [
  { id: 'g-emergency', name: 'Emergency Fund', icon: '🛟', targetMinor: toMinor(10_000_000), savedMinor: toMinor(6_400_000), currency: DEFAULT_CURRENCY, targetDate: iso(addDays(now, 180)), createdAt: iso(subDays(now, 200)) },
  { id: 'g-trip', name: 'Trip to Zanzibar', icon: '🏝️', targetMinor: toMinor(3_500_000), savedMinor: toMinor(1_250_000), currency: DEFAULT_CURRENCY, targetDate: iso(addDays(now, 300)), createdAt: iso(subDays(now, 40)) },
  { id: 'g-laptop', name: 'New Laptop', icon: '💻', targetMinor: toMinor(2_200_000), savedMinor: toMinor(900_000), currency: DEFAULT_CURRENCY, createdAt: iso(subDays(now, 30)) },
];
