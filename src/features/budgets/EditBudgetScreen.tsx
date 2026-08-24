import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { BudgetPeriod } from '@/types/models';
import { toMajor, toMinor } from '@/utils/format';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, SegmentedControl, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Rt = RouteProp<RootStackParamList, 'EditBudget'>;

export function EditBudgetScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const budgetId = route.params?.budgetId;

  const budgets = useStore((s) => s.budgets);
  const categories = useStore((s) => s.categories);
  const user = useStore((s) => s.user);
  const upsertBudget = useStore((s) => s.upsertBudget);
  const deleteBudget = useStore((s) => s.deleteBudget);

  const existing = budgets.find((b) => b.id === budgetId);
  const expenseCats = categories.filter((c) => c.kind === 'expense' && !c.deleted);

  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? expenseCats[0]?.id ?? '');
  const [limit, setLimit] = useState(existing ? String(toMajor(existing.limitMinor)) : '');
  const [period, setPeriod] = useState<BudgetPeriod>(existing?.period ?? 'monthly');

  const parsed = parseFloat(limit.replace(',', '.'));
  const canSave = !Number.isNaN(parsed) && parsed > 0 && !!categoryId;

  const handleSave = () => {
    if (!canSave) return;
    upsertBudget({
      id: existing?.id,
      categoryId,
      limitMinor: toMinor(parsed),
      period,
      currency: user.baseCurrency,
    });
    navigation.goBack();
  };

  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
    color: theme.colors.text,
    fontSize: theme.font.body,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: theme.spacing(4) }}>
      <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(2) }}>
        {t('tx.category')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {expenseCats.map((c) => {
          const active = c.id === categoryId;
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: theme.spacing(2),
                paddingHorizontal: theme.spacing(3),
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: active ? c.color : theme.colors.border,
                backgroundColor: active ? c.color + '22' : theme.colors.surface,
              }}
            >
              <Text>{c.icon} {c.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>
        {t('budget.limit')} ({user.baseCurrency})
      </Text>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={theme.colors.textMuted}
        style={[inputStyle, { fontSize: 24, fontWeight: '700' }]}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>
        {t('budget.period')}
      </Text>
      <SegmentedControl<BudgetPeriod>
        value={period}
        onChange={setPeriod}
        segments={[
          { label: t('budget.weekly'), value: 'weekly' },
          { label: t('budget.monthly'), value: 'monthly' },
          { label: t('budget.yearly'), value: 'yearly' },
        ]}
      />

      <Button title={existing ? t('budget.saveBtn') : t('budget.createBtn')} onPress={handleSave} disabled={!canSave} style={{ marginTop: theme.spacing(6) }} />
      {existing ? (
        <Button
          title={t('budget.deleteBtn')}
          variant="ghost"
          onPress={() => {
            deleteBudget(existing.id);
            navigation.goBack();
          }}
          style={{ marginTop: theme.spacing(2) }}
        />
      ) : null}
    </ScrollView>
  );
}
