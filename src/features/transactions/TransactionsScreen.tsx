import React, { useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { Transaction, TransactionType } from '@/types/models';
import {
  Button,
  Card,
  EmptyState,
  SegmentedControl,
  Text,
  TransactionRow,
} from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n/useTranslation';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | TransactionType;

export function TransactionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);
  const [filter, setFilter] = useState<Filter>('all');

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const sections = useMemo(() => {
    const filtered = transactions.filter(
      (t) => !t.deleted && (filter === 'all' || t.type === filter),
    );
    const groups = new Map<string, Transaction[]>();
    for (const t of [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1))) {
      const key = format(new Date(t.date), 'MMMM yyyy');
      const arr = groups.get(key) ?? [];
      arr.push(t);
      groups.set(key, arr);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.spacing(4), paddingBottom: theme.spacing(3) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(3) }}>
          <Text variant="h2">{t('tx.title')}</Text>
          <Button title={t('common.add')} onPress={() => navigation.navigate('AddTransaction')} style={{ paddingVertical: theme.spacing(2.5) }} />
        </View>
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          segments={[
            { label: t('common.all'), value: 'all' },
            { label: t('common.income'), value: 'income' },
            { label: t('common.expense'), value: 'expense' },
          ]}
        />
      </View>

      {sections.length === 0 ? (
        <EmptyState title={t('tx.empty')} subtitle={t('tx.emptySub')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing(4), paddingBottom: insets.bottom + theme.spacing(8) }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>
              {section.title}
            </Text>
          )}
          renderItem={({ item, index, section }) => (
            <Card style={{ paddingVertical: 0, marginBottom: index === section.data.length - 1 ? 0 : 0 }}>
              <View
                style={{
                  borderBottomWidth: index === section.data.length - 1 ? 0 : 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <TransactionRow
                  transaction={item}
                  category={catById.get(item.categoryId)}
                  onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}
