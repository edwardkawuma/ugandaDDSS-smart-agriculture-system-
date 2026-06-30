import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { geeRouter } from './gee/routes.js';
import { authRouter } from './auth/routes.js';
import { mapsRouter } from './serpapi/routes.js';
import { syncRouter } from './sync/routes.js';
import { userRouter } from './user/routes.js';
import { marketRouter } from './market/routes.js';
import { cropMonitoringRouter } from './cropmonitoring/routes.js';
import { getSqlite } from './db/sqlite.js';
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

async function bootstrap() {
  getSqlite();
  await seedDemoUsers();
  await startSyncService();

  app.listen(PORT, () => {
    console.log(`AgriSmart DDSS API listening on http://localhost:${PORT}`);
    console.log('  Auth:          /api/auth/*');
    console.log('  Maps:          /api/maps/search');
    console.log('  Sync:          /api/sync/status');
    console.log('  GEE:           /api/gee/*');
    console.log('  Market Prices: /api/market-prices/* (UCDA/UBOS)');
  console.log('  Crop Monitor:  /api/crop-monitoring/* (IoT/UAV/NDVI)');
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
