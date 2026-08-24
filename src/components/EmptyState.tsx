import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export function EmptyState({
  icon = '📭',
  title,
  subtitle,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing(10) }}>
      <Text style={{ fontSize: 40, marginBottom: theme.spacing(2) }}>{icon}</Text>
      <Text variant="h3">{title}</Text>
      {subtitle ? (
        <Text tone="muted" style={{ marginTop: theme.spacing(1), textAlign: 'center' }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
