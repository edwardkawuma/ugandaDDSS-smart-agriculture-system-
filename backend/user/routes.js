import { Router } from 'express';
import { findUserById } from '../db/seedUsers.js';
import { requireAuth } from '../auth/middleware.js';

export const userRouter = Router();

userRouter.get('/profile/:userId', requireAuth, (req, res) => {
  const user = findUserById(req.params.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_email_verified: user.is_email_verified ?? 1,
  });
});
