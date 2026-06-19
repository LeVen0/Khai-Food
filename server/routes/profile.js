import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateName, validatePhone, normalizePhone } from '../utils/validate.js';

const router = Router();

router.put('/update', authMiddleware, (req, res) => {
  const { name, phone, address } = req.body;
  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ error: nameErr });
  const phoneErr = validatePhone(phone, true);
  if (phoneErr) return res.status(400).json({ error: phoneErr });

  db.prepare('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?')
    .run(name.trim(), normalizePhone(phone), (address || '').slice(0, 200), req.user.id);
  const user = db.prepare('SELECT id, name, email, phone, address, bonus_points, tier FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.get('/bonuses', authMiddleware, (req, res) => {
  const transactions = db.prepare('SELECT * FROM bonus_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  const user = db.prepare('SELECT bonus_points, tier FROM users WHERE id = ?').get(req.user.id);
  // Рівні лояльності за загальною сумою замовлень: % нарахування та поріг наступного рівня (грн)
  const tiers = {
    bronze: { name: 'Бронза', next: 'silver', spend_to_next: 1000, percent: 1 },
    silver: { name: 'Срібло', next: 'gold',   spend_to_next: 3000, percent: 2 },
    gold:   { name: 'Золото', next: null,     spend_to_next: null, percent: 3 },
  };
  const tierInfo = tiers[user.tier] || tiers.bronze;
  const totalEarned = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM bonus_transactions WHERE user_id = ? AND type = 'earn'").get(req.user.id).total;
  const totalSpent = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE user_id = ?").get(req.user.id).total;
  res.json({ ...user, transactions, tierInfo, totalEarned, totalSpent });
});

export default router;
