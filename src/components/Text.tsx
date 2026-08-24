import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'small';
type Tone = 'default' | 'muted' | 'primary' | 'income' | 'expense' | 'warning';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: TextStyle['fontWeight'];
}

export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const color =
    tone === 'muted'
      ? theme.colors.textMuted
      : tone === 'primary'
        ? theme.colors.primary
        : tone === 'income'
          ? theme.colors.income
          : tone === 'expense'
            ? theme.colors.expense
            : tone === 'warning'
              ? theme.colors.warning
              : theme.colors.text;

  const defaultWeight: TextStyle['fontWeight'] =
    variant === 'h1' || variant === 'h2' ? '700' : variant === 'h3' ? '600' : '400';

  return (
    <RNText
      style={[{ fontSize: theme.font[variant], color, fontWeight: weight ?? defaultWeight }, style]}
      {...rest}
    />
  );
}
