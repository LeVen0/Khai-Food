import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/adapter.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

/* ── Login ───────────────────────────────────────────── */
router.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (login === 'admin' && password === 'admin') {
    const token = jwt.sign({ role: 'admin', login: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Невірний логін або пароль' });
});

/* ── Stats ───────────────────────────────────────────── */
router.get('/stats', adminAuth, (req, res) => {
  const totalOrders    = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const todayOrders    = db.prepare("SELECT COUNT(*) as c FROM orders WHERE date(created_at)=date('now')").get().c;
  const totalRevenue   = db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE status!='cancelled'").get().s;
  const todayRevenue   = db.prepare("SELECT COALESCE(SUM(total),0) as s FROM orders WHERE date(created_at)=date('now') AND status!='cancelled'").get().s;
  const activeOrders   = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('pending','preparing','ready','delivering')").get().c;
  const totalUsers     = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalProducts  = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_available=1').get().c;
  const cancelledOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='cancelled'").get().c;
  res.json({ totalOrders, todayOrders, totalRevenue, todayRevenue, activeOrders, totalUsers, totalProducts, cancelledOrders });
});

/* ── Orders ──────────────────────────────────────────── */
router.get('/orders', adminAuth, (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM orders o LEFT JOIN users u ON o.user_id = u.id
  `;
  const params = [];
  if (status && status !== 'all') {
    if (status === 'active') {
      sql += " WHERE o.status IN ('pending','preparing','ready','delivering')";
    } else {
      sql += ' WHERE o.status = ?';
      params.push(status);
    }
  }
  sql += ' ORDER BY o.created_at DESC';

  const orders = db.prepare(sql).all(...params);
  const result = orders.map(o => {
    const items = db.prepare(`
      SELECT oi.quantity, oi.price, p.name as product_name
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(o.id);
    return { ...o, items };
  });
  res.json(result);
});

router.put('/orders/:id/status', adminAuth, (req, res) => {
  const allowed = ['pending','preparing','ready','delivering','delivered','cancelled'];
  const { status } = req.body;
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Недійсний статус' });
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ ok: true });
});

/* ── Categories ──────────────────────────────────────── */
router.get('/categories', adminAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

/* ── Products ────────────────────────────────────────── */
router.get('/products', adminAuth, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p JOIN categories c ON p.category_id = c.id
    ORDER BY c.sort_order, p.name
  `).all();
  res.json(products);
});

router.post('/products', adminAuth, (req, res) => {
  const { category_id, name, description, price, old_price, image_url,
          weight, calories, is_popular, is_new, is_spicy, is_available } = req.body;
  if (!category_id || !name || !price) return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
  const result = db.prepare(`
    INSERT INTO products (category_id,name,description,price,old_price,image_url,weight,calories,is_popular,is_new,is_spicy,is_available)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(+category_id, name, description || '', +price,
    old_price ? +old_price : null, image_url || null,
    weight ? +weight : null, calories != null ? +calories : null,
    is_popular?1:0, is_new?1:0, is_spicy?1:0, is_available?1:1);

  const newProduct = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id=?
  `).get(result.lastInsertRowid);
  res.json(newProduct);
});

router.put('/products/:id', adminAuth, (req, res) => {
  const { category_id, name, price, old_price, description, image_url,
          weight, calories, is_available, is_popular, is_new, is_spicy } = req.body;
  db.prepare(`
    UPDATE products
    SET category_id=?,name=?,price=?,old_price=?,description=?,image_url=?,
        weight=?,calories=?,is_available=?,is_popular=?,is_new=?,is_spicy=?
    WHERE id=?
  `).run(+category_id, name, +price, old_price ? +old_price : null,
    description, image_url || null,
    weight ? +weight : null, calories != null ? +calories : null,
    is_available?1:0, is_popular?1:0, is_new?1:0, is_spicy?1:0, +req.params.id);

  const updated = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id=?
  `).get(+req.params.id);
  res.json(updated);
});

router.delete('/products/:id', adminAuth, (req, res) => {
  // Check if product is used in any order
  const used = db.prepare('SELECT COUNT(*) as c FROM order_items WHERE product_id=?').get(+req.params.id).c;
  if (used > 0) {
    // Soft-delete: mark as unavailable instead
    db.prepare('UPDATE products SET is_available=0 WHERE id=?').run(+req.params.id);
    return res.json({ ok: true, soft: true, message: 'Товар є в замовленнях — приховано з меню' });
  }
  db.prepare('DELETE FROM products WHERE id=?').run(+req.params.id);
  res.json({ ok: true, soft: false });
});

/* ── Promo codes ─────────────────────────────────────── */
router.get('/promo', adminAuth, (req, res) => {
  const promos = db.prepare('SELECT * FROM promo_codes ORDER BY id DESC').all();
  res.json(promos);
});

router.post('/promo', adminAuth, (req, res) => {
  const { code, type, value, min_order, max_uses, description, expires_at, is_active } = req.body;
  if (!code || !type || value == null) return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
  const upper = code.trim().toUpperCase();
  const exists = db.prepare('SELECT id FROM promo_codes WHERE code=?').get(upper);
  if (exists) return res.status(400).json({ error: 'Такий код вже існує' });
  const result = db.prepare(
    'INSERT INTO promo_codes (code,type,value,min_order,max_uses,description,expires_at,is_active) VALUES (?,?,?,?,?,?,?,?)'
  ).run(upper, type, +value, +(min_order||0), max_uses!=null?+max_uses:-1, description||'', expires_at||null, is_active?1:1);
  const created = db.prepare('SELECT * FROM promo_codes WHERE id=?').get(result.lastInsertRowid);
  res.json(created);
});

router.put('/promo/:id', adminAuth, (req, res) => {
  const { code, type, value, min_order, max_uses, description, expires_at, is_active } = req.body;
  if (!code || !type || value == null) return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
  const upper = code.trim().toUpperCase();
  const dup = db.prepare('SELECT id FROM promo_codes WHERE code=? AND id!=?').get(upper, +req.params.id);
  if (dup) return res.status(400).json({ error: 'Такий код вже існує' });
  db.prepare(
    'UPDATE promo_codes SET code=?,type=?,value=?,min_order=?,max_uses=?,description=?,expires_at=?,is_active=? WHERE id=?'
  ).run(upper, type, +value, +(min_order||0), max_uses!=null?+max_uses:-1, description||'', expires_at||null, is_active?1:0, +req.params.id);
  const updated = db.prepare('SELECT * FROM promo_codes WHERE id=?').get(+req.params.id);
  res.json(updated);
});

router.delete('/promo/:id', adminAuth, (req, res) => {
  db.prepare('DELETE FROM promo_codes WHERE id=?').run(+req.params.id);
  res.json({ ok: true });
});

router.post('/promo/:id/reset', adminAuth, (req, res) => {
  db.prepare('UPDATE promo_codes SET used_count=0 WHERE id=?').run(+req.params.id);
  res.json({ ok: true });
});

/* ── Users ───────────────────────────────────────────── */
router.get('/users', adminAuth, (req, res) => {
  const users = db.prepare(
    'SELECT id,name,email,phone,bonus_points,tier,created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

// Видалення користувача разом із його замовленнями та бонусами
router.delete('/users/:id', adminAuth, (req, res) => {
  const id = +req.params.id;
  const user = db.prepare('SELECT email FROM users WHERE id=?').get(id);
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
  if (user.email === 'demo@fastfood.ua') return res.status(400).json({ error: 'Демо-акаунт видалити не можна' });

  db.prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id=?)').run(id);
  db.prepare('DELETE FROM orders WHERE user_id=?').run(id);
  db.prepare('DELETE FROM bonus_transactions WHERE user_id=?').run(id);
  db.prepare('DELETE FROM email_codes WHERE email=?').run(user.email);
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ message: 'Користувача видалено' });
});

export default router;
