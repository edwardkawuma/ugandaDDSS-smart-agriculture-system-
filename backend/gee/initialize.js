import ee from '@google/earthengine';
import fs from 'fs';

let initialized = false;
let initError = null;

/**
 * Initialize the Earth Engine client using a service account or private key JSON.
 * Returns false when credentials are missing — the API falls back to demo mode.
 */
export async function initializeEarthEngine() {
  if (initialized) return { ok: true, mode: 'gee' };
  if (initError) return { ok: false, mode: 'demo', error: initError.message };

  const projectId = process.env.GEE_PROJECT_ID;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    initError = new Error('Earth Engine credentials not configured — running in demo mode');
    return { ok: false, mode: 'demo', error: initError.message };
  }

  try {
    const key = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    await new Promise((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(key, resolve, reject);
    });
    await new Promise((resolve, reject) => {
      ee.initialize(
        { project: projectId || key.project_id },
        resolve,
        reject,
      );
    });
    initialized = true;
    return { ok: true, mode: 'gee' };
  } catch (err) {
    initError = err;
    console.warn('[GEE] Initialization failed:', err.message);
    return { ok: false, mode: 'demo', error: err.message };
  }
}

export function isGeeReady() {
  return initialized;
}

export { ee };
