import React, { createContext, useContext, useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { SyncEngine } from '@/services/sync/SyncEngine';

interface AuthContextValue {
  ready: boolean;
  authenticated: boolean;
  email: string | null;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const auth = useStore((s) => s.auth);

  useEffect(() => {
    (async () => {
      await SyncEngine.bootstrap();
      setReady(true);
    })();
  }, []);

  const value: AuthContextValue = {
    ready,
    authenticated: !!auth,
    email: auth?.email ?? null,
    register: (email, password, name) => SyncEngine.register(email, password, name),
    login: (email, password) => SyncEngine.login(email, password),
    logout: () => SyncEngine.logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
