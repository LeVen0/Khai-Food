import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'fastfood_jwt_secret_2024';

// Isolated authMiddleware logic (same as middleware/auth.js)
function authMiddleware(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Необхідна авторизація' }); return; }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Невалідний токен' });
  }
}

// Mock helpers
function mockRes() {
  const r = { _status: 200, _body: null };
  r.status = (code) => { r._status = code; return r; };
  r.json = (body) => { r._body = body; return r; };
  return r;
}

describe('MT-01 — MT-03: authMiddleware', () => {

  test('MT-01: відсутній токен → 401', () => {
    const req = { cookies: {}, headers: {} };
    const res = mockRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });
    assert.equal(res._status, 401);
    assert.equal(res._body.error, 'Необхідна авторизація');
    assert.equal(called, false);
  });

  test('MT-02: невалідний токен → 401', () => {
    const req = { cookies: { token: 'invalid.token.here' }, headers: {} };
    const res = mockRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });
    assert.equal(res._status, 401);
    assert.equal(res._body.error, 'Невалідний токен');
    assert.equal(called, false);
  });

  test('MT-03: валідний токен → next(), req.user заповнено', () => {
    const token = jwt.sign({ id: 1, email: 'test@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { cookies: { token }, headers: {} };
    const res = mockRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.user.id, 1);
    assert.equal(req.user.email, 'test@test.com');
  });

  test('MT-03b: токен через Authorization header', () => {
    const token = jwt.sign({ id: 5, email: 'admin@test.com' }, JWT_SECRET, { expiresIn: '1h' });
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    let called = false;
    authMiddleware(req, res, () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.user.id, 5);
  });

});
