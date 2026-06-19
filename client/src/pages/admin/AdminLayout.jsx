import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import './Admin.css';

function adminApi() {
  const token = localStorage.getItem('adminToken');
  return axios.create({
    baseURL: '/api/admin',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export { adminApi };

export default function AdminLayout() {
  const navigate = useNavigate();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }

    const fetchActive = () => {
      adminApi().get('/stats')
        .then(r => setActiveCount(r.data.activeOrders))
        .catch(() => {});
    };
    fetchActive();
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="admin-root">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-title">🍔 KHAI FOOD</div>
          <div className="admin-logo-sub">Адмін-панель</div>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <span className="admin-nav-icon">📊</span>
            <span>Дашборд</span>
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <span className="admin-nav-icon">📦</span>
            <span>Замовлення</span>
            {activeCount > 0 && <span className="admin-nav-badge">{activeCount}</span>}
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <span className="admin-nav-icon">🍔</span>
            <span>Товари</span>
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <span className="admin-nav-icon">👥</span>
            <span>Клієнти</span>
          </NavLink>
          <NavLink to="/admin/promo" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <span className="admin-nav-icon">🏷️</span>
            <span>Промокоди</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={logout}>
            <span>🚪</span>
            <span>Вийти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-header">
          <span className="admin-header-title">Khai Food Admin</span>
          <div className="admin-header-right">
            <span>🕐 {now}</span>
            <span>admin</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
