import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { formatISO } from 'date-fns';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { TransactionType } from '@/types/models';
import { toMinor, toMajor } from '@/utils/format';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, Card, SegmentedControl, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Rt = RouteProp<RootStackParamList, 'AddTransaction'>;

export function AddTransactionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const editing = route.params?.transaction;

  const categories = useStore((s) => s.categories);
  const accounts = useStore((s) => s.accounts).filter((a) => !a.deleted);
  const user = useStore((s) => s.user);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(
    editing ? String(toMajor(editing.amountMinor)) : '',
  );
  const [description, setDescription] = useState(editing?.description ?? '');
  const [accountId, setAccountId] = useState(editing?.accountId ?? accounts[0]?.id ?? '');
  const availableCats = useMemo(
    () => categories.filter((c) => c.kind === type && !c.deleted),
    [categories, type],
  );
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ?? availableCats[0]?.id ?? '',
  );

  // Keep a valid category when switching type.
  const catValid = availableCats.some((c) => c.id === categoryId);
  const effectiveCategoryId = catValid ? categoryId : availableCats[0]?.id ?? '';

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const canSave = !Number.isNaN(parsedAmount) && parsedAmount > 0 && !!accountId && !!effectiveCategoryId;

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      accountId,
      categoryId: effectiveCategoryId,
      type,
      amountMinor: toMinor(parsedAmount),
      currency: user.baseCurrency,
      description: description.trim() || (type === 'income' ? 'Income' : 'Expense'),
      date: editing?.date ?? formatISO(new Date(), { representation: 'date' }),
      isImported: editing?.isImported ?? false,
    };
    if (editing) updateTransaction(editing.id, payload);
    else addTransaction(payload);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (editing) {
      deleteTransaction(editing.id);
      navigation.goBack();
    }
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
      <SegmentedControl<TransactionType>
        value={type}
        onChange={setType}
        segments={[
          { label: t('common.expense'), value: 'expense' },
          { label: t('common.income'), value: 'income' },
        ]}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(5), marginBottom: theme.spacing(1) }}>
        {t('tx.amount')} ({user.baseCurrency})
      </Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={theme.colors.textMuted}
        style={[inputStyle, { fontSize: 28, fontWeight: '700' }]}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>
        {t('tx.description')}
      </Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder={t('tx.descriptionPlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        style={inputStyle}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>
        {t('tx.category')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {availableCats.map((c) => {
          const active = c.id === effectiveCategoryId;
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
              <Text>{c.icon} </Text>
              <Text weight={active ? '600' : '400'}>{c.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>
        {t('tx.account')}
      </Text>
      <Card style={{ padding: 0 }}>
        {accounts.map((a, idx) => {
          const active = a.id === accountId;
          return (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing(3.5),
                borderBottomWidth: idx === accounts.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text>
                {a.name} {a.mask ? `••${a.mask}` : ''}
              </Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </Card>

      <Button
        title={editing ? t('tx.saveBtn') : t('tx.addBtn')}
        onPress={handleSave}
        disabled={!canSave}
        style={{ marginTop: theme.spacing(6) }}
      />
      {editing ? (
        <Button title={t('common.delete')} variant="ghost" onPress={handleDelete} style={{ marginTop: theme.spacing(2) }} />
      ) : null}
    </ScrollView>
  );
}
