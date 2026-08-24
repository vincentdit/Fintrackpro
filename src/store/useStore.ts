import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Account,
  Budget,
  Category,
  EntityKind,
  Goal,
  Transaction,
  TransactionType,
  UserProfile,
} from '@/types/models';
import { zustandStorage } from '@/data/storage';
import {
  seedAccounts,
  seedBudgets,
  seedCategories,
  seedGoals,
  seedTransactions,
  seedUser,
} from '@/data/seed';
import { RatesTable } from '@/services/fx/types';
import { FALLBACK_RATES } from '@/config/rates';
import {
  AuthUser,
  ProfileChange,
  RecordChange,
  SyncChanges,
} from '@/services/sync/types';
import { mergeById } from './merge';

let idCounter = 0;
function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

const nowISO = () => new Date().toISOString();
const key = (kind: EntityKind, id: string) => `${kind}:${id}`;

export interface AppState {
  hydrated: boolean;
  user: UserProfile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];

  // --- fx rates (units per 1 USD) ---
  fxRates: RatesTable;
  fxUpdatedAt: string | null;
  setRates: (rates: RatesTable) => void;

  // --- sync + auth ---
  auth: AuthUser | null;
  pending: Record<string, true>;
  profileDirty: boolean;
  profileUpdatedAt: string;
  lastPulledAt: string | null;
  lastSyncAt: string | null;
  syncing: boolean;
  syncError: string | null;

  setAuth: (user: AuthUser | null) => void;
  setSyncing: (v: boolean) => void;
  setSyncError: (msg: string | null) => void;
  markAllPending: () => void;
  clearForLogin: () => void;
  clearForLogout: () => void;
  collectPending: () => SyncChanges;
  applyServerChanges: (changes: SyncChanges) => void;
  markSynced: (pushedKeys: string[], profilePushed: boolean, serverTime: string) => void;

  // --- transactions ---
  addTransaction: (input: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // --- accounts ---
  addAccount: (input: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  upsertLinkedAccounts: (accounts: Account[]) => void;
  importTransactions: (txns: Transaction[]) => number;

  // --- budgets ---
  upsertBudget: (input: Omit<Budget, 'id' | 'createdAt'> & { id?: string }) => void;
  deleteBudget: (id: string) => void;

  // --- goals ---
  upsertGoal: (input: Omit<Goal, 'id' | 'createdAt'> & { id?: string }) => void;
  contributeToGoal: (id: string, amountMinor: number) => void;
  deleteGoal: (id: string) => void;

  // --- categories ---
  upsertCategory: (input: Omit<Category, 'id'> & { id?: string }) => void;
  deleteCategory: (id: string) => void;
  mergeCategory: (sourceId: string, targetId: string) => void;
  reorderCategories: (kind: TransactionType, orderedIds: string[]) => void;

  // --- profile ---
  updateProfile: (patch: Partial<UserProfile>) => void;

  resetToSeed: () => void;
}

function applyBalance(accounts: Account[], accountId: string, deltaMinor: number, stamp: string): Account[] {
  return accounts.map((a) =>
    a.id === accountId
      ? { ...a, balanceMinor: a.balanceMinor + deltaMinor, updatedAt: stamp }
      : a,
  );
}

function balanceDelta(t: Pick<Transaction, 'type' | 'amountMinor'>): number {
  return t.type === 'income' ? t.amountMinor : -t.amountMinor;
}

/** Add keys to the pending map immutably. */
function withPending(pending: Record<string, true>, ...keys: string[]): Record<string, true> {
  const next = { ...pending };
  for (const k of keys) next[k] = true;
  return next;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: seedUser,
      accounts: seedAccounts,
      categories: seedCategories,
      transactions: seedTransactions,
      budgets: seedBudgets,
      goals: seedGoals,

      fxRates: FALLBACK_RATES,
      fxUpdatedAt: null,
      setRates: (rates) => set({ fxRates: rates, fxUpdatedAt: nowISO() }),

      auth: null,
      pending: {},
      profileDirty: false,
      profileUpdatedAt: nowISO(),
      lastPulledAt: null,
      lastSyncAt: null,
      syncing: false,
      syncError: null,

      setAuth: (user) => set({ auth: user }),
      setSyncing: (v) => set({ syncing: v }),
      setSyncError: (msg) => set({ syncError: msg }),

      markAllPending: () => {
        const s = get();
        const stamp = nowISO();
        const pending: Record<string, true> = {};
        const stampAll = <T extends { id: string; updatedAt?: string }>(arr: T[], kind: EntityKind) =>
          arr.map((e) => {
            pending[key(kind, e.id)] = true;
            return e.updatedAt ? e : { ...e, updatedAt: stamp };
          });
        set({
          accounts: stampAll(s.accounts, 'account'),
          transactions: stampAll(s.transactions, 'transaction'),
          budgets: stampAll(s.budgets, 'budget'),
          goals: stampAll(s.goals, 'goal'),
          categories: stampAll(s.categories, 'category'),
          pending,
          profileDirty: true,
          profileUpdatedAt: stamp,
        });
      },

      clearForLogin: () =>
        set({
          accounts: [],
          transactions: [],
          budgets: [],
          goals: [],
          // Keep the seed categories as a base; the server's categories merge
          // on top by id, so an account created before category-sync still has
          // a usable set rather than none.
          categories: seedCategories,
          pending: {},
          profileDirty: false,
          lastPulledAt: null,
          syncError: null,
        }),

      clearForLogout: () =>
        set({
          user: seedUser,
          accounts: seedAccounts,
          categories: seedCategories,
          transactions: seedTransactions,
          budgets: seedBudgets,
          goals: seedGoals,
          auth: null,
          pending: {},
          profileDirty: false,
          profileUpdatedAt: nowISO(),
          lastPulledAt: null,
          lastSyncAt: null,
          syncError: null,
        }),

      collectPending: () => {
        const s = get();
        const byKind: Record<EntityKind, { id: string; updatedAt?: string; deleted?: boolean }[]> = {
          account: s.accounts,
          transaction: s.transactions,
          budget: s.budgets,
          goal: s.goals,
          category: s.categories,
        };
        const records: RecordChange[] = [];
        for (const k of Object.keys(s.pending)) {
          const [kind, id] = k.split(':') as [EntityKind, string];
          const entity = byKind[kind]?.find((e) => e.id === id);
          if (!entity) continue;
          records.push({
            kind,
            id,
            data: entity as unknown as Record<string, unknown>,
            updatedAt: entity.updatedAt ?? nowISO(),
            deleted: !!entity.deleted,
          });
        }
        const profile: ProfileChange | undefined = s.profileDirty
          ? {
              name: s.user.name,
              settings: {
                baseCurrency: s.user.baseCurrency,
                language: s.user.language,
                biometricEnabled: s.user.biometricEnabled,
              },
              updatedAt: s.profileUpdatedAt,
            }
          : undefined;
        return { records, profile: profile ?? null };
      },

      applyServerChanges: (changes) => {
        const s = get();
        const recs = changes.records ?? [];
        const patch: Partial<AppState> = {
          accounts: mergeById(s.accounts, recs.filter((r) => r.kind === 'account')),
          transactions: mergeById(s.transactions, recs.filter((r) => r.kind === 'transaction')),
          budgets: mergeById(s.budgets, recs.filter((r) => r.kind === 'budget')),
          goals: mergeById(s.goals, recs.filter((r) => r.kind === 'goal')),
          categories: mergeById(s.categories, recs.filter((r) => r.kind === 'category')),
        };

        const p = changes.profile;
        if (p && (p.updatedAt ?? '') >= s.profileUpdatedAt) {
          patch.user = {
            ...s.user,
            name: p.name || s.user.name,
            baseCurrency: p.settings.baseCurrency ?? s.user.baseCurrency,
            language: p.settings.language ?? s.user.language,
            biometricEnabled: p.settings.biometricEnabled ?? s.user.biometricEnabled,
          };
          patch.profileUpdatedAt = p.updatedAt;
        }
        set(patch);
      },

      markSynced: (pushedKeys, profilePushed, serverTime) => {
        set((s) => {
          const pending = { ...s.pending };
          for (const k of pushedKeys) delete pending[k];
          return {
            pending,
            profileDirty: profilePushed ? false : s.profileDirty,
            lastPulledAt: serverTime,
            lastSyncAt: nowISO(),
            syncError: null,
          };
        });
      },

      addTransaction: (input) => {
        const stamp = nowISO();
        const t: Transaction = { ...input, id: makeId('t'), updatedAt: stamp, deleted: false };
        set((s) => ({
          transactions: [t, ...s.transactions],
          accounts: applyBalance(s.accounts, t.accountId, balanceDelta(t), stamp),
          pending: withPending(s.pending, key('transaction', t.id), key('account', t.accountId)),
        }));
      },

      updateTransaction: (id, patch) => {
        const stamp = nowISO();
        set((s) => {
          const existing = s.transactions.find((t) => t.id === id);
          if (!existing) return s;
          const updated: Transaction = { ...existing, ...patch, updatedAt: stamp };
          let accounts = applyBalance(s.accounts, existing.accountId, -balanceDelta(existing), stamp);
          accounts = applyBalance(accounts, updated.accountId, balanceDelta(updated), stamp);
          return {
            transactions: s.transactions.map((t) => (t.id === id ? updated : t)),
            accounts,
            pending: withPending(
              s.pending,
              key('transaction', id),
              key('account', existing.accountId),
              key('account', updated.accountId),
            ),
          };
        });
      },

      deleteTransaction: (id) => {
        const stamp = nowISO();
        set((s) => {
          const existing = s.transactions.find((t) => t.id === id);
          if (!existing) return s;
          return {
            transactions: s.transactions.map((t) =>
              t.id === id ? { ...t, deleted: true, updatedAt: stamp } : t,
            ),
            accounts: applyBalance(s.accounts, existing.accountId, -balanceDelta(existing), stamp),
            pending: withPending(s.pending, key('transaction', id), key('account', existing.accountId)),
          };
        });
      },

      addAccount: (input) => {
        const stamp = nowISO();
        const a: Account = { ...input, id: makeId('acc'), createdAt: stamp, updatedAt: stamp, deleted: false };
        set((s) => ({ accounts: [...s.accounts, a], pending: withPending(s.pending, key('account', a.id)) }));
      },

      updateAccount: (id, patch) => {
        const stamp = nowISO();
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: stamp } : a)),
          pending: withPending(s.pending, key('account', id)),
        }));
      },

      deleteAccount: (id) => {
        const stamp = nowISO();
        set((s) => {
          let pending = withPending(s.pending, key('account', id));
          // Soft-delete the account and its transactions so totals stay correct.
          const transactions = s.transactions.map((tx) => {
            if (tx.accountId === id && !tx.deleted) {
              pending = withPending(pending, key('transaction', tx.id));
              return { ...tx, deleted: true, updatedAt: stamp };
            }
            return tx;
          });
          return {
            accounts: s.accounts.map((a) => (a.id === id ? { ...a, deleted: true, updatedAt: stamp } : a)),
            transactions,
            pending,
          };
        });
      },

      upsertLinkedAccounts: (incoming) => {
        const stamp = nowISO();
        set((s) => {
          const byId = new Map(s.accounts.map((a) => [a.id, a]));
          let pending = s.pending;
          for (const a of incoming) {
            byId.set(a.id, { ...byId.get(a.id), ...a, updatedAt: stamp });
            pending = withPending(pending, key('account', a.id));
          }
          return { accounts: Array.from(byId.values()), pending };
        });
      },

      importTransactions: (txns) => {
        const state = get();
        const seen = new Set(
          state.transactions.map((t) => t.externalId).filter(Boolean) as string[],
        );
        const stamp = nowISO();
        const fresh = txns
          .filter((t) => !t.externalId || !seen.has(t.externalId))
          .map((t) => ({ ...t, updatedAt: stamp, deleted: false }));
        if (fresh.length === 0) return 0;
        set((s) => {
          let accounts = s.accounts;
          let pending = s.pending;
          for (const t of fresh) {
            accounts = applyBalance(accounts, t.accountId, balanceDelta(t), stamp);
            pending = withPending(pending, key('transaction', t.id), key('account', t.accountId));
          }
          return { transactions: [...fresh, ...s.transactions], accounts, pending };
        });
        return fresh.length;
      },

      upsertBudget: (input) => {
        const stamp = nowISO();
        set((s) => {
          if (input.id && s.budgets.some((b) => b.id === input.id)) {
            return {
              budgets: s.budgets.map((b) => (b.id === input.id ? { ...b, ...input, updatedAt: stamp } : b)),
              pending: withPending(s.pending, key('budget', input.id)),
            };
          }
          const b: Budget = { ...input, id: input.id ?? makeId('b'), createdAt: stamp, updatedAt: stamp, deleted: false };
          return { budgets: [...s.budgets, b], pending: withPending(s.pending, key('budget', b.id)) };
        });
      },

      deleteBudget: (id) => {
        const stamp = nowISO();
        set((s) => ({
          budgets: s.budgets.map((b) => (b.id === id ? { ...b, deleted: true, updatedAt: stamp } : b)),
          pending: withPending(s.pending, key('budget', id)),
        }));
      },

      upsertGoal: (input) => {
        const stamp = nowISO();
        set((s) => {
          if (input.id && s.goals.some((g) => g.id === input.id)) {
            return {
              goals: s.goals.map((g) => (g.id === input.id ? { ...g, ...input, updatedAt: stamp } : g)),
              pending: withPending(s.pending, key('goal', input.id)),
            };
          }
          const g: Goal = { ...input, id: input.id ?? makeId('g'), createdAt: stamp, updatedAt: stamp, deleted: false };
          return { goals: [...s.goals, g], pending: withPending(s.pending, key('goal', g.id)) };
        });
      },

      contributeToGoal: (id, amountMinor) => {
        const stamp = nowISO();
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, savedMinor: Math.max(0, g.savedMinor + amountMinor), updatedAt: stamp }
              : g,
          ),
          pending: withPending(s.pending, key('goal', id)),
        }));
      },

      deleteGoal: (id) => {
        const stamp = nowISO();
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, deleted: true, updatedAt: stamp } : g)),
          pending: withPending(s.pending, key('goal', id)),
        }));
      },

      upsertCategory: (input) => {
        const stamp = nowISO();
        set((s) => {
          if (input.id && s.categories.some((c) => c.id === input.id)) {
            return {
              categories: s.categories.map((c) =>
                c.id === input.id ? { ...c, ...input, updatedAt: stamp } : c,
              ),
              pending: withPending(s.pending, key('category', input.id)),
            };
          }
          const c: Category = { ...input, id: input.id ?? makeId('cat'), updatedAt: stamp, deleted: false };
          return { categories: [...s.categories, c], pending: withPending(s.pending, key('category', c.id)) };
        });
      },

      deleteCategory: (id) => {
        const stamp = nowISO();
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, deleted: true, updatedAt: stamp } : c)),
          pending: withPending(s.pending, key('category', id)),
        }));
      },

      mergeCategory: (sourceId, targetId) => {
        if (sourceId === targetId) return;
        const stamp = nowISO();
        set((s) => {
          let pending = s.pending;
          const transactions = s.transactions.map((tx) => {
            if (tx.categoryId === sourceId) {
              pending = withPending(pending, key('transaction', tx.id));
              return { ...tx, categoryId: targetId, updatedAt: stamp };
            }
            return tx;
          });
          const budgets = s.budgets.map((b) => {
            if (b.categoryId === sourceId) {
              pending = withPending(pending, key('budget', b.id));
              return { ...b, categoryId: targetId, updatedAt: stamp };
            }
            return b;
          });
          const categories = s.categories.map((c) =>
            c.id === sourceId ? { ...c, deleted: true, updatedAt: stamp } : c,
          );
          pending = withPending(pending, key('category', sourceId));
          return { transactions, budgets, categories, pending };
        });
      },

      reorderCategories: (kind, orderedIds) => {
        const stamp = nowISO();
        const orderOf = new Map(orderedIds.map((id, i) => [id, i]));
        set((s) => {
          let pending = s.pending;
          const categories = s.categories.map((c) => {
            if (c.kind === kind && orderOf.has(c.id)) {
              pending = withPending(pending, key('category', c.id));
              return { ...c, order: orderOf.get(c.id), updatedAt: stamp };
            }
            return c;
          });
          return { categories, pending };
        });
      },

      updateProfile: (patch) =>
        set((s) => ({
          user: { ...s.user, ...patch },
          profileDirty: true,
          profileUpdatedAt: nowISO(),
        })),

      resetToSeed: () =>
        set((s) => ({
          user: {
            ...seedUser,
            baseCurrency: s.user.baseCurrency,
            language: s.user.language,
            biometricEnabled: s.user.biometricEnabled,
          },
          accounts: seedAccounts,
          categories: seedCategories,
          transactions: seedTransactions,
          budgets: seedBudgets,
          goals: seedGoals,
        })),
    }),
    {
      name: 'fintrackpro-store',
      // v2: USD -> TZS. v3: added language. v4: sync (auth + pending + updatedAt).
      version: 4,
      storage: createJSONStorage(() => zustandStorage),
      migrate: (persisted, fromVersion) => {
        if (fromVersion < 2) {
          return {
            user: seedUser,
            accounts: seedAccounts,
            categories: seedCategories,
            transactions: seedTransactions,
            budgets: seedBudgets,
            goals: seedGoals,
          };
        }
        const state = persisted as Partial<AppState>;
        if (state.user && !state.user.language) {
          state.user = { ...state.user, language: 'sw' };
        }
        return state;
      },
      partialize: (s) => ({
        user: s.user,
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.transactions,
        budgets: s.budgets,
        goals: s.goals,
        fxRates: s.fxRates,
        fxUpdatedAt: s.fxUpdatedAt,
        auth: s.auth,
        pending: s.pending,
        profileDirty: s.profileDirty,
        profileUpdatedAt: s.profileUpdatedAt,
        lastPulledAt: s.lastPulledAt,
        lastSyncAt: s.lastSyncAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
