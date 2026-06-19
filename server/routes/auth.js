import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { validateName, validatePhone, normalizePhone } from '../utils/validate.js';
import { generateCode, sendCodeEmail, mailConfigured } from '../utils/mailer.js';

const router = Router();
const CODE_TTL_MIN = 10;
const cookieOpts = { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000, sameSite: 'lax' };
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, bonus_points: u.bonus_points, tier: u.tier });
const signToken = (u) => jwt.sign({ id: u.id, email: u.email }, JWT_SECRET, { expiresIn: '7d' });

// ── одноразові коди ────────────────────────────────────────────────────────
async function issueCode(email, purpose) {
  db.prepare('DELETE FROM email_codes WHERE email = ? AND purpose = ?').run(email, purpose);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60000).toISOString();
  db.prepare('INSERT INTO email_codes (email, code, purpose, expires_at) VALUES (?,?,?,?)').run(email, code, purpose, expiresAt);
  const { dev } = await sendCodeEmail(email, code, purpose);
  return { dev, code };
}
function checkCode(email, purpose, code) {
  const row = db.prepare('SELECT * FROM email_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1').get(email, purpose);
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  if (String(row.code) !== String(code || '').trim()) return false;
  db.prepare('DELETE FROM email_codes WHERE email = ? AND purpose = ?').run(email, purpose);
  return true;
}
// у dev-режимі (без SMTP) повертаємо код у відповіді, щоб можна було протестувати
const withDev = (obj, dev, code) => (dev ? { ...obj, devCode: code } : obj);

// ── реєстрація + верифікація email ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заповніть всі поля' });
  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ error: nameErr });
  const phoneErr = validatePhone(phone, true);
  if (phoneErr) return res.status(400).json({ error: phoneErr });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль мінімум 6 символів' });

  const exists = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(email);
  if (exists && exists.is_verified) return res.status(400).json({ error: 'Email вже зареєстровано' });

  const hash = bcrypt.hashSync(password, 10);
  if (exists && !exists.is_verified) {
    // незавершена реєстрація — оновлюємо дані та надсилаємо новий код
    db.prepare('UPDATE users SET name = ?, phone = ?, password_hash = ? WHERE id = ?')
      .run(name.trim(), normalizePhone(phone), hash, exists.id);
  } else {
    db.prepare('INSERT INTO users (name, email, phone, password_hash, is_verified) VALUES (?,?,?,?,0)')
      .run(name.trim(), email, normalizePhone(phone), hash);
  }
  const { dev, code } = await issueCode(email, 'verify');
  res.json(withDev({ needVerification: true, email }, dev, code));
});

router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  if (!checkCode(email, 'verify', code)) return res.status(400).json({ error: 'Невірний або прострочений код' });
  db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ token, user: publicUser(user) });
});

router.post('/resend-code', async (req, res) => {
  const { email, purpose = 'verify' } = req.body;
  if (!email) return res.status(400).json({ error: 'Вкажіть email' });
  if (purpose === 'verify') {
    const user = db.prepare('SELECT is_verified FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Email не знайдено' });
    if (user.is_verified) return res.status(400).json({ error: 'Email вже підтверджено' });
  }
  const { dev, code } = await issueCode(email, purpose);
  res.json(withDev({ message: 'Код надіслано' }, dev, code));
});

// ── вхід ───────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Невірний email або пароль' });
  if (!user.is_verified)
    return res.status(403).json({ error: 'Підтвердіть email, щоб увійти', needVerification: true, email: user.email });

  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ token, user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Вихід успішний' });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, address, bonus_points, tier, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  res.json(user);
});

// ── зміна пароля (авторизований) ───────────────────────────────────────────
router.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(oldPassword || '', user.password_hash))
    return res.status(400).json({ error: 'Невірний поточний пароль' });
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Новий пароль має бути мінімум 6 символів' });
  if (bcrypt.compareSync(newPassword, user.password_hash))
    return res.status(400).json({ error: 'Новий пароль не може збігатися зі старим' });
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
  res.json({ message: 'Пароль змінено' });
});

// ── відновлення пароля через код на пошту ──────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Вкажіть email' });
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  let dev = false, code = null;
  if (user) ({ dev, code } = await issueCode(email, 'reset'));
  // не розкриваємо, чи існує акаунт
  res.json(withDev({ message: 'Якщо акаунт існує, код для відновлення надіслано на пошту' }, dev && !!user, code));
});

router.post('/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'Новий пароль має бути мінімум 6 символів' });
  if (!checkCode(email, 'reset', code)) return res.status(400).json({ error: 'Невірний або прострочений код' });
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  db.prepare('UPDATE users SET password_hash = ?, is_verified = 1 WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), user.id);
  res.json({ message: 'Пароль оновлено. Тепер увійдіть із новим паролем.' });
});

export default router;
