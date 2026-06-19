import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import './ProductDetail.css';

const CAT_EMOJI = {
  burgers: '🍔', pizza: '🍕', rolls: '🍣',
  snacks: '🍟', drinks: '🥤', desserts: '🍦',
  salads: '🥗', combo: '🎁',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, setDrawerOpen } = useCart();
  const { show } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setImgError(false);
    setQty(1);
    productsApi.getById(id)
      .then(p => {
        setProduct(p);
        return productsApi.getAll({ category: p.category_slug, limit: 4 });
      })
      .then(prods => setRelated(prods.filter(p => p.id !== parseInt(id)).slice(0, 4)))
      .catch(() => navigate('/menu'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addItem(product, qty);
    show(`${product.name} додано до кошика`, 'success');
    setDrawerOpen(true);
  };

  if (loading) return <main style={{ paddingTop: 80 }}><div className="spinner" /></main>;
  if (!product) return null;

  const emoji = CAT_EMOJI[product.category_slug] || '🍽️';
  const discount = product.old_price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  return (
    <main className="detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Головна</Link>
          <span>›</span>
          <Link to="/menu">Меню</Link>
          <span>›</span>
          <Link to={`/menu?category=${product.category_slug}`}>{product.category_name}</Link>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        <div className="detail-grid">
          {/* Image */}
          <div className="detail-img-wrap">
            {discount && <div className="detail-discount-badge">-{discount}%</div>}
            {imgError ? (
              <div className="detail-img-fallback">
                <span>{emoji}</span>
              </div>
            ) : (
              <img
                src={product.image_url}
                alt={product.name}
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="detail-badges">
              {product.is_popular ? <span className="badge badge-popular">🔥 Хіт продажів</span> : null}
              {product.is_new ? <span className="badge badge-new">✨ Новинка</span> : null}
              {product.is_spicy ? <span className="badge badge-hot">🌶 Гострота</span> : null}
            </div>

            <span className="detail-category">{emoji} {product.category_name}</span>
            <h1 className="detail-name">{product.name}</h1>

            {product.description && (
              <p className="detail-desc">{product.description}</p>
            )}

            {/* Specs */}
            {(product.weight != null || product.calories != null) && (
              <div className="detail-specs">
                {product.weight != null && (
                  <div className="spec-item">
                    <span className="spec-icon">⚖️</span>
                    <div><strong>{product.weight} г</strong><span>Вага</span></div>
                  </div>
                )}
                {product.calories != null && (
                  <div className="spec-item">
                    <span className="spec-icon">🔥</span>
                    <div><strong>{product.calories} ккал</strong><span>Калорійність</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Price */}
            <div className="detail-price-row">
              <span className="detail-price">{product.price} ₴</span>
              {product.old_price && (
                <span className="detail-old-price">{product.old_price} ₴</span>
              )}
            </div>

            {/* Quantity + Add */}
            <div className="detail-actions">
              <div className="qty-big">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <button className="btn btn-primary btn-lg detail-add-btn" onClick={handleAdd}>
                До кошика · {product.price * qty} ₴
              </button>
            </div>

            {/* Extra info */}
            <div className="detail-meta-list">
              <div className="meta-row"><span>Категорія:</span><strong>{product.category_name}</strong></div>
              <div className="meta-row"><span>Час доставки:</span><strong>30–45 хв</strong></div>
              <div className="meta-row"><span>Бонуси за замовлення:</span><strong>+{Math.floor(product.price / 10)} балів</strong></div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="related-section">
            <h2 className="section-title">З цієї ж категорії</h2>
            <div className="related-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
