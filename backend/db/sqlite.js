import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@libsql/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_LOCAL_DB_PATH = path.join(DEFAULT_DATA_DIR, 'agrismart-local.db');

let db;
let turso;
let schemaReady = false;

function isVercelRuntime() {
  return process.env.VERCEL === '1' || process.env.VERCEL === 'true';
}

function isTursoConfigured() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

function resolveLocalDbPath() {
  if (process.env.SQLITE_PATH?.trim()) {
    return process.env.SQLITE_PATH.trim();
  }
  if (isVercelRuntime()) {
    return '/tmp/agrismart-local.db';
  }
  return DEFAULT_LOCAL_DB_PATH;
}

export function getStoreInfo() {
  return {
    mode: isTursoConfigured() ? 'turso' : 'sqlite-local',
    path: isTursoConfigured() ? null : resolveLocalDbPath(),
  };
}

export async function initSqlStore() {
  if (schemaReady) return;
  if (isTursoConfigured()) {
    turso = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    await initSchemaTurso();
    schemaReady = true;
    return;
  }

  const dbPath = resolveLocalDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchemaSqlite(db);
  schemaReady = true;
}

export function getSqlite() {
  if (!db) {
    const dbPath = resolveLocalDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchemaSqlite(db);
  }
  return db;
}

function initSchemaSqlite(database) {
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

async function initSchemaTurso() {
  await turso.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        is_email_verified INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )`,
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue(synced)',
    ].map((sql) => ({ sql })),
    'write',
  );
}

function normalizeRow(row) {
  if (!row) return null;
  return {
    ...row,
    is_email_verified: Number(row.is_email_verified ?? 0),
  };
}

export async function createUser(user) {
  await initSqlStore();
  if (isTursoConfigured()) {
    await turso.execute({
      sql: `INSERT INTO users (user_id, email, password_hash, name, role, is_email_verified, created_at, updated_at, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user.user_id,
        user.email,
        user.password_hash,
        user.name,
        user.role,
        user.is_email_verified,
        user.created_at,
        user.updated_at,
        user.synced_at,
      ],
    });
    return;
  }

  const database = getSqlite();
  database
    .prepare(
      `INSERT INTO users (user_id, email, password_hash, name, role, is_email_verified, created_at, updated_at, synced_at)
       VALUES (@user_id, @email, @password_hash, @name, @role, @is_email_verified, @created_at, @updated_at, @synced_at)`,
    )
    .run(user);
}

export async function findUserByEmailSql(email) {
  await initSqlStore();
  if (isTursoConfigured()) {
    const rs = await turso.execute({
      sql: 'SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
      args: [email],
    });
    return normalizeRow(rs.rows?.[0] ?? null);
  }

  const database = getSqlite();
  return normalizeRow(database.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email));
}

export async function findUserByIdSql(userId) {
  await initSqlStore();
  if (isTursoConfigured()) {
    const rs = await turso.execute({
      sql: 'SELECT * FROM users WHERE user_id = ? LIMIT 1',
      args: [userId],
    });
    return normalizeRow(rs.rows?.[0] ?? null);
  }

  const database = getSqlite();
  return normalizeRow(database.prepare('SELECT * FROM users WHERE user_id = ?').get(userId));
}

export async function updateUserVerification(userId) {
  await initSqlStore();
  const now = new Date().toISOString();
  if (isTursoConfigured()) {
    await turso.execute({
      sql: 'UPDATE users SET is_email_verified = 1, updated_at = ? WHERE user_id = ?',
      args: [now, userId],
    });
    return;
  }

  const database = getSqlite();
  database.prepare('UPDATE users SET is_email_verified = 1, updated_at = ? WHERE user_id = ?').run(now, userId);
}

export async function markUsersSynced(userIds, syncedAt) {
  if (!userIds.length) return;
  await initSqlStore();
  if (isTursoConfigured()) {
    const statements = userIds.map((userId) => ({
      sql: 'UPDATE users SET synced_at = ? WHERE user_id = ?',
      args: [syncedAt, userId],
    }));
    await turso.batch(statements, 'write');
    return;
  }

  const database = getSqlite();
  for (const userId of userIds) {
    database.prepare('UPDATE users SET synced_at = ? WHERE user_id = ?').run(syncedAt, userId);
  }
}

export async function enqueueSync(entity, entityId, operation, payload) {
  await initSqlStore();
  const createdAt = new Date().toISOString();
  const payloadText = JSON.stringify(payload);
  if (isTursoConfigured()) {
    await turso.execute({
      sql: `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at, synced)
            VALUES (?, ?, ?, ?, ?, 0)`,
      args: [entity, entityId, operation, payloadText, createdAt],
    });
    return;
  }

  const database = getSqlite();
  database
    .prepare(
      `INSERT INTO sync_queue (entity, entity_id, operation, payload, created_at, synced)
       VALUES (?, ?, ?, ?, ?, 0)`,
    )
    .run(entity, entityId, operation, payloadText, createdAt);
}

export async function getPendingSyncCount() {
  await initSqlStore();
  if (isTursoConfigured()) {
    const rs = await turso.execute('SELECT COUNT(*) AS count FROM sync_queue WHERE synced = 0');
    return Number(rs.rows?.[0]?.count ?? 0);
  }

  const database = getSqlite();
  const row = database.prepare('SELECT COUNT(*) AS count FROM sync_queue WHERE synced = 0').get();
  return Number(row?.count ?? 0);
}

export async function markSyncQueueSynced(ids) {
  if (!ids.length) return;

  await initSqlStore();
  if (isTursoConfigured()) {
    const placeholders = ids.map(() => '?').join(',');
    await turso.execute({
      sql: `UPDATE sync_queue SET synced = 1 WHERE id IN (${placeholders})`,
      args: ids,
    });
    return;
  }

  const database = getSqlite();
  const placeholders = ids.map(() => '?').join(',');
  database.prepare(`UPDATE sync_queue SET synced = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export async function getPendingSyncItems(limit = 50) {
  await initSqlStore();
  if (isTursoConfigured()) {
    const rs = await turso.execute({
      sql: 'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY id ASC LIMIT ?',
      args: [limit],
    });
    return (rs.rows ?? []).map((row) => ({
      ...row,
      id: Number(row.id),
      synced: Number(row.synced ?? 0),
    }));
  }

  const database = getSqlite();
  return database
    .prepare('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY id ASC LIMIT ?')
    .all(limit);
}
