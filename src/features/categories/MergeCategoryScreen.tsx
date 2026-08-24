import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/i18n/useTranslation';
import { Card, Screen, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Rt = RouteProp<RootStackParamList, 'MergeCategory'>;

export function MergeCategoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const sourceId = route.params.categoryId;

  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const budgets = useStore((s) => s.budgets);
  const mergeCategory = useStore((s) => s.mergeCategory);

  const source = categories.find((c) => c.id === sourceId);
  const targets = categories.filter(
    (c) => !c.deleted && c.id !== sourceId && c.kind === source?.kind,
  );

  if (!source) return null;

  const usage =
    transactions.filter((tx) => !tx.deleted && tx.categoryId === sourceId).length +
    budgets.filter((b) => !b.deleted && b.categoryId === sourceId).length;

  const doMerge = (targetId: string, targetName: string) => {
    Alert.alert(
      t('category.mergeTitle', { name: source.name }),
      t('category.mergeConfirm', { count: usage, target: targetName, name: source.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.save'),
          onPress: () => {
            mergeCategory(sourceId, targetId);
            navigation.navigate('Categories' as never);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Text tone="muted" style={{ marginBottom: theme.spacing(4) }}>
        {t('category.mergeTitle', { name: source.name })}
      </Text>
      <Card style={{ padding: 0 }}>
        {targets.map((c, idx) => (
          <Pressable
            key={c.id}
            onPress={() => doMerge(c.id, c.name)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing(3.5),
              borderBottomWidth: idx === targets.length - 1 ? 0 : 1,
              borderBottomColor: theme.colors.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.color + '22',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: theme.spacing(3),
              }}
            >
              <Text style={{ fontSize: 16 }}>{c.icon}</Text>
            </View>
            <Text weight="600">{c.name}</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
