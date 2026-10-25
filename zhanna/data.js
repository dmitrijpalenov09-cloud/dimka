// Данные студии «Жанна Д'Арт» — из DIKIDI dikidi.net/862980 (цены на 21.10.2026).
// В рабочей версии запись идёт в DIKIDI студии, оплата сертификата — через онлайн-кассу.
window.OCHL = {
  clinic: {
    name: 'Жанна Д’Арт',
    address: 'Светлановский проспект, 54В',
    phone: '+7 919 770-19-07',
    phoneRaw: '+79197701907',
    booking: 'https://dikidi.net/862980',
    channel: 'https://t.me/wllw_bom',
    mapQuery: 'Санкт-Петербург, Светлановский проспект, 54В',
  },

  amounts: [3000, 5000, 7000, 10000, 15000, 20000],

  cats: [
    { id: 'massage', name: 'Массаж' },
    { id: 'shape', name: 'LPG и сферомассаж' },
    { id: 'sub', name: 'Абонементы — выгодно' },
    { id: 'beauty', name: 'Ногти, брови, ресницы' },
  ],

  // goals — для подбора: relax · shape · face · nails · brows
  procs: [
    { id: 'relaxauthor', cat: 'massage', goals: ['relax'], name: 'Массаж релакс (авторский)', price: 3000, hit: true,
      text: '50 минут, чтобы выдохнуть и ни о чём не думать.' },
    { id: 'relax75', cat: 'massage', goals: ['relax'], name: 'Расслабляющий массаж', price: 3700,
      text: 'Долгий расслабляющий массаж — 75 минут.' },
    { id: 'classic60', cat: 'massage', goals: ['relax'], name: 'Классический массаж · 60 минут', price: 3500,
      text: 'Классический массаж всего тела.' },
    { id: 'back', cat: 'massage', goals: ['relax'], name: 'Массаж спины + шейно-воротниковая зона', price: 3600,
      text: 'Для тех, кто много сидит за компьютером.' },
    { id: 'anticell', cat: 'massage', goals: ['shape'], name: 'Антицеллюлитный массаж · 60 минут', price: 3500,
      text: 'Ручной антицеллюлитный массаж.' },
    { id: 'silhouette', cat: 'shape', goals: ['shape'], name: '«Идеальный силуэт»: LPG + сферомассаж', price: 4700, hit: true,
      text: 'Комплекс на всё тело — 90 минут.' },
    { id: 'detox', cat: 'shape', goals: ['shape'], name: '«Детокс + Тонус»: LPG + сферомассаж', price: 3400,
      text: 'Комплекс на одну зону.' },
    { id: 'sculpt', cat: 'shape', goals: ['shape'], name: 'Скульптурное моделирование тела', price: 4000,
      text: 'Ручной массаж с элементами лепки — 90 минут.' },
    { id: 'face', cat: 'shape', goals: ['face'], name: 'Уход для лица: LPG + сферомассаж', price: 3200, hit: true,
      text: 'Комбинированный аппаратный уход для лица.' },
    { id: 'sub5', cat: 'sub', goals: ['relax', 'shape'], name: 'Абонемент: 5 массажей по 60 минут', price: 15400,
      text: 'Скидка 12% — лучший подарок для курса.' },
    { id: 'sub3', cat: 'sub', goals: ['relax', 'shape'], name: 'Абонемент: 3 массажа по 40 минут', price: 8100,
      text: 'Скидка 10%.' },
    { id: 'combo', cat: 'beauty', goals: ['nails'], name: 'Маникюр + педикюр с покрытием', price: 5700, hit: true,
      text: 'Комбо за один визит.' },
    { id: 'mani', cat: 'beauty', goals: ['nails'], name: 'Маникюр с покрытием гель', price: 2600,
      text: 'Маникюр с покрытием гель-лак.' },
    { id: 'lashbrow', cat: 'beauty', goals: ['brows'], name: 'Ламинирование ресниц и бровей', price: 4500,
      text: 'Комбо: ламинирование и окрашивание ресниц и бровей.' },
  ],

  covers: [
    { id: 'winter', name: 'Королевский' },
    { id: 'paper', name: 'Жемчуг' },
    { id: 'powder', name: 'Пудра' },
    { id: 'graphite', name: 'Графит' },
  ],

  wishes: [
    'С Новым годом! Пусть этот час будет только твоим ✨',
    'Выдохни и отдохни — ты это заслужила',
    'Спасибо, что ты рядом ❤️',
    'С днём рождения! Красоты и лёгкости',
  ],

  quiz: {
    who: [
      { id: 'mom', name: 'Маме', e: '🤍' },
      { id: 'love', name: 'Любимой', e: '❤️' },
      { id: 'friend', name: 'Подруге', e: '🥂' },
      { id: 'colleague', name: 'Коллеге', e: '💼' },
      { id: 'me', name: 'Себе', e: '✨' },
    ],
    goal: [
      { id: 'relax', name: 'Расслабиться', sub: 'массаж, тишина, время для себя' },
      { id: 'shape', name: 'Подтянуть фигуру', sub: 'LPG, сферомассаж, антицеллюлит' },
      { id: 'face', name: 'Уход за лицом', sub: 'аппаратный уход' },
      { id: 'nails', name: 'Красивые руки', sub: 'маникюр и педикюр' },
      { id: 'any', name: 'Не знаю — пусть выберет сама', sub: 'сертификат на сумму' },
    ],
    budget: [
      { id: 4000, name: 'до 4 000 ₽' },
      { id: 8000, name: 'до 8 000 ₽' },
      { id: 0, name: 'Не важно' },
    ],
  },
};
