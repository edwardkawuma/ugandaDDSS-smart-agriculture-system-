/** Uganda map viewport and data asset paths. */
export const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
export const UGANDA_ZOOM = 7;
export const UGANDA_MIN_ZOOM = 6;
export const UGANDA_MAX_ZOOM = 14;
export const UGANDA_BOUNDS: [[number, number], [number, number]] = [
  [-1.5, 29.5],
  [4.3, 35.0],
];

export const GEOJSON_PATHS = {
  boundary: '/data/uganda-boundary.geojson',
  districts: '/data/uganda-districts.geojson',
} as const;

/** Uses Vite dev proxy in development; override with VITE_GEE_API_URL in production. */
export const GEE_API_BASE =
  import.meta.env.VITE_GEE_API_URL ?? '/api/gee';
