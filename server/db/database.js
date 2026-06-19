import db from './adapter.js';
import bcrypt from 'bcryptjs';

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      address TEXT DEFAULT '',
      bonus_points INTEGER DEFAULT 0,
      tier TEXT DEFAULT 'bronze',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      old_price REAL,
      image_url TEXT,
      weight INTEGER,
      calories INTEGER,
      is_popular INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 1,
      is_new INTEGER DEFAULT 0,
      is_spicy INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      status TEXT DEFAULT 'pending',
      total REAL NOT NULL,
      delivery_address TEXT,
      delivery_method TEXT DEFAULT 'delivery',
      payment_method TEXT DEFAULT 'cash',
      comment TEXT DEFAULT '',
      promo_code TEXT DEFAULT '',
      discount_amount REAL DEFAULT 0,
      bonus_used INTEGER DEFAULT 0,
      bonus_earned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT -1,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      description TEXT
    );
    CREATE TABLE IF NOT EXISTS bonus_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migrate promo_codes: add columns if not present (SQLite throws on duplicate)
  try { db.exec("ALTER TABLE promo_codes ADD COLUMN expires_at DATETIME DEFAULT NULL"); } catch {}
  try { db.exec("ALTER TABLE promo_codes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch {}

  // Email-верифікація: колонка статусу + таблиця кодів
  // (UPDATE виконується лише раз — у момент додавання колонки — щоб наявні акаунти лишились підтвердженими)
  try {
    db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
    db.exec("UPDATE users SET is_verified = 1");
  } catch {}
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get();
  if (catCount.c === 0) seedData();
}

function seedData() {
  const cats = db.prepare('INSERT INTO categories (name, slug, icon, description, sort_order) VALUES (?,?,?,?,?)');
  const categories = [
    ['Бургери',  'burgers',   '🍔', 'Соковиті бургери з хрусткими булочками', 1],
    ['Піца',     'pizza',     '🍕', 'Піца на тонкому тісті з моцарелою',       2],
    ['Роли',     'rolls',     '🍣', 'Свіжі японські роли та суші',             3],
    ['Снеки',    'snacks',    '🍟', 'Картопля фрі, нагетси та закуски',        4],
    ['Напої',    'drinks',    '🥤', 'Освіжаючі напої та шейки',                5],
    ['Десерти',  'desserts',  '🍦', 'Солодкі десерти та морозиво',             6],
    ['Салати',   'salads',    '🥗', 'Свіжі та поживні салати',                 7],
    ['Комбо',    'combo',     '🎁', 'Вигідні комбо-набори',                    8],
  ];
  categories.forEach(c => cats.run(...c));

  const prod = db.prepare(`INSERT INTO products
    (category_id, name, description, price, old_price, image_url, weight, calories, is_popular, is_new, is_spicy)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  const products = [
    // Бургери (cat 1)
    [1,'Класик Бургер','Яловича котлета 150г, свіжий салат, томат, цибуля, фірмовий соус',159,null,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',280,520,1,0,0],
    [1,'Подвійний Смок','Дві яловичі котлети, димний соус BBQ, хрусткий бекон, чеддер',239,269,'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop',380,780,1,0,0],
    [1,'Чікен Кріспі','Хрустке куряче філе, соус ранч, листя айсберг, томат',179,null,'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop',300,560,0,1,0],
    [1,'Чізбургер Делюкс','Три скибки чеддера, карамелізована цибуля, корнішон, гірчиця',199,null,'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',320,640,0,0,0],
    [1,'Спайсі Мексіко','Гостра котлета, халапеньо, соус чіпотле, авокадо',189,null,'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=300&fit=crop',290,590,0,1,1],
    [1,'Веган Бургер','Рослинна котлета Beyond Meat, авокадо, руккола, веган-соус',169,null,'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',260,430,0,1,0],
    [1,'Шефський Бургер','Авторський рецепт шефа: трюфельний соус, карамелізований цибуля конфі',249,null,'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=400&h=300&fit=crop',350,720,1,0,0],
    [1,'Міні Стрит','Маленький бургер з яловичиною та корнішоном — ідеальна закуска',99,null,'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop',160,330,0,0,0],
    // Піца (cat 2)
    [2,'Маргарита','Томатний соус, свіжа моцарела, листя базиліку, оливкова олія',249,null,'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',500,780,1,0,0],
    [2,'Пепероні','Пепероні, моцарела, томатний соус, орегано',289,null,'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&h=300&fit=crop',520,920,1,0,0],
    [2,'Чотири Сири','Горгонзола, пармезан, моцарела, чеддер на томатному соусі',319,null,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',500,1040,0,0,0],
    [2,'Курка BBQ','Куряче філе, соус BBQ, червона цибуля, болгарський перець',299,null,'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=300&fit=crop',530,890,0,0,0],
    [2,'Вегетарна','Перець, гриби, маслини, томати чері, моцарела',269,299,'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop',480,720,0,0,0],
    [2,'Гавайська','Шинка, ананас, моцарела, томатний соус',279,null,'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',510,840,0,0,0],
    // Роли (cat 3)
    [3,'Філадельфія','Лосось, вершковий сир філадельфія, огірок, авокадо',229,null,'https://images.unsplash.com/photo-1712192644058-092c39b36b6f?w=400&h=300&fit=crop',280,420,1,0,0],
    [3,'Каліфорнія','Краб-паличка, авокадо, огірок, ікра тобіко',199,null,'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&h=300&fit=crop',250,380,1,0,0],
    [3,'Дракон','Вугор, авокадо, кунжут, соус унагі',259,null,'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&h=300&fit=crop',290,450,0,0,0],
    [3,'Лосось Смажений','Смажений лосось, сир філадельфія, огірок в темпурі',239,null,'https://images.unsplash.com/photo-1558985212-92c2ff0b56e7?w=400&h=300&fit=crop',300,490,0,1,0],
    [3,'Спайсі Тунець','Гострий тунець, авокадо, огірок, соус спайсі',219,null,'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&h=300&fit=crop',260,400,0,0,1],
    [3,'Темпура Краб','Краб у хрусткій темпурі, авокадо, вершковий сир',249,null,'https://images.unsplash.com/photo-1633237308525-cd587cf71926?w=400&h=300&fit=crop',310,530,0,0,0],
    [3,'Веган Рол','Авокадо, огірок, морква, маринований імбир',179,null,'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400&h=300&fit=crop',230,290,0,1,0],
    [3,'Райдуга','Асорті 8 видів риби: лосось, тунець, вугор, креветка',289,null,'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop',320,540,1,0,0],
    // Снеки (cat 4)
    [4,'Картопля Фрі','Хрустка картопля фрі з фірмовим соусом',79,null,'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',150,380,1,0,0],
    [4,'Нагетси Курячі','8 соковитих курячих нагетсів з соусом на вибір',139,null,'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',200,490,1,0,0],
    [4,'Крила BBQ','6 крил у димному соусі BBQ зі свіжою зеленню',169,null,'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop',280,620,0,0,0],
    [4,'Цибулеві Кільця','Хрусткі кільця цибулі в паніровці з соусом ранч',89,null,'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',130,340,0,0,0],
    [4,'Сирні Палички','Гарячі палички моцарели у хрусткій паніровці',109,null,'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&h=300&fit=crop',160,420,0,0,0],
    // Напої (cat 5)
    [5,'Кола 0.5л','Класична Coca-Cola крижана',49,null,'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',500,210,0,0,0],
    [5,'Лимонад Домашній','Натуральний лимонад з м\'ятою та імбиром',69,null,'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=400&h=300&fit=crop',400,120,1,0,0],
    [5,'Молочний Шейк','Кремовий шоколадний шейк на молоці',99,null,'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop',450,540,1,0,0],
    [5,'Апельсиновий Фреш','Свіжовичавлений апельсиновий сік',89,null,'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',300,130,0,0,0],
    [5,'Зелений Чай','Зелений чай з лимоном та медом',59,null,'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',350,30,0,0,0],
    [5,'Мінеральна Вода','Мінеральна вода негазована 0.5л',29,null,'https://images.unsplash.com/photo-1591719482505-fcde0bdd0ed1?w=400&h=300&fit=crop',500,0,0,0,0],
    // Десерти (cat 6)
    [6,'Чізкейк Нью-Йорк','Класичний нью-йоркський чізкейк на крекерній основі',129,null,'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',150,480,1,0,0],
    [6,'Морозиво Ваніль','Дві кулі ніжного ванільного морозива',79,null,'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop',120,280,0,0,0],
    [6,'Шоколадний Брауні','Теплий брауні з горіхами та кулею морозива',109,null,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',180,520,1,0,0],
    [6,'Панакота','Ніжна панакота з ягідним соусом та м\'ятою',119,null,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',140,360,0,1,0],
    // Салати (cat 7)
    [7,'Цезар з Куркою','Хрустящий ромен, гриль курка, пармезан, гренки, соус Цезар',169,null,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',280,420,1,0,0],
    [7,'Грецький','Томати, огірок, маслини, болгарський перець, сир фета',149,null,'https://images.unsplash.com/photo-1778449532114-430396ada55b?w=400&h=300&fit=crop',250,310,0,0,0],
    [7,'Коул Слоу','Хрустяча капуста з морквою у кремовій заправці',99,null,'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&h=300&fit=crop',200,190,0,0,0],
    [7,'Нікуаз','Тунець, картопля, яйця, маслини, анчоуси',189,null,'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop',320,480,0,0,0],
    // Комбо (cat 8)
    [8,'Комбо Сімейне','2 великі піци + 4 напої на вибір — ідеально для компанії!',549,699,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',null,null,1,0,0],
    [8,'Комбо Бургер','Будь-який бургер + картопля фрі + напій 0.5л',239,279,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',null,null,1,0,0],
    [8,'Комбо Суші','2 роли на вибір + місо суп + зелений чай',449,529,'https://images.unsplash.com/photo-1651326852735-7ba1e0f8364e?w=400&h=300&fit=crop',null,null,1,0,0],
    [8,'Ланч Сет','Суп дня + будь-який салат + напій — ідеальний обід',199,239,'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',null,null,0,0,0],
  ];
  products.forEach(p => prod.run(...p));

  const promo = db.prepare('INSERT INTO promo_codes (code, type, value, min_order, max_uses, description) VALUES (?,?,?,?,?,?)');
  promo.run('WELCOME10', 'percent', 10, 0, 1000, 'Знижка 10% на перше замовлення');
  promo.run('FAST50', 'fixed', 50, 500, 500, '50 грн знижки при замовленні від 500 грн');
  promo.run('COMBO20', 'percent', 20, 300, 200, '20% знижки на комбо-набори (мін. 300 грн)');
  promo.run('BONUS2X', 'bonus_x2', 2, 200, 300, 'Подвійні бонуси за замовлення від 200 грн');

  const hash = bcrypt.hashSync('demo1234', 10);
  db.prepare('INSERT INTO users (name, email, phone, password_hash, bonus_points, tier, is_verified) VALUES (?,?,?,?,?,?,1)').run(
    'Тестовий Користувач', 'demo@fastfood.ua', '+380501234567', hash, 350, 'silver'
  );
}

export default db;
