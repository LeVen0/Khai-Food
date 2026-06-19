import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from './AdminLayout';

const TYPE_LABELS = { percent: '% знижка', fixed: 'Фіксована', bonus_x2: 'x2 бонуси' };
const TYPE_COLORS = { percent: '#4fc3f7', fixed: '#81c784', bonus_x2: '#ffb74d' };

const EMPTY_FORM = {
  code: '', type: 'percent', value: '', min_order: '',
  max_uses: '', description: '', expires_at: '', is_active: true,
};

function statusInfo(p) {
  if (!p.is_active) return { label: 'Вимкнено', color: '#888' };
  if (p.expires_at && new Date(p.expires_at) < new Date())
    return { label: 'Прострочено', color: '#e57373' };
  if (p.max_uses !== -1 && p.used_count >= p.max_uses)
    return { label: 'Вичерпано', color: '#e57373' };
  return { label: 'Активний', color: '#81c784' };
}

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('uk-UA');
}

export default function AdminPromoCodes() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | promo object
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const api = adminApi();

  const load = () => {
    setLoading(true);
    api.get('/promo')
      .then(r => setPromos(r.data))
      .catch(e => { if (e.response?.status === 401) navigate('/admin/login'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setModal('create'); };
  const openEdit = (p) => {
    setForm({
      code: p.code, type: p.type, value: p.value,
      min_order: p.min_order || '', max_uses: p.max_uses === -1 ? '' : p.max_uses,
      description: p.description || '',
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
      is_active: !!p.is_active,
    });
    setError('');
    setModal(p);
  };
  const closeModal = () => setModal(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true); setError('');
    const payload = {
      ...form,
      value: parseFloat(form.value),
      min_order: parseFloat(form.min_order) || 0,
      max_uses: form.max_uses === '' ? -1 : parseInt(form.max_uses),
      expires_at: form.expires_at || null,
    };
    try {
      if (modal === 'create') {
        const r = await adminApi().post('/promo', payload);
        setPromos(prev => [r.data, ...prev]);
      } else {
        const r = await adminApi().put(`/promo/${modal.id}`, payload);
        setPromos(prev => prev.map(p => p.id === modal.id ? r.data : p));
      }
      closeModal();
    } catch (e) {
      setError(e.response?.data?.error || 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Видалити промокод?')) return;
    await adminApi().delete(`/promo/${id}`);
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  const reset = async (id) => {
    if (!confirm('Скинути лічильник використань до 0?')) return;
    await adminApi().post(`/promo/${id}/reset`);
    setPromos(prev => prev.map(p => p.id === id ? { ...p, used_count: 0 } : p));
  };

  const filtered = promos.filter(p => {
    const matchSearch = !search ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || p.type === filterType;
    return matchSearch && matchType;
  });

  if (loading) return <div className="admin-spinner" />;

  return (
    <div>
      {/* Header */}
      <div className="admin-section-header">
        <h2 className="admin-section-title">Промокоди</h2>
        <button className="admin-add-btn" onClick={openCreate}>+ Новий промокод</button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <input
          className="admin-search"
          placeholder="🔍 Пошук за кодом або описом..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[['all', 'Усі типи'], ['percent', '% знижка'], ['fixed', 'Фіксована'], ['bonus_x2', 'x2 бонуси']].map(([val, label]) => (
            <button key={val}
              onClick={() => setFilterType(val)}
              style={{
                padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none',
                background: filterType === val ? '#4fc3f7' : 'rgba(255,255,255,0.07)',
                color: filterType === val ? '#000' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Всього', val: promos.length, color: '#4fc3f7' },
          { label: 'Активних', val: promos.filter(p => statusInfo(p).label === 'Активний').length, color: '#81c784' },
          { label: 'Вимкнено/Прострочено', val: promos.filter(p => statusInfo(p).label !== 'Активний').length, color: '#e57373' },
          { label: 'Використань разом', val: promos.reduce((s, p) => s + (p.used_count || 0), 0), color: '#ffb74d' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 20px', minWidth: 140 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
              {['Код', 'Тип', 'Знижка', 'Мін. сума', 'Використань', 'Ліміт', 'Термін дії', 'Статус', 'Дії'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Промокодів не знайдено</td></tr>
            )}
            {filtered.map((p, i) => {
              const st = statusInfo(p);
              const usagePercent = p.max_uses === -1 ? null : Math.round((p.used_count / p.max_uses) * 100);
              return (
                <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 5 }}>{p.code}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: TYPE_COLORS[p.type] || '#aaa', background: `${TYPE_COLORS[p.type]}18`, padding: '3px 8px', borderRadius: 5 }}>
                      {TYPE_LABELS[p.type] || p.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 700 }}>
                    {p.type === 'percent' ? `${p.value}%` : p.type === 'fixed' ? `${p.value} ₴` : `×${p.value}`}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {p.min_order > 0 ? `${p.min_order} ₴` : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, color: '#fff', marginBottom: usagePercent !== null ? 4 : 0 }}>{p.used_count || 0}</div>
                    {usagePercent !== null && (
                      <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                        <div style={{ width: `${Math.min(usagePercent, 100)}%`, height: '100%', background: usagePercent >= 100 ? '#e57373' : '#4fc3f7', borderRadius: 2 }} />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {p.max_uses === -1 ? '∞' : p.max_uses}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {fmt(p.expires_at)}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: st.color, background: `${st.color}18`, padding: '3px 8px', borderRadius: 5 }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(p)} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', color: '#aaa', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }} title="Редагувати">✏️</button>
                      <button onClick={() => reset(p.id)} style={{ background: 'rgba(255,183,0,0.1)', border: 'none', color: '#ffb74d', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }} title="Скинути лічильник">↺</button>
                      <button onClick={() => del(p.id)} style={{ background: 'rgba(229,115,115,0.1)', border: 'none', color: '#e57373', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }} title="Видалити">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={closeModal}>
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#fff' }}>
              {modal === 'create' ? '➕ Новий промокод' : `✏️ Редагування: ${modal.code}`}
            </div>

            {error && <div style={{ background: 'rgba(229,115,115,0.15)', border: '1px solid rgba(229,115,115,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e57373', fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <div className="admin-modal-label">Код промокоду *</div>
                <input className="admin-modal-input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="Наприклад: SUMMER20" style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }} />
              </div>

              <div>
                <div className="admin-modal-label">Тип знижки *</div>
                <select className="admin-modal-input" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="percent">% від суми</option>
                  <option value="fixed">Фіксована сума (₴)</option>
                  <option value="bonus_x2">x2 бонуси</option>
                </select>
              </div>

              <div>
                <div className="admin-modal-label">Значення * {form.type === 'percent' ? '(%)' : form.type === 'fixed' ? '(₴)' : '(множник)'}</div>
                <input className="admin-modal-input" type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="10" />
              </div>

              <div>
                <div className="admin-modal-label">Мін. сума замовлення (₴)</div>
                <input className="admin-modal-input" type="number" min="0" value={form.min_order} onChange={e => set('min_order', e.target.value)} placeholder="0 — без обмеження" />
              </div>

              <div>
                <div className="admin-modal-label">Ліміт використань</div>
                <input className="admin-modal-input" type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Порожньо — безліміт" />
              </div>

              <div>
                <div className="admin-modal-label">Термін дії (до)</div>
                <input className="admin-modal-input" type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <div className="admin-modal-label">Опис</div>
                <input className="admin-modal-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Короткий опис для відображення клієнту" />
              </div>

              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="promo-active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="promo-active" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer' }}>Промокод активний</label>
              </div>
            </div>

            {/* Preview */}
            {form.code && (
              <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>{form.code}</span>
                {' — '}
                {form.type === 'percent' && form.value ? `знижка ${form.value}%` : ''}
                {form.type === 'fixed' && form.value ? `знижка ${form.value} ₴` : ''}
                {form.type === 'bonus_x2' ? `бонуси ×${form.value || 2}` : ''}
                {form.min_order ? ` (від ${form.min_order} ₴)` : ''}
                {form.max_uses ? `, ліміт ${form.max_uses} шт.` : ', безліміт'}
                {form.expires_at ? `, до ${new Date(form.expires_at).toLocaleDateString('uk-UA')}` : ''}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>Скасувати</button>
              <button onClick={save} disabled={saving} style={{ padding: '10px 24px', background: '#4fc3f7', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Збереження...' : modal === 'create' ? 'Створити' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
