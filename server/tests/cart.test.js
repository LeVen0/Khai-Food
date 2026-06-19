import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Pure cart logic (mirrors CartContext.jsx)
function addItem(items, product, qty = 1) {
  const existing = items.find(i => i.id === product.id);
  if (existing) return items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
  return [...items, { ...product, quantity: qty }];
}

function removeItem(items, id) {
  return items.filter(i => i.id !== id);
}

function updateQty(items, id, qty) {
  if (qty <= 0) return removeItem(items, id);
  return items.map(i => i.id === id ? { ...i, quantity: qty } : i);
}

function clearCart() { return []; }

function calcTotal(items) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

const burger = { id: 1, name: 'Класик Бургер', price: 159 };
const pizza  = { id: 2, name: 'Маргарита', price: 249 };

describe('MT-04 — MT-10: CartContext логіка', () => {

  test('MT-04: додавання нового товару', () => {
    const items = addItem([], burger, 1);
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 1);
    assert.equal(items[0].id, 1);
  });

  test('MT-05: повторне додавання збільшує кількість', () => {
    let items = addItem([], burger, 1);
    items = addItem(items, burger, 2);
    assert.equal(items.length, 1);
    assert.equal(items[0].quantity, 3);
  });

  test('MT-06: видалення товару з кошика', () => {
    let items = addItem([], burger);
    items = addItem(items, pizza);
    items = removeItem(items, 1);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, 2);
  });

  test('MT-07: зміна кількості товару', () => {
    let items = addItem([], burger);
    items = updateQty(items, 1, 5);
    assert.equal(items[0].quantity, 5);
  });

  test('MT-08: qty <= 0 видаляє товар', () => {
    let items = addItem([], burger);
    items = updateQty(items, 1, 0);
    assert.equal(items.length, 0);
  });

  test('MT-09: підрахунок суми кошика', () => {
    let items = addItem([], burger, 2);   // 159*2 = 318
    items = addItem(items, pizza, 1);     // 249*1 = 249
    const total = calcTotal(items);
    assert.equal(total, 567);
  });

  test('MT-10: clearCart очищує масив', () => {
    let items = addItem([], burger);
    items = clearCart();
    assert.equal(items.length, 0);
    assert.equal(calcTotal(items), 0);
  });

});
