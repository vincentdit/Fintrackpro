import { RecordChange } from '@/services/sync/types';

/**
 * Merge incoming server records into a local collection using last-write-wins
 * by `updatedAt`. A record is overwritten only when the incoming copy is at
 * least as new. Pure and dependency-free so it can be unit tested directly.
 */
export function mergeById<T extends { id: string; updatedAt?: string }>(
  local: T[],
  incoming: RecordChange[],
): T[] {
  const map = new Map(local.map((e) => [e.id, e]));
  for (const rc of incoming) {
    const existing = map.get(rc.id);
    if (!existing || (rc.updatedAt ?? '') >= (existing.updatedAt ?? '')) {
      map.set(rc.id, {
        ...(rc.data as unknown as T),
        updatedAt: rc.updatedAt,
        deleted: rc.deleted,
      } as T);
    }
  }
  return Array.from(map.values());
}
