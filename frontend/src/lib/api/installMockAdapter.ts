// Bootstrap that wires the mock adapter onto apiService when running in mock mode.
// Called from main.tsx before <App /> renders.
//
// Activation: set VITE_USE_MOCK=true in .env (or .env.local) for dev/preview.
// In real-API builds (production deploy), keep VITE_USE_MOCK unset/false — the
// dynamic import below is then never evaluated and the mock layer is tree-shaken
// out of the bundle.

import apiService from './apiService';
import { authClient, mapsClient, syncClient } from './authClient';

export async function installMockAdapter(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return;
  const mod = await import('./mockAdapter');
  const adapter = mod.mockAdapter as unknown as (config: any) => Promise<any>;

  // Ensure every axios-based client uses the same mock transport in mock mode.
  // Without this, auth flows can bypass mocks and hit the Vite proxy.
  apiService.installAdapter(adapter);
  authClient.defaults.adapter = adapter;
  mapsClient.defaults.adapter = adapter;
  syncClient.defaults.adapter = adapter;

  // eslint-disable-next-line no-console
  console.info('[apiService] mock adapter installed for apiService + auth/maps/sync clients (VITE_USE_MOCK=true)');
}
