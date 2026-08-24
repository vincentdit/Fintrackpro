import { Transaction } from '@/types/models';

export type RootStackParamList = {
  Tabs: undefined;
  AddTransaction: { transaction?: Transaction } | undefined;
  LinkAccount: undefined;
  EditBudget: { budgetId?: string } | undefined;
  EditGoal: { goalId?: string } | undefined;
  SelectCurrency: undefined;
  Categories: undefined;
  EditCategory: { categoryId?: string } | undefined;
  MergeCategory: { categoryId: string };
  EditAccount: { accountId?: string } | undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budgets: undefined;
  Reports: undefined;
  Accounts: undefined;
};
