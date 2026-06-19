import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateName, validatePhone, normalizePhone } from '../utils/validate.js';

describe('MT-21 — MT-23: валідація імені', () => {

  test('MT-21: коректне ім\'я — без помилки', () => {
    assert.equal(validateName('Сергій Пономаренко'), null);
  });

  test('MT-22: занадто коротке ім\'я → помилка', () => {
    assert.match(validateName('С'), /мінімум 2/);
  });

  test('MT-23: ім\'я понад 24 символи → помилка', () => {
    assert.match(validateName('а'.repeat(25)), /не більше 24/);
  });

  test('MT-24: ім\'я з цифрами → помилка', () => {
    assert.match(validateName('Іван123'), /лише літери/);
  });

});

describe('MT-25 — MT-28: валідація телефону (UA)', () => {

  test('MT-25: коректний +380XXXXXXXXX — без помилки', () => {
    assert.equal(validatePhone('+380501234567'), null);
  });

  test('MT-26: формат 0XXXXXXXXX нормалізується і приймається', () => {
    assert.equal(normalizePhone('0501234567'), '+380501234567');
    assert.equal(validatePhone('0501234567'), null);
  });

  test('MT-27: некоректний номер (не UA) → помилка', () => {
    assert.match(validatePhone('+1234567890'), /\+380/);
  });

  test('MT-28: порожній номер коли обов\'язковий → помилка', () => {
    assert.match(validatePhone('', true), /Вкажіть/);
  });

});
