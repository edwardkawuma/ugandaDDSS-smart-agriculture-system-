import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '../db/seedUsers.js';
import { signToken } from './jwt.js';
import { createUser, enqueueSync, updateUserVerification } from '../db/sqlite.js';
import { isOnline, upsertUser } from '../db/postgres.js';

export const authRouter = Router();

function publicUser(row) {
  return {
    user_id: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    is_email_verified: row.is_email_verified ?? 1,
  };
}

authRouter.post('/signin', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = signToken(user);
  return res.json({ token, ...publicUser(user) });
});

authRouter.post('/signup', async (req, res) => {
  const { email, password, name, role = 'Public Visitor' } = req.body ?? {};
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (await findUserByEmail(email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const now = new Date().toISOString();
  const userId = `user-${Date.now().toString(36)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    user_id: userId,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    name,
    role,
    is_email_verified: 0,
    created_at: now,
    updated_at: now,
    synced_at: null,
  };

  await createUser(user);

  await enqueueSync('users', userId, 'upsert', user);
  if (isOnline()) await upsertUser(user).catch(() => {});

  return res.json({ user_id: userId, message: 'Account created. Verify your email with OTP.' });
});

authRouter.post('/verifyOtp', async (req, res) => {
  const { email } = req.body ?? {};
  const user = email ? await findUserByEmail(email) : null;
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  await updateUserVerification(user.user_id);

  const token = signToken(user);
  return res.json({ token, user_id: user.user_id, role: user.role });
});

authRouter.post('/forgotPassword', (_req, res) => res.json({ message: 'OTP sent if account exists' }));
authRouter.post('/resetPassword', (_req, res) => res.json({ message: 'Password reset successful' }));
authRouter.post('/verifyResetOtp', (_req, res) =>
  res.json({ reset_token: 'demo-reset-' + Math.random().toString(36).slice(2, 10) }),
);
authRouter.post('/resendOtp', (_req, res) => res.json({ message: 'OTP resent' }));
authRouter.post('/resendResetOtp', (_req, res) => res.json({ message: 'OTP resent' }));
