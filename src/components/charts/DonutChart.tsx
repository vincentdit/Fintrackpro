import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '../Text';

export interface DonutSlice {
  value: number;
  color: string;
  key: string;
}

/**
 * A donut chart drawn with stroke-dasharray arcs. Pure react-native-svg,
 * no chart library, so it renders identically on iOS, Android, and web.
 */
export function DonutChart({
  data,
  size = 180,
  strokeWidth = 24,
  centerLabel,
  centerSubLabel,
}: {
  data: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let offsetAccum = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {data.map((slice) => {
            const fraction = slice.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const dashoffset = offsetAccum;
            offsetAccum += dash;
            return (
              <Circle
                key={slice.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-dashoffset}
                strokeLinecap="butt"
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {centerLabel ? <Text variant="h3">{centerLabel}</Text> : null}
        {centerSubLabel ? (
          <Text variant="small" tone="muted">
            {centerSubLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
