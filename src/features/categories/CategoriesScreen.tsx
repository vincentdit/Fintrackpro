import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/i18n/useTranslation';
import { Card, Screen, Text } from '@/components';
import { DraggableList } from '@/components/DraggableList';
import { Category, TransactionType } from '@/types/models';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ITEM_HEIGHT = 60;

function sortByOrder(cats: Category[]): Category[] {
  return [...cats].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
}

export function CategoriesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const categories = useStore((s) => s.categories).filter((c) => !c.deleted);
  const reorderCategories = useStore((s) => s.reorderCategories);

  const groups: { kind: TransactionType; label: string; items: Category[] }[] = [
    { kind: 'expense', label: t('common.expense'), items: sortByOrder(categories.filter((c) => c.kind === 'expense')) },
    { kind: 'income', label: t('common.income'), items: sortByOrder(categories.filter((c) => c.kind === 'income')) },
  ];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(2) }}>
        <Text variant="h2">{t('categories.title')}</Text>
        <Pressable onPress={() => navigation.navigate('EditCategory')}>
          <Text tone="primary" weight="600">+ {t('common.new')}</Text>
        </Pressable>
      </View>
      <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(4) }}>
        {t('category.reorderHint')}
      </Text>

      {groups.map((g) => (
        <View key={g.kind} style={{ marginBottom: theme.spacing(4) }}>
          <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(2) }}>
            {g.label}
          </Text>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <DraggableList
              items={g.items}
              itemHeight={ITEM_HEIGHT}
              onReorder={(ids) => reorderCategories(g.kind, ids)}
              renderItem={(c, dragHandle, dragging) => (
                <Pressable
                  onPress={() => navigation.navigate('EditCategory', { categoryId: c.id })}
                  style={{
                    height: ITEM_HEIGHT,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing(3.5),
                    backgroundColor: dragging ? theme.colors.surfaceAlt : theme.colors.surface,
                    borderBottomWidth: 1,
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
                    <Text style={{ fontSize: 17 }}>{c.icon}</Text>
                  </View>
                  <Text weight="600" style={{ flex: 1 }}>{c.name}</Text>
                  {/* Drag handle */}
                  <View {...dragHandle} style={{ paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(2) }}>
                    <Text tone="muted" style={{ fontSize: 20 }}>≡</Text>
                  </View>
                </Pressable>
              )}
            />
          </Card>
        </View>
      ))}
    </Screen>
  );
}
