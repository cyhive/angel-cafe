import express from 'express';
import { connectDb } from './db.js';
import { createApiRouter } from './api.js';
import { createAuthRouter, requireAuthentication } from './auth.js';

// Connects once per process (or per warm serverless instance)
let ready: Promise<void> | null = null;
function ensureReady(): Promise<void> {
  ready ??= connectDb().catch((err) => {
    ready = null; // retry on the next request
    throw err;
  });
  return ready;
}

/** Express app serving the POS API under /api. Used locally and on Vercel. */
export function createApp() {
  const app = express();
  app.use('/api/auth', createAuthRouter());
  app.use('/api', requireAuthentication);
  app.use('/api', async (_req, res, next) => {
    try {
      await ensureReady();
      next();
    } catch (err) {
      console.error('Database connection failed:', err);
      res.status(503).json({ error: `Database connection failed: ${(err as Error).message}` });
    }
  });
  app.use('/api', createApiRouter());
  return app;
}
