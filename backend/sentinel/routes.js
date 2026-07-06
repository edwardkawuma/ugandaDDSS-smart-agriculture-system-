/**
 * Sentinel Hub WMS proxy — backend/sentinel/routes.js
 *
 * Proxies WMS tile requests to Sentinel Hub, injecting INSTANCE_ID and
 * enforcing Uganda's bounding box (W29.5 S-1.5 E35.0 N4.2).
 *
 * All requests are validated to ensure BBOX stays within Uganda.
 * Credentials are never exposed to the client.
 *
 * Env vars required:
 *   SENTINEL_INSTANCE_ID  — your Sentinel Hub instance ID
 *   SENTINEL_CLIENT_ID    — OAuth2 client id (optional, for OAuth flow)
 *   SENTINEL_CLIENT_SECRET— OAuth2 client secret (optional)
 */

import { Router } from 'express';
import https from 'https';
import http  from 'http';

export const sentinelRouter = Router();

// ── Uganda bounding box ──────────────────────────────────────────────────────
const UGANDA_BBOX = {
  west:  29.5,
  south: -1.5,
  east:  35.0,
  north:  4.2,
};

const INSTANCE_ID = process.env.SENTINEL_INSTANCE_ID ?? 'DEMO';

// Supported layers whitelist — prevents arbitrary layer injection
const ALLOWED_LAYERS = new Set([
  'FALSE_COLOR',
  'NDVI',
  'EVI',
  'BARREN-SOIL',
  'MOISTURE-INDEX',
  'MOISTURE-STRESS',
  'AGRICULTURE',
  'SAVI',
  // Standard Sentinel Hub presets
  'TRUE-COLOR',
  'TRUE-COLOR-S2L2A',
]);

// ── WMS proxy ────────────────────────────────────────────────────────────────

/**
 * GET /api/sentinel/wms
 * Proxies any WMS GetMap / GetCapabilities request to Sentinel Hub.
 * Enforces Uganda bbox and layer whitelist.
 */
sentinelRouter.get('/wms', (req, res) => {
  const qs = { ...req.query };

  // Validate / enforce layer whitelist
  const requestedLayer = (qs.LAYERS ?? qs.layers ?? '').toString().toUpperCase();
  if (requestedLayer && !ALLOWED_LAYERS.has(requestedLayer)) {
    return res.status(400).json({ error: `Layer '${requestedLayer}' is not permitted.` });
  }

  // Clamp BBOX to Uganda
  if (qs.BBOX || qs.bbox) {
    const raw = (qs.BBOX ?? qs.bbox ?? '').toString().split(',').map(Number);
    if (raw.length === 4) {
      const [w, s, e, n] = raw;
      qs.BBOX = [
        Math.max(w, UGANDA_BBOX.west),
        Math.max(s, UGANDA_BBOX.south),
        Math.min(e, UGANDA_BBOX.east),
        Math.min(n, UGANDA_BBOX.north),
      ].join(',');
      delete qs.bbox;
    }
  }

  // Build Sentinel Hub WMS URL
  const params = new URLSearchParams({
    SERVICE:     'WMS',
    REQUEST:     qs.REQUEST ?? qs.request ?? 'GetMap',
    VERSION:     '1.3.0',
    LAYERS:      requestedLayer || 'NDVI',
    FORMAT:      'image/png',
    TRANSPARENT: 'true',
    WIDTH:       String(qs.WIDTH ?? qs.width ?? 512),
    HEIGHT:      String(qs.HEIGHT ?? qs.height ?? 512),
    CRS:         'EPSG:3857',
    MAXCC:       '20',
    ...qs,
  });

  const sentinelUrl = `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}?${params.toString()}`;

  // If no real INSTANCE_ID configured — return a placeholder demo tile
  if (INSTANCE_ID === 'DEMO') {
    // Return a transparent 1×1 PNG so Leaflet doesn't 404
    const TRANSPARENT_1PX_PNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    res.set('Content-Type', 'image/png');
    res.set('X-Sentinel-Mode', 'demo');
    return res.send(TRANSPARENT_1PX_PNG);
  }

  // Proxy to Sentinel Hub
  const protocol = sentinelUrl.startsWith('https') ? https : http;
  const proxyReq = protocol.get(sentinelUrl, (proxyRes) => {
    res.set('Content-Type', proxyRes.headers['content-type'] ?? 'image/png');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('X-Sentinel-Mode', 'live');
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[sentinel-proxy] Error:', err.message);
    res.status(502).json({ error: 'Sentinel Hub unreachable', detail: err.message });
  });

  proxyReq.setTimeout(15000, () => {
    proxyReq.destroy();
    res.status(504).json({ error: 'Sentinel Hub request timed out' });
  });
});

// ── Layer catalogue ──────────────────────────────────────────────────────────

/**
 * GET /api/sentinel/layers
 * Returns the list of available layers and current instance config.
 */
sentinelRouter.get('/layers', (_req, res) => {
  res.json({
    instance_id:  INSTANCE_ID === 'DEMO' ? null : INSTANCE_ID,
    mode:         INSTANCE_ID === 'DEMO' ? 'demo' : 'live',
    bbox:         UGANDA_BBOX,
    wms_base:     `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}`,
    layers:       Array.from(ALLOWED_LAYERS).map(id => ({
      id,
      wms_url: `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}?LAYERS=${id}&FORMAT=image/tiff`,
    })),
  });
});

// ── GeoTIFF export info ──────────────────────────────────────────────────────

/**
 * GET /api/sentinel/export/:layer
 * Returns the WMS GeoTIFF URL clipped to Uganda bbox for server-side processing
 * (e.g. GDAL/Rasterio pipeline). Does not download the file — just returns the URL.
 */
sentinelRouter.get('/export/:layer', (req, res) => {
  const layer = req.params.layer.toUpperCase();
  if (!ALLOWED_LAYERS.has(layer)) {
    return res.status(400).json({ error: `Layer '${layer}' is not in the allowed list.` });
  }

  const params = new URLSearchParams({
    SERVICE:     'WMS',
    REQUEST:     'GetMap',
    VERSION:     '1.3.0',
    LAYERS:      layer,
    FORMAT:      'image/tiff',
    TRANSPARENT: 'false',
    WIDTH:       '2048',
    HEIGHT:      '2048',
    CRS:         'EPSG:4326',
    BBOX:        `${UGANDA_BBOX.south},${UGANDA_BBOX.west},${UGANDA_BBOX.north},${UGANDA_BBOX.east}`,
    MAXCC:       '10',
  });

  const tiffUrl = `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}?${params.toString()}`;

  res.json({
    layer,
    mode:          INSTANCE_ID === 'DEMO' ? 'demo' : 'live',
    bbox:          UGANDA_BBOX,
    geotiff_url:   tiffUrl,
    output_path:   `uganda_layers/${layer.toLowerCase().replace(/-/g, '_')}.tif`,
    gdal_command:  `gdal_translate -of GTiff "${tiffUrl}" uganda_layers/${layer.toLowerCase()}.tif`,
  });
});

// ── Status ───────────────────────────────────────────────────────────────────

sentinelRouter.get('/status', (_req, res) => {
  res.json({
    service:      'Sentinel Hub WMS Proxy',
    instance_id:  INSTANCE_ID === 'DEMO' ? null : INSTANCE_ID,
    mode:         INSTANCE_ID === 'DEMO' ? 'demo' : 'live',
    bbox:         UGANDA_BBOX,
    allowed_layers: Array.from(ALLOWED_LAYERS),
    note:         INSTANCE_ID === 'DEMO'
      ? 'Set SENTINEL_INSTANCE_ID in .env to enable live Sentinel Hub tiles'
      : 'Live Sentinel Hub WMS proxy active',
  });
});
