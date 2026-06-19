import { Link } from 'react-router-dom';
import './About.css';

export default function About() {
  return (
    <main style={{ paddingTop: 80 }}>
      <section className="about-hero">
        <div className="container">
          <span className="tag">Наша історія</span>
          <h1 className="section-title">Про Khai Food</h1>
          <p className="about-lead">Ми — команда ентузіастів, закоханих у смачну їжу та технології. З 2020 року доставляємо щастя у вигляді бургерів, піци та ролів.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div className="about-text">
              <h2>Наша місія</h2>
              <p>Khai Food — це більше ніж просто доставка їжі. Ми прагнемо зробити кожне замовлення особливим. Наші кухарі готують зі свіжих інгредієнтів щодня, а кур'єри доставляють замовлення гарячими та вчасно.</p>
              <p>Ми постійно вдосконалюємо наш сервіс, розширюємо меню та впроваджуємо нові технології, щоб зробити ваш досвід замовлення максимально комфортним.</p>
            </div>
            <div className="about-numbers">
              {[['3+','роки на ринку'],['45+','страв у меню'],['10K+','задоволених клієнтів'],['30 хв','середня доставка']].map(([n,l])=>(
                <div key={l} className="about-stat">
                  <strong>{n}</strong><span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <span className="tag">Наша команда</span>
          <h2 className="section-title">Люди за кулісами</h2>
          <div className="team-grid">
            {[
              { emoji:'👨‍🍳', name:'Олексій Кухаренко', role:'Шеф-кухар' },
              { emoji:'👩‍💼', name:'Марія Петренко', role:'CEO & Засновниця' },
              { emoji:'🚴', name:'Дмитро Швидкий', role:'Старший кур\'єр' },
              { emoji:'👨‍💻', name:'Андрій Цифровий', role:'CTO' },
            ].map(p => (
              <div key={p.name} className="team-card">
                <div className="team-avatar">{p.emoji}</div>
                <strong>{p.name}</strong>
                <span>{p.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Готові спробувати?</h2>
          <p className="section-subtitle">Замовте прямо зараз та отримайте знижку 10% на перше замовлення</p>
          <Link to="/menu" className="btn btn-primary btn-lg">Перейти до меню</Link>
        </div>
      </section>
    </main>
  );
}
