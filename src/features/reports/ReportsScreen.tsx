import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import {
  expenseByCategory,
  monthlyExpenses,
  monthlyIncome,
  monthlyTrend,
} from '@/store/selectors';
import { formatCurrency, formatPercent } from '@/utils/format';
import { Card, EmptyState, Screen, Text } from '@/components';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import { toMajor } from '@/utils/format';
import { useTranslation } from '@/i18n/useTranslation';

export function ReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const user = useStore((s) => s.user);
  const rates = useStore((s) => s.fxRates);
  const base = user.baseCurrency;

  const slices = useMemo(
    () => expenseByCategory(transactions, categories, base, rates),
    [transactions, categories, base, rates],
  );
  const trend = useMemo(
    () => monthlyTrend(transactions, base, rates, 6),
    [transactions, base, rates],
  );
  const income = monthlyIncome(transactions, base, rates);
  const expenses = monthlyExpenses(transactions, base, rates);
  const savings = income - expenses;
  const savingsRate = income > 0 ? savings / income : 0;

  const donutData = slices.map((s) => ({
    key: s.category.id,
    value: toMajor(s.amountMinor),
    color: s.category.color,
  }));

  return (
    <Screen>
      <Text variant="h2" style={{ marginBottom: theme.spacing(4) }}>
        {t('reports.title')}
      </Text>

      <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginBottom: theme.spacing(4) }}>
        <Card style={{ flex: 1 }}>
          <Text variant="small" tone="muted">{t('reports.savedThisMonth')}</Text>
          <Text variant="h3" tone={savings >= 0 ? 'income' : 'expense'} style={{ marginTop: theme.spacing(1) }}>
            {formatCurrency(savings, user.baseCurrency)}
          </Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text variant="small" tone="muted">{t('reports.savingsRate')}</Text>
          <Text variant="h3" style={{ marginTop: theme.spacing(1) }}>
            {formatPercent(Math.max(0, savingsRate))}
          </Text>
        </Card>
      </View>

      <Text variant="h3" style={{ marginBottom: theme.spacing(3) }}>
        {t('reports.incomeVsExpense')}
      </Text>
      <Card style={{ marginBottom: theme.spacing(5) }}>
        <BarChart data={trend.map((pt) => ({ label: pt.label, income: toMajor(pt.income), expense: toMajor(pt.expense) }))} />
        <View style={{ flexDirection: 'row', gap: theme.spacing(4), justifyContent: 'center', marginTop: theme.spacing(2) }}>
          <Legend color={theme.colors.income} label={t('common.income')} />
          <Legend color={theme.colors.expense} label={t('common.expense')} />
        </View>
      </Card>

      <Text variant="h3" style={{ marginBottom: theme.spacing(3) }}>
        {t('reports.byCategory')}
      </Text>
      {slices.length === 0 ? (
        <EmptyState icon="📊" title={t('reports.noSpendTitle')} subtitle={t('reports.noSpendSub')} />
      ) : (
        <Card>
          <View style={{ alignItems: 'center', marginBottom: theme.spacing(4) }}>
            <DonutChart
              data={donutData}
              centerLabel={formatCurrency(expenses, user.baseCurrency)}
              centerSubLabel={t('common.thisMonth')}
            />
          </View>
          {slices.map((s) => (
            <View
              key={s.category.id}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing(2) }}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.category.color, marginRight: theme.spacing(3) }} />
              <Text style={{ flex: 1 }}>
                {s.category.icon} {s.category.name}
              </Text>
              <Text tone="muted" variant="small" style={{ marginRight: theme.spacing(3) }}>
                {formatPercent(s.ratio)}
              </Text>
              <Text weight="600">{formatCurrency(s.amountMinor, user.baseCurrency)}</Text>
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
      <Text variant="small" tone="muted">{label}</Text>
    </View>
  );
}
