import React, { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { totalBalance } from '@/store/selectors';
import { formatCurrency } from '@/utils/format';
import { Button, Card, Screen, SegmentedControl, Text } from '@/components';
import { bankSync } from '@/services/plaid';
import { refreshRates } from '@/services/fx';
import { SyncEngine } from '@/services/sync/SyncEngine';
import { useAuth } from '@/services/auth/AuthProvider';
import { config } from '@/config/env';
import { currencyMeta } from '@/config/currencies';
import { useTranslation } from '@/i18n/useTranslation';
import { TKey } from '@/i18n/translations';
import { Language } from '@/types/models';
import { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AccountsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { logout, email } = useAuth();

  const accounts = useStore((s) => s.accounts);
  const user = useStore((s) => s.user);
  const rates = useStore((s) => s.fxRates);
  const fxUpdatedAt = useStore((s) => s.fxUpdatedAt);
  const syncing = useStore((s) => s.syncing);
  const lastSyncAt = useStore((s) => s.lastSyncAt);
  const syncError = useStore((s) => s.syncError);
  const updateProfile = useStore((s) => s.updateProfile);
  const importTransactions = useStore((s) => s.importTransactions);
  const upsertLinkedAccounts = useStore((s) => s.upsertLinkedAccounts);
  const resetToSeed = useStore((s) => s.resetToSeed);

  const [syncingItem, setSyncingItem] = useState<string | null>(null);
  const [refreshingRates, setRefreshingRates] = useState(false);

  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      await refreshRates();
    } finally {
      setRefreshingRates(false);
    }
  };

  const ratesStatus = refreshingRates
    ? t('settings.ratesUpdating')
    : fxUpdatedAt
      ? t('settings.ratesUpdated', { when: new Date(fxUpdatedAt).toLocaleString() })
      : t('settings.ratesBundled');

  const syncStatus = syncing
    ? t('settings.syncing')
    : syncError
      ? `${t('settings.syncFailed')}: ${syncError}`
      : lastSyncAt
        ? t('settings.synced', { when: new Date(lastSyncAt).toLocaleString() })
        : t('settings.syncNever');

  const visibleAccounts = accounts.filter((a) => !a.deleted);
  const linkedItems = Array.from(
    new Set(visibleAccounts.filter((a) => a.isLinked && a.linkedItemId).map((a) => a.linkedItemId!)),
  );

  const handleSync = async (itemId: string) => {
    setSyncingItem(itemId);
    try {
      const [txns, balances] = await Promise.all([
        bankSync.syncTransactions(itemId),
        bankSync.refreshBalances(itemId).catch(() => []),
      ]);
      const added = importTransactions(txns);
      if (balances.length) {
        upsertLinkedAccounts(
          accounts
            .filter((a) => a.linkedItemId === itemId)
            .map((a) => {
              const fresh = balances.find((b) => b.id === a.id);
              return fresh ? { ...a, balanceMinor: fresh.balanceMinor } : a;
            }),
        );
      }
      Alert.alert(t('accounts.syncComplete'), t('accounts.syncImported', { count: added }));
    } catch (e) {
      Alert.alert(t('accounts.syncFailed'), e instanceof Error ? e.message : t('accounts.tryAgain'));
    } finally {
      setSyncingItem(null);
    }
  };

  const baseMeta = currencyMeta(user.baseCurrency);

  return (
    <Screen>
      <Text variant="h2" style={{ marginBottom: theme.spacing(4) }}>
        {t('accounts.title')}
      </Text>

      <Card style={{ marginBottom: theme.spacing(4) }}>
        <Text variant="small" tone="muted">{t('accounts.netWorth')}</Text>
        <Text variant="h1" style={{ marginTop: theme.spacing(1) }}>
          {formatCurrency(totalBalance(accounts, user.baseCurrency, rates), user.baseCurrency)}
        </Text>
        <Text variant="small" tone="muted" style={{ marginTop: theme.spacing(2) }}>
          {t('settings.rateNote')}
        </Text>
      </Card>

      {visibleAccounts.map((a) => (
        <Pressable key={a.id} onPress={() => navigation.navigate('EditAccount', { accountId: a.id })}>
          <Card style={{ marginBottom: theme.spacing(3) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text weight="600">{a.name}</Text>
                <Text variant="small" tone="muted">
                  {a.institution} · {t(`accountType.${a.type}` as TKey)}
                  {a.mask ? ` ••${a.mask}` : ''}
                  {a.isLinked ? ' · 🔗' : ''}
                </Text>
              </View>
              <Text weight="700" tone={a.balanceMinor < 0 ? 'expense' : 'default'}>
                {formatCurrency(a.balanceMinor, a.currency)}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginTop: theme.spacing(1) }}>
        <Button
          title={t('account.add')}
          onPress={() => navigation.navigate('EditAccount')}
          style={{ flex: 1 }}
        />
        <Button
          title={t('accounts.linkAccount')}
          variant="secondary"
          onPress={() => navigation.navigate('LinkAccount')}
          style={{ flex: 1 }}
        />
      </View>

      {linkedItems.length > 0 && (
        <View style={{ marginTop: theme.spacing(4) }}>
          <Text variant="h3" style={{ marginBottom: theme.spacing(2) }}>
            {t('accounts.linkedInstitutions')}
          </Text>
          {linkedItems.map((itemId) => {
            const inst = accounts.find((a) => a.linkedItemId === itemId)?.institution ?? 'Bank';
            return (
              <Card key={itemId} style={{ marginBottom: theme.spacing(2) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text weight="600">{inst}</Text>
                  <Button
                    title={syncingItem === itemId ? t('accounts.syncing') : t('accounts.syncNow')}
                    onPress={() => handleSync(itemId)}
                    loading={syncingItem === itemId}
                    style={{ paddingVertical: theme.spacing(2) }}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Account + sync */}
      <Text variant="h3" style={{ marginTop: theme.spacing(6), marginBottom: theme.spacing(2) }}>
        {t('settings.account')}
      </Text>
      <Card>
        <View style={{ paddingVertical: theme.spacing(2) }}>
          <Text weight="600">{email}</Text>
        </View>
        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing(2) }}>
          <View style={{ flex: 1, paddingRight: theme.spacing(3) }}>
            <Text weight="600">{t('settings.sync')}</Text>
            <Text variant="small" tone={syncError ? 'expense' : 'muted'}>{syncStatus}</Text>
          </View>
          <Button
            title={t('settings.syncNow')}
            variant="secondary"
            onPress={() => SyncEngine.syncNow()}
            loading={syncing}
            style={{ paddingVertical: theme.spacing(2) }}
          />
        </View>
      </Card>

      <Text variant="h3" style={{ marginTop: theme.spacing(6), marginBottom: theme.spacing(2) }}>
        {t('settings.title')}
      </Text>
      <Card>
        {/* Base currency */}
        <Pressable
          onPress={() => navigation.navigate('SelectCurrency')}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing(2) }}
        >
          <View>
            <Text weight="600">{t('settings.baseCurrency')}</Text>
            <Text variant="small" tone="muted">
              {baseMeta.flag} {user.language === 'sw' ? baseMeta.nameSw : baseMeta.name}
            </Text>
          </View>
          <Text tone="muted">{user.baseCurrency} ›</Text>
        </Pressable>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        {/* Categories */}
        <Pressable
          onPress={() => navigation.navigate('Categories')}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing(2) }}
        >
          <Text weight="600">{t('settings.categories')}</Text>
          <Text tone="muted">›</Text>
        </Pressable>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        {/* Exchange rates */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing(2) }}>
          <View style={{ flex: 1, paddingRight: theme.spacing(3) }}>
            <Text weight="600">{t('settings.rates')}</Text>
            <Text variant="small" tone="muted">{ratesStatus}</Text>
          </View>
          <Button
            title={t('settings.refreshRates')}
            variant="secondary"
            onPress={handleRefreshRates}
            loading={refreshingRates}
            style={{ paddingVertical: theme.spacing(2) }}
          />
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        {/* Language */}
        <View style={{ paddingVertical: theme.spacing(2) }}>
          <Text weight="600" style={{ marginBottom: theme.spacing(2) }}>{t('settings.language')}</Text>
          <SegmentedControl<Language>
            value={user.language}
            onChange={(lng) => updateProfile({ language: lng })}
            segments={[
              { label: 'English', value: 'en' },
              { label: 'Kiswahili', value: 'sw' },
            ]}
          />
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        {/* Biometric */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing(2) }}>
          <View style={{ flex: 1, paddingRight: theme.spacing(3) }}>
            <Text weight="600">{t('settings.biometric')}</Text>
            <Text variant="small" tone="muted">{t('settings.biometricSub')}</Text>
          </View>
          <Switch
            value={user.biometricEnabled}
            onValueChange={(v) => updateProfile({ biometricEnabled: v })}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        <Pressable
          onPress={() =>
            Alert.alert(t('settings.resetDemo'), t('settings.resetConfirm'), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('settings.reset'), style: 'destructive', onPress: () => resetToSeed() },
            ])
          }
          style={{ paddingVertical: theme.spacing(2) }}
        >
          <Text tone="primary" weight="600">{t('settings.resetDemo')}</Text>
        </Pressable>

        <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing(2) }} />

        <Pressable onPress={() => logout()} style={{ paddingVertical: theme.spacing(2) }}>
          <Text tone="expense" weight="600">{t('settings.signOut')}</Text>
        </Pressable>
      </Card>

      <Text variant="small" tone="muted" style={{ textAlign: 'center', marginTop: theme.spacing(4) }}>
        {config.dataSource} · Plaid {config.plaidEnv}
      </Text>
    </Screen>
  );
}
