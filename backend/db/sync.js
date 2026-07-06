import { getPendingSyncCount, getPendingSyncItems, markSyncQueueSynced, markUsersSynced } from './sqlite.js';
import { isOnline, upsertUser, initPostgres } from './postgres.js';

let syncInterval = null;

export async function startSyncService() {
  await initPostgres();
  await syncNow();
  syncInterval = setInterval(() => {
    void syncNow();
  }, Number(process.env.SYNC_INTERVAL_MS ?? 15000));
}

export function stopSyncService() {
  if (syncInterval) clearInterval(syncInterval);
}

export async function syncNow() {
  const connected = await initPostgres();
  if (!connected) {
    return { online: false, synced: 0, pending: await getPendingSyncCount() };
  }

  const items = await getPendingSyncItems();
  const syncedIds = [];

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload);
      if (item.entity === 'users') {
        await upsertUser(payload);
        syncedIds.push(item.id);
      }
    } catch (err) {
      console.warn(`[sync] Failed to sync item ${item.id}:`, err.message);
    }
  }

  if (syncedIds.length) {
    await markSyncQueueSynced(syncedIds);
    const now = new Date().toISOString();
    await markUsersSynced(
      items.filter((item) => syncedIds.includes(item.id)).map((item) => item.entity_id),
      now,
    );
  }

  return { online: true, synced: syncedIds.length, pending: await getPendingSyncCount() };
}

export async function getSyncStatus() {
  const online = isOnline();
  return {
    online,
    pending: await getPendingSyncCount(),
    mode: online ? 'hybrid' : 'offline',
    offlineStore: 'sqlite',
    onlineStore: online ? 'postgresql' : null,
  };
}
