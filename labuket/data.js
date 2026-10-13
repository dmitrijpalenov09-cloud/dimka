// Концепт для цветочного магазина LaBuket. Цены и формат букетов — из постов канала @labuketSPB (авг.–окт. 2026).
// Названия букетов даны описательно, фото — стоковые (Unsplash): в рабочей версии будут их фото.
window.LB = {
  shop: {
    name: 'LaBuket',
    tagline: 'Букеты-гиганты с доставкой по Петербургу.\nПоставки цветов — каждый день.',
    years: 14,
    address: 'Большая Пушкарская, 15',
    hours: 'Пн–сб 11:00–20:00',
    mapQuery: 'Санкт-Петербург, Большая Пушкарская 15',
    freeFrom: 5000,
  },

  cats: [
    { id: 'all', name: 'Все' },
    { id: 'giant', name: 'Гиганты 🔥' },
    { id: 'roses', name: 'Розы' },
    { id: 'daisy', name: 'Ромашки' },
    { id: 'box', name: 'Коробки' },
    { id: 'basket', name: 'Корзины' },
  ],

  items: [
    { id: 'iloveyou', cat: ['box'], name: 'Коробка «I LOVE YOU» с ромашками', price: 3900, img: 'box-love', hit: true, text: 'Признание в любви из живых цветов — большая фирменная коробка' },
    { id: 'box45', cat: ['box'], name: 'Коробка с цветами', price: 4500, img: 'pastel', text: 'Нежная цветочная композиция в коробке' },
    { id: 'author', cat: ['roses'], name: 'Яркий авторский микс', price: 5200, img: 'mix-dark', text: 'Сборный букет: розы, гортензия и сезонная зелень' },
    { id: 'white-roses', cat: ['roses'], name: 'Белые розы', price: 5000, img: 'pastel', text: 'Классика, которая подходит к любому поводу' },
    { id: 'crimson', cat: ['roses'], name: 'Малиновые розы', price: 5600, img: 'roses-sea', text: 'Яркий и сочный букет на день рождения' },
    { id: 'daisy-white', cat: ['daisy'], name: 'Большой букет белых ромашек', price: 6000, img: 'daisy', text: 'Воздушный, светлый и очень летний' },
    { id: 'pink-mix', cat: ['roses'], name: 'Розовый микс с гортензией', price: 6400, img: 'jar', text: 'Максимум нежности: розы, гортензия, кустовые розы' },
    { id: 'peony', cat: ['roses'], name: 'Пионовидные розы', price: 7200, img: 'peony', hit: true, text: 'Пышные пионовидные розы — хит на день рождения' },
    { id: 'hit8', cat: ['roses'], name: 'Наш хит — большой яркий букет', price: 8000, img: 'rainbow', hit: true, text: 'Собираем по несколько штук в день — выбирают снова и снова' },
    { id: 'basket-peony', cat: ['basket'], name: 'Корзина пионовидных роз', price: 10900, img: 'peony', text: 'Пионовидные розы в плетёной корзине' },
    { id: 'basket-roses', cat: ['basket', 'roses'], name: 'Огромная корзина роз', price: 11900, img: 'roses-sea', text: 'Корзина, от которой невозможно отвести глаз' },
    { id: 'daisy-giant', cat: ['giant', 'daisy'], name: 'Ромашки-гигант', price: 12100, img: 'daisies', text: 'Огромный бело-розовый букет ромашек' },
    { id: 'daisy-rainbow', cat: ['giant', 'daisy'], name: 'Микс разноцветных ромашек', price: 13400, img: 'rainbow', text: 'Букет, который невозможно не заметить' },
    { id: 'giant-hydr', cat: ['giant', 'roses'], name: 'Гигант с розами и гортензиями', price: 15000, img: 'jar', text: 'Крупные розы и гортензии в формате гигант' },
    { id: 'giant-snow', cat: ['giant', 'daisy'], name: 'Белоснежный гигант ромашек', price: 15600, img: 'daisy', text: 'Настоящий вау-эффект на годовщину' },
    { id: 'mega-roses', cat: ['giant', 'roses'], name: 'Мега-гигант роз', price: 18900, img: 'roses-sea', sale: true, text: 'Акционная цена — пока есть цветы' },
    { id: 'giant-peony', cat: ['giant', 'roses'], name: 'Гигант: пионовидные розы и альстромерии', price: 22500, img: 'peony', text: 'Объёмный, нежный и очень эффектный' },
    { id: 'french', cat: ['giant', 'roses'], name: 'Французские розы, большой букет', price: 26900, img: 'pastel', text: 'Для случаев, когда хочется действительно впечатлить' },
    { id: 'giant-pink', cat: ['giant', 'roses'], name: 'Роскошный розовый микс-гигант', price: 29000, img: 'hero', text: 'Для особенного поздравления' },
  ],

  // Гиганты дня по акции — в канале их публикуют каждый день
  dayDeals: [
    { id: 'deal1', cat: ['giant'], name: 'Гигант дня №1', price: 5000, img: 'mix-dark', sale: true, text: 'Акция на гиганты: состав зависит от сегодняшней поставки' },
    { id: 'deal2', cat: ['giant'], name: 'Гигант дня №2', price: 5300, img: 'pastel', sale: true, text: 'Акция на гиганты: состав зависит от сегодняшней поставки' },
    { id: 'deal3', cat: ['giant'], name: 'Гигант дня №3', price: 5500, img: 'daisies', sale: true, text: 'Акция на гиганты: состав зависит от сегодняшней поставки' },
  ],

  // «Сегодня поехали» — формат их постов-отчётов (районы, без адресов)
  feed: [
    { text: 'Огромный букет на день рождения любимой', price: 29600, where: 'Кудрово', img: 'hero' },
    { text: 'Наш хит поздравлять маму', price: 8000, where: 'Невский район', img: 'rainbow' },
    { text: 'Яркий букет', price: 5200, where: 'Крестовский остров', img: 'mix-dark' },
    { text: 'Ромашки-гигант', price: 12500, where: 'Петроградская сторона', img: 'daisies' },
  ],

  slots: ['11:00–14:00', '14:00–17:00', '17:00–20:00'],
};
