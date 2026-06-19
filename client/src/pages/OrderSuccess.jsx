import { useLocation, Link } from 'react-router-dom';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { state } = useLocation();
  const orderId = state?.orderId;
  const total = state?.total;
  const bonusEarned = state?.bonusEarned;

  return (
    <main className="success-page">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h1>Замовлення оформлено!</h1>
        {orderId && <p className="success-order">Замовлення <strong>#{orderId}</strong></p>}
        <p className="success-desc">
          Дякуємо за ваше замовлення! Наші кухарі вже готують для вас.
          Очікуйте доставку протягом 30–45 хвилин.
        </p>
        {bonusEarned > 0 && (
          <div className="success-bonus">⭐ Ви отримали +{bonusEarned} бонусних балів</div>
        )}
        {total && (
          <div className="success-total">До оплати: <strong>{total} ₴</strong></div>
        )}
        <div className="success-steps">
          <div className="step active">✓ Прийнято</div>
          <div className="step-line" />
          <div className="step">🍳 Готується</div>
          <div className="step-line" />
          <div className="step">🚀 Доставка</div>
          <div className="step-line" />
          <div className="step">😋 Отримано</div>
        </div>
        <div className="success-actions">
          <Link to="/menu" className="btn btn-primary btn-lg">Замовити ще</Link>
          <Link to="/profile" className="btn btn-outline btn-lg">Мої замовлення</Link>
        </div>
      </div>
    </main>
  );
}
