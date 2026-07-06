/**
 * Uganda Raster Time-Series Cube — frontend API service
 * Communicates with /api/timeseries/* on the backend.
 */

const BASE = '/api/timeseries';

export type CubeLayer = {
  id:    string;
  name:  string;
  group: 'vegetation' | 'moisture' | 'agriculture' | 'composite';
};

export type BuildParams = {
  layers: string[];
  months: number;
  width:  number;
  height: number;
  output?: string;
};

export type CubeStatus = {
  running:      boolean;
  outputReady:  boolean;
  outputPath:   string | null;
  sizeMb:       number | null;
  credentials: {
    instance_id_set:    boolean;
    client_id_set:      boolean;
    client_secret_set:  boolean;
  };
  lastRun: null | {
    startedAt:   string;
    finishedAt?: string;
    status:      'running' | 'done' | 'error';
    progress:    number;
    total:       number;
    params:      BuildParams;
    sizeMb:      number | null;
    log:         Array<Record<string, unknown>>;
  };
};

export type LayersResponse = {
  layers:      CubeLayer[];
  defaults:    string[];
  max_months:  number;
  bbox:        { west: number; south: number; east: number; north: number };
  description: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const timeseriesService = {
  /** Fetch available layers + parameter docs */
  layers: () => fetchJson<LayersResponse>('/layers'),

  /** Fetch current pipeline status */
  status: () => fetchJson<CubeStatus>('/status'),

  /**
   * Start the Python pipeline. Returns an EventSource-compatible URL.
   * Use buildAndStream() to get a live progress stream instead.
   */
  buildUrl: () => `${BASE}/build`,

  /**
   * POST build params and return an EventSource stream of JSON-line events.
   * The caller receives `onEvent` callbacks as the pipeline runs.
   */
  buildAndStream: async (
    params: BuildParams,
    onEvent: (evt: Record<string, unknown>) => void,
    onDone:  (evt: Record<string, unknown>) => void,
    onError: (msg: string) => void,
  ): Promise<void> => {
    let res: Response;
    try {
      res = await fetch(`${BASE}/build`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
    } catch (e) {
      onError(String(e));
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      onError((body as { error?: string }).error ?? `HTTP ${res.status}`);
      return;
    }

    const reader  = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) { onError('No response body'); return; }

    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const text = line.replace(/^data:\s*/, '').trim();
        if (!text) continue;
        try {
          const evt = JSON.parse(text) as Record<string, unknown>;
          onEvent(evt);
          if (evt.status === 'done')  { onDone(evt);  return; }
          if (evt.status === 'error') { onError(String(evt.message ?? 'Unknown error')); return; }
        } catch { /* non-JSON chunk */ }
      }
    }
  },

  /** Download the generated NetCDF file */
  downloadUrl: () => `${BASE}/download`,
};
