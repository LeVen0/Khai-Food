import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const { items, total, count, removeItem, updateQty, clearCart, drawerOpen, setDrawerOpen } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      <aside className="cart-drawer">
        <div className="drawer-header">
          <h2>Кошик <span className="drawer-count">{count}</span></h2>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <div style={{ fontSize: 64 }}>🛒</div>
            <p>Ваш кошик порожній</p>
            <Link to="/menu" className="btn btn-primary btn-sm" onClick={() => setDrawerOpen(false)}>
              До меню
            </Link>
          </div>
        ) : (
          <>
            <div className="drawer-items">
              {items.map(item => (
                <div key={item.id} className="drawer-item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    onError={e => { e.target.src = `https://placehold.co/80x80/141f14/00c853?text=${encodeURIComponent(item.name[0])}`; }}
                  />
                  <div className="drawer-item-info">
                    <span className="drawer-item-name">{item.name}</span>
                    <span className="drawer-item-price">{item.price} ₴</span>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="drawer-footer">
              <div className="drawer-total">
                <span>Разом:</span>
                <strong>{total} ₴</strong>
              </div>
              <Link
                to="/checkout"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setDrawerOpen(false)}
              >
                Оформити замовлення
              </Link>
              <button className="clear-cart" onClick={clearCart}>Очистити кошик</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
