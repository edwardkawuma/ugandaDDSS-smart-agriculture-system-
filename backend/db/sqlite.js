import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'agrismart-local.db');

let db;

export function getSqlite() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  return db;
}

function initSchema(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      is_email_verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(synced) WHERE synced = 0;
  `);
}

export function enqueueSync(entity, entityId, operation, payload) {
  const database = getSqlite();
  database
    .prepare(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at, synced)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run(entity, entityId, operation, JSON.stringify(payload), new Date().toISOString());
}

export function getPendingSyncCount() {
  const database = getSqlite();
  const row = database.prepare('SELECT COUNT(*) AS count FROM sync_queue WHERE synced = 0').get();
  return row?.count ?? 0;
}

export function markSyncQueueSynced(ids) {
  if (!ids.length) return;
  const database = getSqlite();
  const placeholders = ids.map(() => '?').join(',');
  database.prepare(`UPDATE sync_queue SET synced = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function getPendingSyncItems(limit = 50) {
  const database = getSqlite();
  return database
    .prepare('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY id ASC LIMIT ?')
    .all(limit);
}
