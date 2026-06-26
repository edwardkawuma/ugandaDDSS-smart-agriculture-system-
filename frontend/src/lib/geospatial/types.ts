export type GeeLayerId = 'crop-distribution' | 'soil-quality' | 'rainfall' | 'ndvi';

export interface LegendItem {
  label: string;
  color: string;
}

export interface GeeLayerDefinition {
  id: GeeLayerId;
  name: string;
  description: string;
  source: string;
  legend: LegendItem[];
}

export interface GeeStatusResponse {
  mode: 'gee' | 'demo';
  geeReady: boolean;
  message: string;
}

export interface GeeLayersResponse {
  mode: 'gee' | 'demo';
  layers: Array<GeeLayerDefinition & { available: boolean }>;
}

export interface GeeTileResponse {
  mode: 'gee' | 'demo';
  layerId: string;
  mapId?: string;
  token?: string;
  tileUrl?: string | null;
}

export interface ActiveLayerState {
  id: GeeLayerId;
  visible: boolean;
  opacity: number;
}

export const DEFAULT_ACTIVE_LAYERS: ActiveLayerState[] = [
  { id: 'crop-distribution', visible: true, opacity: 0.75 },
  { id: 'soil-quality', visible: false, opacity: 0.7 },
  { id: 'rainfall', visible: false, opacity: 0.7 },
  { id: 'ndvi', visible: false, opacity: 0.75 },
];

/** Demo-mode choropleth palettes keyed by layer id. */
export const DEMO_LAYER_PALETTES: Record<GeeLayerId, { property: string; stops: Array<{ value: number; color: string }> }> = {
  'crop-distribution': {
    property: 'production_index',
    stops: [
      { value: 0.5, color: '#fef0d9' },
      { value: 0.65, color: '#fdcc8a' },
      { value: 0.8, color: '#fc8d59' },
      { value: 1.0, color: '#d7301f' },
    ],
  },
  'soil-quality': {
    property: 'production_index',
    stops: [
      { value: 0.5, color: '#8c510a' },
      { value: 0.65, color: '#bf812d' },
      { value: 0.8, color: '#dfc27d' },
      { value: 1.0, color: '#f6e8c3' },
    ],
  },
  rainfall: {
    property: 'production_index',
    stops: [
      { value: 0.5, color: '#ffffcc' },
      { value: 0.65, color: '#a1dab4' },
      { value: 0.8, color: '#41b6c4' },
      { value: 1.0, color: '#225ea8' },
    ],
  },
  ndvi: {
    property: 'production_index',
    stops: [
      { value: 0.5, color: '#d73027' },
      { value: 0.65, color: '#fee08b' },
      { value: 0.8, color: '#66bd63' },
      { value: 1.0, color: '#1a9850' },
    ],
  },
};

export function colorForValue(
  value: number,
  stops: Array<{ value: number; color: string }>,
): string {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  if (value <= sorted[0].value) return sorted[0].color;
  for (let i = 1; i < sorted.length; i += 1) {
    if (value <= sorted[i].value) return sorted[i].color;
  }
  return sorted[sorted.length - 1].color;
}
