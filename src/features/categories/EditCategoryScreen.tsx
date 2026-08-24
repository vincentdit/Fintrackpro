import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/i18n/useTranslation';
import { TransactionType } from '@/types/models';
import { Button, SegmentedControl, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Rt = RouteProp<RootStackParamList, 'EditCategory'>;

const ICONS = [
  '🛒', '🍽️', '🚗', '🏠', '💡', '🎬', '🩺', '💼', '🧑‍💻', '☕',
  '🎁', '✈️', '📚', '👕', '🐾', '💊', '⚽', '🎵', '💇', '🔧',
  '📱', '🍺', '🎓', '💳', '💰', '🏋️', '🍼', '🌍',
];
const COLORS = [
  '#4C82FF', '#1AAE6F', '#E5A00D', '#8B5CF6', '#E5484D', '#0EA5E9',
  '#EC4899', '#14B8A6', '#33C88A', '#F2B84B', '#FF6169', '#95A0B8',
];

export function EditCategoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const categoryId = route.params?.categoryId;

  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const budgets = useStore((s) => s.budgets);
  const upsertCategory = useStore((s) => s.upsertCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const existing = categories.find((c) => c.id === categoryId);

  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<TransactionType>(existing?.kind ?? 'expense');
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]!);
  const [color, setColor] = useState(existing?.color ?? COLORS[0]!);

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    upsertCategory({ id: existing?.id, name: name.trim(), icon, color, kind });
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    const usage =
      transactions.filter((tx) => !tx.deleted && tx.categoryId === existing.id).length +
      budgets.filter((b) => !b.deleted && b.categoryId === existing.id).length;
    const remove = () => {
      deleteCategory(existing.id);
      navigation.goBack();
    };
    if (usage > 0) {
      Alert.alert(existing.name, t('category.inUse', { count: usage }), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: remove },
      ]);
    } else {
      remove();
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
      {/* Preview */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing(5) }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: color + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 30 }}>{icon}</Text>
        </View>
        <Text weight="600" style={{ marginTop: theme.spacing(2) }}>
          {name.trim() || t('category.namePlaceholder')}
        </Text>
      </View>

      <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>{t('category.name')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('category.namePlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        style={inputStyle}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('category.kind')}</Text>
      <SegmentedControl<TransactionType>
        value={kind}
        onChange={setKind}
        segments={[
          { label: t('common.expense'), value: 'expense' },
          { label: t('common.income'), value: 'income' },
        ]}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('category.icon')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {ICONS.map((ic) => (
          <Text
            key={ic}
            onPress={() => setIcon(ic)}
            style={{
              fontSize: 22,
              padding: theme.spacing(2),
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: ic === icon ? theme.colors.primary : theme.colors.border,
              backgroundColor: ic === icon ? theme.colors.primary + '22' : theme.colors.surface,
            }}
          >
            {ic}
          </Text>
        ))}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('category.color')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(3) }}>
        {COLORS.map((cl) => (
          <Pressable
            key={cl}
            onPress={() => setColor(cl)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: cl,
              borderWidth: 3,
              borderColor: cl === color ? theme.colors.text : 'transparent',
            }}
          />
        ))}
      </View>

      <Button
        title={existing ? t('category.saveBtn') : t('category.createBtn')}
        onPress={handleSave}
        disabled={!canSave}
        style={{ marginTop: theme.spacing(6) }}
      />
      {existing ? (
        <>
          <Button
            title={t('category.merge')}
            variant="secondary"
            onPress={() => navigation.navigate('MergeCategory', { categoryId: existing.id })}
            style={{ marginTop: theme.spacing(2) }}
          />
          <Button title={t('category.deleteBtn')} variant="ghost" onPress={handleDelete} style={{ marginTop: theme.spacing(2) }} />
        </>
      ) : null}
    </ScrollView>
  );
}
