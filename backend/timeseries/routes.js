/**
 * Time-Series Cube API — backend/timeseries/routes.js
 *
 * POST /api/timeseries/build   — spawn the Python pipeline, stream JSON-line progress
 * GET  /api/timeseries/status  — check last run status
 * GET  /api/timeseries/download — download the generated NetCDF file
 * GET  /api/timeseries/layers  — list available layers + parameter docs
 */

import { Router }                from 'express';
import { spawn }                 from 'child_process';
import { existsSync, statSync }  from 'fs';
import path                      from 'path';
import { fileURLToPath }         from 'url';

export const timeseriesRouter = Router();

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT     = path.join(__dirname, 'cube_pipeline.py');
const OUTPUT_DIR = path.join(__dirname, 'output');
const NC_FILE    = path.join(OUTPUT_DIR, 'uganda_time_series_cube.nc');

// In-memory last-run state (survives only within a single server session)
let lastRun = null;   // { startedAt, status, progress, total, log[], outputPath, sizeMb }
let running  = false;

const AVAILABLE_LAYERS = [
  { id: 'NDVI',           name: 'Vegetation Health (NDVI)',  group: 'vegetation' },
  { id: 'EVI',            name: 'Enhanced Vegetation (EVI)', group: 'vegetation' },
  { id: 'MOISTURE-INDEX', name: 'Moisture Index',            group: 'moisture'   },
  { id: 'MOISTURE-STRESS',name: 'Moisture Stress',           group: 'moisture'   },
  { id: 'SAVI',           name: 'SAVI',                      group: 'vegetation' },
  { id: 'FALSE_COLOR',    name: 'False Colour Composite',    group: 'composite'  },
  { id: 'AGRICULTURE',    name: 'Agriculture Composite',     group: 'agriculture'},
  { id: 'BARREN-SOIL',    name: 'Barren Soil',               group: 'agriculture'},
];

// ── GET /layers ───────────────────────────────────────────────────────────────
timeseriesRouter.get('/layers', (_req, res) => {
  res.json({
    layers:      AVAILABLE_LAYERS,
    defaults:    ['NDVI', 'EVI', 'MOISTURE-INDEX'],
    max_months:  24,
    bbox:        { west: 29.5, south: -1.5, east: 35.0, north: 4.2 },
    description: 'Uganda raster time-series cube via Sentinel Hub WMS + rasterio clipping',
  });
});

// ── GET /status ───────────────────────────────────────────────────────────────
timeseriesRouter.get('/status', (_req, res) => {
  const outputExists = existsSync(NC_FILE);
  res.json({
    running,
    lastRun,
    outputReady: outputExists,
    outputPath:  outputExists ? NC_FILE : null,
    sizeMb:      outputExists ? +(statSync(NC_FILE).size / 1_048_576).toFixed(2) : null,
    credentials: {
      instance_id_set:     !!process.env.SENTINEL_INSTANCE_ID,
      client_id_set:       !!process.env.SENTINEL_CLIENT_ID,
      client_secret_set:   !!process.env.SENTINEL_CLIENT_SECRET,
    },
  });
});

// ── GET /download ─────────────────────────────────────────────────────────────
timeseriesRouter.get('/download', (req, res) => {
  if (!existsSync(NC_FILE)) {
    return res.status(404).json({
      error: 'NetCDF file not found. Run /api/timeseries/build first.',
    });
  }
  res.download(NC_FILE, 'uganda_time_series_cube.nc');
});

// ── POST /build ───────────────────────────────────────────────────────────────
/**
 * Body (all optional):
 *   layers  string[]  — e.g. ["NDVI","EVI","MOISTURE-INDEX"]
 *   months  number    — default 12, max 24
 *   width   number    — default 512
 *   height  number    — default 512
 *   output  string    — filename inside output/
 */
timeseriesRouter.post('/build', (req, res) => {
  if (running) {
    return res.status(409).json({
      error: 'A build is already running. Check /api/timeseries/status for progress.',
    });
  }

  if (!process.env.SENTINEL_INSTANCE_ID) {
    return res.status(400).json({
      error: 'SENTINEL_INSTANCE_ID is not set in backend/.env',
      hint:  'Add SENTINEL_INSTANCE_ID=your-id to backend/.env and restart the server.',
    });
  }

  const {
    layers = ['NDVI', 'EVI', 'MOISTURE-INDEX'],
    months = 12,
    width  = 512,
    height = 512,
    output = 'uganda_time_series_cube.nc',
  } = req.body ?? {};

  // Validate layers
  const allowedIds = new Set(AVAILABLE_LAYERS.map(l => l.id));
  const invalid    = layers.filter(l => !allowedIds.has(l));
  if (invalid.length) {
    return res.status(400).json({ error: `Unknown layers: ${invalid.join(', ')}` });
  }
  if (months < 1 || months > 24) {
    return res.status(400).json({ error: 'months must be between 1 and 24' });
  }

  // Build CLI args
  const args = [
    SCRIPT,
    '--layers', ...layers,
    '--months', String(Math.min(months, 24)),
    '--width',  String(width),
    '--height', String(height),
    '--output', output,
  ];

  running = true;
  lastRun = {
    startedAt: new Date().toISOString(),
    status:    'running',
    progress:  0,
    total:     layers.length * months,
    log:       [],
    outputPath: null,
    sizeMb:    null,
    params:    { layers, months, width, height, output },
  };

  // Set up SSE so the frontend can stream progress
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent({ status: 'start', layers, months, width, height });

  const py = spawn('python3', args, {
    env: { ...process.env },
    cwd: __dirname,
  });

  py.stdout.on('data', (chunk) => {
    chunk.toString().trim().split('\n').forEach(line => {
      if (!line.trim()) return;
      try {
        const evt = JSON.parse(line);
        lastRun.log.push(evt);
        if (evt.progress != null) {
          lastRun.progress = evt.progress;
          lastRun.total    = evt.total ?? lastRun.total;
        }
        sendEvent(evt);
      } catch {
        // non-JSON stdout line — forward as info
        const msg = { status: 'info', message: line };
        lastRun.log.push(msg);
        sendEvent(msg);
      }
    });
  });

  py.stderr.on('data', (chunk) => {
    const msg = { status: 'stderr', message: chunk.toString().trim() };
    lastRun.log.push(msg);
    sendEvent(msg);
  });

  py.on('close', (code) => {
    running = false;
    if (code === 0) {
      const outputExists = existsSync(NC_FILE);
      lastRun.status    = 'done';
      lastRun.finishedAt = new Date().toISOString();
      lastRun.outputPath = outputExists ? NC_FILE : null;
      lastRun.sizeMb     = outputExists
        ? +(statSync(NC_FILE).size / 1_048_576).toFixed(2)
        : null;
      sendEvent({
        status:     'done',
        outputPath: lastRun.outputPath,
        sizeMb:     lastRun.sizeMb,
      });
    } else {
      lastRun.status = 'error';
      lastRun.exitCode = code;
      sendEvent({ status: 'error', message: `Process exited with code ${code}` });
    }
    res.end();
  });

  req.on('close', () => {
    // Client disconnected — let Python keep running but stop SSE
  });
});
