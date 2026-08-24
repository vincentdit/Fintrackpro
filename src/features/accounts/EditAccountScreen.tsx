import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/i18n/useTranslation';
import { AccountType, CurrencyCode } from '@/types/models';
import { toMajor, toMinor } from '@/utils/format';
import { CURRENCIES } from '@/config/currencies';
import { Button, Text } from '@/components';
import { TKey } from '@/i18n/translations';
import { RootStackParamList } from '@/navigation/types';

type Rt = RouteProp<RootStackParamList, 'EditAccount'>;

const TYPES: { value: AccountType; key: TKey }[] = [
  { value: 'checking', key: 'accountType.checking' },
  { value: 'savings', key: 'accountType.savings' },
  { value: 'credit', key: 'accountType.credit' },
  { value: 'cash', key: 'accountType.cash' },
  { value: 'investment', key: 'accountType.investment' },
];

export function EditAccountScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const accountId = route.params?.accountId;

  const accounts = useStore((s) => s.accounts);
  const user = useStore((s) => s.user);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const transactions = useStore((s) => s.transactions);

  const existing = accounts.find((a) => a.id === accountId);

  const [name, setName] = useState(existing?.name ?? '');
  const [institution, setInstitution] = useState(existing?.institution ?? '');
  const [type, setType] = useState<AccountType>(existing?.type ?? 'checking');
  const [currency, setCurrency] = useState<CurrencyCode>(existing?.currency ?? user.baseCurrency);
  const [balance, setBalance] = useState(existing ? String(toMajor(existing.balanceMinor)) : '');

  const parsedBalance = parseFloat(balance.replace(',', '.'));
  const balanceMinor = Number.isNaN(parsedBalance) ? 0 : toMinor(parsedBalance);
  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    if (existing) {
      updateAccount(existing.id, { name: name.trim(), institution: institution.trim(), type, currency, balanceMinor });
    } else {
      addAccount({
        name: name.trim(),
        institution: institution.trim() || '—',
        type,
        currency,
        balanceMinor,
        isLinked: false,
      });
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    const count = transactions.filter((tx) => !tx.deleted && tx.accountId === existing.id).length;
    Alert.alert(existing.name, t('account.deleteConfirm', { count }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteAccount(existing.id);
          navigation.goBack();
        },
      },
    ]);
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
      <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>{t('account.name')}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={t('account.namePlaceholder')} placeholderTextColor={theme.colors.textMuted} style={inputStyle} />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>{t('account.institution')}</Text>
      <TextInput value={institution} onChangeText={setInstitution} placeholder={t('account.institutionPlaceholder')} placeholderTextColor={theme.colors.textMuted} style={inputStyle} />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('account.type')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {TYPES.map((ty) => {
          const active = ty.value === type;
          return (
            <Pressable
              key={ty.value}
              onPress={() => setType(ty.value)}
              style={{
                paddingVertical: theme.spacing(2),
                paddingHorizontal: theme.spacing(3.5),
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primary + '22' : theme.colors.surface,
              }}
            >
              <Text weight={active ? '600' : '400'}>{t(ty.key)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('account.currency')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {CURRENCIES.map((c) => {
          const active = c.code === currency;
          return (
            <Pressable
              key={c.code}
              onPress={() => setCurrency(c.code)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: theme.spacing(2),
                paddingHorizontal: theme.spacing(3),
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                backgroundColor: active ? theme.colors.primary + '22' : theme.colors.surface,
              }}
            >
              <Text>{c.flag} {c.code}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>
        {t('account.balance')} ({currency})
      </Text>
      <TextInput
        value={balance}
        onChangeText={setBalance}
        keyboardType="numbers-and-punctuation"
        placeholder="0"
        placeholderTextColor={theme.colors.textMuted}
        style={[inputStyle, { fontSize: 22, fontWeight: '700' }]}
      />

      <Button title={existing ? t('account.saveBtn') : t('account.createBtn')} onPress={handleSave} disabled={!canSave} style={{ marginTop: theme.spacing(6) }} />
      {existing ? (
        <Button title={t('account.deleteBtn')} variant="ghost" onPress={handleDelete} style={{ marginTop: theme.spacing(2) }} />
      ) : null}
    </ScrollView>
  );
}
