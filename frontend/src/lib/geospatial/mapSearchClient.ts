import { mapsClient, syncClient } from '@/lib/api/authClient';
import type { MapSearchResponse, SyncStatus } from './mapSearchTypes';

export async function searchMapLocations(
  query: string,
  type: 'location' | 'district' | 'town' | 'agricultural_zone' = 'location',
): Promise<MapSearchResponse> {
  const res = await mapsClient.get<MapSearchResponse>('/maps/search', { params: { q: query, type } });
  return res.data;
}

export async function suggestMapLocations(query: string) {
  const res = await mapsClient.get<{ suggestions: MapSearchResponse['results'] }>('/maps/suggest', {
    params: { q: query },
  });
  return res.data;
}

export async function fetchSyncStatus(): Promise<SyncStatus> {
  const res = await syncClient.get<SyncStatus>('/sync/status');
  return res.data;
}
