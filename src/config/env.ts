/**
 * Centralised, typed access to runtime configuration.
 * Values come from EXPO_PUBLIC_* env vars (safe to expose to the client).
 * Anything secret (Plaid client_secret, DB creds) must live on the backend only.
 */

export type DataSource = 'mock' | 'plaid';

interface AppConfig {
  dataSource: DataSource;
  apiBaseUrl: string;
  plaidEnv: 'sandbox' | 'development' | 'production';
}

function readDataSource(): DataSource {
  const raw = process.env.EXPO_PUBLIC_DATA_SOURCE;
  return raw === 'plaid' ? 'plaid' : 'mock';
}

export const config: AppConfig = {
  dataSource: readDataSource(),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com',
  plaidEnv:
    (process.env.EXPO_PUBLIC_PLAID_ENV as AppConfig['plaidEnv']) ?? 'sandbox',
};
