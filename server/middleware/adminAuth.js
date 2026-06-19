import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.js';

export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Не авторизовано' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Доступ заборонено' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Недійсний токен' });
  }
}
