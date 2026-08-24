import { Router, Response } from 'express';
import { pool } from './db';
import { AuthedRequest, requireAuth } from './auth';

export const syncRouter = Router();

interface RecordChange {
  kind: string;
  id: string;
  data: unknown;
  updatedAt: string;
  deleted: boolean;
}

interface ProfileChange {
  name: string;
  settings: Record<string, unknown>;
  updatedAt: string;
}

const EPOCH = '1970-01-01T00:00:00.000Z';

/**
 * Bidirectional delta sync.
 *
 * Request:  { lastPulledAt, changes: { records: RecordChange[], profile? } }
 * Response: { serverTime, changes: { records: RecordChange[], profile? } }
 *
 * Push is last-write-wins on the client domain `updatedAt`. Pull uses the
 * server clock (`server_updated_at`) as the cursor, so it never depends on
 * client clock accuracy. `now()` is constant within a transaction, so all
 * writes and the returned cursor share one timestamp.
 */
syncRouter.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const userId = req.userId!;
  const lastPulledAt: string = req.body?.lastPulledAt ?? EPOCH;
  const incoming = (req.body?.changes ?? {}) as {
    records?: RecordChange[];
    profile?: ProfileChange | null;
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- PUSH records (last-write-wins by updatedAt) ---
    for (const r of incoming.records ?? []) {
      if (!r || typeof r.id !== 'string' || typeof r.kind !== 'string') continue;
      await client.query(
        `INSERT INTO records (user_id, kind, id, data, updated_at, deleted, server_updated_at)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, now())
         ON CONFLICT (user_id, kind, id) DO UPDATE
           SET data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at,
               deleted = EXCLUDED.deleted,
               server_updated_at = now()
           WHERE records.updated_at <= EXCLUDED.updated_at`,
        [userId, r.kind, r.id, JSON.stringify(r.data ?? {}), r.updatedAt, !!r.deleted],
      );
    }

    // --- PUSH profile (last-write-wins) ---
    const p = incoming.profile;
    if (p && typeof p.updatedAt === 'string') {
      await client.query(
        `UPDATE users
           SET name = $2,
               settings = $3::jsonb,
               profile_updated_at = $4,
               profile_server_updated_at = now()
         WHERE id = $1 AND profile_updated_at <= $4`,
        [userId, p.name ?? '', JSON.stringify(p.settings ?? {}), p.updatedAt],
      );
    }

    // --- PULL: single transaction timestamp is the new cursor ---
    const { rows: timeRows } = await client.query<{ now: string }>('SELECT now() AS now');
    const serverTime = timeRows[0]!.now;

    const { rows: recordRows } = await client.query(
      `SELECT kind, id, data, updated_at AS "updatedAt", deleted
         FROM records
        WHERE user_id = $1 AND server_updated_at > $2`,
      [userId, lastPulledAt],
    );

    const { rows: profileRows } = await client.query(
      `SELECT name, settings, profile_updated_at AS "updatedAt"
         FROM users
        WHERE id = $1 AND profile_server_updated_at > $2`,
      [userId, lastPulledAt],
    );

    await client.query('COMMIT');

    res.json({
      serverTime,
      changes: {
        records: recordRows,
        profile: profileRows[0] ?? null,
      },
    });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(500).json({ error: e instanceof Error ? e.message : 'sync failed' });
  } finally {
    client.release();
  }
});
