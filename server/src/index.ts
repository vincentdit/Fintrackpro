import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { initDb } from './db';
import { authRouter } from './auth';
import { syncRouter } from './sync';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// Trust the first proxy (a reverse proxy / load balancer in production) so
// client IPs — and thus rate limiting — are attributed correctly.
app.set('trust proxy', 1);

// In production set CORS_ORIGIN to your web app's URL(s) (comma-separated) to
// restrict who may call the API. Unset (dev) allows any origin.
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()) } : {}),
);
app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Rate limits: strict on auth (brute-force protection), looser on sync.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests, try again later' },
});
const syncLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests, slow down' },
});

app.use('/auth', authLimiter, authRouter);
app.use('/sync', syncLimiter, syncRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err instanceof Error ? err.message : 'server error' });
});

async function start(): Promise<void> {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      await initDb();
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`DB not ready (attempt ${attempt}/10): ${msg}`);
      if (attempt === 10) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  app.listen(PORT, () => console.log(`FinTrackPro API listening on :${PORT}`));
}

start().catch((e) => {
  console.error('Failed to start server:', e);
  process.exit(1);
});
