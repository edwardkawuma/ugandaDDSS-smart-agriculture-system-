/**
 * Sentinel Hub WMS integration for Uganda DDSS.
 * All layers are clipped to Uganda's bounding box: N=4.2, S=-1.5, E=35.0, W=29.5
 * WMS tiles are proxied through /api/sentinel to avoid CORS + hide credentials.
 */

export const UGANDA_BBOX = {
  west:  29.5,
  south: -1.5,
  east:  35.0,
  north:  4.2,
} as const;

/** Uganda center for map initialisation */
export const UGANDA_CENTER_LATLNG: [number, number] = [1.3733, 32.2903];

// ── Layer catalogue ──────────────────────────────────────────────────────────

export type SentinelLayerId =
  | 'FALSE_COLOR'
  | 'NDVI'
  | 'EVI'
  | 'BARREN_SOIL'
  | 'MOISTURE_INDEX'
  | 'MOISTURE_STRESS'
  | 'AGRICULTURE'
  | 'SAVI';

export interface SentinelLayerDef {
  id: SentinelLayerId;
  name: string;
  description: string;
  wmsLayer: string;        // exact LAYERS= param name Sentinel Hub expects
  legend: Array<{ label: string; color: string }>;
  group: 'vegetation' | 'moisture' | 'agriculture' | 'composite';
}

export const SENTINEL_LAYERS: SentinelLayerDef[] = [
  {
    id: 'FALSE_COLOR',
    name: 'False Colour',
    wmsLayer: 'FALSE_COLOR',
    description: 'NIR-Red-Green composite — healthy vegetation appears bright red',
    group: 'composite',
    legend: [
      { label: 'Dense vegetation', color: '#c0392b' },
      { label: 'Sparse vegetation', color: '#e8a0a0' },
      { label: 'Bare soil / urban', color: '#95a5a6' },
      { label: 'Water', color: '#2980b9' },
    ],
  },
  {
    id: 'NDVI',
    name: 'NDVI',
    wmsLayer: 'NDVI',
    description: 'Normalised Difference Vegetation Index — crop vigour indicator',
    group: 'vegetation',
    legend: [
      { label: '< 0.1 (bare)', color: '#d73027' },
      { label: '0.1–0.3',     color: '#fc8d59' },
      { label: '0.3–0.5',     color: '#fee08b' },
      { label: '0.5–0.7',     color: '#91cf60' },
      { label: '> 0.7 (lush)',color: '#1a9850' },
    ],
  },
  {
    id: 'EVI',
    name: 'EVI',
    wmsLayer: 'EVI',
    description: 'Enhanced Vegetation Index — reduced atmospheric distortion vs NDVI',
    group: 'vegetation',
    legend: [
      { label: 'Low',    color: '#d9ef8b' },
      { label: 'Medium', color: '#66bd63' },
      { label: 'High',   color: '#1a9641' },
    ],
  },
  {
    id: 'BARREN_SOIL',
    name: 'Barren Soil',
    wmsLayer: 'BARREN-SOIL',
    description: 'Highlights exposed, bare soil — useful for erosion monitoring',
    group: 'agriculture',
    legend: [
      { label: 'Vegetated', color: '#2d6a4f' },
      { label: 'Bare soil', color: '#d4a373' },
    ],
  },
  {
    id: 'MOISTURE_INDEX',
    name: 'Moisture Index',
    wmsLayer: 'MOISTURE-INDEX',
    description: 'NDWI-based moisture index — detects water stress before wilting',
    group: 'moisture',
    legend: [
      { label: 'Dry',    color: '#d62728' },
      { label: 'Normal', color: '#ffd92f' },
      { label: 'Wet',    color: '#1f77b4' },
    ],
  },
  {
    id: 'MOISTURE_STRESS',
    name: 'Moisture Stress',
    wmsLayer: 'MOISTURE-STRESS',
    description: 'Identifies areas under moisture stress — links to drought early warning',
    group: 'moisture',
    legend: [
      { label: 'No stress',   color: '#31a354' },
      { label: 'Mild stress', color: '#fd8d3c' },
      { label: 'High stress', color: '#bd0026' },
    ],
  },
  {
    id: 'AGRICULTURE',
    name: 'Agriculture',
    wmsLayer: 'AGRICULTURE',
    description: 'SWIR-NIR-Blue composite — distinguishes crop types and maturity stages',
    group: 'agriculture',
    legend: [
      { label: 'Active cropland', color: '#ffff33' },
      { label: 'Fallow',          color: '#a65628' },
      { label: 'Forest / shrub',  color: '#4daf4a' },
    ],
  },
  {
    id: 'SAVI',
    name: 'SAVI',
    wmsLayer: 'SAVI',
    description: 'Soil-Adjusted Vegetation Index — accounts for soil brightness in sparse cover areas (N. Uganda)',
    group: 'vegetation',
    legend: [
      { label: 'Sparse',  color: '#fee5d9' },
      { label: 'Moderate',color: '#fb6a4a' },
      { label: 'Dense',   color: '#cb181d' },
    ],
  },
];

// ── WMS tile URL builder ─────────────────────────────────────────────────────

/** Base URL for the backend proxy — avoids exposing INSTANCE_ID to the client */
export const SENTINEL_API_BASE =
  (import.meta.env.VITE_SENTINEL_API_URL as string | undefined) ?? '/api/sentinel';

/**
 * Build a Leaflet-compatible WMS tile URL through the backend proxy.
 * The proxy strips credentials before forwarding to Sentinel Hub.
 */
export function buildSentinelTileUrl(layerId: SentinelLayerId, opacity = 1): string {
  const params = new URLSearchParams({
    layer:   layerId,
    opacity: String(opacity),
  });
  return `${SENTINEL_API_BASE}/tiles/{z}/{x}/{y}?${params.toString()}`;
}

/**
 * Direct WMS URL (used server-side / for GeoTIFF export).
 * Requires INSTANCE_ID and is only called from the backend proxy.
 */
export function buildWmsUrl(instanceId: string, layerName: string): string {
  const base = `https://services.sentinel-hub.com/ogc/wms/${instanceId}`;
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    LAYERS:  layerName,
    FORMAT:  'image/png',
    TRANSPARENT: 'true',
    MAXCC: '20',
    WIDTH: '256',
    HEIGHT: '256',
    CRS: 'EPSG:3857',
    // Uganda bbox clamp — enforced at proxy level too
    BBOX: `${UGANDA_BBOX.west},${UGANDA_BBOX.south},${UGANDA_BBOX.east},${UGANDA_BBOX.north}`,
  });
  return `${base}?${params.toString()}`;
}
