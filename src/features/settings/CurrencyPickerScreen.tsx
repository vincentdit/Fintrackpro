import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { useTranslation } from '@/i18n/useTranslation';
import { CURRENCIES } from '@/config/currencies';
import { Card, Text } from '@/components';

export function CurrencyPickerScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { t, lang } = useTranslation();
  const current = useStore((s) => s.user.baseCurrency);
  const updateProfile = useStore((s) => s.updateProfile);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }} contentContainerStyle={{ padding: theme.spacing(4) }}>
      <Text tone="muted" style={{ marginBottom: theme.spacing(4) }}>
        {t('currency.subtitle')}
      </Text>
      <Card style={{ padding: 0 }}>
        {CURRENCIES.map((c, idx) => {
          const active = c.code === current;
          return (
            <Pressable
              key={c.code}
              onPress={() => {
                updateProfile({ baseCurrency: c.code });
                navigation.goBack();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: theme.spacing(3.5),
                borderBottomWidth: idx === CURRENCIES.length - 1 ? 0 : 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              <Text style={{ fontSize: 22, marginRight: theme.spacing(3) }}>{c.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text weight="600">{lang === 'sw' ? c.nameSw : c.name}</Text>
                <Text variant="small" tone="muted">{c.code}</Text>
              </View>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active ? <Text style={{ color: theme.colors.primaryText, fontSize: 12 }}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </Card>
    </ScrollView>
  );
}
