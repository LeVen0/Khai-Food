import { useEffect, useState } from 'react';
import { adminApi } from './AdminLayout';
import { formatDate } from '../../utils/format';

const TIER_LABEL = { bronze: '🥉 Бронза', silver: '🥈 Срібло', gold: '🥇 Золото' };
const TIER_CLASS = { bronze: 'tier-bronze', silver: 'tier-silver', gold: 'tier-gold' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi().get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  );

  return (
    <div>
      <div className="admin-section-header">
        <h2 className="admin-section-title">Клієнти ({users.length})</h2>
        <input
          className="admin-search"
          placeholder="🔍 Пошук клієнта..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="admin-spinner" />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Ім'я</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Рівень</th>
                <th>Бонуси</th>
                <th>Дата реєстрації</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{u.email}</td>
                  <td style={{ color: 'rgba(255,255,255,0.6)' }}>{u.phone || '—'}</td>
                  <td>
                    <span className={`tier-badge ${TIER_CLASS[u.tier] || 'tier-bronze'}`}>
                      {TIER_LABEL[u.tier] || u.tier}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#00c853' }}>⭐ {u.bonus_points}</span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="admin-empty">
              <div className="admin-empty-icon">👤</div>
              <div className="admin-empty-text">Клієнтів не знайдено</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
