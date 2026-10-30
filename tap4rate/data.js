// Tap4Rate (Эмиль, @wyhax_nfc) — товары и цены из канала Project2Profit.
// В рабочей версии заказы уходят в бот/таблицу Эмиля, оплата — через ЮKassa или перевод.
window.T4R = {
  manager: 'wyhax_nfc',
  reviews: 'https://t.me/Tap4Rate_reviews',
  resale: 2490,

  colors: [
    { id: 'black', name: 'Чёрный мат', bg: ['#16171B', '#060607'], fg: '#FFFFFF', edge: '#0B0B0D' },
    { id: 'white', name: 'Белый', bg: ['#FFFFFF', '#E6E6E1'], fg: '#111111', edge: '#E9E9E4' },
    { id: 'gold', name: 'Графит и золото', bg: ['#34343B', '#121215'], fg: '#F2C35B', edge: '#1A1A1E' },
    { id: 'green', name: 'Зелёный', bg: ['#22A060', '#0B3A23'], fg: '#FFFFFF', edge: '#0F4A2C' },
    { id: 'wine', name: 'Бордо', bg: ['#8A2840', '#360D18'], fg: '#FFFFFF', edge: '#45111F' },
  ],

  finishes: [
    { id: 'matte', name: 'Матовая', rough: .62, clear: 0, metal: 0 },
    { id: 'gloss', name: 'Глянец', rough: .22, clear: 1, metal: 0 },
    { id: 'metal', name: 'Металлик', rough: .32, clear: .6, metal: .55 },
  ],

  products: [
    { id: 'stand', name: 'Смарт-стенд', price: 2490, hit: true,
      text: 'NFC-карта 85×54 мм на акриловой подставке, название заведения на карте.' },
    { id: 'pro', name: 'С логотипом и гравировкой', price: 2990,
      text: 'Ваш логотип на карте, название гравируем на подставке.' },
    { id: 'set10', name: 'Набор для зала · 10 шт', price: 19900, old: 24900,
      text: 'Стенд на каждый стол в едином стиле. Можно разные ссылки для филиалов.' },
  ],

  tiers: [
    { min: 3, max: 9, price: 600 },
    { min: 10, max: 25, price: 550 },
    { min: 26, max: 100, price: 475 },
  ],

  starter: [
    { id: 'starter', name: 'Tap4Rate Starter Pack', price: 7390,
      text: '5 фирменных карт с подставками + Tap4Rate Club: поиск клиентов, скрипты для ТГ и визитов, поставщики.' },
    { id: 'reserve', name: 'Бронь набора под ваш город', price: 2000,
      text: 'Закрепляете Starter Pack и выкупаете на следующей неделе. 2 000 ₽ идут в счёт 7 390 ₽.' },
  ],

  cities: ['Краснодар', 'Москва', 'Санкт-Петербург', 'Ростов-на-Дону', 'Сочи', 'Другой'],
  delivery: ['СДЭК', 'Яндекс Доставка', 'OZON', 'Почта России', 'Самовывоз, Краснодар'],
};
