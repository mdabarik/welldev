import jwt from 'jsonwebtoken';
import { db } from '../data.js';
import { fail } from './errors.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const TOKEN_TTL = '1h';

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL });

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// Header: Authorization: Bearer <token>
export function auth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return fail(res, 401, 'UNAUTHORIZED', 'Authorization: Bearer <token> header দিতে হবে');
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === payload.sub);
    if (!user) return fail(res, 401, 'INVALID_TOKEN', 'Token-এর user আর নেই');
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return fail(res, 401, 'TOKEN_EXPIRED', 'Token-এর মেয়াদ শেষ, আবার login করো');
    return fail(res, 401, 'INVALID_TOKEN', 'Token ঠিক নয়');
  }
}

// auth-এর পরে বসাতে হয়। 401 = তুমি কে জানি না, 403 = জানি, কিন্তু তোমার অনুমতি নেই।
export const requireRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : fail(res, 403, 'FORBIDDEN', `এই কাজ শুধু ${role}-এর জন্য`);
