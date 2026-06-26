import { GEE_API_BASE } from './constants';
import type {
  GeeLayersResponse,
  GeeLayerId,
  GeeStatusResponse,
  GeeTileResponse,
} from './types';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${GEE_API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GEE API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchGeeStatus(): Promise<GeeStatusResponse> {
  try {
    return await fetchJson<GeeStatusResponse>('/status');
  } catch {
    return {
      mode: 'demo',
      geeReady: false,
      message: 'GEE API unavailable — using local demo layers',
    };
  }
}

export async function fetchGeeLayers(): Promise<GeeLayersResponse> {
  try {
    return await fetchJson<GeeLayersResponse>('/layers');
  } catch {
    return { mode: 'demo', layers: [] };
  }
}

export async function fetchGeeTile(layerId: GeeLayerId): Promise<GeeTileResponse> {
  try {
    return await fetchJson<GeeTileResponse>(`/tiles/${layerId}`);
  } catch {
    return { mode: 'demo', layerId, tileUrl: null };
  }
}

/** Build a Leaflet-compatible tile URL from a GEE mapId response. */
export function buildGeeTileUrl(tile: GeeTileResponse): string | null {
  if (tile.mode !== 'gee' || !tile.mapId || !tile.token) return null;
  return `https://earthengine.googleapis.com/v1/${tile.mapId}/tiles/{z}/{x}/{y}?token=${tile.token}`;
}
