import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

router.get('/', (req, res) => {
  const { category, popular, search, limit } = req.query;
  let query = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_available = 1';
  const params = [];

  if (category) { query += ' AND c.slug = ?'; params.push(category); }
  if (popular === 'true') { query += ' AND p.is_popular = 1'; }
  query += ' ORDER BY p.is_popular DESC, p.id ASC';

  let rows = db.prepare(query).all(...params);

  // Пошук — у JS, бо SQLite LIKE не враховує регістр для кирилиці
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (limit) rows = rows.slice(0, parseInt(limit));

  res.json(rows);
});

router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Товар не знайдено' });
  res.json(product);
});

export default router;
