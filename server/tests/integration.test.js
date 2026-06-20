/**
 * Інтеграційні тести REST API Khai Food
 * Запуск: node --test tests/integration.test.js
 * Вимога: сервер запущено на http://localhost:3002
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '..', 'db', 'fastfood.db');

// Якщо SMTP налаштовано — сервер не повертає devCode (код іде листом),
// тому беремо останній код напряму з БД. Працює в обох режимах.
let _SQL;
async function latestCode(email, purpose) {
  _SQL = _SQL || await initSqlJs();
  const db = new _SQL.Database(readFileSync(DB_FILE));
  const r = db.exec(`SELECT code FROM email_codes WHERE email='${email}' AND purpose='${purpose}' ORDER BY id DESC LIMIT 1`);
  db.close();
  return r.length ? String(r[0].values[0][0]) : null;
}

const BASE = 'http://localhost:3002/api';
const TEST_EMAIL = `test_${Date.now()}@khai.test`;
const TEST_PASS  = 'testpass123';

let userToken   = '';   // cookie string
let adminToken  = '';
let createdOrderId = null;

// ── helpers ──────────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function authApi(path, opts = {}) {
  return api(path, { ...opts, headers: { Cookie: userToken, ...opts.headers } });
}

async function adminApi(path, opts = {}) {
  return api(path, { ...opts, headers: { Authorization: `Bearer ${adminToken}`, ...opts.headers } });
}

// ── IT-01: Реєстрація ─────────────────────────────────────────────────────────
describe('IT-01 — IT-06: Автентифікація', () => {

  let verifyCode = '';

  test('IT-01: POST /auth/register — реєстрація вимагає підтвердження email', async () => {
    const r = await api('/auth/register', {
      method: 'POST',
      body: { name: 'Тест Користувач', email: TEST_EMAIL, phone: '+380501234567', password: TEST_PASS },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.needVerification, true, 'Потрібне підтвердження email');
    verifyCode = r.data.devCode || await latestCode(TEST_EMAIL, 'verify');
    assert.ok(verifyCode, 'Код підтвердження отримано (devCode або з БД)');
  });

  test('IT-01b: POST /auth/verify — підтвердження email видає токен', async () => {
    const r = await api('/auth/verify', {
      method: 'POST',
      body: { email: TEST_EMAIL, code: verifyCode },
    });
    assert.equal(r.status, 200);
    assert.ok(r.data.token, 'Видано токен');
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) userToken = setCookie.split(';')[0];
  });

  test('IT-02: POST /auth/register — дублювання підтвердженого email → 400', async () => {
    const r = await api('/auth/register', {
      method: 'POST',
      body: { name: 'Дубль', email: TEST_EMAIL, phone: '+380501234567', password: TEST_PASS },
    });
    assert.equal(r.status, 400);
    assert.ok(r.data.error, 'Відповідь містить error');
  });

  test('IT-03: POST /auth/login — успішний вхід', async () => {
    const r = await api('/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASS },
    });
    assert.equal(r.status, 200);
    assert.ok(r.data.token, 'Відповідь містить token');
    assert.ok(r.data.user?.email, 'Відповідь містить user.email');
    const setCookie = r.headers.get('set-cookie');
    if (setCookie) userToken = setCookie.split(';')[0];
  });

  test('IT-04: POST /auth/login — невірний пароль → 401', async () => {
    const r = await api('/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: 'wrongpass' },
    });
    assert.equal(r.status, 401);
  });

  test('IT-05: GET /auth/me — профіль авторизованого користувача', async () => {
    const r = await authApi('/auth/me');
    assert.equal(r.status, 200);
    assert.equal(r.data.email, TEST_EMAIL);
    assert.ok(!r.data.password_hash, 'Хеш пароля не повертається');
  });

  test('IT-06: GET /auth/me — без токена → 401', async () => {
    const r = await api('/auth/me');
    assert.equal(r.status, 401);
  });

});

// ── IT-07 — IT-09: Каталог ────────────────────────────────────────────────────
describe('IT-07 — IT-09: Каталог товарів', () => {

  test('IT-07: GET /products — список усіх товарів', async () => {
    const r = await api('/products');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.data), 'Відповідь — масив');
    assert.ok(r.data.length > 0, 'Товари є в базі');
    assert.ok(r.data[0].category_name, 'Є поле category_name');
  });

  test('IT-08: GET /products?category=burgers — фільтрація за категорією', async () => {
    const r = await api('/products?category=burgers');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.data));
    assert.ok(r.data.every(p => p.category_slug === 'burgers'), 'Всі товари з категорії burgers');
  });

  test('IT-08b: GET /products?search — пошук кирилицею без урахування регістру', async () => {
    const r = await api('/products?search=гава');   // малими, товар «Гавайська»
    assert.equal(r.status, 200);
    assert.ok(r.data.some(p => /гавайська/i.test(p.name)), 'Знайдено «Гавайська» за запитом «гава»');
  });

  test('IT-09: GET /categories — список категорій', async () => {
    const r = await api('/categories');
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.data));
    assert.ok(r.data.length >= 8, 'Мінімум 8 категорій');
  });

});

// ── IT-10 — IT-11: Замовлення ─────────────────────────────────────────────────
describe('IT-10 — IT-11: Замовлення', () => {

  test('IT-10: POST /orders — створення замовлення авторизованим', async () => {
    const r = await authApi('/orders', {
      method: 'POST',
      body: {
        items: [{ id: 1, quantity: 2 }],
        delivery_method: 'delivery',
        delivery_address: 'вул. Тестова, 1',
        payment_method: 'cash',
      },
    });
    assert.equal(r.status, 200);
    assert.ok(r.data.orderId, 'Замовлення має orderId');
    createdOrderId = r.data.orderId;
  });

  test('IT-11: POST /orders — порожній кошик → 400', async () => {
    const r = await api('/orders', {
      method: 'POST',
      body: { items: [], delivery_method: 'pickup', payment_method: 'cash' },
    });
    assert.equal(r.status, 400);
    assert.equal(r.data.error, 'Кошик порожній');
  });

});

// ── IT-12 — IT-14: Промокоди ──────────────────────────────────────────────────
describe('IT-12 — IT-14: Промокоди', () => {

  test('IT-12: POST /promo/validate — дійсний промокод WELCOME10 (авторизований)', async () => {
    const r = await authApi('/promo/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', total: 300 },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.valid, true);
    assert.equal(r.data.discount, 30);
  });

  test('IT-13: POST /promo/validate — неіснуючий код → 404', async () => {
    const r = await authApi('/promo/validate', {
      method: 'POST',
      body: { code: 'NOTEXIST999', total: 300 },
    });
    assert.equal(r.status, 404);
  });

  test('IT-14: POST /promo/validate — сума менша за мінімальну → 400', async () => {
    const r = await authApi('/promo/validate', {
      method: 'POST',
      body: { code: 'FAST50', total: 100 },
    });
    assert.equal(r.status, 400);
    assert.ok(r.data.error.includes('500'), 'Повідомлення містить мінімальну суму');
  });

  test('IT-14b: POST /promo/validate — гість не може застосувати промокод → 401', async () => {
    const r = await api('/promo/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', total: 300 },
    });
    assert.equal(r.status, 401);
  });

  test('IT-14c: POST /orders — гість із промокодом: знижка не застосовується', async () => {
    const r = await api('/orders', {
      method: 'POST',
      body: { items: [{ id: 1, quantity: 2 }], delivery_method: 'pickup', payment_method: 'cash', promo_code: 'WELCOME10' },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.discount, 0, 'Гостю промокод не нараховує знижку');
  });

});

// ── IT-19 — IT-21: Промокод — одне використання на акаунт ─────────────────────
describe('IT-19 — IT-21: Промокод — одне використання на акаунт', () => {

  test('IT-19: перше застосування WELCOME10 в замовленні — успішно', async () => {
    const r = await authApi('/orders', {
      method: 'POST',
      body: {
        items: [{ id: 1, quantity: 2 }],
        delivery_method: 'pickup',
        payment_method: 'cash',
        promo_code: 'WELCOME10',
      },
    });
    assert.equal(r.status, 200);
    assert.ok(r.data.discount > 0, 'Знижку застосовано');
  });

  test('IT-20: повторна валідація WELCOME10 тим самим акаунтом → 400', async () => {
    const r = await authApi('/promo/validate', {
      method: 'POST',
      body: { code: 'WELCOME10', total: 300 },
    });
    assert.equal(r.status, 400);
    assert.match(r.data.error || '', /вже використано/i);
  });

  test('IT-21: повторне замовлення з WELCOME10 тим самим акаунтом → 400', async () => {
    const r = await authApi('/orders', {
      method: 'POST',
      body: {
        items: [{ id: 1, quantity: 2 }],
        delivery_method: 'pickup',
        payment_method: 'cash',
        promo_code: 'WELCOME10',
      },
    });
    assert.equal(r.status, 400);
    assert.match(r.data.error || '', /вже використано/i);
  });

});

// ── IT-15: Профіль ────────────────────────────────────────────────────────────
describe('IT-15: Профіль користувача', () => {

  test('IT-15: GET /profile/bonuses — бонусний рахунок авторизованого', async () => {
    const r = await authApi('/profile/bonuses');
    assert.equal(r.status, 200);
    assert.ok(r.data.bonus_points !== undefined, 'Є бонусні бали');
    assert.ok(Array.isArray(r.data.transactions), 'Є транзакції');
  });

});

// ── IT-16 — IT-18: Адмін API ──────────────────────────────────────────────────
describe('IT-16 — IT-18: Адміністративний API', () => {

  before(async () => {
    const r = await api('/admin/login', {
      method: 'POST',
      body: { login: 'admin', password: 'admin' },
    });
    adminToken = r.data.token;
  });

  test('IT-16: POST /admin/login — вхід адміністратора', async () => {
    assert.ok(adminToken, 'Токен адміністратора отримано');
  });

  test('IT-17: GET /admin/stats — без адмін-токена → 401', async () => {
    const r = await authApi('/admin/stats');
    assert.equal(r.status, 401);
  });

  test('IT-18: POST /admin/promo — створення промокоду адміном', async () => {
    const code = `TEST${Date.now()}`;
    const r = await adminApi('/admin/promo', {
      method: 'POST',
      body: { code, type: 'percent', value: 5, description: 'Тестовий промокод' },
    });
    assert.equal(r.status, 200);
    assert.equal(r.data.code, code);
    assert.equal(r.data.used_count, 0);
    // cleanup
    await adminApi(`/admin/promo/${r.data.id}`, { method: 'DELETE' });
  });

});

// ── IT-22 — IT-26: Email-верифікація та пароль ────────────────────────────────
describe('IT-22 — IT-26: Верифікація email та керування паролем', () => {

  test('IT-22: POST /auth/change-password — невірний поточний пароль → 400', async () => {
    const r = await authApi('/auth/change-password', {
      method: 'POST',
      body: { oldPassword: 'wrongwrong', newPassword: 'brandNew123' },
    });
    assert.equal(r.status, 400);
  });

  test('IT-23: POST /auth/change-password — успішна зміна (і назад)', async () => {
    const r1 = await authApi('/auth/change-password', {
      method: 'POST',
      body: { oldPassword: TEST_PASS, newPassword: 'brandNew123' },
    });
    assert.equal(r1.status, 200);
    // повертаємо пароль назад
    const r2 = await authApi('/auth/change-password', {
      method: 'POST',
      body: { oldPassword: 'brandNew123', newPassword: TEST_PASS },
    });
    assert.equal(r2.status, 200);
  });

  test('IT-24: POST /auth/forgot-password — генерує код для існуючого акаунта', async () => {
    const r = await api('/auth/forgot-password', { method: 'POST', body: { email: TEST_EMAIL } });
    assert.equal(r.status, 200);
    const code = r.data.devCode || await latestCode(TEST_EMAIL, 'reset');
    assert.ok(code, 'Код відновлення згенеровано');
  });

  test('IT-25: POST /auth/reset-password — скидання пароля за кодом', async () => {
    const f = await api('/auth/forgot-password', { method: 'POST', body: { email: TEST_EMAIL } });
    const code = f.data.devCode || await latestCode(TEST_EMAIL, 'reset');
    const r = await api('/auth/reset-password', {
      method: 'POST',
      body: { email: TEST_EMAIL, code, newPassword: TEST_PASS },
    });
    assert.equal(r.status, 200);
    // вхід із тим самим паролем працює
    const login = await api('/auth/login', { method: 'POST', body: { email: TEST_EMAIL, password: TEST_PASS } });
    assert.equal(login.status, 200);
    assert.ok(login.data.token);
  });

  test('IT-26: POST /auth/verify — невірний код → 400', async () => {
    const email = `verify_${Date.now()}@khai.test`;
    await api('/auth/register', { method: 'POST', body: { name: 'Верифай Тест', email, phone: '+380501112233', password: TEST_PASS } });
    const r = await api('/auth/verify', { method: 'POST', body: { email, code: '000000' } });
    assert.equal(r.status, 400);
  });

});
