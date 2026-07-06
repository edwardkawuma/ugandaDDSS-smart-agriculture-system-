/**
 * Simulated per-district Sentinel Hub layer values for Uganda.
 * In production these would come from actual clipped GeoTIFF statistics
 * served by the Python pipeline (/api/timeseries/district-stats).
 *
 * Structure:  districtValues[layerId][district_id] = 0–1 normalised value
 */

export type DistrictLayerData = Record<string, Record<string, number>>;

export const DISTRICT_LAYER_VALUES: DistrictLayerData = {
  NDVI: {
    'UG-KLA': 0.52, 'UG-WAK': 0.68, 'UG-MUK': 0.61,
    'UG-JIN': 0.74, 'UG-MBL': 0.77, 'UG-GUL': 0.42,
    'UG-LIR': 0.48, 'UG-MBR': 0.71, 'UG-KAB': 0.66,
    'UG-MAS': 0.79,
  },
  EVI: {
    'UG-KLA': 0.44, 'UG-WAK': 0.61, 'UG-MUK': 0.55,
    'UG-JIN': 0.68, 'UG-MBL': 0.70, 'UG-GUL': 0.35,
    'UG-LIR': 0.41, 'UG-MBR': 0.65, 'UG-KAB': 0.59,
    'UG-MAS': 0.73,
  },
  'MOISTURE-INDEX': {
    'UG-KLA': 0.58, 'UG-WAK': 0.72, 'UG-MUK': 0.63,
    'UG-JIN': 0.69, 'UG-MBL': 0.55, 'UG-GUL': 0.29,
    'UG-LIR': 0.33, 'UG-MBR': 0.76, 'UG-KAB': 0.81,
    'UG-MAS': 0.74,
  },
  'MOISTURE-STRESS': {
    'UG-KLA': 0.45, 'UG-WAK': 0.31, 'UG-MUK': 0.38,
    'UG-JIN': 0.27, 'UG-MBL': 0.44, 'UG-GUL': 0.78,
    'UG-LIR': 0.69, 'UG-MBR': 0.22, 'UG-KAB': 0.18,
    'UG-MAS': 0.25,
  },
  AGRICULTURE: {
    'UG-KLA': 0.61, 'UG-WAK': 0.74, 'UG-MUK': 0.69,
    'UG-JIN': 0.88, 'UG-MBL': 0.72, 'UG-GUL': 0.55,
    'UG-LIR': 0.58, 'UG-MBR': 0.82, 'UG-KAB': 0.67,
    'UG-MAS': 0.78,
  },
  SAVI: {
    'UG-KLA': 0.49, 'UG-WAK': 0.64, 'UG-MUK': 0.57,
    'UG-JIN': 0.71, 'UG-MBL': 0.73, 'UG-GUL': 0.38,
    'UG-LIR': 0.44, 'UG-MBR': 0.68, 'UG-KAB': 0.62,
    'UG-MAS': 0.75,
  },
  FALSE_COLOR: {
    'UG-KLA': 0.55, 'UG-WAK': 0.70, 'UG-MUK': 0.63,
    'UG-JIN': 0.76, 'UG-MBL': 0.78, 'UG-GUL': 0.43,
    'UG-LIR': 0.49, 'UG-MBR': 0.72, 'UG-KAB': 0.67,
    'UG-MAS': 0.80,
  },
  'BARREN-SOIL': {
    'UG-KLA': 0.32, 'UG-WAK': 0.21, 'UG-MUK': 0.28,
    'UG-JIN': 0.18, 'UG-MBL': 0.24, 'UG-GUL': 0.62,
    'UG-LIR': 0.57, 'UG-MBR': 0.19, 'UG-KAB': 0.15,
    'UG-MAS': 0.20,
  },
};

// ── Colour ramps per layer ─────────────────────────────────────────────────────

export type ColourStop = { value: number; color: string };

export const LAYER_COLOUR_RAMPS: Record<string, ColourStop[]> = {
  NDVI: [
    { value: 0.0, color: '#d73027' },
    { value: 0.3, color: '#fc8d59' },
    { value: 0.5, color: '#fee08b' },
    { value: 0.7, color: '#91cf60' },
    { value: 1.0, color: '#1a9850' },
  ],
  EVI: [
    { value: 0.0, color: '#feedde' },
    { value: 0.4, color: '#fdbe85' },
    { value: 0.6, color: '#fd8d3c' },
    { value: 0.8, color: '#e6550d' },
    { value: 1.0, color: '#a63603' },
  ],
  'MOISTURE-INDEX': [
    { value: 0.0, color: '#d62728' },
    { value: 0.3, color: '#ff7f0e' },
    { value: 0.5, color: '#ffd92f' },
    { value: 0.7, color: '#74c476' },
    { value: 1.0, color: '#1f77b4' },
  ],
  'MOISTURE-STRESS': [
    { value: 0.0, color: '#31a354' },
    { value: 0.4, color: '#a1d99b' },
    { value: 0.6, color: '#fd8d3c' },
    { value: 0.8, color: '#e31a1c' },
    { value: 1.0, color: '#800026' },
  ],
  AGRICULTURE: [
    { value: 0.0, color: '#fff7bc' },
    { value: 0.4, color: '#fec44f' },
    { value: 0.7, color: '#d95f0e' },
    { value: 1.0, color: '#993404' },
  ],
  SAVI: [
    { value: 0.0, color: '#fee5d9' },
    { value: 0.3, color: '#fcae91' },
    { value: 0.6, color: '#fb6a4a' },
    { value: 0.8, color: '#de2d26' },
    { value: 1.0, color: '#a50f15' },
  ],
  FALSE_COLOR: [
    { value: 0.0, color: '#f7f7f7' },
    { value: 0.3, color: '#d9f0a3' },
    { value: 0.6, color: '#78c679' },
    { value: 0.8, color: '#31a354' },
    { value: 1.0, color: '#006837' },
  ],
  'BARREN-SOIL': [
    { value: 0.0, color: '#2d6a4f' },
    { value: 0.3, color: '#95d5b2' },
    { value: 0.6, color: '#d4a373' },
    { value: 0.8, color: '#bc6c25' },
    { value: 1.0, color: '#6b3a2a' },
  ],
};

/** Interpolate a colour from a ramp given a 0–1 value */
export function rampColor(value: number, stops: ColourStop[]): string {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  if (value <= sorted[0].value) return sorted[0].color;
  for (let i = 1; i < sorted.length; i++) {
    if (value <= sorted[i].value) {
      // Linear interpolation between two hex colours
      const t = (value - sorted[i - 1].value) / (sorted[i].value - sorted[i - 1].value);
      return lerpHex(sorted[i - 1].color, sorted[i].color, t);
    }
  }
  return sorted[sorted.length - 1].color;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}
