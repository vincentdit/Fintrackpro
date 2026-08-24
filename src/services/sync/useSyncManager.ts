import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useStore } from '@/store/useStore';
import { SyncEngine } from './SyncEngine';

/**
 * Drives sync while logged in:
 *  - debounced push shortly after any local change,
 *  - a pull when the app returns to the foreground,
 *  - a periodic pull so other devices' edits arrive without user action.
 */
export function useSyncManager(): void {
  const auth = useStore((s) => s.auth);
  const pendingCount = useStore(
    (s) => Object.keys(s.pending).length + (s.profileDirty ? 1 : 0),
  );
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!auth || pendingCount === 0) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      SyncEngine.syncNow();
    }, 1500);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [auth, pendingCount]);

  useEffect(() => {
    if (!auth) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') SyncEngine.syncNow();
    });
    const interval = setInterval(() => SyncEngine.syncNow(), 30000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [auth]);
}
