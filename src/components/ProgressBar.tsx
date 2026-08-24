import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

/** Horizontal progress bar. `ratio` may exceed 1; the fill clamps but color warns. */
export function ProgressBar({
  ratio,
  color,
  height = 8,
}: {
  ratio: number;
  color?: string;
  height?: number;
}) {
  const theme = useTheme();
  const clamped = Math.max(0, Math.min(1, ratio));
  const over = ratio > 1;
  const fill = over ? theme.colors.expense : color ?? theme.colors.primary;
  return (
    <View
      style={{
        height,
        borderRadius: height,
        backgroundColor: theme.colors.surfaceAlt,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: fill }} />
    </View>
  );
}
