// Концепт для салона «КОМНАТА». Услуги и цены — из открытых страниц записи салона (YCLIENTS), 13.10.2026.
window.KOMNATA = {
  salon: {
    name: 'Комната',
    tagline: 'Маникюрная и парикмахерская\nв одном окне',
    address: 'Полтавский проезд, 3 ст1',
    mapQuery: 'Санкт-Петербург, Полтавский проезд, 3 ст1',
    years: 9,
    open: 10 * 60,
    close: 22 * 60,
  },

  branches: [
    { id: 'nails', name: 'Маникюрная', ico: '💅', note: 'Маникюр, педикюр, наращивание', handle: '@komnata_nail', img: 'nails-dark', slotLabel: 'Маникюр / педикюр' },
    { id: 'hair', name: 'Парикмахерская', ico: '✂️', note: 'Стрижки, тонирование, биозавивка', handle: '@komnata_hair', img: 'hair-styling', slotLabel: 'Стрижка / тонирование' },
  ],

  // options — уровни мастера (или длина волос) со своей ценой и длительностью, как в прайсе салона
  services: [
    { id: 'gel', branch: 'nails', group: 'Маникюр', name: 'Маникюр с покрытием (гель-лак)', desc: 'Гигиенический маникюр, снятие, укрепление гелем и 3 простых ремонта', img: 'nails-dark', design: true, popular: true,
      options: [{ label: 'Мастер', price: 2900, dur: 105 }, { label: 'Топ-мастер', price: 3300, dur: 120 }] },
    { id: 'hyg', branch: 'nails', group: 'Маникюр', name: 'Гигиенический маникюр + снятие', desc: 'Комбинированный: аппарат + ножницы, по желанию прозрачный лак', img: 'nails-care',
      options: [{ label: 'Мастер', price: 2150, dur: 60 }, { label: 'Топ-мастер', price: 2450, dur: 75 }] },
    { id: 'jap', branch: 'nails', group: 'Маникюр', name: 'Японский маникюр', desc: 'Уход с пчелиным воском и минеральной пастой для блеска', img: 'nails-process',
      options: [{ label: 'Мастер', price: 2300, dur: 75 }, { label: 'Топ-мастер', price: 2700, dur: 60 }] },
    { id: 'file', branch: 'nails', group: 'Маникюр', name: 'Пилочный маникюр', desc: 'Без режущих инструментов — только пилки', img: 'nails-pastel', design: true,
      options: [{ label: 'Топ-мастер', price: 2700, dur: 90 }] },
    { id: 'pedi', branch: 'nails', group: 'Педикюр', name: 'Педикюр полный с покрытием', desc: 'Стопы, пальчики и покрытие гель-лаком или обычным лаком', img: 'nails-art', design: true,
      options: [{ label: 'Мастер', price: 3800, dur: 135 }, { label: 'Топ-мастер', price: 4100, dur: 120 }] },
    { id: 'pedi-toes', branch: 'nails', group: 'Педикюр', name: 'Пальчики + покрытие', desc: 'Педикюр пальчиков с покрытием на выбор', img: 'nails-art', design: true,
      options: [{ label: 'Мастер', price: 3300, dur: 120 }, { label: 'Топ-мастер', price: 3600, dur: 120 }] },
    { id: 'ext', branch: 'nails', group: 'Наращивание', name: 'Наращивание', optTitle: 'Вариант', desc: 'Короткое или длинное', img: 'nails-gel', design: true,
      options: [{ label: 'Короткое', price: 4600, dur: 150 }, { label: 'Длинное', price: 5200, dur: 180 }, { label: 'Экстра', price: 6400, dur: 180 }] },
    { id: 'ext-fix', branch: 'nails', group: 'Наращивание', name: 'Коррекция наращивания', optTitle: 'Вариант', desc: 'Обычного или экстра', img: 'nails-gel', design: true,
      options: [{ label: 'Обычная', price: 4400, dur: 150 }, { label: 'Экстра', price: 4800, dur: 150 }] },

    { id: 'cut', branch: 'hair', group: 'Стрижки', name: 'Стрижка', desc: 'Цена зависит от уровня мастера', img: 'hair-styling', popular: true,
      options: [{ label: 'Мастер', price: 1800, dur: 90 }, { label: 'Стилист', price: 2500, dur: 90 }, { label: 'Топ-стилист', price: 2900, dur: 90 }, { label: 'Эксперт', price: 3300, dur: 90 }, { label: 'Топ-эксперт', price: 3800, dur: 90 }] },
    { id: 'bangs', branch: 'hair', group: 'Стрижки', name: 'Стрижка чёлки', desc: 'Без мытья головы, на чистые волосы', img: 'hair-blowout',
      options: [{ label: 'Мастер', price: 900, dur: 30 }, { label: 'Стилист', price: 1300, dur: 30 }, { label: 'Топ-стилист', price: 1700, dur: 30 }, { label: 'Эксперт', price: 1900, dur: 30 }, { label: 'Топ-эксперт', price: 2100, dur: 30 }] },
    { id: 'tone', branch: 'hair', group: 'Окрашивание', name: 'Тонирование / тон в тон', desc: 'Цена без учёта материалов', img: 'hair-waves', popular: true,
      options: [{ label: 'Мастер', price: 3000, dur: 120 }, { label: 'Стилист', price: 4300, dur: 120 }, { label: 'Топ-стилист', price: 4900, dur: 120 }, { label: 'Эксперт', price: 5600, dur: 120 }, { label: 'Топ-эксперт', price: 6100, dur: 120 }] },
    { id: 'perm', branch: 'hair', group: 'Биозавивка', name: 'Биозавивка', optTitle: 'Длина волос', desc: 'Цена без учёта материалов, зависит от длины', img: 'hair-wash',
      options: [{ label: 'Короткие', price: 8000, dur: 180 }, { label: 'Средние', price: 9500, dur: 210 }, { label: 'Длинные', price: 12000, dur: 240 }, { label: 'Очень длинные', price: 14000, dur: 240 }] },
  ],

  // Дизайн — дополнение к маникюру, педикюру и наращиванию
  designs: [
    { id: 'none', name: 'Без дизайна', price: 0, dur: 0 },
    { id: 'simple', name: 'Простой', price: 600, dur: 0 },
    { id: 'month', name: 'Дизайн месяца', price: 990, dur: 30 },
    { id: 'mid', name: 'Средний', price: 1200, dur: 30 },
    { id: 'surprise', name: 'Сюрприз', price: 1200, dur: 30 },
    { id: 'hard', name: 'Сложный', price: 1800, dur: 45 },
  ],

  monthDrop: {
    month: 'Октябрь',
    title: 'Хеллоуин-дроп',
    text: 'Четыре дизайна — четыре фильма. Какой забираете?',
    items: [
      { id: 'ghouls', name: 'Реальные упыри', text: 'Чёрный глянец, клыки и цветные камни',
        nails: ['#0b0b0b', '#141414', 'gem', '#0b0b0b', 'fang'] },
      { id: 'witch', name: 'Колдовство', text: 'Тёмная слива, медная чешуя, металлические кончики',
        nails: ['plum', 'copper', 'plum', 'scale', 'plum'] },
      { id: 'love', name: 'Ведьма любви', text: 'Цветы, карамель, лаванда, конфетти — 70-е колдуют',
        nails: ['#c9b3e6', 'flower', '#d9a066', 'confetti', '#c9b3e6'] },
      { id: 'dracula', name: 'Дракула', text: 'Нюд, дымчатый чёрный и красные капли',
        nails: ['#e9c8b6', 'smoke', 'drop', '#e9c8b6', 'smoke'] },
    ],
  },

  drinks: [
    { group: 'Кофе', items: ['Пряная тыква', 'Лесной орех', 'Кленовый', 'Ваниль', 'Ирландский крем'] },
    { group: 'Чай', items: ['Молочный улун', 'Зелёный с жасмином', 'Каркаде', 'Травяной', 'С бергамотом'] },
  ],

  partner: { title: 'Бонус от студии танца «Будь собой»', text: 'Первое занятие бесплатно по промокоду КОМНАТА — до конца 2026 года' },
};
