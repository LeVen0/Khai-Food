import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const PROMOS = [
  { id: 1, title: 'Знижка 10% на перше замовлення', desc: 'Промокод: WELCOME10', color: '#00c853', emoji: '🎉' },
  { id: 2, title: 'Подвійні бонуси кожен вівторок', desc: '2× бонусні бали за будь-яке замовлення', color: '#FFD60A', emoji: '⭐' },
  { id: 3, title: 'Безкоштовна доставка від 500 ₴', desc: 'По всьому місту без доплати', color: '#22C55E', emoji: '🚀' },
];

const FEATURES = [
  { icon: '⚡', title: 'Швидка доставка', desc: 'Доставимо за 30–45 хвилин або безкоштовно' },
  { icon: '👨‍🍳', title: 'Свіжі інгредієнти', desc: 'Готуємо лише зі свіжих продуктів щодня' },
  { icon: '🎁', title: 'Бонусна програма', desc: 'Накопичуйте бали та отримуйте знижки' },
  { icon: '📱', title: 'Легке замовлення', desc: 'Замовляйте онлайн без дзвінків та черг' },
];

export default function Home() {
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productsApi.getPopular(), categoriesApi.getAll()])
      .then(([prods, cats]) => { setPopular(prods); setCategories(cats); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient" />
          <div className="hero-dots" />
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <span className="tag">🔥 Замовляй онлайн</span>
            <h1 className="hero-title">
              Смачна їжа<br/>
              <span className="accent-text">за 30 хвилин</span>
            </h1>
            <p className="hero-desc">
              Бургери, піца, роли та багато іншого — свіжо приготовлено<br/>
              та доставлено прямо до вашого порогу.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-primary btn-lg">
                Замовити зараз
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link to="/about" className="btn btn-outline btn-lg">Дізнатись більше</Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><strong>45+</strong><span>Страв у меню</span></div>
              <div className="stat-divider" />
              <div className="stat"><strong>30 хв</strong><span>Середня доставка</span></div>
              <div className="stat-divider" />
              <div className="stat"><strong>4.9 ★</strong><span>Рейтинг</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-1">
              <span>🍔</span>
              <div><strong>Бургер Дня</strong><span>від 159 ₴</span></div>
            </div>
            <div className="hero-card hero-card-2">
              <span>⭐</span>
              <div><strong>+150 бонусів</strong><span>за замовлення</span></div>
            </div>
            <div className="hero-emoji-ring">
              {['🍔','🍕','🍣','🍟','🥤','🍦'].map((e,i) => (
                <div key={i} className="emoji-orbit" style={{ '--i': i }}>
                  <span>{e}</span>
                </div>
              ))}
              <div className="hero-emoji-center">🔥</div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40C240 0 480 80 720 40C960 0 1200 80 1440 40V80H0V40Z" fill="#0d0d0d"/>
          </svg>
        </div>
      </section>

      {/* PROMO BANNERS */}
      <section className="section-sm">
        <div className="container">
          <div className="promo-grid">
            {PROMOS.map(p => (
              <div key={p.id} className="promo-card" style={{ '--color': p.color }}>
                <span className="promo-emoji">{p.emoji}</span>
                <div>
                  <strong>{p.title}</strong>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section-sm">
        <div className="container">
          <span className="tag">Що бажаєте?</span>
          <h2 className="section-title">Категорії</h2>
          <div className="categories-grid">
            {categories.map(cat => (
              <Link key={cat.id} to={`/menu?category=${cat.slug}`} className="cat-card">
                <span className="cat-icon">{cat.icon}</span>
                <strong>{cat.name}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR */}
      <section className="section">
        <div className="container">
          <span className="tag">Найзамовляніше</span>
          <h2 className="section-title">Популярні страви</h2>
          <p className="section-subtitle">Наші хіти, які обирають знову і знову</p>
          {loading ? <div className="spinner" /> : (
            <div className="products-grid">
              {popular.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/menu" className="btn btn-outline btn-lg">Переглянути все меню</Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section features-section">
        <div className="container">
          <span className="tag">Чому обирають нас</span>
          <h2 className="section-title">Наші переваги</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BONUS CTA */}
      <section className="section bonus-cta-section">
        <div className="container">
          <div className="bonus-cta">
            <div className="bonus-cta-text">
              <span className="tag">Бонусна програма</span>
              <h2>Накопичуй бали —<br/>отримуй смаколики!</h2>
              <p>За кожне замовлення ви отримуєте бонусні бали, які можна використати як знижку. Чим більше замовляєш — тим вищий рівень і більше привілеїв.</p>
              <div className="bonus-tiers">
                <div className="tier bronze"><span>🥉</span> Бронза</div>
                <div className="tier silver"><span>🥈</span> Срібло</div>
                <div className="tier gold"><span>🥇</span> Золото</div>
              </div>
              <Link to="/register" className="btn btn-primary btn-lg">Зареєструватись безкоштовно</Link>
            </div>
            <div className="bonus-cta-visual">
              <div className="bonus-card-preview">
                <div className="bonus-card-header">
                  <span>🔥 Khai Food</span>
                  <span className="tier-badge">🥈 Срібло</span>
                </div>
                <div className="bonus-amount">350 <small>балів</small></div>
                <div className="bonus-bar-wrap">
                  <div className="bonus-bar"><div style={{ width: '70%' }} /></div>
                  <span>350 / 500 до Золота</span>
                </div>
                <div className="bonus-card-footer">Іванченко Олексій</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
