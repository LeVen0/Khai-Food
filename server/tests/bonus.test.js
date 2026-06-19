import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Дзеркало логіки нарахування бонусів і визначення рівня (orders.js) —
// узгоджено з бізнес-правилами: Бронза 1%, Срібло 2%, Золото 3%; рівні за сумою замовлень.
const TIER_PERCENT = { bronze: 1, silver: 2, gold: 3 };
function bonusEarned(finalTotal, tier, x2 = false) {
  const pct = TIER_PERCENT[tier] || 1;
  return Math.round(finalTotal * pct / 100) * (x2 ? 2 : 1);
}
function tierBySpend(total) {
  if (total >= 3000) return 'gold';
  if (total >= 1000) return 'silver';
  return 'bronze';
}

describe('MT-31 — MT-35: нарахування бонусів і рівні лояльності', () => {

  test('MT-31: Бронза — 1% від суми', () => {
    assert.equal(bonusEarned(500, 'bronze'), 5);
  });

  test('MT-32: Срібло — 2% від суми', () => {
    assert.equal(bonusEarned(500, 'silver'), 10);
  });

  test('MT-33: Золото — 3% від суми', () => {
    assert.equal(bonusEarned(500, 'gold'), 15);
  });

  test('MT-34: промокод x2 подвоює нарахування', () => {
    assert.equal(bonusEarned(500, 'silver', true), 20);
  });

  test('MT-35: рівень за загальною сумою замовлень (1000 / 3000 грн)', () => {
    assert.equal(tierBySpend(900), 'bronze');
    assert.equal(tierBySpend(1000), 'silver');
    assert.equal(tierBySpend(2999), 'silver');
    assert.equal(tierBySpend(3000), 'gold');
  });

});
