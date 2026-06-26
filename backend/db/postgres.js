import pg from 'pg';

const { Pool } = pg;

let pool = null;
let online = false;

export function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function initPostgres() {
  if (!isPostgresConfigured()) {
    online = false;
    return false;
  }
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 5,
      connectionTimeoutMillis: 5000,
    });
    await pool.query('SELECT 1');
    await ensureSchema();
    online = true;
    console.log('[db] PostgreSQL connected — online sync enabled');
    return true;
  } catch (err) {
    console.warn('[db] PostgreSQL unavailable — running offline (SQLite only):', err.message);
    online = false;
    if (pool) {
      await pool.end().catch(() => {});
      pool = null;
    }
    return false;
  }
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      is_email_verified INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      synced_at TIMESTAMPTZ
    );
  `);
}

export function isOnline() {
  return online && pool !== null;
}

export function getPool() {
  return pool;
}

export async function upsertUser(user) {
  if (!isOnline()) return false;
  await pool.query(
    `INSERT INTO users (user_id, email, password_hash, name, role, is_email_verified, created_at, updated_at, synced_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       email = EXCLUDED.email,
       password_hash = EXCLUDED.password_hash,
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       is_email_verified = EXCLUDED.is_email_verified,
       updated_at = EXCLUDED.updated_at,
       synced_at = NOW()`,
    [
      user.user_id,
      user.email,
      user.password_hash,
      user.name,
      user.role,
      user.is_email_verified ?? 1,
      user.created_at,
      user.updated_at,
    ],
  );
  return true;
}

export async function findUserByEmail(email) {
  if (!isOnline()) return null;
  const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  return rows[0] ?? null;
}
