import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { pathToFileURL } from 'url';
import { geeRouter } from './gee/routes.js';
import { authRouter } from './auth/routes.js';
import { mapsRouter } from './serpapi/routes.js';
import { syncRouter } from './sync/routes.js';
import { userRouter } from './user/routes.js';
import { marketRouter } from './market/routes.js';
import { cropMonitoringRouter } from './cropmonitoring/routes.js';
import { sentinelRouter } from './sentinel/routes.js';
import { timeseriesRouter } from './timeseries/routes.js';
import { demoDataRouter } from './data/routes.js';
import { getStoreInfo, initSqlStore } from './db/sqlite.js';
import { seedDemoUsers } from './db/seedUsers.js';
import { startSyncService } from './db/sync.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:8080', 'http://127.0.0.1:8080'] }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'agrismart-uganda-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/gee', geeRouter);
app.use('/api/market-prices', marketRouter);
app.use('/api/crop-monitoring', cropMonitoringRouter);
app.use('/api/sentinel',    sentinelRouter);
app.use('/api/timeseries', timeseriesRouter);
app.use('/api', demoDataRouter);

async function bootstrap() {
  await initBackend();

  app.listen(PORT, () => {
    console.log(`AgriSmart DDSS API listening on http://localhost:${PORT}`);
    console.log('  Auth:          /api/auth/*');
    console.log('  Maps:          /api/maps/search');
    console.log('  Sync:          /api/sync/status');
    console.log('  GEE:           /api/gee/*');
    console.log('  Market Prices: /api/market-prices/* (UCDA/UBOS)');
  console.log('  Crop Monitor:  /api/crop-monitoring/* (IoT/UAV/NDVI)');
  console.log('  Sentinel Hub:  /api/sentinel/* (WMS proxy + GeoTIFF export)');
  console.log('  Time-Series:   /api/timeseries/* (Python cube pipeline)');
  });
}

let initPromise;

export async function initBackend() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await initSqlStore();
    const store = getStoreInfo();
    console.log(`[db] SQL store mode: ${store.mode}${store.path ? ` (${store.path})` : ''}`);
    await seedDemoUsers();
    // The sync worker is useful in long-running local servers but unnecessary for serverless invocations.
    if (!process.env.VERCEL) {
      await startSyncService();
    }
  })();

  return initPromise;
}

export default app;

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  bootstrap().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
