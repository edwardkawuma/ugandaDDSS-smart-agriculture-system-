import { getSqlite, getPendingSyncItems, markSyncQueueSynced } from './sqlite.js';
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
    return { online: false, synced: 0, pending: getPendingSyncCount() };
  }

  const items = getPendingSyncItems();
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
    markSyncQueueSynced(syncedIds);
    const database = getSqlite();
    const now = new Date().toISOString();
    for (const item of items.filter((i) => syncedIds.includes(i.id))) {
      database.prepare('UPDATE users SET synced_at = ? WHERE user_id = ?').run(now, item.entity_id);
    }
  }

  return { online: true, synced: syncedIds.length, pending: getPendingSyncCount() };
}

function getPendingSyncCount() {
  const database = getSqlite();
  const row = database.prepare('SELECT COUNT(*) AS count FROM sync_queue WHERE synced = 0').get();
  return row?.count ?? 0;
}

export function getSyncStatus() {
  return {
    online: isOnline(),
    pending: getPendingSyncCount(),
    mode: isOnline() ? 'hybrid' : 'offline',
    offlineStore: 'sqlite',
    onlineStore: isOnline() ? 'postgresql' : null,
  };
}
