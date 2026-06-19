import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import { validateName, validatePhone, normalizePhone, NAME_MAX } from '../utils/validation';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form');     // 'form' | 'code'
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const { register, verifyEmail } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const nameError = form.name ? validateName(form.name) : null;
  const phoneError = form.phone ? validatePhone(form.phone) : null;

  const submit = async (e) => {
    e.preventDefault();
    const nErr = validateName(form.name);
    if (nErr) { show(nErr, 'error'); return; }
    if (!isValidEmail(form.email)) { show('Введіть коректну email-адресу (наприклад: user@gmail.com)', 'error'); return; }
    const pErr = validatePhone(form.phone);
    if (pErr) { show(pErr, 'error'); return; }
    if (form.password.length < 6) { show('Пароль має бути мінімум 6 символів', 'error'); return; }
    if (form.password !== form.confirm) { show('Паролі не співпадають', 'error'); return; }
    setLoading(true);
    try {
      const res = await register({ name: form.name.trim(), email: form.email, phone: normalizePhone(form.phone), password: form.password });
      if (res.devCode) setDevCode(res.devCode);
      show('Код підтвердження надіслано на пошту', 'success');
      setStep('code');
    } catch (err) {
      show(err.error || 'Помилка реєстрації', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail({ email: form.email, code: code.trim() });
      show('Email підтверджено! Вітаємо!', 'success');
      navigate('/profile');
    } catch (err) {
      show(err.error || 'Невірний код', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const r = await authApi.resendCode({ email: form.email });
      if (r.devCode) setDevCode(r.devCode);
      show('Новий код надіслано', 'success');
    } catch (err) { show(err.error || 'Помилка', 'error'); }
  };

  if (step === 'code') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-logo"><span>🍔</span><span>Khai Food</span></div>
          <h1>Підтвердження email</h1>
          <p className="auth-sub">Ми надіслали 6-значний код на <b>{form.email}</b>. Введіть його нижче.</p>
          {devCode && <div className="dev-code-hint">DEV: код — <b>{devCode}</b></div>}
          <form onSubmit={submitCode}>
            <div className="form-group">
              <label>Код підтвердження</label>
              <input className="input" value={code} onChange={e => setCode(e.target.value)}
                placeholder="6-значний код" maxLength={6} inputMode="numeric" autoFocus required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Перевіряємо...' : 'Підтвердити'}
            </button>
          </form>
          <p className="auth-switch">
            Не отримали код? <button type="button" className="link-btn" onClick={resend}>Надіслати ще раз</button>
          </p>
          <p className="auth-switch">
            <button type="button" className="link-btn" onClick={() => setStep('form')}>← Змінити дані</button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span>🍔</span><span>Khai Food</span></div>
        <h1>Реєстрація</h1>
        <p className="auth-sub">Створіть акаунт та отримуйте бонуси!</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Ім'я</label>
            <input
              className={`input ${nameError ? 'input-error' : ''}`}
              name="name"
              placeholder="Ваше ім'я та прізвище"
              value={form.name}
              onChange={handle}
              maxLength={NAME_MAX}
              required
            />
            {nameError && <span className="field-error">{nameError}</span>}
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className={`input ${form.email && !isValidEmail(form.email) ? 'input-error' : ''}`}
              type="text"
              name="email"
              placeholder="your@gmail.com"
              value={form.email}
              onChange={handle}
              maxLength={254}
              required
            />
            {form.email && !isValidEmail(form.email) && (
              <span className="field-error">Невірний формат. Приклад: user@gmail.com</span>
            )}
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              className={`input ${phoneError ? 'input-error' : ''}`}
              name="phone"
              type="tel"
              placeholder="+380XXXXXXXXX"
              value={form.phone}
              onChange={handle}
              maxLength={13}
              required
            />
            {phoneError && <span className="field-error">{phoneError}</span>}
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="input" type="password" name="password" placeholder="Мінімум 6 символів" value={form.password} onChange={handle} maxLength={64} minLength={6} required />
          </div>
          <div className="form-group">
            <label>Підтвердити пароль</label>
            <input className="input" type="password" name="confirm" placeholder="Повторіть пароль" value={form.confirm} onChange={handle} maxLength={64} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Реєструємось...' : 'Зареєструватись'}
          </button>
        </form>

        <p className="auth-switch">Вже є акаунт? <Link to="/login">Увійти</Link></p>
      </div>
    </main>
  );
}
