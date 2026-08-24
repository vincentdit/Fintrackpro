import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { bankSync, Institution } from '@/services/plaid';
import { Card, Text } from '@/components';
import { config } from '@/config/env';
import { useTranslation } from '@/i18n/useTranslation';

export function LinkAccountScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const upsertLinkedAccounts = useStore((s) => s.upsertLinkedAccounts);
  const importTransactions = useStore((s) => s.importTransactions);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Institution[]>([]);
  const [searching, setSearching] = useState(true);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSearching(true);
    const handle = setTimeout(async () => {
      const found = await bankSync.searchInstitutions(query);
      if (active) {
        setResults(found);
        setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query]);

  const handleLink = async (institutionId: string) => {
    setLinkingId(institutionId);
    try {
      // In the mock provider this simulates the full Plaid Link handshake.
      // With EXPO_PUBLIC_DATA_SOURCE=plaid, wire react-native-plaid-link-sdk
      // here: fetch a link_token, open Plaid Link, then exchange the
      // public_token via PlaidBankSyncService.exchangePublicToken().
      const result = await bankSync.linkInstitution(institutionId);
      upsertLinkedAccounts(result.accounts);
      const txns = await bankSync.syncTransactions(result.itemId);
      importTransactions(txns);
      navigation.goBack();
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing(4) }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('link.search')}
        placeholderTextColor={theme.colors.textMuted}
        autoFocus
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing(4),
          paddingVertical: theme.spacing(3.5),
          color: theme.colors.text,
          fontSize: theme.font.body,
          marginBottom: theme.spacing(4),
        }}
      />

      {config.dataSource === 'mock' ? (
        <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(3) }}>
          {t('link.demoNote')}
        </Text>
      ) : null}

      {searching ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: theme.spacing(6) }} />
      ) : (
        results.map((inst) => (
          <Pressable key={inst.id} onPress={() => handleLink(inst.id)} disabled={linkingId !== null}>
            <Card style={{ marginBottom: theme.spacing(2), opacity: linkingId && linkingId !== inst.id ? 0.5 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: inst.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: theme.spacing(3),
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{inst.logo}</Text>
                </View>
                <Text weight="600" style={{ flex: 1 }}>{inst.name}</Text>
                {linkingId === inst.id ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Text tone="primary" weight="600">{t('link.link')}</Text>
                )}
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </View>
  );
}
