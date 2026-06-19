import { Link } from 'react-router-dom';
import './Partners.css';

const PROGRAMS = [
  {
    id: 1,
    emoji: '🏪',
    title: 'Франшиза Khai Food',
    tag: 'Найпопулярніше',
    tagColor: '#00c853',
    desc: 'Відкрийте власний заклад під брендом Khai Food. Ми надаємо повний пакет підтримки: від навчання персоналу до маркетингових матеріалів.',
    offers: [
      'Готова бізнес-модель з підтвердженими показниками',
      'Повне навчання команди та управлінців',
      'Маркетингова підтримка та рекламні матеріали',
      'Централізована система постачання продуктів',
      'Технічна підтримка та IT-інфраструктура',
      'Консультації з управління та розвитку',
    ],
    investment: 'від 800 000 ₴',
    payback: '12–18 місяців',
  },
  {
    id: 2,
    emoji: '🥩',
    title: 'Постачальники продуктів',
    tag: 'Відкрита співпраця',
    tagColor: '#3b82f6',
    desc: 'Ми працюємо лише зі свіжими та якісними інгредієнтами. Якщо ви вирощуєте або виробляєте продукти харчування — ми готові до співпраці.',
    offers: [
      'Довгострокові контракти зі стабільними обсягами',
      'Прозора система ціноутворення та своєчасна оплата',
      'Регулярні заявки без затримок',
      'Можливість стати ексклюзивним постачальником',
      'Спільна розробка нових продуктів для меню',
      'Сертифікація та аудит відповідно до наших стандартів',
    ],
    investment: 'Без вкладень',
    payback: 'Одразу',
  },
  {
    id: 3,
    emoji: '🚗',
    title: 'Партнер з доставки',
    tag: 'Актуально',
    tagColor: '#f59e0b',
    desc: 'Маєте власний автопарк або команду кур\'єрів? Ми шукаємо надійних партнерів для розширення географії та швидкості доставки.',
    offers: [
      'Стабільне завантаження замовленнями',
      'Конкурентні тарифи за кожну доставку',
      'Інтеграція з нашою платформою замовлень',
      'Автоматична диспетчеризація та маршрутизація',
      'Спільна система трекінгу для клієнтів',
      'Бонуси за швидкість та якість сервісу',
    ],
    investment: 'Без вкладень',
    payback: 'Одразу',
  },
  {
    id: 4,
    emoji: '📱',
    title: 'Рекламна співпраця',
    tag: '',
    tagColor: '',
    desc: 'Блогери, медіа, агрегатори та рекламні майданчики — ми відкриті до будь-яких форм рекламної співпраці для взаємної вигоди.',
    offers: [
      'Реферальна програма з відсотком від продажів',
      'Бартерна співпраця з блогерами та інфлюенсерами',
      'Розміщення у харчових агрегаторах та каталогах',
      'Спонсорство заходів та фестивалів',
      'Партнерські промокоди для вашої аудиторії',
      'Розміщення рекламних матеріалів',
    ],
    investment: 'Гнучкі умови',
    payback: 'Залежить від формату',
  },
];

const STEPS = [
  { num: '01', title: 'Залиште заявку', desc: 'Надішліть лист на partners@khaifood.ua або заповніть форму нижче' },
  { num: '02', title: 'Знайомство', desc: 'Наш менеджер зв\'яжеться з вами протягом 1–2 робочих днів' },
  { num: '03', title: 'Презентація', desc: 'Ознайомимо вас з умовами співпраці та відповімо на всі запитання' },
  { num: '04', title: 'Угода', desc: 'Підписуємо договір і починаємо плідну співпрацю' },
];

export default function Partners() {
  return (
    <main style={{ paddingTop: 80 }}>
      {/* Hero */}
      <section className="part-hero">
        <div className="container">
          <span className="tag">Бізнес-можливості</span>
          <h1 className="section-title">Партнерам</h1>
          <p className="part-lead">Khai Food — це не лише ресторан, це екосистема. Ми відкриті до партнерства у різних форматах і готові будувати довгострокові відносини на взаємовигідних умовах.</p>
          <div className="part-hero-stats">
            <div className="part-stat"><strong>3+</strong><span>роки досвіду</span></div>
            <div className="part-stat-div" />
            <div className="part-stat"><strong>10K+</strong><span>клієнтів щомісяця</span></div>
            <div className="part-stat-div" />
            <div className="part-stat"><strong>45+</strong><span>страв у меню</span></div>
            <div className="part-stat-div" />
            <div className="part-stat"><strong>4</strong><span>програми партнерства</span></div>
          </div>
        </div>
      </section>

      {/* Why partner */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <span className="tag">Чому ми</span>
          <h2 className="section-title">Переваги співпраці з Khai Food</h2>
          <div className="part-why-grid">
            {[
              { emoji: '📈', title: 'Зростаючий бренд', desc: 'Ми активно розширюємося, а це означає нові можливості та більші обсяги для партнерів' },
              { emoji: '🤝', title: 'Чесні умови', desc: 'Прозорі договори, фіксовані умови та своєчасні виплати без затримок' },
              { emoji: '💡', title: 'Спільний розвиток', desc: 'Ми інвестуємо в партнерів: навчання, технології, маркетинг — все разом' },
              { emoji: '🔒', title: 'Надійність', desc: 'Офіційна реєстрація, прозора бухгалтерія та досвідчена команда менеджерів' },
            ].map(w => (
              <div key={w.title} className="part-why-card">
                <div className="part-why-emoji">{w.emoji}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section">
        <div className="container">
          <span className="tag">Формати співпраці</span>
          <h2 className="section-title">Програми партнерства</h2>
          <div className="part-programs">
            {PROGRAMS.map(p => (
              <div key={p.id} className="part-program-card">
                <div className="part-program-top">
                  <div className="part-program-emoji">{p.emoji}</div>
                  <div className="part-program-info">
                    <div className="part-program-title-row">
                      <h3>{p.title}</h3>
                      {p.tag && <span className="part-tag" style={{ background: p.tagColor + '22', color: p.tagColor, border: `1px solid ${p.tagColor}44` }}>{p.tag}</span>}
                    </div>
                    <p className="part-program-desc">{p.desc}</p>
                  </div>
                </div>

                <div className="part-program-offers">
                  <h4>Що ми пропонуємо:</h4>
                  <ul>
                    {p.offers.map(o => <li key={o}>{o}</li>)}
                  </ul>
                </div>

                <div className="part-program-footer">
                  <div className="part-program-nums">
                    <div>
                      <span>Інвестиції</span>
                      <strong>{p.investment}</strong>
                    </div>
                    <div>
                      <span>Окупність</span>
                      <strong>{p.payback}</strong>
                    </div>
                  </div>
                  <a href="mailto:partners@khaifood.ua" className="btn btn-primary">Обговорити умови</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <span className="tag">Процес</span>
          <h2 className="section-title">Як стати партнером</h2>
          <div className="part-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="part-step">
                <div className="part-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < STEPS.length - 1 && <div className="part-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Готові до співпраці?</h2>
          <p className="section-subtitle">Напишіть нам — і ми обговоримо найкращий формат партнерства для вас</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:partners@khaifood.ua" className="btn btn-primary btn-lg">📩 Написати нам</a>
            <Link to="/about" className="btn btn-outline btn-lg">Дізнатися більше про нас</Link>
          </div>
          <p style={{ marginTop: 24, color: 'var(--text3)', fontSize: 14 }}>
            📧 partners@khaifood.ua &nbsp;·&nbsp; 📞 +380 (57) 123-45-67
          </p>
        </div>
      </section>
    </main>
  );
}
