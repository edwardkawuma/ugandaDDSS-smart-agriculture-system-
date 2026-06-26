export interface MapSearchResult {
  title: string;
  subtitle: string;
  type: string;
  lat: number;
  lng: number;
  rating?: number;
  source: string;
}

export interface MapSearchResponse {
  query: string;
  type: string;
  count: number;
  source: string;
  results: MapSearchResult[];
  warning?: string;
}

export interface SyncStatus {
  online: boolean;
  pending: number;
  mode: 'hybrid' | 'offline';
  offlineStore: string;
  onlineStore: string | null;
}
