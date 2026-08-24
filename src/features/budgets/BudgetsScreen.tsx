import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { budgetStatuses } from '@/store/selectors';
import { formatCurrency, formatPercent } from '@/utils/format';
import { convert } from '@/utils/convert';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, Card, EmptyState, ProgressBar, Screen, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BudgetsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const budgets = useStore((s) => s.budgets);
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const rates = useStore((s) => s.fxRates);
  const base = useStore((s) => s.user.baseCurrency);

  const statuses = budgetStatuses(budgets, categories, transactions, base, rates);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(4) }}>
        <Text variant="h2">{t('budgets.title')}</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(2) }}>
        <Text variant="h3">{t('budgets.monthly')}</Text>
        <Pressable onPress={() => navigation.navigate('EditBudget')}>
          <Text tone="primary" weight="600">+ {t('common.new')}</Text>
        </Pressable>
      </View>

      {statuses.length === 0 ? (
        <EmptyState icon="🎯" title={t('budgets.emptyTitle')} subtitle={t('budgets.emptySub')} />
      ) : (
        statuses.map((st) => (
          <Pressable key={st.budget.id} onPress={() => navigation.navigate('EditBudget', { budgetId: st.budget.id })}>
            <Card style={{ marginBottom: theme.spacing(3) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(2) }}>
                <Text weight="600">
                  {st.category.icon} {st.category.name}
                </Text>
                <Text variant="small" tone={st.ratio > 1 ? 'expense' : 'muted'}>
                  {formatPercent(st.ratio)}
                </Text>
              </View>
              <ProgressBar ratio={st.ratio} color={st.category.color} height={10} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(2) }}>
                <Text variant="small" tone="muted">
                  {formatCurrency(st.spentMinor, st.budget.currency)} {t('budgets.spent')}
                </Text>
                <Text variant="small" tone={st.remainingMinor < 0 ? 'expense' : 'muted'}>
                  {st.remainingMinor < 0 ? `${t('budgets.overBy')} ` : ''}
                  {formatCurrency(Math.abs(st.remainingMinor), st.budget.currency)}
                  {st.remainingMinor < 0 ? '' : ` ${t('budgets.left')}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing(5), marginBottom: theme.spacing(2) }}>
        <Text variant="h3">{t('budgets.goals')}</Text>
        <Pressable onPress={() => navigation.navigate('EditGoal')}>
          <Text tone="primary" weight="600">+ {t('common.new')}</Text>
        </Pressable>
      </View>

      {goals.filter((g) => !g.deleted).length === 0 ? (
        <EmptyState icon="🏆" title={t('budgets.goalsEmptyTitle')} subtitle={t('budgets.goalsEmptySub')} />
      ) : (
        goals.filter((g) => !g.deleted).map((g) => {
          const ratio = g.targetMinor > 0 ? g.savedMinor / g.targetMinor : 0;
          const savedBase = convert(g.savedMinor, g.currency, base, rates);
          const targetBase = convert(g.targetMinor, g.currency, base, rates);
          return (
            <Pressable key={g.id} onPress={() => navigation.navigate('EditGoal', { goalId: g.id })}>
              <Card style={{ marginBottom: theme.spacing(3) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(2) }}>
                  <Text weight="600">
                    {g.icon} {g.name}
                  </Text>
                  <Text variant="small" tone="muted">{formatPercent(ratio)}</Text>
                </View>
                <ProgressBar ratio={ratio} color={theme.colors.success} height={10} />
                <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(2) }}>
                  {formatCurrency(savedBase, base)} / {formatCurrency(targetBase, base)}
                </Text>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
