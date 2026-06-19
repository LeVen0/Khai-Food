import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from './AdminLayout';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    setError(null);
    adminApi().get('/stats')
      .then(r => setStats(r.data))
      .catch(e => {
        if (e.response?.status === 401) { navigate('/admin/login'); return; }
        setError('Не вдалося завантажити дані');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="admin-spinner" />;
  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ marginBottom: 16 }}>{error}</div>
      <button className="admin-refresh-btn" onClick={load}>Спробувати знову</button>
    </div>
  );
  if (!stats) return null;

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Дашборд</h2>
        <button className="admin-refresh-btn" onClick={load}>↻ Оновити</button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card accent">
          <div className="admin-stat-icon">🔥</div>
          <div className="admin-stat-value">{stats.activeOrders}</div>
          <div className="admin-stat-label">Активних замовлень</div>
          <div className="admin-stat-sub">зараз в обробці</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">📦</div>
          <div className="admin-stat-value">{stats.todayOrders}</div>
          <div className="admin-stat-label">Замовлень сьогодні</div>
          <div className="admin-stat-sub">всього: {stats.totalOrders}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">💰</div>
          <div className="admin-stat-value">{Math.round(stats.todayRevenue)} ₴</div>
          <div className="admin-stat-label">Виручка сьогодні</div>
          <div className="admin-stat-sub">всього: {Math.round(stats.totalRevenue)} ₴</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div className="admin-stat-value">{stats.totalUsers}</div>
          <div className="admin-stat-label">Клієнтів</div>
          <div className="admin-stat-sub">зареєстровано</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">🍔</div>
          <div className="admin-stat-value">{stats.totalProducts}</div>
          <div className="admin-stat-label">Активних товарів</div>
          <div className="admin-stat-sub">в меню</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon">❌</div>
          <div className="admin-stat-value">{stats.cancelledOrders}</div>
          <div className="admin-stat-label">Скасовано</div>
          <div className="admin-stat-sub">за весь час</div>
        </div>
      </div>

      <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>Швидкі дії</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/admin/orders" style={{ padding: '10px 20px', background: 'rgba(0,200,83,0.15)', color: '#00c853', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(0,200,83,0.25)' }}>
            📦 Переглянути замовлення
          </Link>
          <Link to="/admin/products" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            🍔 Редагувати меню
          </Link>
          <Link to="/admin/users" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>
            👥 Список клієнтів
          </Link>
        </div>
      </div>
    </div>
  );
}
