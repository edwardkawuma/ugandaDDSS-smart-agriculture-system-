import { Router } from 'express';
import { getSyncStatus, syncNow } from '../db/sync.js';
import { requireAuth } from '../auth/middleware.js';

export const syncRouter = Router();

syncRouter.get('/status', async (_req, res) => {
  res.json(await getSyncStatus());
});

syncRouter.post('/trigger', requireAuth, async (_req, res) => {
  const result = await syncNow();
  const status = await getSyncStatus();
  res.json({ message: 'Sync completed', ...result, ...status });
});
