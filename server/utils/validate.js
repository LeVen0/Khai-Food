// Серверна валідація полів: ім'я та номер телефону (український формат).

export const NAME_MAX = 24;
export const UA_PHONE_RE = /^\+380\d{9}$/;
const NAME_RE = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’ \-]+$/;

export function normalizePhone(raw) {
  if (!raw) return '';
  const c = String(raw).replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(c)) return '+38' + c;
  if (/^380\d{9}$/.test(c)) return '+' + c;
  return c;
}

export function validateName(name) {
  const n = (name || '').trim();
  if (n.length < 2) return "Ім'я має містити мінімум 2 символи";
  if (n.length > NAME_MAX) return `Ім'я не більше ${NAME_MAX} символів`;
  if (!NAME_RE.test(n)) return "Ім'я може містити лише літери, пробіл, апостроф і дефіс";
  return null;
}

export function validatePhone(raw, required = true) {
  const p = normalizePhone(raw);
  if (!p) return required ? 'Вкажіть номер телефону' : null;
  if (!UA_PHONE_RE.test(p)) return 'Телефон у форматі +380XXXXXXXXX';
  return null;
}
