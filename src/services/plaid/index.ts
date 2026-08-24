import { config } from '@/config/env';
import { BankSyncService } from './types';
import { MockBankSyncService } from './MockBankSyncService';
import { PlaidBankSyncService } from './PlaidBankSyncService';

/**
 * Single entry point for the rest of the app. Screens import `bankSync`
 * and never care which provider is behind it. Flip EXPO_PUBLIC_DATA_SOURCE
 * to "plaid" (and stand up the backend) to go live.
 */
export const bankSync: BankSyncService =
  config.dataSource === 'plaid'
    ? new PlaidBankSyncService()
    : new MockBankSyncService();

export * from './types';
