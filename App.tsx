import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { AuthProvider } from '@/services/auth/AuthProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { refreshRates } from '@/services/fx';
import { useSyncManager } from '@/services/sync/useSyncManager';

export default function App() {
  useEffect(() => {
    // Fetch live exchange rates once on launch; silently keeps bundled rates
    // if the network is unavailable.
    refreshRates();
  }, []);

  // Push local changes and pull remote ones while logged in.
  useSyncManager();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
