import { useEffect, useState } from 'react';
import { adminApi } from './AdminLayout';

const CAT_EMOJI = {
  burgers:'🍔', pizza:'🍕', rolls:'🍣', snacks:'🍟',
  drinks:'🥤', desserts:'🍦', salads:'🥗', combo:'🎁',
};

/* ── Image preview component ─────────────────────────── */
function ImgPreview({ url, slug }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [url]);
  if (!url || err) return (
    <div style={{ width:70, height:56, borderRadius:8, background:'#222', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
      {CAT_EMOJI[slug] || '🍽️'}
    </div>
  );
  return <img src={url} alt="" style={{ width:70, height:56, borderRadius:8, objectFit:'cover' }} onError={() => setErr(true)} />;
}

/* ── Shared form fields ──────────────────────────────── */
function ProductForm({ form, set, categories }) {
  return (
    <>
      {/* Category */}
      <div>
        <div className="admin-modal-label">Категорія *</div>
        <select
          className="admin-modal-input"
          value={form.category_id || ''}
          onChange={e => set('category_id', e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Оберіть категорію —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{CAT_EMOJI[c.slug] || ''} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <div className="admin-modal-label">Назва *</div>
        <input className="admin-modal-input" placeholder="Назва страви" value={form.name || ''} onChange={e => set('name', e.target.value)} />
      </div>

      {/* Description */}
      <div>
        <div className="admin-modal-label">Опис</div>
        <textarea className="admin-modal-input admin-modal-textarea" placeholder="Склад, особливості..." value={form.description || ''} onChange={e => set('description', e.target.value)} />
      </div>

      {/* Image URL */}
      <div>
        <div className="admin-modal-label">Фото (URL)</div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <input
            className="admin-modal-input"
            style={{ flex:1 }}
            placeholder="https://images.unsplash.com/photo-..."
            value={form.image_url || ''}
            onChange={e => set('image_url', e.target.value)}
          />
          <ImgPreview url={form.image_url} slug={form.category_slug} />
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
          Вставте URL зображення з Unsplash або іншого сайту
        </div>
      </div>

      {/* Price */}
      <div className="admin-modal-row">
        <div>
          <div className="admin-modal-label">Ціна (₴) *</div>
          <input className="admin-modal-input" type="number" min="0" placeholder="199" value={form.price || ''} onChange={e => set('price', e.target.value)} />
        </div>
        <div>
          <div className="admin-modal-label">Стара ціна (₴)</div>
          <input className="admin-modal-input" type="number" min="0" placeholder="—" value={form.old_price || ''} onChange={e => set('old_price', e.target.value)} />
        </div>
      </div>

      {/* Weight / Calories */}
      <div className="admin-modal-row">
        <div>
          <div className="admin-modal-label">Вага (г)</div>
          <input className="admin-modal-input" type="number" min="0" placeholder="300" value={form.weight || ''} onChange={e => set('weight', e.target.value)} />
        </div>
        <div>
          <div className="admin-modal-label">Калорії (ккал)</div>
          <input className="admin-modal-input" type="number" min="0" placeholder="450" value={form.calories != null ? form.calories : ''} onChange={e => set('calories', e.target.value)} />
        </div>
      </div>

      {/* Flags */}
      <div>
        <div className="admin-modal-label">Позначки</div>
        <div className="admin-toggles-row">
          {[
            ['is_available', '✅ Доступний'],
            ['is_popular',   '🔥 Хіт'],
            ['is_new',       '✨ Новинка'],
            ['is_spicy',     '🌶 Гостро'],
          ].map(([key, label]) => (
            <label key={key} className="admin-toggle-item">
              <input
                type="checkbox"
                checked={!!form[key]}
                onChange={e => set(key, e.target.checked ? 1 : 0)}
                style={{ accentColor:'#00c853', width:16, height:16, cursor:'pointer' }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Edit Modal ──────────────────────────────────────── */
function EditModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState({ ...product });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.price) { setError('Заповніть назву та ціну'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await adminApi().put(`/products/${form.id}`, form);
      setSaved(true);
      setTimeout(() => { setSaved(false); onSave(data); onClose(); }, 900);
    } catch { setError('Помилка збереження'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div className="admin-modal-title">✏️ Редагування товару</div>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-form">
          <ProductForm form={form} set={set} categories={categories} />
          {error && <div style={{ color:'#ef4444', fontSize:13, textAlign:'center' }}>{error}</div>}
          {saved
            ? <div className="admin-modal-success">✓ Збережено!</div>
            : <button className="admin-modal-save" onClick={save} disabled={saving}>
                {saving ? 'Збереження...' : '💾 Зберегти зміни'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

/* ── Add Modal ───────────────────────────────────────── */
const EMPTY = {
  category_id:'', name:'', description:'', price:'', old_price:'',
  image_url:'', weight:'', calories:'',
  is_available:1, is_popular:0, is_new:1, is_spicy:0,
};

function AddModal({ categories, onClose, onAdd }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.category_id) { setError('Оберіть категорію'); return; }
    if (!form.name.trim())  { setError('Введіть назву'); return; }
    if (!form.price)        { setError('Введіть ціну'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await adminApi().post('/products', form);
      onAdd(data);
      onClose();
    } catch (e) { setError(e.response?.data?.error || 'Помилка'); }
    finally { setSaving(false); }
  };

  return (
    <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div className="admin-modal-title">➕ Нова позиція</div>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="admin-modal-form">
          <ProductForm form={form} set={set} categories={categories} />
          {error && <div style={{ color:'#ef4444', fontSize:13, textAlign:'center' }}>{error}</div>}
          <button className="admin-modal-save" onClick={save} disabled={saving}>
            {saving ? 'Збереження...' : '➕ Додати позицію'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export default function AdminProducts() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing]     = useState(null);
  const [adding, setAdding]       = useState(false);
  const [imgErrors, setImgErrors] = useState({});
  const [deleting, setDeleting]   = useState(null); // id being confirmed

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi().get('/products'),
      adminApi().get('/categories'),
    ]).then(([pr, cr]) => {
      setProducts(pr.data);
      setCategories(cr.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deleteProduct = async (id) => {
    const { data } = await adminApi().delete(`/products/${id}`);
    if (data.soft) {
      // just mark unavailable in state
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: 0 } : p));
      alert(data.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
    setDeleting(null);
  };

  const quickToggle = async (p, key) => {
    const updated = { ...p, [key]: p[key] ? 0 : 1 };
    setProducts(prev => prev.map(x => x.id === p.id ? updated : x));
    await adminApi().put(`/products/${p.id}`, updated);
  };

  // Filter
  const filtered = products.filter(p => {
    const matchCat = catFilter === 'all' || p.category_slug === catFilter;
    const matchSearch = !search
      || p.name.toLowerCase().includes(search.toLowerCase())
      || p.category_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category for count badges
  const countByCat = products.reduce((acc, p) => {
    acc[p.category_slug] = (acc[p.category_slug] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="admin-section-header">
        <h2 className="admin-section-title">Товари ({products.length})</h2>
        <input
          className="admin-search"
          placeholder="🔍 Пошук..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => setAdding(true)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', background:'linear-gradient(135deg,#00c853,#00e676)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}
        >
          ➕ Додати позицію
        </button>
        <button className="admin-refresh-btn" onClick={load}>↻</button>
      </div>

      {/* Category filter tabs */}
      <div className="admin-tabs">
        <button className={`admin-tab${catFilter==='all'?' active':''}`} onClick={() => setCatFilter('all')}>
          Всі <span className="admin-tab-count">{products.length}</span>
        </button>
        {categories.map(c => (
          <button key={c.slug} className={`admin-tab${catFilter===c.slug?' active':''}`} onClick={() => setCatFilter(c.slug)}>
            {CAT_EMOJI[c.slug]} {c.name}
            {countByCat[c.slug] && <span className="admin-tab-count">{countByCat[c.slug]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-spinner" />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🍽️</div>
          <div className="admin-empty-text">Товарів не знайдено</div>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width:60 }}>Фото</th>
                <th>Назва / Категорія</th>
                <th>Ціна</th>
                <th>Вага / Ккал</th>
                <th>Позначки</th>
                <th>Активний</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    {imgErrors[p.id]
                      ? <div className="admin-product-img-fallback">{CAT_EMOJI[p.category_slug]||'🍽️'}</div>
                      : <img
                          className="admin-product-img"
                          src={p.image_url}
                          alt={p.name}
                          onError={() => setImgErrors(e => ({...e,[p.id]:true}))}
                        />
                    }
                  </td>
                  <td>
                    <div className="admin-product-name">{p.name}</div>
                    <div className="admin-product-cat">{CAT_EMOJI[p.category_slug]||''} {p.category_name}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight:700 }}>{p.price} ₴</div>
                    {p.old_price && <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textDecoration:'line-through' }}>{p.old_price} ₴</div>}
                  </td>
                  <td style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>
                    {p.weight ? `${p.weight} г` : '—'}<br/>
                    {p.calories != null ? `${p.calories} ккал` : '—'}
                  </td>
                  <td>
                    {!!p.is_popular && <span className="admin-mini-badge mini-popular">🔥 Хіт</span>}
                    {!!p.is_new     && <span className="admin-mini-badge mini-new">✨ Нове</span>}
                    {!!p.is_spicy   && <span className="admin-mini-badge mini-spicy">🌶 Гостро</span>}
                  </td>
                  <td>
                    <label className="admin-toggle">
                      <input type="checkbox" checked={!!p.is_available} onChange={() => quickToggle(p, 'is_available')} />
                      <span className="admin-toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button className="admin-edit-btn" onClick={() => setEditing(p)}>✏️ Змінити</button>
                      {deleting === p.id
                        ? <>
                            <button onClick={() => deleteProduct(p.id)} style={{ padding:'6px 10px', background:'rgba(239,68,68,0.2)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.35)', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer' }}>✓ Так</button>
                            <button onClick={() => setDeleting(null)} style={{ padding:'6px 10px', background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' }}>Ні</button>
                          </>
                        : <button onClick={() => setDeleting(p.id)} style={{ padding:'6px 10px', background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, fontSize:12, cursor:'pointer' }}>🗑</button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={updated => {
            setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
            setImgErrors(e => { const n={...e}; delete n[updated.id]; return n; });
          }}
        />
      )}

      {/* Add modal */}
      {adding && (
        <AddModal
          categories={categories}
          onClose={() => setAdding(false)}
          onAdd={newProduct => {
            setProducts(prev => [...prev, newProduct]);
            // Switch to the new product's category
            setCatFilter(newProduct.category_slug);
          }}
        />
      )}
    </div>
  );
}
