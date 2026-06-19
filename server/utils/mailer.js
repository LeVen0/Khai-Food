// Надсилання листів з кодами підтвердження / відновлення пароля.
// Якщо SMTP не налаштовано (немає server/.env) — працює dev-режим:
// код друкується в консоль сервера та повертається у відповіді (поле devCode).
import './env.js';
import nodemailer from 'nodemailer';

const HOST = process.env.SMTP_HOST;
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const PORT = Number(process.env.SMTP_PORT) || 587;
const FROM = process.env.SMTP_FROM || USER || 'Khai Food <no-reply@khaifood.local>';

export const mailConfigured = !!(HOST && USER && PASS);

const transport = mailConfigured
  ? nodemailer.createTransport({ host: HOST, port: PORT, secure: PORT === 465, auth: { user: USER, pass: PASS } })
  : null;

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendCodeEmail(to, code, purpose) {
  const isReset = purpose === 'reset';
  const subject = isReset ? 'Khai Food — відновлення пароля' : 'Khai Food — підтвердження email';
  const action = isReset ? 'відновлення пароля' : 'підтвердження реєстрації';
  const text = `Ваш код для ${action}: ${code}\nКод дійсний 10 хвилин.\nЯкщо ви не робили цього запиту — проігноруйте лист.`;

  if (!mailConfigured) {
    console.log(`\n📧 [DEV EMAIL] → ${to}\n   ${subject}\n   КОД: ${code}  (дійсний 10 хв)\n`);
    return { dev: true };
  }

  await transport.sendMail({
    from: FROM, to, subject, text,
    html: `<div style="font-family:Arial,sans-serif">
      <p>Ваш код для <b>${action}</b>:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#E8552D">${code}</p>
      <p style="color:#777">Код дійсний 10 хвилин. Якщо ви не робили цього запиту — проігноруйте лист.</p></div>`,
  });
  return { dev: false };
}
