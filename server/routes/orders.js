import { Router } from 'express';
import db from '../db/database.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Відсоток нарахування бонусів за рівнем лояльності (узгоджено з бізнес-правилами)
const TIER_PERCENT = { bronze: 1, silver: 2, gold: 3 };

router.post('/', optionalAuth, (req, res) => {
  const { items, delivery_address, delivery_method, payment_method, comment, promo_code, bonus_used } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Кошик порожній' });

  let total = 0;
  let discount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_available = 1').get(item.id);
    if (!product) return res.status(400).json({ error: `Товар ${item.id} недоступний` });
    orderItems.push({ product, quantity: item.quantity, price: product.price });
    total += product.price * item.quantity;
  }

  // Promo code validation — промокоди доступні лише авторизованим користувачам
  let appliedPromo = null;
  if (promo_code && req.user) {
    const code = promo_code.toUpperCase();
    const promo = db.prepare("SELECT * FROM promo_codes WHERE code = ? AND is_active = 1").get(code);
    if (promo) {
      const limited = promo.max_uses !== -1;
      // Промокод з обмеженням використань — лише один раз на акаунт
      if (limited && req.user) {
        const prior = db.prepare(
          "SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND UPPER(promo_code) = ?"
        ).get(req.user.id, code);
        if (prior.c > 0) {
          return res.status(400).json({ error: 'Промокод вже використано на цьому акаунті' });
        }
      }
      if (total >= promo.min_order && (!limited || promo.used_count < promo.max_uses)) {
        appliedPromo = promo;
        if (promo.type === 'percent') discount = Math.round(total * promo.value / 100);
        else if (promo.type === 'fixed') discount = Math.min(promo.value, total);
        db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
      }
    }
  }

  // Bonus points usage + поточний рівень лояльності користувача
  let bonusUsed = 0;
  let currentTier = 'bronze';
  if (req.user) {
    const user = db.prepare('SELECT bonus_points, tier FROM users WHERE id = ?').get(req.user.id);
    currentTier = user.tier || 'bronze';
    if (bonus_used > 0) {
      bonusUsed = Math.min(bonus_used, user.bonus_points, Math.floor(total * 0.3));
      discount += Math.floor(bonusUsed / 10);
    }
  }

  const finalTotal = Math.max(total - discount, 0);
  // Нарахування балів за рівнем лояльності (Бронза 1%, Срібло 2%, Золото 3% від суми замовлення)
  const tierPercent = TIER_PERCENT[currentTier] || 1;
  const bonusEarned = req.user
    ? Math.round(finalTotal * tierPercent / 100) * (appliedPromo?.type === 'bonus_x2' ? 2 : 1)
    : 0;

  const orderResult = db.prepare(`INSERT INTO orders (user_id, total, delivery_address, delivery_method, payment_method, comment, promo_code, discount_amount, bonus_used, bonus_earned)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
    req.user?.id || null, finalTotal, delivery_address || '', delivery_method || 'delivery',
    payment_method || 'cash', comment || '', appliedPromo ? appliedPromo.code : '', discount, bonusUsed, bonusEarned
  );

  const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)');
  for (const item of orderItems) {
    insertItem.run(orderResult.lastInsertRowid, item.product.id, item.quantity, item.price);
  }

  if (req.user) {
    db.prepare('UPDATE users SET bonus_points = bonus_points - ? + ? WHERE id = ?').run(bonusUsed, bonusEarned, req.user.id);
    if (bonusEarned > 0) {
      db.prepare('INSERT INTO bonus_transactions (user_id, amount, type, description) VALUES (?,?,?,?)').run(req.user.id, bonusEarned, 'earn', `Нараховано за замовлення #${orderResult.lastInsertRowid}`);
    }
    if (bonusUsed > 0) {
      db.prepare('INSERT INTO bonus_transactions (user_id, amount, type, description) VALUES (?,?,?,?)').run(req.user.id, -bonusUsed, 'spend', `Використано у замовленні #${orderResult.lastInsertRowid}`);
    }
    // Оновлення рівня лояльності за загальною сумою замовлень (Срібло від 1000 грн, Золото від 3000 грн).
    // Рівень лише підвищується (згідно з бізнес-правилами) — не знижується.
    const totalSpent = db.prepare('SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE user_id = ?').get(req.user.id).s;
    let computed = 'bronze';
    if (totalSpent >= 3000) computed = 'gold';
    else if (totalSpent >= 1000) computed = 'silver';
    const rank = { bronze: 0, silver: 1, gold: 2 };
    const newTier = rank[computed] > rank[currentTier] ? computed : currentTier;
    db.prepare('UPDATE users SET tier = ? WHERE id = ?').run(newTier, req.user.id);
  }

  res.json({ orderId: orderResult.lastInsertRowid, total: finalTotal, discount, bonusEarned, bonusUsed });
});

router.get('/my', authMiddleware, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const result = orders.map(order => {
    const items = db.prepare(`SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`).all(order.id);
    return { ...order, items };
  });
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Замовлення не знайдено' });
  const items = db.prepare(`SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`).all(order.id);
  res.json({ ...order, items });
});

export default router;
