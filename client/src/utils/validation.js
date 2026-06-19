// Валідація полів форм: ім'я та номер телефону (український формат).

export const NAME_MAX = 24;
export const UA_PHONE_RE = /^\+380\d{9}$/;
const NAME_RE = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ \-]+$/;

/** Приводить різні варіанти запису до канонічного +380XXXXXXXXX. */
export function normalizePhone(raw) {
  if (!raw) return '';
  const c = String(raw).replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(c)) return '+38' + c;     // 0XXXXXXXXX
  if (/^380\d{9}$/.test(c)) return '+' + c;      // 380XXXXXXXXX
  return c;                                      // +380... або частковий ввід
}

/** Повертає текст помилки або null, якщо ім'я коректне. */
export function validateName(name) {
  const n = (name || '').trim();
  if (n.length < 2) return "Ім'я має містити мінімум 2 символи";
  if (n.length > NAME_MAX) return `Ім'я не більше ${NAME_MAX} символів`;
  if (!NAME_RE.test(n)) return "Ім'я може містити лише літери, пробіл, апостроф і дефіс";
  return null;
}

/** Повертає текст помилки або null, якщо телефон у форматі +380XXXXXXXXX. */
export function validatePhone(raw, required = true) {
  const p = normalizePhone(raw);
  if (!p) return required ? 'Вкажіть номер телефону' : null;
  if (!UA_PHONE_RE.test(p)) return 'Телефон у форматі +380XXXXXXXXX';
  return null;
}
