import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Vacancies.css';

const VACANCIES = [
  {
    id: 1,
    emoji: '👨‍🍳',
    title: 'Кухар гарячого цеху',
    type: 'Повна зайнятість',
    salary: '18 000 – 24 000 ₴',
    location: 'Харків, вул. Вадима Манька, 17',
    desc: 'Шукаємо досвідченого кухаря для приготування гарячих страв — бургерів, піци та снеків. Робота в дружньому колективі з сучасним кухонним обладнанням.',
    duties: [
      'Приготування страв згідно з технологічними картами',
      'Дотримання стандартів якості та санітарних норм',
      'Контроль термінів зберігання продуктів',
      'Участь у розробці нових позицій меню',
    ],
    requirements: [
      'Досвід роботи кухарем від 1 року',
      'Наявність медичної книжки',
      'Відповідальність та охайність',
      'Бажання навчатися та розвиватися',
    ],
    benefits: ['Офіційне працевлаштування', 'Безкоштовне харчування', 'Уніформа за рахунок компанії', 'Щомісячні премії'],
    tag: 'Гаряча вакансія',
    tagColor: '#ef4444',
  },
  {
    id: 2,
    emoji: '🚴',
    title: 'Кур\'єр з доставки',
    type: 'Повна / часткова зайнятість',
    salary: '15 000 – 22 000 ₴',
    location: 'Харків (весь місто)',
    desc: 'Доставляємо щастя у вигляді гарячої їжі! Шукаємо активних кур\'єрів на власному транспорті або велосипеді.',
    duties: [
      'Доставка замовлень клієнтам вчасно та у збереженому вигляді',
      'Підтримання зв\'язку з диспетчером',
      'Дотримання правил дорожнього руху',
      'Ввічливе спілкування з клієнтами',
    ],
    requirements: [
      'Наявність власного транспорту (авто / мотоцикл / велосипед)',
      'Знання міста Харків',
      'Смартфон для роботи з додатком',
      'Вік від 18 років',
    ],
    benefits: ['Компенсація пального', 'Гнучкий графік', 'Щотижневі виплати', 'Бонуси за швидкість'],
    tag: 'Є вакансії',
    tagColor: '#00c853',
  },
  {
    id: 3,
    emoji: '🧑‍💼',
    title: 'Адміністратор / Касир',
    type: 'Повна зайнятість',
    salary: '14 000 – 18 000 ₴',
    location: 'Харків, вул. Вадима Манька, 17',
    desc: 'Обличчя нашого закладу! Шукаємо привітного та організованого адміністратора для роботи в залі та на касі.',
    duties: [
      'Обслуговування клієнтів на касі',
      'Прийом та обробка замовлень',
      'Вирішення конфліктних ситуацій',
      'Контроль чистоти та порядку в залі',
    ],
    requirements: [
      'Досвід роботи з клієнтами від 6 місяців',
      'Грамотне мовлення та привітність',
      'Впевнений користувач ПК',
      'Стресостійкість',
    ],
    benefits: ['Офіційне працевлаштування', 'Безкоштовне харчування', 'Кар\'єрне зростання', 'Навчання за рахунок компанії'],
    tag: 'Є вакансії',
    tagColor: '#00c853',
  },
  {
    id: 4,
    emoji: '📦',
    title: 'Менеджер з постачання',
    type: 'Повна зайнятість',
    salary: '20 000 – 28 000 ₴',
    location: 'Харків, вул. Вадима Манька, 17',
    desc: 'Відповідальна позиція для людини, яка вміє домовлятися з постачальниками та стежити за якістю інгредієнтів.',
    duties: [
      'Пошук та переговори з постачальниками',
      'Контроль своєчасності поставок',
      'Перевірка якості продуктів',
      'Ведення звітності та документації',
    ],
    requirements: [
      'Досвід роботи у сфері закупівель від 2 років',
      'Навички ведення переговорів',
      'Знання Excel та 1С',
      'Вища освіта (бажано)',
    ],
    benefits: ['Офіційне працевлаштування', 'Корпоративний телефон', 'Медичне страхування', 'Щорічна відпустка 24 дні'],
    tag: '',
    tagColor: '',
  },
  {
    id: 5,
    emoji: '📱',
    title: 'SMM-менеджер / Маркетолог',
    type: 'Повна зайнятість / Фріланс',
    salary: '16 000 – 25 000 ₴',
    location: 'Харків або дистанційно',
    desc: 'Шукаємо творчу людину для просування Khai Food у соцмережах та розробки маркетингових кампаній.',
    duties: [
      'Ведення Instagram, TikTok, Facebook',
      'Створення контенту: фото, відео, сторіс',
      'Розробка та запуск рекламних кампаній',
      'Аналіз показників та звітність',
    ],
    requirements: [
      'Досвід ведення соцмереж від 1 року',
      'Навички фото/відеозйомки та монтажу',
      'Знання таргетованої реклами',
      'Творчий підхід та ініціативність',
    ],
    benefits: ['Гнучкий графік', 'Дистанційна робота', 'Творча свобода', 'Бонуси за результатами'],
    tag: 'Нова вакансія',
    tagColor: '#3b82f6',
  },
  {
    id: 6,
    emoji: '👨‍💻',
    title: 'Fullstack-розробник',
    type: 'Повна зайнятість / Контракт',
    salary: '35 000 – 55 000 ₴',
    location: 'Харків або дистанційно',
    desc: 'Розвиваємо власну IT-платформу! Шукаємо розробника для підтримки та розширення функціоналу нашого сервісу замовлень.',
    duties: [
      'Розробка та підтримка веб-платформи',
      'Інтеграція нових функцій та API',
      'Оптимізація продуктивності додатку',
      'Code review та технічна документація',
    ],
    requirements: [
      'Досвід з React, Node.js від 2 років',
      'Знання SQL та REST API',
      'Досвід роботи з Git',
      'Вміння працювати самостійно',
    ],
    benefits: ['Конкурентна зарплата', 'Повністю дистанційно', 'Гнучкий графік', 'Цікаві технічні задачі'],
    tag: 'Нова вакансія',
    tagColor: '#3b82f6',
  },
];

export default function Vacancies() {
  const [open, setOpen] = useState(null);

  return (
    <main style={{ paddingTop: 80 }}>
      {/* Hero */}
      <section className="vac-hero">
        <div className="container">
          <span className="tag">Команда Khai Food</span>
          <h1 className="section-title">Вакансії</h1>
          <p className="vac-lead">Ми постійно зростаємо і шукаємо талановитих людей. Приєднуйся до нашої команди та будуй кар'єру разом з нами!</p>
          <div className="vac-stats">
            <div className="vac-stat"><strong>6</strong><span>відкритих вакансій</span></div>
            <div className="vac-stat-div" />
            <div className="vac-stat"><strong>50+</strong><span>співробітників</span></div>
            <div className="vac-stat-div" />
            <div className="vac-stat"><strong>3+</strong><span>роки на ринку</span></div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <span className="tag">Чому ми</span>
          <h2 className="section-title">Переваги роботи в Khai Food</h2>
          <div className="vac-perks-grid">
            {[
              { emoji: '💰', title: 'Конкурентна зарплата', desc: 'Ринкові ставки + бонуси за результатами роботи щомісяця' },
              { emoji: '📚', title: 'Навчання та розвиток', desc: 'Безкоштовне навчання, майстер-класи, курси за рахунок компанії' },
              { emoji: '🤝', title: 'Дружня атмосфера', desc: 'Молодий колектив, корпоративні заходи та командний дух' },
              { emoji: '🚀', title: 'Кар\'єрне зростання', desc: 'Ми цінуємо ініціативу — кожен має шанс рости всередині компанії' },
              { emoji: '🍔', title: 'Безкоштовне харчування', desc: 'Смачні обіди від наших кухарів щодня для всіх співробітників' },
              { emoji: '📋', title: 'Офіційне оформлення', desc: 'Повністю офіційне працевлаштування, відпустка, лікарняні' },
            ].map(p => (
              <div key={p.title} className="vac-perk-card">
                <div className="vac-perk-emoji">{p.emoji}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vacancies list */}
      <section className="section">
        <div className="container">
          <span className="tag">Відкриті позиції</span>
          <h2 className="section-title">Актуальні вакансії</h2>
          <div className="vac-list">
            {VACANCIES.map(v => (
              <div key={v.id} className={`vac-card ${open === v.id ? 'open' : ''}`}>
                <div className="vac-card-header" onClick={() => setOpen(open === v.id ? null : v.id)}>
                  <div className="vac-card-emoji">{v.emoji}</div>
                  <div className="vac-card-main">
                    <div className="vac-card-top">
                      <h3 className="vac-card-title">{v.title}</h3>
                      {v.tag && <span className="vac-tag" style={{ background: v.tagColor + '22', color: v.tagColor, border: `1px solid ${v.tagColor}44` }}>{v.tag}</span>}
                    </div>
                    <div className="vac-card-meta">
                      <span>⏱ {v.type}</span>
                      <span>💰 {v.salary}</span>
                      <span>📍 {v.location}</span>
                    </div>
                  </div>
                  <div className={`vac-chevron ${open === v.id ? 'up' : ''}`}>▼</div>
                </div>

                {open === v.id && (
                  <div className="vac-card-body">
                    <p className="vac-desc">{v.desc}</p>
                    <div className="vac-details-grid">
                      <div>
                        <h4>Обов'язки</h4>
                        <ul>{v.duties.map(d => <li key={d}>{d}</li>)}</ul>
                      </div>
                      <div>
                        <h4>Вимоги</h4>
                        <ul>{v.requirements.map(r => <li key={r}>{r}</li>)}</ul>
                      </div>
                    </div>
                    <div className="vac-benefits">
                      <h4>Ми пропонуємо</h4>
                      <div className="vac-benefits-list">
                        {v.benefits.map(b => <span key={b} className="vac-benefit-chip">{b}</span>)}
                      </div>
                    </div>
                    <a href="mailto:hr@khaifood.ua?subject=Відгук на вакансію: "
                      className="btn btn-primary" style={{ marginTop: 8 }}>
                      📩 Надіслати резюме
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Не знайшли підходящу вакансію?</h2>
          <p className="section-subtitle">Надішліть нам своє резюме — ми зберемо його та зв'яжемося, коли з'явиться підходяща позиція</p>
          <a href="mailto:hr@khaifood.ua" className="btn btn-primary btn-lg">Надіслати резюме</a>
        </div>
      </section>
    </main>
  );
}
