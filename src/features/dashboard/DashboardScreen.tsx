import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import {
  budgetStatuses,
  monthlyExpenses,
  monthlyIncome,
  totalBalance,
} from '@/store/selectors';
import { formatCurrency } from '@/utils/format';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, Card, ProgressBar, Screen, Text, TransactionRow } from '@/components';
import { config } from '@/config/env';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const user = useStore((s) => s.user);
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const budgets = useStore((s) => s.budgets);
  const rates = useStore((s) => s.fxRates);
  const base = user.baseCurrency;

  const net = totalBalance(accounts, base, rates);
  const income = monthlyIncome(transactions, base, rates);
  const expenses = monthlyExpenses(transactions, base, rates);
  const netFlow = income - expenses;
  const statuses = budgetStatuses(budgets, categories, transactions, base, rates).slice(0, 3);
  const recent = transactions.filter((t) => !t.deleted).slice(0, 4);
  const catById = new Map(categories.map((c) => [c.id, c]));

  return (
    <Screen>
      <Text variant="small" tone="muted">
        {t('dash.welcome')}
      </Text>
      <Text variant="h2" style={{ marginBottom: theme.spacing(4) }}>
        {user.name.split(' ')[0]}
      </Text>

      <Card style={{ marginBottom: theme.spacing(4) }}>
        <Text variant="small" tone="muted">
          {t('dash.totalBalance')}
        </Text>
        <Text variant="h1" style={{ marginVertical: theme.spacing(1) }}>
          {formatCurrency(net, user.baseCurrency)}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: theme.spacing(3) }}>
          <View style={{ flex: 1 }}>
            <Text variant="small" tone="muted">
              {t('dash.incomeMo')}
            </Text>
            <Text weight="600" tone="income">
              {formatCurrency(income, user.baseCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="small" tone="muted">
              {t('dash.spentMo')}
            </Text>
            <Text weight="600" tone="expense">
              {formatCurrency(expenses, user.baseCurrency)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="small" tone="muted">
              {t('dash.netMo')}
            </Text>
            <Text weight="600" tone={netFlow >= 0 ? 'income' : 'expense'}>
              {formatCurrency(netFlow, user.baseCurrency, { signed: true })}
            </Text>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(5) }}>
        <Button
          title={t('dash.addTransaction')}
          onPress={() => navigation.navigate('AddTransaction')}
          style={{ flex: 1 }}
        />
        {config.bankSyncEnabled && (
          <Button
            title={t('dash.linkBank')}
            variant="secondary"
            onPress={() => navigation.navigate('LinkAccount')}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {statuses.length > 0 && (
        <>
          <Text variant="h3" style={{ marginBottom: theme.spacing(3) }}>
            {t('dash.budgetHealth')}
          </Text>
          <Card style={{ marginBottom: theme.spacing(5) }}>
            {statuses.map((st, idx) => (
              <View
                key={st.budget.id}
                style={{ marginBottom: idx === statuses.length - 1 ? 0 : theme.spacing(4) }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(1.5) }}>
                  <Text weight="600">
                    {st.category.icon} {st.category.name}
                  </Text>
                  <Text variant="small" tone={st.ratio > 1 ? 'expense' : 'muted'}>
                    {formatCurrency(st.spentMinor, st.budget.currency)} /{' '}
                    {formatCurrency(st.budget.limitMinor, st.budget.currency)}
                  </Text>
                </View>
                <ProgressBar ratio={st.ratio} color={st.category.color} />
              </View>
            ))}
          </Card>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(1) }}>
        <Text variant="h3">{t('dash.recentActivity')}</Text>
      </View>
      <Card>
        {recent.map((t, idx) => (
          <View
            key={t.id}
            style={{
              borderBottomWidth: idx === recent.length - 1 ? 0 : 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <TransactionRow transaction={t} category={catById.get(t.categoryId)} />
          </View>
        ))}
      </Card>
    </Screen>
  );
}
