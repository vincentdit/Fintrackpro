import * as LocalAuthentication from 'expo-local-authentication';
import { secureStorage } from '@/data/storage';

const SESSION_KEY = 'ftp.session.token';

/**
 * AuthService encapsulates session + device-level authentication.
 *
 * In this prototype a "session" is a locally-issued token stored in the
 * device keychain, and unlocking uses the device biometric / passcode.
 *
 * For an enterprise deployment, replace `signIn` with a real call to your
 * identity provider (OAuth2 / OIDC), store the returned refresh token here,
 * and keep short-lived access tokens in memory only. The rest of the app
 * depends only on this interface, so nothing else needs to change.
 */
export const AuthService = {
  async hasSession(): Promise<boolean> {
    return (await secureStorage.get(SESSION_KEY)) !== null;
  },

  async signIn(email: string): Promise<void> {
    // Simulated token issuance. Swap for a real IdP exchange in production.
    const token = `local.${btoa(email)}.${Date.now()}`;
    await secureStorage.set(SESSION_KEY, token);
  },

  async signOut(): Promise<void> {
    await secureStorage.remove(SESSION_KEY);
  },

  /** Returns true if device biometric/passcode auth is available. */
  async canUseBiometrics(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && enrolled;
    } catch {
      return false;
    }
  },

  /** Prompts the device unlock. Resolves true when authenticated. */
  async unlock(): Promise<boolean> {
    try {
      const available = await this.canUseBiometrics();
      if (!available) return true; // No biometrics enrolled: don't hard-block the prototype.
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock FinTrackPro',
        fallbackLabel: 'Use passcode',
      });
      return result.success;
    } catch {
      return true;
    }
  },
};
