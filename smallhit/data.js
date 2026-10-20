// Концепт для барбершопа Small Hit. Услуги, цены, мастера и число отзывов — из открытой записи YCLIENTS (20.10.2026).
// Свободные окна в демо — примерные; в рабочей версии они приходят из YCLIENTS в реальном времени.
window.SH = {
  shop: {
    name: 'Small Hit',
    address: 'Яхтенная, 28 ст1',
    district: 'Приморский район',
    mapQuery: 'Санкт-Петербург, Яхтенная улица, 28 ст1',
    booking: 'https://n990439.yclients.com/company/919684/personal/menu?o=',
    open: 10, close: 22, // часы окон в демо
  },

  services: [
    { id: 'head', name: 'Стрижка головы', short: 'Голова', dur: 60, text: 'Любой сложности и длины (и даже наголо), с укладочными средствами.' },
    { id: 'beard', name: 'Стрижка бороды', short: 'Борода', dur: 60, text: 'Моделирование бороды, бритьё и всё, что связано с бородой.' },
    { id: 'combo', name: 'Голова + борода', short: 'Голова + борода', dur: 120, text: 'Полная проработка образа за один визит.' },
  ],

  levels: [
    { id: 'barber', name: 'BARBER', price: { head: 1400, beard: 1100, combo: 2500 }, text: 'Молодой мастер. Аккуратно, по выгодной цене — длинные волосы не стрижёт.' },
    { id: 'pro', name: 'PRO BARBER', price: { head: 1700, beard: 1400, combo: 3100 }, text: 'Уверенный мастер на любые классические и модные стрижки.' },
    { id: 'top', name: 'TOP BARBER', price: { head: 2000, beard: 1600, combo: 3400 }, text: 'Опыт и постоянные клиенты. Сложные формы и фейды.' },
    { id: 'expert', name: 'EXPERT BARBER', price: { head: 2400, beard: 1800, combo: 4000 }, text: 'Самые опытные. Образ под стиль и тип волос.' },
  ],

  // nearest — через сколько дней ближайшее окно (как в YCLIENTS на 20.10), busy — насколько плотная запись
  masters: [
    { id: 'aleksey', name: 'Алексей', level: 'barber', reviews: 1, nearest: 0, busy: 0.3 },
    { id: 'bogdan', name: 'Богдан', level: 'pro', reviews: 4, nearest: 1, busy: 0.45 },
    { id: 'ron', name: 'Рон', level: 'top', reviews: 35, nearest: 2, busy: 0.75 },
    { id: 'emin', name: 'Эмин', level: 'expert', reviews: 70, nearest: 1, busy: 0.85 },
    { id: 'pavel', name: 'Павел', level: 'expert', reviews: 43, nearest: 3, busy: 0.85 },
  ],
};
