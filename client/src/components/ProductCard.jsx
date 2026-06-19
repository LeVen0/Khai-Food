import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './ProductCard.css';

const CAT_EMOJI = {
  burgers: '🍔', pizza: '🍕', rolls: '🍣',
  snacks: '🍟', drinks: '🥤', desserts: '🍦',
  salads: '🥗', combo: '🎁',
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { show } = useToast();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addItem(product);
    show(`${product.name} додано до кошика`, 'success');
    setTimeout(() => setAdding(false), 600);
  };

  const emoji = CAT_EMOJI[product.category_slug] || '🍽️';

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-img-wrap">
        {imgError ? (
          <div className="img-fallback">
            <span>{emoji}</span>
          </div>
        ) : (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        <div className="product-badges">
          {product.is_popular ? <span className="badge badge-popular">🔥 Хіт</span> : null}
          {product.is_new ? <span className="badge badge-new">✨ Новинка</span> : null}
          {product.is_spicy ? <span className="badge badge-hot">🌶 Гостро</span> : null}
          {product.old_price ? <span className="badge badge-sale">Знижка</span> : null}
        </div>
      </Link>

      <div className="product-body">
        <div className="product-meta">
          {product.weight != null && product.weight !== '' && <span>{product.weight} г</span>}
          {product.calories != null && product.calories !== '' && <span>{product.calories} ккал</span>}
        </div>
        <Link to={`/product/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}
        <div className="product-footer">
          <div className="product-price">
            <span className="price-current">{product.price} ₴</span>
            {product.old_price && <span className="price-old">{product.old_price} ₴</span>}
          </div>
          <button
            className={`add-btn ${adding ? 'adding' : ''}`}
            onClick={handleAdd}
            aria-label="Додати до кошика"
          >
            {adding ? '✓' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
}
