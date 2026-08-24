import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://fintrack:fintrack@localhost:5432/fintrack';

// Managed Postgres (Render, Railway, Neon, Supabase, …) requires TLS. Enable
// it when the URL asks for it or DATABASE_SSL=true; local dev stays plaintext.
const needsSSL =
  process.env.DATABASE_SSL === 'true' || /sslmode=require/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
});

/**
 * Versioned migrations. Each runs once, in order, inside a transaction, and is
 * recorded in `schema_migrations`. Statements use IF NOT EXISTS so applying the
 * baseline over a database created by an older build is a safe no-op.
 */
interface Migration {
  id: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    id: '001_init',
    sql: `
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS users (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email                 TEXT UNIQUE NOT NULL,
        password_hash         TEXT NOT NULL,
        name                  TEXT NOT NULL DEFAULT '',
        settings              JSONB NOT NULL DEFAULT '{}'::jsonb,
        profile_updated_at    TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01T00:00:00Z',
        profile_server_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS records (
        user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        kind               TEXT NOT NULL,
        id                 TEXT NOT NULL,
        data               JSONB NOT NULL,
        updated_at         TIMESTAMPTZ NOT NULL,
        server_updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted            BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY (user_id, kind, id)
      );

      CREATE INDEX IF NOT EXISTS records_cursor_idx
        ON records (user_id, server_updated_at);
    `,
  },
  {
    id: '002_refresh_tokens',
    sql: `
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL,
        expires_at  TIMESTAMPTZ NOT NULL,
        revoked     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS refresh_tokens_hash_idx ON refresh_tokens (token_hash);
      CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON refresh_tokens (user_id);
    `,
  },
];

/** Applies any pending migrations. Safe to run on every boot. */
export async function initDb(): Promise<void> {
  await pool.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.id));

  for (const m of migrations) {
    if (applied.has(m.id)) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(m.sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id]);
      await client.query('COMMIT');
      console.log(`migration applied: ${m.id}`);
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
}
