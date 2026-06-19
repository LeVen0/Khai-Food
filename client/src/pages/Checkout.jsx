import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersApi, promoApi } from '../services/api';
import './Checkout.css';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    delivery_address: user?.address || '',
    delivery_method: 'delivery',
    payment_method: 'cash',
    comment: '',
  });
  const [promo, setPromo] = useState('');
  const [promoData, setPromoData] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [bonusUse, setBonusUse] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const applyPromo = async () => {
    if (!promo) return;
    setPromoLoading(true);
    try {
      const data = await promoApi.validate(promo, total);
      setPromoData(data);
      show(`Промокод застосовано: -${data.discount} ₴`, 'success');
    } catch (err) {
      show(err.error || 'Невалідний промокод', 'error');
      setPromoData(null);
    } finally { setPromoLoading(false); }
  };

  const maxBonusDiscount = user ? Math.min(user.bonus_points, Math.floor(total * 30 / 100)) : 0;
  const discount = promoData?.discount || 0;
  const bonusDiscount = Math.floor(bonusUse / 10);
  const finalTotal = Math.max(total - discount - bonusDiscount, 0);
  const willEarn = user ? Math.floor(finalTotal / 10) : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { show('Кошик порожній', 'error'); return; }
    if (form.delivery_method === 'delivery' && !form.delivery_address) { show('Введіть адресу доставки', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        items: items.map(i => ({ id: i.id, quantity: i.quantity })),
        ...form,
        promo_code: promo,
        bonus_used: bonusUse,
      });
      clearCart();
      show('Замовлення оформлено!', 'success');
      navigate('/order-success', { state: { orderId: res.orderId, total: res.total, bonusEarned: res.bonusEarned } });
    } catch (err) {
      show(err.error || 'Помилка оформлення', 'error');
    } finally { setSubmitting(false); }
  };

  if (items.length === 0) return (
    <main className="checkout-page">
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
        <h2>Кошик порожній</h2>
        <button className="btn btn-primary btn-lg" style={{ marginTop: 24 }} onClick={() => navigate('/menu')}>До меню</button>
      </div>
    </main>
  );

  return (
    <main className="checkout-page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 8 }}>Оформлення замовлення</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 40 }}>{items.length} позицій у кошику</p>

        <div className="checkout-grid">
          <form onSubmit={submit} className="checkout-form">
            {/* Delivery */}
            <div className="checkout-block">
              <h3>🚚 Спосіб отримання</h3>
              <div className="method-toggle">
                {[['delivery','🚀 Доставка'],['pickup','🏪 Самовивіз']].map(([v,l]) => (
                  <button key={v} type="button"
                    className={`method-btn ${form.delivery_method === v ? 'active' : ''}`}
                    onClick={() => setForm(f => ({...f, delivery_method: v}))}>
                    {l}
                  </button>
                ))}
              </div>
              {form.delivery_method === 'delivery' && (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Адреса доставки</label>
                  <input className="input" name="delivery_address" placeholder="вул. Хрещатик, 1, кв. 10"
                    value={form.delivery_address} onChange={handle} required />
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="checkout-block">
              <h3>💳 Спосіб оплати</h3>
              <div className="method-toggle" style={{ flexDirection: 'column', gap: 10 }}>
                {[
                  ['cash',   '💵', 'Готівка при отриманні',  'Оплатите кур\'єру готівкою у момент доставки'],
                  ['card',   '💳', 'Картка при отриманні',   'Оплата карткою через термінал у кур\'єра'],
                  ['online', '📱', 'Онлайн зараз',           'Оплата одразу через додаток або інтернет-банкінг'],
                ].map(([v, icon, title, hint]) => (
                  <button key={v} type="button"
                    className={`method-btn method-btn-full ${form.payment_method === v ? 'active' : ''}`}
                    onClick={() => setForm(f => ({...f, payment_method: v}))}>
                    <span className="method-btn-icon">{icon}</span>
                    <span className="method-btn-text">
                      <span className="method-btn-title">{title}</span>
                      <span className="method-btn-hint">{hint}</span>
                    </span>
                    {form.payment_method === v && <span className="method-btn-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo — лише для авторизованих користувачів */}
            {user && (
              <div className="checkout-block">
                <h3>🎁 Промокод</h3>
                <div className="promo-input-row">
                  <input className="input" placeholder="Введіть промокод (напр. WELCOME10)"
                    value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={applyPromo} disabled={promoLoading}>
                    {promoLoading ? '...' : 'Застосувати'}
                  </button>
                </div>
                {promoData && (
                  <div className="promo-applied">✓ {promoData.description} · Знижка: -{discount} ₴</div>
                )}
              </div>
            )}

            {/* Bonus */}
            {user && user.bonus_points > 0 && (
              <div className="checkout-block">
                <h3>⭐ Бонусні бали</h3>
                <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 12 }}>
                  Доступно: <strong style={{ color: 'var(--accent)' }}>{user.bonus_points} балів</strong> (100 б. = 10 ₴)
                </p>
                <div className="bonus-range-row">
                  <input type="range" min={0} max={maxBonusDiscount} step={10}
                    value={bonusUse} onChange={e => setBonusUse(+e.target.value)} />
                  <span>{bonusUse} б. (-{bonusDiscount} ₴)</span>
                </div>
              </div>
            )}

            {/* Comment */}
            <div className="checkout-block">
              <h3>💬 Коментар</h3>
              <textarea className="input" name="comment" rows={3}
                placeholder="Побажання до замовлення, алергії..."
                value={form.comment} onChange={handle} style={{ resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Оформляємо...' : `Підтвердити замовлення · ${finalTotal} ₴`}
            </button>
          </form>

          {/* Order summary */}
          <div className="order-summary">
            <h3>Ваше замовлення</h3>
            <div className="summary-items">
              {items.map(item => (
                <div key={item.id} className="summary-item">
                  <img src={item.image_url} alt={item.name}
                    onError={e => { e.target.style.display='none'; }} />
                  <div className="summary-item-info">
                    <span>{item.name}</span>
                    <span className="qty-label">× {item.quantity}</span>
                  </div>
                  <strong>{item.price * item.quantity} ₴</strong>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="summary-totals">
              <div className="summary-row"><span>Сума:</span><span>{total} ₴</span></div>
              {discount > 0 && <div className="summary-row discount"><span>Промокод:</span><span>-{discount} ₴</span></div>}
              {bonusDiscount > 0 && <div className="summary-row discount"><span>Бонуси:</span><span>-{bonusDiscount} ₴</span></div>}
              <div className="summary-row"><span>Доставка:</span><span className="free">{form.delivery_method === 'delivery' ? (finalTotal >= 500 ? 'Безкоштовно' : '49 ₴') : 'Безкоштовно'}</span></div>
            </div>
            <div className="divider" />
            <div className="summary-final">
              <span>До оплати:</span>
              <strong>{finalTotal + (form.delivery_method === 'delivery' && finalTotal < 500 ? 49 : 0)} ₴</strong>
            </div>
            {user && <p className="earn-hint">+{willEarn} бонусних балів за це замовлення ⭐</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
