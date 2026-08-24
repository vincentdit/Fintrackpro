import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme/ThemeProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { TKey } from '@/i18n/translations';
import { TabParamList } from './types';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { TransactionsScreen } from '@/features/transactions/TransactionsScreen';
import { BudgetsScreen } from '@/features/budgets/BudgetsScreen';
import { ReportsScreen } from '@/features/reports/ReportsScreen';
import { AccountsScreen } from '@/features/accounts/AccountsScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, string> = {
  Dashboard: '🏠',
  Transactions: '💳',
  Budgets: '🎯',
  Reports: '📊',
  Accounts: '🏦',
};

const labelKey: Record<keyof TabParamList, TKey> = {
  Dashboard: 'tab.dashboard',
  Transactions: 'tab.transactions',
  Budgets: 'tab.budgets',
  Reports: 'tab.reports',
  Accounts: 'tab.accounts',
};

export function TabNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabel: t(labelKey[route.name]),
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.6 }}>
            {icons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Accounts" component={AccountsScreen} />
    </Tab.Navigator>
  );
}
