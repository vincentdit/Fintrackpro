import { mergeById } from '@/store/merge';
import { RecordChange } from '@/services/sync/types';

interface Row {
  id: string;
  updatedAt?: string;
  deleted?: boolean;
  amountMinor?: number;
}

const rc = (id: string, updatedAt: string, data: object, deleted = false): RecordChange => ({
  kind: 'transaction',
  id,
  data: { id, ...data },
  updatedAt,
  deleted,
});

describe('last-write-wins merge', () => {
  test('adds new records from the server', () => {
    const out = mergeById<Row>([], [rc('t1', '2026-01-01T00:00:00Z', { amountMinor: 100 })]);
    expect(out).toHaveLength(1);
    expect(out[0]!.amountMinor).toBe(100);
  });

  test('newer server record overwrites older local one', () => {
    const local: Row[] = [{ id: 't1', updatedAt: '2026-01-01T00:00:00Z', amountMinor: 100 }];
    const out = mergeById(local, [rc('t1', '2026-02-01T00:00:00Z', { amountMinor: 250 })]);
    expect(out[0]!.amountMinor).toBe(250);
  });

  test('older server record does NOT overwrite newer local one', () => {
    const local: Row[] = [{ id: 't1', updatedAt: '2026-03-01T00:00:00Z', amountMinor: 999 }];
    const out = mergeById(local, [rc('t1', '2026-01-01T00:00:00Z', { amountMinor: 1 })]);
    expect(out[0]!.amountMinor).toBe(999);
  });

  test('deletion tombstone propagates', () => {
    const local: Row[] = [{ id: 't1', updatedAt: '2026-01-01T00:00:00Z', amountMinor: 100 }];
    const out = mergeById(local, [rc('t1', '2026-02-01T00:00:00Z', { amountMinor: 100 }, true)]);
    expect(out[0]!.deleted).toBe(true);
  });

  test('untouched local records are preserved', () => {
    const local: Row[] = [
      { id: 't1', updatedAt: '2026-01-01T00:00:00Z', amountMinor: 1 },
      { id: 't2', updatedAt: '2026-01-01T00:00:00Z', amountMinor: 2 },
    ];
    const out = mergeById(local, [rc('t1', '2026-02-01T00:00:00Z', { amountMinor: 10 })]);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.id === 't2')!.amountMinor).toBe(2);
  });
});
