import { useEffect, useState, useCallback } from 'react';
import { adminApi } from './AdminLayout';
import { timeAgo, formatDateTime } from '../../utils/format';

const STATUS_LABEL = {
  pending: 'Нове',
  preparing: 'Готується',
  ready: 'Готово',
  delivering: 'Доставляється',
  delivered: 'Доставлено',
  cancelled: 'Скасовано',
};
const STATUS_DOT = {
  pending: '🟡', preparing: '🔵', ready: '🟢',
  delivering: '🟣', delivered: '⚫', cancelled: '🔴',
};
const NEXT_STATUS = {
  pending:    { status: 'preparing',  label: '▶ Взяти в роботу' },
  preparing:  { status: 'ready',      label: '✓ Готово!' },
  ready:      { status: 'delivering', label: '🛵 Передати кур\'єру' },
  delivering: { status: 'delivered',  label: '✅ Доставлено' },
};

const TABS = [
  { key: 'active',     label: 'Активні' },
  { key: 'all',        label: 'Всі' },
  { key: 'pending',    label: 'Нові' },
  { key: 'preparing',  label: 'Готуються' },
  { key: 'ready',      label: 'Готові' },
  { key: 'delivering', label: 'Доставляються' },
  { key: 'delivered',  label: 'Доставлено' },
  { key: 'cancelled',  label: 'Скасовані' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [expanded, setExpanded] = useState(null);
  const [counts, setCounts] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    adminApi().get(`/orders?status=${tab}`)
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, [tab]);

  const loadCounts = () => {
    adminApi().get('/stats').then(r => {
      setCounts({ active: r.data.activeOrders });
    }).catch(() => {});
  };

  useEffect(() => {
    load();
    loadCounts();
  }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => { load(); loadCounts(); }, 30000);
    return () => clearInterval(t);
  }, [load]);

  const changeStatus = async (id, status) => {
    await adminApi().put(`/orders/${id}/status`, { status });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    loadCounts();
  };

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Замовлення</h2>
        <button className="admin-refresh-btn" onClick={() => { load(); loadCounts(); }}>↻ Оновити</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => { setTab(t.key); setExpanded(null); }}
          >
            {t.label}
            {t.key === 'active' && counts.active > 0 && (
              <span className="admin-tab-count">{counts.active}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-spinner" />
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <div className="admin-empty-text">Замовлень не знайдено</div>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div key={order.id} className={`admin-order-card status-${order.status}`}>
              {/* Main row */}
              <div className="admin-order-row" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="admin-order-id">#{String(order.id).padStart(3, '0')}</div>

                <div className="admin-order-client">
                  <div className="admin-order-client-name">{order.user_name || 'Гість'}</div>
                  <div className="admin-order-client-phone">{order.user_phone || order.user_email || '—'}</div>
                </div>

                <div className="admin-order-items">
                  <div className="admin-order-items-text">
                    {order.items.map(it => `${it.product_name} ×${it.quantity}`).join(', ')}
                  </div>
                </div>

                <div className="admin-order-total">{order.total} ₴</div>

                <div>
                  <span className={`status-badge ${order.status}`}>
                    {STATUS_DOT[order.status]} {STATUS_LABEL[order.status]}
                  </span>
                  <div className="admin-order-time">{timeAgo(order.created_at)}</div>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                  {expanded === order.id ? '▲' : '▼'}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === order.id && (
                <div className="admin-order-details">
                  <div>
                    <div className="admin-order-items-detail">
                      {order.items.map((it, i) => (
                        <div key={i} className="admin-order-item-row">
                          <span><strong>{it.product_name}</strong> × {it.quantity}</span>
                          <span>{it.price * it.quantity} ₴</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>Разом</span>
                        <span style={{ color: '#00c853' }}>{order.total} ₴</span>
                      </div>
                    </div>
                    <div className="admin-order-detail-row">
                      <span>📍 {order.delivery_method === 'delivery' ? `Доставка: ${order.delivery_address || '—'}` : 'Самовивіз'}</span>
                      <span>💳 {order.payment_method === 'cash' ? 'Готівка' : order.payment_method === 'card' ? 'Картка' : 'Онлайн'}</span>
                      {order.promo_code && <span>🏷 {order.promo_code} (-{order.discount_amount} ₴)</span>}
                      {order.bonus_used > 0 && <span>⭐ -{order.bonus_used} балів</span>}
                      {order.comment && <span>💬 {order.comment}</span>}
                    </div>
                  </div>

                  <div className="admin-order-actions">
                    {NEXT_STATUS[order.status] ? (
                      <button
                        className="admin-action-btn next"
                        onClick={() => changeStatus(order.id, NEXT_STATUS[order.status].status)}
                      >
                        {NEXT_STATUS[order.status].label}
                      </button>
                    ) : (
                      <button className="admin-action-btn disabled" disabled>
                        {STATUS_LABEL[order.status]}
                      </button>
                    )}
                    {['pending', 'preparing'].includes(order.status) && (
                      <button
                        className="admin-action-btn cancel"
                        onClick={() => changeStatus(order.id, 'cancelled')}
                      >
                        ✕ Скасувати
                      </button>
                    )}
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, textAlign: 'right' }}>
                      {formatDateTime(order.created_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
