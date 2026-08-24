import { CurrencyCode, EntityKind, Language } from '@/types/models';

/** One entity change on the wire. `data` is the full entity object. */
export interface RecordChange {
  kind: EntityKind;
  id: string;
  data: Record<string, unknown>;
  updatedAt: string;
  deleted: boolean;
}

export interface ProfileSettings {
  baseCurrency: CurrencyCode;
  language: Language;
  biometricEnabled: boolean;
}

export interface ProfileChange {
  name: string;
  settings: ProfileSettings;
  updatedAt: string;
}

export interface SyncChanges {
  records: RecordChange[];
  profile?: ProfileChange | null;
}

export interface SyncPullResponse {
  serverTime: string;
  changes: SyncChanges;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  settings?: Partial<ProfileSettings>;
}
