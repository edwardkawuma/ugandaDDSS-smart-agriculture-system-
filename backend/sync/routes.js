import { Router } from 'express';
import { getSyncStatus, syncNow } from '../db/sync.js';
import { requireAuth } from '../auth/middleware.js';

export const syncRouter = Router();

syncRouter.get('/status', (_req, res) => {
  res.json(getSyncStatus());
});

syncRouter.post('/trigger', requireAuth, async (_req, res) => {
  const result = await syncNow();
  res.json({ message: 'Sync completed', ...result, ...getSyncStatus() });
});
