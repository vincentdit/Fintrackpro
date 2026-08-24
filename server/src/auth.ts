import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me';
const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;

export interface AuthedRequest extends Request {
  userId?: string;
}

function signAccess(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

const randomToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

/** Issue an access JWT plus a rotating, hashed refresh token stored in the DB. */
async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = randomToken();
  const expires = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(refreshToken), expires.toISOString()],
  );
  return { accessToken: signAccess(userId), refreshToken };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  settings: Record<string, unknown>;
}

async function loadUser(id: string): Promise<UserRow | null> {
  const { rows } = await pool.query(
    'SELECT id, email, name, settings FROM users WHERE id = $1',
    [id],
  );
  return rows[0] ?? null;
}

const publicUser = (u: UserRow) => ({ id: u.id, email: u.email, name: u.name, settings: u.settings });

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const name = String(req.body?.name ?? '').trim();
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'email and a 6+ char password are required' });
  }
  const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rowCount) return res.status(409).json({ error: 'email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, settings',
    [email, hash, name],
  );
  const user = rows[0] as UserRow;
  const tokens = await issueTokens(user.id);
  return res.status(201).json({ ...tokens, user: publicUser(user) });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const { rows } = await pool.query(
    'SELECT id, email, name, settings, password_hash FROM users WHERE email = $1',
    [email],
  );
  const row = rows[0];
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    return res.status(401).json({ error: 'invalid email or password' });
  }
  const tokens = await issueTokens(row.id);
  return res.json({ ...tokens, user: publicUser(row) });
});

/**
 * Rotating refresh: the presented token is single-use. A valid token is
 * revoked and replaced. Presenting an already-revoked token is treated as
 * theft/replay and revokes the user's whole token family.
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  const tokenHash = hashToken(refreshToken);

  const { rows } = await pool.query(
    'SELECT id, user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return res.status(401).json({ error: 'invalid refresh token' });

  if (row.revoked) {
    // Reuse of a rotated token — revoke everything for safety.
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [row.user_id]);
    return res.status(401).json({ error: 'refresh token reused' });
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(401).json({ error: 'refresh token expired' });
  }

  await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [row.id]);
  const user = await loadUser(row.user_id);
  if (!user) return res.status(401).json({ error: 'user not found' });
  const tokens = await issueTokens(user.id);
  return res.json({ ...tokens, user: publicUser(user) });
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = String(req.body?.refreshToken ?? '');
  if (refreshToken) {
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [
      hashToken(refreshToken),
    ]);
  }
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = await loadUser(req.userId!);
  if (!user) return res.status(404).json({ error: 'not found' });
  return res.json({ user: publicUser(user) });
});
