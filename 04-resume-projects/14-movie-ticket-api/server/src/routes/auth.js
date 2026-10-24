import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, nextId } from '../data.js';
import { auth, signToken, publicUser } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';
import { isEmail, isStr } from '../validate.js';

const router = Router();

// POST /api/auth/register  -> 201 Created
router.post('/register', (req, res) => {
  const { name, email, password } = req.body || {};
  const details = [];
  if (!isStr(name, 2, 60)) details.push({ field: 'name', message: 'name ২-৬০ অক্ষরের হতে হবে' });
  if (!isEmail(email)) details.push({ field: 'email', message: 'ঠিক email দাও' });
  if (!isStr(password, 6, 100)) details.push({ field: 'password', message: 'password কমপক্ষে ৬ অক্ষর' });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);

  if (db.users.some((u) => u.email === email.toLowerCase())) {
    return fail(res, 409, 'EMAIL_TAKEN', 'এই email দিয়ে আগেই account আছে');
  }
  const user = { id: nextId('user'), name: name.trim(), email: email.toLowerCase(), role: 'user', passwordHash: bcrypt.hashSync(password, 8) };
  db.users.push(user);
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
});

// POST /api/auth/login  -> 200 OK + JWT
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || !isStr(password, 1, 100)) {
    return fail(res, 400, 'VALIDATION_ERROR', 'email আর password দিতে হবে');
  }
  const user = db.users.find((u) => u.email === email.toLowerCase());
  // email ভুল না password ভুল, সেটা আলাদা করে বলি না (নিরাপত্তা)
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'email বা password ভুল');
  }
  res.json({ user: publicUser(user), token: signToken(user) });
});

// GET /api/auth/me  -> নিজের তথ্য
router.get('/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

// PATCH /api/auth/me  -> নিজের name / password আংশিক বদল
router.patch('/me', auth, (req, res) => {
  const { name, password } = req.body || {};
  if (name === undefined && password === undefined) {
    return fail(res, 400, 'VALIDATION_ERROR', 'name বা password-এর অন্তত একটা দাও');
  }
  const details = [];
  if (name !== undefined && !isStr(name, 2, 60)) details.push({ field: 'name', message: 'name ২-৬০ অক্ষরের হতে হবে' });
  if (password !== undefined && !isStr(password, 6, 100)) details.push({ field: 'password', message: 'password কমপক্ষে ৬ অক্ষর' });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);

  if (name !== undefined) req.user.name = name.trim();
  if (password !== undefined) req.user.passwordHash = bcrypt.hashSync(password, 8);
  res.json({ user: publicUser(req.user) });
});

export default router;
