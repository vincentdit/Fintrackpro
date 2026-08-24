import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

/**
 * Storage abstraction.
 *
 * - Non-sensitive, larger app state (transactions, budgets, UI prefs) is
 *   persisted through AsyncStorage via the Zustand persist adapter below.
 * - Sensitive secrets (auth/session tokens, the Plaid access proxy token)
 *   go through SecureStore, which is backed by the iOS Keychain and Android
 *   Keystore. SecureStore has a ~2KB per-key limit, so only keep secrets there.
 *
 * On web (where SecureStore is unavailable) we transparently fall back to
 * AsyncStorage so the prototype still runs in a browser.
 */

const isSecureStoreAvailable = typeof SecureStore.getItemAsync === 'function';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isSecureStoreAvailable) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return AsyncStorage.getItem(key);
      }
    }
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isSecureStoreAvailable) {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        /* fall through to AsyncStorage */
      }
    }
    await AsyncStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (isSecureStoreAvailable) {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch {
        /* fall through */
      }
    }
    await AsyncStorage.removeItem(key);
  },
};

/** Zustand persist adapter backed by AsyncStorage. */
export const zustandStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};
