import { useState } from 'react';
import { authApi } from '../services/api';
import { useToast } from '../context/ToastContext';

// Модальне вікно відновлення пароля: крок 1 — email, крок 2 — код + новий пароль.
export default function ForgotPasswordModal({ open, onClose, defaultEmail = '' }) {
  const { show } = useToast();
  const [step, setStep] = useState('request');   // 'request' | 'reset'
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => { setStep('request'); setCode(''); setPass(''); setConfirm(''); setDevCode(''); };
  const close = () => { reset(); onClose(); };

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email) { show('Введіть email', 'error'); return; }
    setLoading(true);
    try {
      const r = await authApi.forgotPassword({ email });
      if (r.devCode) setDevCode(r.devCode);
      show('Код надіслано на пошту', 'success');
      setStep('reset');
    } catch (err) { show(err.error || 'Помилка', 'error'); }
    finally { setLoading(false); }
  };

  const doReset = async (e) => {
    e.preventDefault();
    if (pass.length < 6) { show('Пароль мінімум 6 символів', 'error'); return; }
    if (pass !== confirm) { show('Паролі не співпадають', 'error'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: code.trim(), newPassword: pass });
      show('Пароль оновлено! Увійдіть з новим паролем', 'success');
      close();
    } catch (err) { show(err.error || 'Помилка', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 6 }}>Відновлення пароля</h3>
        {step === 'request' ? (
          <form onSubmit={sendCode}>
            <p className="auth-sub" style={{ marginBottom: 16 }}>Введіть email — надішлемо код для відновлення.</p>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" maxLength={254} required />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={close}>Скасувати</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Надіслати код'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={doReset}>
            <p className="auth-sub" style={{ marginBottom: 16 }}>Введіть код з листа та новий пароль.</p>
            {devCode && <div className="dev-code-hint">DEV: код — <b>{devCode}</b></div>}
            <div className="form-group">
              <label>Код з пошти</label>
              <input className="input" value={code} onChange={e => setCode(e.target.value)}
                placeholder="6-значний код" maxLength={6} inputMode="numeric" required />
            </div>
            <div className="form-group">
              <label>Новий пароль</label>
              <input className="input" type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder="Мінімум 6 символів" maxLength={64} minLength={6} required />
            </div>
            <div className="form-group">
              <label>Повторіть пароль</label>
              <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Повторіть новий пароль" maxLength={64} required />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setStep('request')}>Назад</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '...' : 'Змінити пароль'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
