import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { toMajor, toMinor, formatCurrency } from '@/utils/format';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, Card, ProgressBar, Text } from '@/components';
import { RootStackParamList } from '@/navigation/types';

type Rt = RouteProp<RootStackParamList, 'EditGoal'>;

const ICONS = ['🛟', '🏝️', '💻', '🏡', '🚗', '🎓', '💍', '🏖️'];

export function EditGoalScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const goalId = route.params?.goalId;

  const goals = useStore((s) => s.goals);
  const user = useStore((s) => s.user);
  const upsertGoal = useStore((s) => s.upsertGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const contributeToGoal = useStore((s) => s.contributeToGoal);

  const existing = goals.find((g) => g.id === goalId);

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? ICONS[0]!);
  const [target, setTarget] = useState(existing ? String(toMajor(existing.targetMinor)) : '');
  const [contribution, setContribution] = useState('');

  const parsedTarget = parseFloat(target.replace(',', '.'));
  const canSave = name.trim().length > 0 && !Number.isNaN(parsedTarget) && parsedTarget > 0;

  const handleSave = () => {
    if (!canSave) return;
    upsertGoal({
      id: existing?.id,
      name: name.trim(),
      icon,
      targetMinor: toMinor(parsedTarget),
      savedMinor: existing?.savedMinor ?? 0,
      currency: user.baseCurrency,
    });
    navigation.goBack();
  };

  const handleContribute = () => {
    const amt = parseFloat(contribution.replace(',', '.'));
    if (existing && !Number.isNaN(amt) && amt !== 0) {
      contributeToGoal(existing.id, toMinor(amt));
      setContribution('');
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
      {existing ? (
        <Card style={{ marginBottom: theme.spacing(5) }}>
          <Text variant="small" tone="muted">{t('goal.progress')}</Text>
          <Text variant="h2" style={{ marginVertical: theme.spacing(1) }}>
            {formatCurrency(existing.savedMinor, existing.currency)}
          </Text>
          <ProgressBar
            ratio={existing.targetMinor > 0 ? existing.savedMinor / existing.targetMinor : 0}
            color={theme.colors.success}
            height={10}
          />
          <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(2) }}>
            {t('goal.target')} {formatCurrency(existing.targetMinor, existing.currency)}
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing(2), marginTop: theme.spacing(3) }}>
            <TextInput
              value={contribution}
              onChangeText={setContribution}
              keyboardType="decimal-pad"
              placeholder={t('goal.addWithdraw')}
              placeholderTextColor={theme.colors.textMuted}
              style={[inputStyle, { flex: 1 }]}
            />
            <Button title={t('common.apply')} onPress={handleContribute} />
          </View>
        </Card>
      ) : null}

      <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>{t('goal.name')}</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={t('goal.namePlaceholder')}
        placeholderTextColor={theme.colors.textMuted}
        style={inputStyle}
      />

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(2) }}>{t('goal.icon')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
        {ICONS.map((ic) => (
          <Text
            key={ic}
            onPress={() => setIcon(ic)}
            style={{
              fontSize: 24,
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

      <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(4), marginBottom: theme.spacing(1) }}>
        {t('goal.target')} ({user.baseCurrency})
      </Text>
      <TextInput
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={theme.colors.textMuted}
        style={[inputStyle, { fontSize: 24, fontWeight: '700' }]}
      />

      <Button title={existing ? t('goal.saveBtn') : t('goal.createBtn')} onPress={handleSave} disabled={!canSave} style={{ marginTop: theme.spacing(6) }} />
      {existing ? (
        <Button
          title={t('goal.deleteBtn')}
          variant="ghost"
          onPress={() => {
            deleteGoal(existing.id);
            navigation.goBack();
          }}
          style={{ marginTop: theme.spacing(2) }}
        />
      ) : null}
    </ScrollView>
  );
}
