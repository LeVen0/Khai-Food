import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateCode } from '../utils/mailer.js';

describe('MT-29 — MT-30: генерація коду підтвердження', () => {

  test('MT-29: код — це 6 цифр', () => {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      assert.match(c, /^\d{6}$/, `Код має бути 6-значним: ${c}`);
    }
  });

  test('MT-30: коди різняться (немає сталого значення)', () => {
    const set = new Set();
    for (let i = 0; i < 30; i++) set.add(generateCode());
    assert.ok(set.size > 1, 'Коди мають бути випадковими');
  });

});
