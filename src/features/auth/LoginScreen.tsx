import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { useAuth } from '@/services/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { Button, SegmentedControl, Text } from '@/components';

type Mode = 'login' | 'register';

export function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === 'login' || name.trim().length > 0);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(email.trim(), password, name.trim());
      else await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3.5),
    color: theme.colors.text,
    fontSize: theme.font.body,
    marginBottom: theme.spacing(3),
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: theme.spacing(6),
          paddingTop: insets.top + theme.spacing(6),
          paddingBottom: insets.bottom + theme.spacing(6),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 48, marginBottom: theme.spacing(3) }}>💠</Text>
        <Text variant="h1">FinTrackPro</Text>
        <Text tone="muted" style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(6) }}>
          {t('auth.subtitle')}
        </Text>

        <View style={{ marginBottom: theme.spacing(5) }}>
          <SegmentedControl<Mode>
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
            segments={[
              { label: t('auth.login'), value: 'login' },
              { label: t('auth.register'), value: 'register' },
            ]}
          />
        </View>

        {mode === 'register' && (
          <>
            <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>
              {t('auth.name')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('auth.namePlaceholder')}
              placeholderTextColor={theme.colors.textMuted}
              style={inputStyle}
            />
          </>
        )}

        <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>
          {t('login.email')}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor={theme.colors.textMuted}
          style={inputStyle}
        />

        <Text variant="small" tone="muted" style={{ marginBottom: theme.spacing(1) }}>
          {t('auth.password')}
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder={t('auth.passwordHint')}
          placeholderTextColor={theme.colors.textMuted}
          style={inputStyle}
        />

        {error ? (
          <Text tone="expense" variant="small" style={{ marginBottom: theme.spacing(3) }}>
            {error}
          </Text>
        ) : null}

        <Button
          title={mode === 'register' ? t('auth.register') : t('auth.login')}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
          style={{ marginTop: theme.spacing(1) }}
        />

        <Text
          tone="primary"
          weight="600"
          onPress={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          style={{ textAlign: 'center', marginTop: theme.spacing(5) }}
        >
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
