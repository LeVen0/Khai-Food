import { Link } from 'react-router-dom';
import './Promotions.css';

const PROMOS = [
  { id:1, emoji:'🎉', title:'Знижка 10% на перше замовлення', desc:'Зареєструйтесь та введіть промокод WELCOME10 при першому замовленні. Знижка діє на всі позиції меню.', code:'WELCOME10', color:'#00c853', category:'Нові клієнти' },
  { id:2, emoji:'⭐', title:'Подвійні бонуси кожного вівторка', desc:'Кожного вівторка всі зареєстровані клієнти отримують у 2 рази більше бонусних балів. Без промокоду!', code:null, color:'#FFD60A', category:'Бонусна програма' },
  { id:3, emoji:'🚀', title:'Безкоштовна доставка від 500 ₴', desc:'При замовленні на суму від 500 гривень — доставка безкоштовна! По всьому місту.', code:null, color:'#22C55E', category:'Доставка' },
  { id:4, emoji:'🍕', title:'Комбо зі знижкою 20%', desc:'Замовте будь-яке комбо з нашого меню та отримайте знижку 20%. Промокод: COMBO20 (мін. 300 ₴).', code:'COMBO20', color:'#8B5CF6', category:'Комбо' },
  { id:5, emoji:'💰', title:'50 грн при замовленні від 500 ₴', desc:'Введіть промокод FAST50 та отримайте знижку 50 гривень на замовлення від 500 гривень.', code:'FAST50', color:'#3B82F6', category:'Знижки' },
  { id:6, emoji:'🎂', title:'Подарунок у день народження', desc:'У день вашого народження та тиждень після — спеціальна знижка 15% на все замовлення. Зверніться до оператора.', code:null, color:'#EC4899', category:'Спеціальні' },
];

export default function Promotions() {
  return (
    <main style={{ paddingTop: 80 }}>
      <section className="promos-header">
        <div className="container">
          <span className="tag">Актуальні пропозиції</span>
          <h1 className="section-title">Акції та знижки</h1>
          <p className="section-subtitle">Вигідні пропозиції для наших клієнтів щодня</p>
        </div>
      </section>
      <section className="section-sm">
        <div className="container">
          <div className="promos-grid">
            {PROMOS.map(p => (
              <div key={p.id} className="promo-full-card" style={{ '--c': p.color }}>
                <div className="promo-full-top">
                  <span className="promo-cat">{p.category}</span>
                  <span className="promo-big-emoji">{p.emoji}</span>
                </div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                {p.code && (
                  <div className="promo-code-box">
                    <span>Промокод:</span>
                    <strong>{p.code}</strong>
                  </div>
                )}
                <Link to="/menu" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  Скористатись
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
