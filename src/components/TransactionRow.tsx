import React from 'react';
import { Pressable, View } from 'react-native';
import { format } from 'date-fns';
import { Category, Transaction } from '@/types/models';
import { useTheme } from '@/theme/ThemeProvider';
import { formatCurrency } from '@/utils/format';
import { Text } from './Text';

export function TransactionRow({
  transaction,
  category,
  onPress,
}: {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const isIncome = transaction.type === 'income';
  const signedMinor = isIncome ? transaction.amountMinor : -transaction.amountMinor;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing(3),
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: (category?.color ?? theme.colors.primary) + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing(3),
        }}
      >
        <Text style={{ fontSize: 18 }}>{category?.icon ?? '💸'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text weight="600" numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text variant="small" tone="muted">
          {category?.name ?? 'Uncategorized'} · {format(new Date(transaction.date), 'MMM d')}
          {transaction.isImported ? ' · synced' : ''}
        </Text>
      </View>

      <Text weight="600" tone={isIncome ? 'income' : 'default'}>
        {formatCurrency(signedMinor, transaction.currency, { signed: true })}
      </Text>
    </Pressable>
  );
}
