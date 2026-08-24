import { useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { translate, TKey } from './translations';

type Vars = Record<string, string | number>;

/**
 * Hook returning the translator `t` and the active `lang`. It subscribes to
 * the language in the store, so changing the language re-renders every screen
 * that uses it. The actual translation logic lives in `translations.ts` so it
 * can be unit tested without pulling in the store.
 */
export function useTranslation() {
  const lang = useStore((s) => s.user.language) ?? 'en';
  const t = useCallback(
    (key: TKey, vars?: Vars) => translate(lang, key, vars),
    [lang],
  );
  return { t, lang };
}
