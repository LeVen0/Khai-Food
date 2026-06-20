import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Menu.css';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const activeCategory = searchParams.get('category') || 'all';

  useEffect(() => {
    categoriesApi.getAll().then(setCategories);
    productsApi.getAll({}).then(list => setTotal(list.length)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (search) params.search = search;
    productsApi.getAll(params)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const handleSearch = (e) => setSearch(e.target.value);

  const setCategory = (slug) => {
    if (slug === 'all') searchParams.delete('category');
    else searchParams.set('category', slug);
    setSearchParams(searchParams);
  };

  const allCats = [{ id: 0, name: 'Всі', slug: 'all', icon: '🍽️' }, ...categories];

  return (
    <main style={{ paddingTop: 80 }}>
      <section className="menu-header">
        <div className="container">
          <span className="tag">Наше меню</span>
          <h1 className="section-title">Що сьогодні будемо?</h1>
          <p className="section-subtitle">Вибирайте з {total || '...'} смачних позицій</p>

          <div className="menu-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" className="input" placeholder="Шукати страву..."
              value={search} onChange={handleSearch}
            />
          </div>
        </div>
      </section>

      <div className="container">
        {/* Category tabs */}
        <div className="cat-tabs">
          {allCats.map(cat => (
            <button
              key={cat.slug}
              className={`cat-tab ${activeCategory === cat.slug ? 'active' : ''}`}
              onClick={() => setCategory(cat.slug)}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="menu-results">
          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>Нічого не знайдено</h3>
              <p>Спробуйте змінити запит або категорію</p>
            </div>
          ) : (
            <div className="menu-grid">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
