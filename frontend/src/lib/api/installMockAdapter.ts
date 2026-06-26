// Bootstrap that wires the mock adapter onto apiService when running in mock mode.
// Called from main.tsx before <App /> renders.
//
// Activation: set VITE_USE_MOCK=true in .env (or .env.local) for dev/preview.
// In real-API builds (production deploy), keep VITE_USE_MOCK unset/false — the
// dynamic import below is then never evaluated and the mock layer is tree-shaken
// out of the bundle.

import apiService from './apiService';

export async function installMockAdapter(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return;
  const mod = await import('./mockAdapter');
  apiService.installAdapter(mod.mockAdapter as unknown as (config: any) => Promise<any>);
  // eslint-disable-next-line no-console
  console.info('[apiService] mock adapter installed (VITE_USE_MOCK=true)');
}
