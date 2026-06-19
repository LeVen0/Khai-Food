import { Router } from 'express';
import db from '../db/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/validate', optionalAuth, (req, res) => {
  const { code, total } = req.body;
  if (!req.user) return res.status(401).json({ error: 'Промокод доступний лише авторизованим користувачам' });
  if (!code) return res.status(400).json({ error: 'Введіть промокод' });

  const upperCode = code.toUpperCase();
  const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND is_active = 1").get(upperCode);
  if (!promo) return res.status(404).json({ error: 'Промокод не знайдено або недійсний' });
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return res.status(400).json({ error: 'Термін дії промокоду закінчився' });
  if (promo.max_uses !== -1 && promo.used_count >= promo.max_uses) return res.status(400).json({ error: 'Промокод вичерпано' });
  // Промокод з обмеженням використань — лише один раз на акаунт
  if (promo.max_uses !== -1 && req.user) {
    const prior = db.prepare(
      "SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND UPPER(promo_code) = ?"
    ).get(req.user.id, upperCode);
    if (prior.c > 0) return res.status(400).json({ error: 'Промокод вже використано на цьому акаунті' });
  }
  if (total < promo.min_order) return res.status(400).json({ error: `Мінімальна сума замовлення: ${promo.min_order} грн` });

  let discount = 0;
  if (promo.type === 'percent') discount = Math.round(total * promo.value / 100);
  else if (promo.type === 'fixed') discount = Math.min(promo.value, total);

  res.json({ valid: true, discount, description: promo.description, type: promo.type, value: promo.value });
});

export default router;
