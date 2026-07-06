import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

const sqlitePath = process.env.SQLITE_PATH?.trim() || path.join(process.cwd(), 'data', 'agrismart-local.db');
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoToken) {
  console.error('[migrate] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment.');
  process.exit(1);
}

if (!fs.existsSync(sqlitePath)) {
  console.error(`[migrate] Local SQLite file not found: ${sqlitePath}`);
  process.exit(1);
}

const sqlite = new Database(sqlitePath, { readonly: true });
const turso = createClient({ url: tursoUrl, authToken: tursoToken });

async function ensureSchema() {
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

async function migrateUsers() {
  const users = sqlite.prepare('SELECT * FROM users').all();
  for (const user of users) {
    await turso.execute({
      sql: `INSERT INTO users (user_id, email, password_hash, name, role, is_email_verified, created_at, updated_at, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              email = excluded.email,
              password_hash = excluded.password_hash,
              name = excluded.name,
              role = excluded.role,
              is_email_verified = excluded.is_email_verified,
              created_at = excluded.created_at,
              updated_at = excluded.updated_at,
              synced_at = excluded.synced_at`,
      args: [
        user.user_id,
        user.email,
        user.password_hash,
        user.name,
        user.role,
        Number(user.is_email_verified ?? 0),
        user.created_at,
        user.updated_at,
        user.synced_at ?? null,
      ],
    });
  }
  return users.length;
}

async function migrateSyncQueue() {
  const rows = sqlite.prepare('SELECT * FROM sync_queue ORDER BY id ASC').all();

  await turso.execute('DELETE FROM sync_queue');

  for (const row of rows) {
    await turso.execute({
      sql: `INSERT INTO sync_queue (id, entity, entity_id, operation, payload, created_at, synced)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        Number(row.id),
        row.entity,
        row.entity_id,
        row.operation,
        row.payload,
        row.created_at,
        Number(row.synced ?? 0),
      ],
    });
  }

  if (rows.length > 0) {
    const maxId = rows[rows.length - 1].id;
    await turso.execute({
      sql: 'UPDATE sqlite_sequence SET seq = ? WHERE name = ?',
      args: [Number(maxId), 'sync_queue'],
    }).catch(async () => {
      await turso.execute({
        sql: 'INSERT OR REPLACE INTO sqlite_sequence(name, seq) VALUES(?, ?)',
        args: ['sync_queue', Number(maxId)],
      });
    });
  }

  return rows.length;
}

async function counts() {
  const localUsers = sqlite.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const localSync = sqlite.prepare('SELECT COUNT(*) AS c FROM sync_queue').get().c;

  const remoteUsersRs = await turso.execute('SELECT COUNT(*) AS c FROM users');
  const remoteSyncRs = await turso.execute('SELECT COUNT(*) AS c FROM sync_queue');

  const remoteUsers = Number(remoteUsersRs.rows?.[0]?.c ?? 0);
  const remoteSync = Number(remoteSyncRs.rows?.[0]?.c ?? 0);

  return { localUsers, localSync, remoteUsers, remoteSync };
}

async function main() {
  console.log(`[migrate] SQLite source: ${sqlitePath}`);
  console.log('[migrate] Ensuring Turso schema...');
  await ensureSchema();

  console.log('[migrate] Migrating users...');
  const usersMoved = await migrateUsers();

  console.log('[migrate] Migrating sync_queue...');
  const syncMoved = await migrateSyncQueue();

  const c = await counts();

  console.log('[migrate] Done.');
  console.log(`[migrate] users moved=${usersMoved}, sync_queue moved=${syncMoved}`);
  console.log(`[migrate] local users=${c.localUsers}, remote users=${c.remoteUsers}`);
  console.log(`[migrate] local sync_queue=${c.localSync}, remote sync_queue=${c.remoteSync}`);

  if (c.localUsers !== c.remoteUsers || c.localSync !== c.remoteSync) {
    console.error('[migrate] Count mismatch detected.');
    process.exit(2);
  }
}

main()
  .catch((err) => {
    console.error('[migrate] Failed:', err?.message || err);
    process.exit(1);
  })
  .finally(() => {
    try { sqlite.close(); } catch {}
  });
