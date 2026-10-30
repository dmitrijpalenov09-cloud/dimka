// Tapio NFC (Брянск, канал «Tapio NFC») — товары и цены из закреплённого поста.
// В рабочей версии заказы уходят в бот Tapio, оплата — через ЮKassa или перевод.
window.T4R = {
  brand: 'tapio',
  stand: false,          // Tapio продаёт карты и стикеры без подставки
  accent: 0xFFD23F,
  manager: 'tapioonfc',
  manager2: 'NFC_Tapio',
  resale: 1500,

  colors: [
    { id: 'yellow', name: 'Жёлтая', bg: ['#FFDA4D', '#F2B200'], fg: '#141100', edge: '#E0A800' },
    { id: 'green', name: 'Зелёная', bg: ['#33C25A', '#0F7A30'], fg: '#FFFFFF', edge: '#0F6A2A' },
    { id: 'black', name: 'Чёрная', bg: ['#1C1C20', '#060607'], fg: '#FFFFFF', edge: '#0B0B0D' },
    { id: 'white', name: 'Белая', bg: ['#FFFFFF', '#E6E6E1'], fg: '#111111', edge: '#E9E9E4' },
    { id: 'blue', name: 'Синяя', bg: ['#3D6BFF', '#14267A'], fg: '#FFFFFF', edge: '#162C8A' },
  ],

  finishes: [
    { id: 'matte', name: 'Матовая', rough: .62, clear: 0, metal: 0 },
    { id: 'gloss', name: 'Глянец', rough: .22, clear: 1, metal: 0 },
    { id: 'metal', name: 'Металлик', rough: .32, clear: .6, metal: .55 },
  ],

  products: [
    { id: 'yandex', name: 'Для Яндекс Карт', price: 450, hit: true, color: 'yellow', maps: ['Яндекс Карты'],
      text: 'NFC-карта с QR, ведёт сразу в окно отзыва на Яндекс Картах.' },
    { id: 'gis', name: 'Для 2ГИС', price: 450, color: 'green', maps: ['2ГИС'],
      text: 'Такая же карта под 2ГИС — для городов, где все смотрят 2ГИС.' },
    { id: 'custom', name: 'Свой дизайн', price: 450, from: true, color: 'black', maps: ['Яндекс Карты', '2ГИС'],
      text: 'Логотип и фирменные цвета заведения. Макет согласуем, цену уточнит менеджер.' },
  ],

  tiers: [
    { min: 1, max: 14, price: 450 },
    { min: 15, max: Infinity, price: 350 },
  ],

  cities: ['Брянск', 'Москва', 'Санкт-Петербург', 'Другой'],
  delivery: ['Курьер по Брянску', 'СДЭК', 'Яндекс Доставка', 'Почта России'],
};
