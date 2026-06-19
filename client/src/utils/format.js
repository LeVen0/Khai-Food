// Парсинг та форматування дат, мапа статусів замовлень.

/**
 * SQLite зберігає CURRENT_TIMESTAMP у форматі "YYYY-MM-DD HH:MM:SS" за UTC
 * (без позначки зони). JS за замовчуванням трактує такий рядок як локальний час,
 * через що виникала похибка на величину зміщення часового поясу.
 * Тут явно інтерпретуємо значення як UTC.
 */
export function parseDbDate(value) {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  let s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }
  return new Date(s);
}

export function timeAgo(value) {
  const d = parseDbDate(value);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'щойно';
  if (mins < 60) return `${mins} хв тому`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год тому`;
  return d.toLocaleDateString('uk-UA');
}

export function formatDate(value, opts) {
  return parseDbDate(value).toLocaleDateString('uk-UA', opts);
}

export function formatDateTime(value) {
  return parseDbDate(value).toLocaleString('uk-UA');
}

// Єдина мапа статусів замовлення (узгоджена з сервером)
export const ORDER_STATUS = {
  pending:    { label: 'Очікує підтвердження', color: '#f59e0b' },
  preparing:  { label: 'Готується',            color: '#3b82f6' },
  ready:      { label: 'Готове',               color: '#22c55e' },
  delivering: { label: 'Доставляється',        color: '#06b6d4' },
  delivered:  { label: 'Доставлено',           color: '#16a34a' },
  cancelled:  { label: 'Скасовано',            color: '#ef4444' },
};

export function orderStatus(status) {
  return ORDER_STATUS[status] || { label: status, color: '#888' };
}
