import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/services/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AddTransactionScreen } from '@/features/transactions/AddTransactionScreen';
import { LinkAccountScreen } from '@/features/accounts/LinkAccountScreen';
import { EditBudgetScreen } from '@/features/budgets/EditBudgetScreen';
import { EditGoalScreen } from '@/features/goals/EditGoalScreen';
import { CurrencyPickerScreen } from '@/features/settings/CurrencyPickerScreen';
import { CategoriesScreen } from '@/features/categories/CategoriesScreen';
import { EditCategoryScreen } from '@/features/categories/EditCategoryScreen';
import { MergeCategoryScreen } from '@/features/categories/MergeCategoryScreen';
import { EditAccountScreen } from '@/features/accounts/EditAccountScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { ready, authenticated } = useAuth();

  const navTheme = theme.dark ? DarkTheme : DefaultTheme;
  const mergedTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={mergedTheme}>
      <Stack.Navigator>
        {!authenticated ? (
          <Stack.Screen name="Tabs" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Group screenOptions={{ presentation: 'modal', headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text }}>
              <Stack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: t('modal.transaction') }} />
              <Stack.Screen name="LinkAccount" component={LinkAccountScreen} options={{ title: t('modal.linkBank') }} />
              <Stack.Screen name="EditBudget" component={EditBudgetScreen} options={{ title: t('modal.budget') }} />
              <Stack.Screen name="EditGoal" component={EditGoalScreen} options={{ title: t('modal.goal') }} />
              <Stack.Screen name="SelectCurrency" component={CurrencyPickerScreen} options={{ title: t('currency.title') }} />
              <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: t('modal.categories') }} />
              <Stack.Screen name="EditCategory" component={EditCategoryScreen} options={{ title: t('modal.category') }} />
              <Stack.Screen name="MergeCategory" component={MergeCategoryScreen} options={{ title: t('category.merge') }} />
              <Stack.Screen name="EditAccount" component={EditAccountScreen} options={{ title: t('modal.account') }} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
