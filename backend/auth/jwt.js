import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'agrismart-uganda-dev-secret-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    SECRET,
    { expiresIn: EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
