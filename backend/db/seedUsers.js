import bcrypt from 'bcryptjs';
import { createUser, enqueueSync, findUserByEmailSql, findUserByIdSql } from './sqlite.js';
import { isOnline, upsertUser } from './postgres.js';

export const DEMO_USERS = [
  { email: 'farmer@demo.com', name: 'Demo Farmer', role: 'Farmer' },
  { email: 'extensionworker@demo.com', name: 'Demo Extension Worker', role: 'Extension Worker' },
  { email: 'researcher@demo.com', name: 'Demo Researcher', role: 'Researcher' },
  { email: 'maaifofficial@demo.com', name: 'Demo MAAIF Official', role: 'MAAIF Official' },
  { email: 'developmentpartner@demo.com', name: 'Demo Development Partner', role: 'Development Partner' },
  { email: 'publicvisitor@demo.com', name: 'Demo Public Visitor', role: 'Public Visitor' },
];

const DEMO_PASSWORD = 'Demo@1234';

export async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date().toISOString();

  for (const demo of DEMO_USERS) {
    const existing = await findUserByEmailSql(demo.email);
    if (existing) continue;

    const userId = `demo-${demo.role.toLowerCase().replace(/\s+/g, '-')}`;
    const user = {
      user_id: userId,
      email: demo.email.toLowerCase(),
      password_hash: passwordHash,
      name: demo.name,
      role: demo.role,
      is_email_verified: 1,
      created_at: now,
      updated_at: now,
      synced_at: null,
    };

    await createUser(user);

    await enqueueSync('users', userId, 'upsert', user);

    if (isOnline()) {
      await upsertUser(user).catch(() => {});
    }
  }

  console.log(`[db] Demo users ready (${DEMO_USERS.length} roles, password: ${DEMO_PASSWORD})`);
}

export async function findUserByEmail(email) {
  return findUserByEmailSql(email);
}

export async function findUserById(userId) {
  return findUserByIdSql(userId);
}
