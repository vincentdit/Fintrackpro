import { addMinutes, formatISO, subDays } from 'date-fns';
import { Account, CurrencyCode, Transaction } from '@/types/models';
import { toMinor } from '@/utils/format';
import { BankSyncService, Institution, LinkResult } from './types';

/** Currency used by the mock provider's simulated accounts. */
const CURRENCY: CurrencyCode = 'TZS';

const INSTITUTIONS: Institution[] = [
  { id: 'ins_crdb', name: 'CRDB Bank', logo: '🏦', color: '#2E6BFF' },
  { id: 'ins_nmb', name: 'NMB Bank', logo: '🟠', color: '#E5A00D' },
  { id: 'ins_nbc', name: 'NBC', logo: '🔵', color: '#0EA5E9' },
  { id: 'ins_equity', name: 'Equity Bank', logo: '🟥', color: '#E5484D' },
  { id: 'ins_stanbic', name: 'Stanbic Bank', logo: '🔷', color: '#1AAE6F' },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const merchants = [
  { name: 'Shoprite', cat: 'cat-groceries', min: 30_000, max: 160_000 },
  { name: 'Bolt', cat: 'cat-transport', min: 8_000, max: 45_000 },
  { name: 'Java House', cat: 'cat-dining', min: 12_000, max: 40_000 },
  { name: 'Azam TV', cat: 'cat-entertainment', min: 35_000, max: 42_000 },
  { name: 'Puma Energy', cat: 'cat-transport', min: 40_000, max: 120_000 },
  { name: 'Jumia', cat: 'cat-entertainment', min: 15_000, max: 200_000 },
];

/** Whole-shilling random amount within [min, max]. */
function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

/**
 * A fully working, self-contained implementation used when
 * EXPO_PUBLIC_DATA_SOURCE=mock. It mimics realistic latency and returns
 * deterministic-enough data so the entire linked-account experience works
 * end to end with no backend or credentials.
 */
export class MockBankSyncService implements BankSyncService {
  async searchInstitutions(query: string): Promise<Institution[]> {
    await delay(350);
    const q = query.trim().toLowerCase();
    if (!q) return INSTITUTIONS;
    return INSTITUTIONS.filter((i) => i.name.toLowerCase().includes(q));
  }

  async linkInstitution(institutionId: string): Promise<LinkResult> {
    await delay(900);
    const institution =
      INSTITUTIONS.find((i) => i.id === institutionId) ?? INSTITUTIONS[0]!;
    const itemId = `item_${institutionId}_${Date.now().toString(36)}`;
    const accounts: Account[] = [
      {
        id: `${itemId}_chk`,
        name: `${institution.name} Current`,
        institution: institution.name,
        type: 'checking',
        balanceMinor: toMinor(randomBetween(800_000, 4_000_000)),
        currency: CURRENCY,
        linkedItemId: itemId,
        mask: String(Math.floor(1000 + Math.random() * 8999)),
        isLinked: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: `${itemId}_sav`,
        name: `${institution.name} Savings`,
        institution: institution.name,
        type: 'savings',
        balanceMinor: toMinor(randomBetween(2_000_000, 12_000_000)),
        currency: CURRENCY,
        linkedItemId: itemId,
        mask: String(Math.floor(1000 + Math.random() * 8999)),
        isLinked: true,
        createdAt: new Date().toISOString(),
      },
    ];
    return { itemId, institution, accounts };
  }

  async syncTransactions(itemId: string): Promise<Transaction[]> {
    await delay(700);
    const accountId = `${itemId}_chk`;
    const count = 4 + Math.floor(Math.random() * 4);
    const txns: Transaction[] = [];
    for (let i = 0; i < count; i++) {
      const m = merchants[Math.floor(Math.random() * merchants.length)]!;
      const amount = randomBetween(m.min, m.max);
      const when = addMinutes(subDays(new Date(), i), Math.floor(Math.random() * 600));
      txns.push({
        id: `imp_${itemId}_${i}_${Date.now().toString(36)}`,
        accountId,
        categoryId: m.cat,
        type: 'expense',
        amountMinor: toMinor(amount),
        currency: CURRENCY,
        description: m.name,
        merchant: m.name,
        date: formatISO(when, { representation: 'date' }),
        isImported: true,
        externalId: `${itemId}_${when.getTime()}_${m.name}`,
      });
    }
    return txns;
  }

  async refreshBalances(itemId: string): Promise<Account[]> {
    await delay(500);
    return [
      {
        id: `${itemId}_chk`,
        name: 'Current',
        institution: '',
        type: 'checking',
        balanceMinor: toMinor(randomBetween(800_000, 4_000_000)),
        currency: CURRENCY,
        linkedItemId: itemId,
        isLinked: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async unlink(_itemId: string): Promise<void> {
    await delay(300);
  }
}
