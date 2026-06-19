import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/login', form);
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/orders');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="admin-login-logo">
          <div className="logo-icon">🍔</div>
          <h1>Khai Food Admin</h1>
          <p>Панель управління</p>
        </div>
        <form className="admin-login-form" onSubmit={handle}>
          {error && <div className="admin-login-error">{error}</div>}
          <div className="admin-input-group">
            <label>Логін</label>
            <input
              className="admin-input"
              placeholder="admin"
              value={form.login}
              onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="admin-input-group">
            <label>Пароль</label>
            <input
              className="admin-input"
              type="password"
              placeholder="••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <button className="admin-login-btn" disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>
      </div>
    </div>
  );
}
