import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');   // 'login' | 'verify'
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login, verifyEmail } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      show('Ласкаво просимо!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      if (err.needVerification) {
        // акаунт не підтверджено — надсилаємо код і просимо підтвердити
        try { const r = await authApi.resendCode({ email: form.email }); if (r.devCode) setDevCode(r.devCode); } catch {}
        show('Підтвердіть email — ми надіслали код', 'error');
        setStep('verify');
      } else {
        show(err.error || 'Помилка входу', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyEmail({ email: form.email, code: code.trim() });
      show('Email підтверджено!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      show(err.error || 'Невірний код', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-logo"><span>🍔</span><span>Khai Food</span></div>
          <h1>Підтвердження email</h1>
          <p className="auth-sub">Введіть код, надісланий на <b>{form.email}</b>.</p>
          {devCode && <div className="dev-code-hint">DEV: код — <b>{devCode}</b></div>}
          <form onSubmit={submitCode}>
            <div className="form-group">
              <label>Код підтвердження</label>
              <input className="input" value={code} onChange={e => setCode(e.target.value)}
                placeholder="6-значний код" maxLength={6} inputMode="numeric" autoFocus required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Перевіряємо...' : 'Підтвердити та увійти'}
            </button>
          </form>
          <p className="auth-switch">
            <button type="button" className="link-btn" onClick={() => setStep('login')}>← Назад до входу</button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span>🍔</span>
          <span>Khai Food</span>
        </div>
        <h1>Вхід до акаунту</h1>
        <p className="auth-sub">Введіть свої дані для входу</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handle} maxLength={254} required />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} maxLength={64} required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 14 }}>
            <button type="button" className="link-btn" onClick={() => setForgotOpen(true)}>Забули пароль?</button>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        <div className="auth-divider"><span>або</span></div>
        <div className="demo-hint">
          <strong>Демо-акаунт:</strong> demo@fastfood.ua / demo1234
        </div>

        <p className="auth-switch">
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </p>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} defaultEmail={form.email} />
    </main>
  );
}
