import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

interface Segment<T extends string> {
  label: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: theme.radius.md,
        padding: theme.spacing(1),
      }}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => onChange(seg.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing(2.5),
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              backgroundColor: active ? theme.colors.surface : 'transparent',
            }}
          >
            <Text weight={active ? '600' : '400'} tone={active ? 'default' : 'muted'}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
