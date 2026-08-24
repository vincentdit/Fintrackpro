import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

/** Themed screen container that handles safe-area insets and optional scroll. */
export function Screen({ children, scroll = true, padded = true, style }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        { paddingHorizontal: padded ? theme.spacing(4) : 0, paddingTop: theme.spacing(2) },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
        {content}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + theme.spacing(8) }}
      showsVerticalScrollIndicator={false}
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
