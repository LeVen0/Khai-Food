import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi, ordersApi, authApi } from '../services/api';
import { orderStatus, formatDate } from '../utils/format';
import { validateName, validatePhone, normalizePhone, NAME_MAX } from '../utils/validation';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import './Auth.css';
import './Profile.css';

const TIER_INFO = {
  bronze: { label: 'Бронза', icon: '🥉', color: '#b45309', next: 'Срібло', nextSpend: 1000, percent: 1 },
  silver: { label: 'Срібло', icon: '🥈', color: '#94a3b8', next: 'Золото', nextSpend: 3000, percent: 2 },
  gold:   { label: 'Золото', icon: '🥇', color: '#ffd60a', next: null,     nextSpend: null, percent: 3 },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { show } = useToast();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [bonuses, setBonuses] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [changingPwd, setChangingPwd] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  useEffect(() => {
    if (tab === 'orders') ordersApi.getMy().then(setOrders).catch(() => {});
    if (tab === 'bonuses') profileApi.getBonuses().then(setBonuses).catch(() => {});
  }, [tab]);

  const nameError = form.name ? validateName(form.name) : null;
  const phoneError = form.phone ? validatePhone(form.phone) : null;

  const saveProfile = async (e) => {
    e.preventDefault();
    const nErr = validateName(form.name);
    if (nErr) { show(nErr, 'error'); return; }
    const pErr = validatePhone(form.phone);
    if (pErr) { show(pErr, 'error'); return; }
    setSaving(true);
    try {
      await profileApi.update({ ...form, name: form.name.trim(), phone: normalizePhone(form.phone) });
      await refreshUser();
      show('Профіль оновлено', 'success');
    } catch (err) { show(err.error || 'Помилка оновлення', 'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 6) { show('Новий пароль мінімум 6 символів', 'error'); return; }
    if (pwd.newPassword !== pwd.confirm) { show('Паролі не співпадають', 'error'); return; }
    setChangingPwd(true);
    try {
      await authApi.changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword });
      setPwd({ oldPassword: '', newPassword: '', confirm: '' });
      show('Пароль змінено', 'success');
    } catch (err) { show(err.error || 'Помилка зміни пароля', 'error'); }
    finally { setChangingPwd(false); }
  };

  if (!user) return (
    <main style={{ paddingTop: 100, textAlign: 'center' }}>
      <h2>Будь ласка, увійдіть</h2>
    </main>
  );

  const tier = TIER_INFO[user.tier] || TIER_INFO.bronze;

  return (
    <main className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-big">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="profile-header-info">
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <div className="profile-tier-badge" style={{ '--tier-color': tier.color }}>
              {tier.icon} {tier.label}
            </div>
          </div>
          <div className="profile-bonus-pill">
            <span className="bonus-num">{user.bonus_points}</span>
            <span>бонусних балів</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {[
            { id: 'profile', label: '👤 Профіль' },
            { id: 'orders',  label: '📦 Замовлення' },
            { id: 'bonuses', label: '⭐ Бонуси' },
          ].map(t => (
            <button key={t.id} className={`profile-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {tab === 'profile' && (
          <div className="profile-section">
            <h2>Мої дані</h2>
            <form onSubmit={saveProfile} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Ім'я та прізвище</label>
                  <input className={`input ${nameError ? 'input-error' : ''}`} value={form.name} maxLength={NAME_MAX}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  {nameError && <span className="field-error">{nameError}</span>}
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input className={`input ${phoneError ? 'input-error' : ''}`} type="tel" placeholder="+380XXXXXXXXX"
                    value={form.phone} maxLength={13}
                    onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  {phoneError && <span className="field-error">{phoneError}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Email (не змінюється)</label>
                <input className="input" value={user.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="form-group">
                <label>Адреса доставки за замовчуванням</label>
                <input className="input" placeholder="вул. Хрещатик, 1, кв. 12" value={form.address} maxLength={200} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
              </button>
            </form>

            <h2 style={{ marginTop: 40 }}>Зміна пароля</h2>
            <form onSubmit={changePassword} className="profile-form">
              <div className="form-group">
                <label>Поточний пароль</label>
                <input className="input" type="password" value={pwd.oldPassword} maxLength={64}
                  onChange={e => setPwd(p => ({ ...p, oldPassword: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Новий пароль</label>
                  <input className="input" type="password" value={pwd.newPassword} maxLength={64} minLength={6}
                    placeholder="Мінімум 6 символів"
                    onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Повторіть новий пароль</label>
                  <input className="input" type="password" value={pwd.confirm} maxLength={64}
                    onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={changingPwd}>
                  {changingPwd ? 'Змінюємо...' : 'Змінити пароль'}
                </button>
                <button type="button" className="link-btn" onClick={() => setForgotOpen(true)}>
                  Забули поточний пароль?
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Orders */}
        {tab === 'orders' && (
          <div className="profile-section">
            <h2>Мої замовлення</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📦</div>
                <h3>Замовлень поки немає</h3>
                <p>Оформіть перше замовлення та отримайте бонуси!</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => {
                  const st = orderStatus(order.status);
                  return (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div>
                          <span className="order-id">Замовлення #{order.id}</span>
                          <span className="order-date">{formatDate(order.created_at, { day:'2-digit', month:'long', year:'numeric' })}</span>
                        </div>
                        <span className="order-status" style={{ color: st.color, background: st.color + '20', border: `1px solid ${st.color}40` }}>
                          {st.label}
                        </span>
                      </div>
                      <div className="order-items-preview">
                        {order.items?.slice(0,3).map(item => (
                          <img key={item.id} src={item.image_url} alt={item.name} title={item.name}
                            onError={e => { e.target.style.display='none'; }} />
                        ))}
                        {order.items?.length > 3 && <span className="more-items">+{order.items.length - 3}</span>}
                      </div>
                      <div className="order-footer">
                        <span>{order.items?.map(i => i.name).join(', ').substring(0, 60)}{order.items?.join(', ').length > 60 ? '...' : ''}</span>
                        <div className="order-total-row">
                          <span>{order.bonus_earned > 0 && `+${order.bonus_earned} балів`}</span>
                          <strong>{order.total} ₴</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Bonuses */}
        {tab === 'bonuses' && (
          <div className="profile-section">
            <h2>Бонусна програма</h2>
            {!bonuses ? <div className="spinner" /> : (
              <>
                <div className="bonus-overview">
                  <div className="bonus-stat-card accent">
                    <div className="bonus-stat-value">{bonuses.bonus_points}</div>
                    <div className="bonus-stat-label">Поточний баланс</div>
                  </div>
                  <div className="bonus-stat-card">
                    <div className="bonus-stat-value">{bonuses.totalEarned}</div>
                    <div className="bonus-stat-label">Всього зароблено</div>
                  </div>
                  <div className="bonus-stat-card">
                    <div className="bonus-stat-value">{Math.floor(bonuses.bonus_points / 10)} ₴</div>
                    <div className="bonus-stat-label">До знижки (100 б. = 10 ₴)</div>
                  </div>
                </div>

                <div className="tier-progress-card">
                  <div className="tier-info">
                    <span>{tier.icon} {tier.label}</span>
                    {tier.next && <span className="tier-next">До {tier.next}: {Math.max(0, tier.nextSpend - (bonuses.totalSpent || 0))} ₴ замовлень</span>}
                  </div>
                  {tier.next && (
                    <div className="tier-progress-bar">
                      <div style={{ width: `${Math.min(100, ((bonuses.totalSpent || 0) / tier.nextSpend) * 100)}%` }} />
                    </div>
                  )}
                  <p className="tier-perks">
                    Нарахування {tier.percent}% від суми замовлення
                    {user.tier === 'gold' && ' · Максимальний рівень — вітаємо!'}
                  </p>
                </div>

                <h3 style={{ marginBottom: 16, marginTop: 32 }}>Останні транзакції</h3>
                {bonuses.transactions.length === 0 ? (
                  <p style={{ color: 'var(--text2)' }}>Транзакцій поки немає</p>
                ) : (
                  <div className="transactions-list">
                    {bonuses.transactions.map(t => (
                      <div key={t.id} className="transaction-row">
                        <div>
                          <span className="tx-desc">{t.description}</span>
                          <span className="tx-date">{formatDate(t.created_at)}</span>
                        </div>
                        <span className={`tx-amount ${t.amount > 0 ? 'earn' : 'spend'}`}>
                          {t.amount > 0 ? '+' : ''}{t.amount} б.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} defaultEmail={user.email} />
    </main>
  );
}
