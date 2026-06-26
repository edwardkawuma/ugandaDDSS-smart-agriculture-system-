import { Router } from 'express';
import { getMapTiles, listLayers } from './layers.js';
import { initializeEarthEngine } from './initialize.js';

const router = Router();
let cachedMode = 'demo';

router.get('/status', async (_req, res) => {
  const status = await initializeEarthEngine();
  cachedMode = status.mode;
  res.json({
    mode: status.mode,
    geeReady: status.ok,
    message:
      status.mode === 'gee'
        ? 'Google Earth Engine connected'
        : 'Demo mode — configure GOOGLE_APPLICATION_CREDENTIALS for live GEE tiles',
  });
});

router.get('/layers', async (_req, res) => {
  const status = await initializeEarthEngine();
  cachedMode = status.mode;
  res.json({ mode: status.mode, layers: listLayers(status.mode) });
});

router.get('/tiles/:layerId', async (req, res) => {
  const status = await initializeEarthEngine();
  cachedMode = status.mode;

  if (status.mode !== 'gee') {
    return res.json({
      mode: 'demo',
      layerId: req.params.layerId,
      tileUrl: null,
    });
  }

  try {
    const tiles = getMapTiles(req.params.layerId);
    res.json({ mode: 'gee', layerId: req.params.layerId, ...tiles });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export { router as geeRouter, cachedMode };
