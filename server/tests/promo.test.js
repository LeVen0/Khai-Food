import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Promo discount logic (mirrors server/routes/promo.js + routes/admin.js validation)
function calcDiscount(promo, total) {
  if (promo.type === 'percent') return Math.round(total * promo.value / 100);
  if (promo.type === 'fixed')   return Math.min(promo.value, total);
  return 0;
}

function validatePromo(promo, total) {
  if (!promo.is_active)                                    return { error: 'Промокод не знайдено або недійсний' };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { error: 'Термін дії промокоду закінчився' };
  if (promo.max_uses !== -1 && promo.used_count >= promo.max_uses) return { error: 'Промокод вичерпано' };
  if (total < promo.min_order)                             return { error: `Мінімальна сума замовлення: ${promo.min_order} грн` };
  const discount = calcDiscount(promo, total);
  return { valid: true, discount };
}

// Перевірка з урахуванням попереднього використання акаунтом
// (промокод з обмеженням використань — лише один раз на акаунт)
function validatePromoForUser(promo, total, alreadyUsedByUser) {
  if (promo.max_uses !== -1 && alreadyUsedByUser)
    return { error: 'Промокод вже використано на цьому акаунті' };
  return validatePromo(promo, total);
}

describe('MT-11 — MT-13: розрахунок знижки промокоду', () => {

  test('MT-11: відсоткова знижка 10% від 500 грн', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: -1, used_count: 0, is_active: 1, expires_at: null };
    const result = validatePromo(promo, 500);
    assert.equal(result.valid, true);
    assert.equal(result.discount, 50);
  });

  test('MT-12: фіксована знижка 100 грн від 300 грн', () => {
    const promo = { type: 'fixed', value: 100, min_order: 0, max_uses: -1, used_count: 0, is_active: 1, expires_at: null };
    const result = validatePromo(promo, 300);
    assert.equal(result.valid, true);
    assert.equal(result.discount, 100);
  });

  test('MT-13: знижка не перевищує суму замовлення', () => {
    const promo = { type: 'fixed', value: 100, min_order: 0, max_uses: -1, used_count: 0, is_active: 1, expires_at: null };
    const result = validatePromo(promo, 40);
    assert.equal(result.valid, true);
    assert.equal(result.discount, 40); // min(100, 40)
  });

  test('MT-14: мінімальна сума не досягнута', () => {
    const promo = { type: 'fixed', value: 50, min_order: 500, max_uses: -1, used_count: 0, is_active: 1, expires_at: null };
    const result = validatePromo(promo, 200);
    assert.equal(result.error, 'Мінімальна сума замовлення: 500 грн');
  });

  test('MT-15: промокод вичерпано (ліміт використань)', () => {
    const promo = { type: 'percent', value: 20, min_order: 0, max_uses: 5, used_count: 5, is_active: 1, expires_at: null };
    const result = validatePromo(promo, 300);
    assert.equal(result.error, 'Промокод вичерпано');
  });

  test('MT-16: прострочений промокод', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: -1, used_count: 0, is_active: 1, expires_at: '2020-01-01' };
    const result = validatePromo(promo, 300);
    assert.equal(result.error, 'Термін дії промокоду закінчився');
  });

  test('MT-17: неактивний промокод', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: -1, used_count: 0, is_active: 0, expires_at: null };
    const result = validatePromo(promo, 300);
    assert.equal(result.error, 'Промокод не знайдено або недійсний');
  });

  test('MT-18: промокод з лімітом — повторне використання акаунтом заборонено', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: 1000, used_count: 5, is_active: 1, expires_at: null };
    const result = validatePromoForUser(promo, 300, true);
    assert.equal(result.error, 'Промокод вже використано на цьому акаунті');
  });

  test('MT-19: промокод з лімітом — перше використання акаунтом дозволено', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: 1000, used_count: 5, is_active: 1, expires_at: null };
    const result = validatePromoForUser(promo, 300, false);
    assert.equal(result.valid, true);
    assert.equal(result.discount, 30);
  });

  test('MT-20: безлімітний промокод можна застосовувати повторно', () => {
    const promo = { type: 'percent', value: 10, min_order: 0, max_uses: -1, used_count: 5, is_active: 1, expires_at: null };
    const result = validatePromoForUser(promo, 300, true);
    assert.equal(result.valid, true);
  });

});
