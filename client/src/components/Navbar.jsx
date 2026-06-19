import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍔</span>
          <span className="logo-text">Khai<span> Food</span></span>
        </Link>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><NavLink to="/" end onClick={() => setMenuOpen(false)}>Головна</NavLink></li>
          <li><NavLink to="/menu" onClick={() => setMenuOpen(false)}>Меню</NavLink></li>
          <li><NavLink to="/promotions" onClick={() => setMenuOpen(false)}>Акції</NavLink></li>
          <li><NavLink to="/about" onClick={() => setMenuOpen(false)}>Про нас</NavLink></li>
        </ul>

        <div className="navbar-actions">
          <button className="cart-btn" onClick={() => setDrawerOpen(true)} aria-label="Кошик">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>

          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="user-btn">
                <span className="user-avatar">{user.name?.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.name?.split(' ')[0]}</span>
              </Link>
              <button className="logout-btn" onClick={handleLogout} title="Вийти">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Увійти</Link>
          )}

          <button className="burger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Меню">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
