// Данные клиники — с сайта obshestvo-chistyh-lits.ru (цены на 20.10.2026).
// В рабочей версии каталог и продажа сертификатов идут через YCLIENTS клиники.
window.OCHL = {
  clinic: {
    name: 'Общество Чистых Лиц',
    address: 'Аптекарский проспект, 18А',
    phone: '+7 995 597-99-01',
    phoneRaw: '+79955979901',
    license: 'Л041-01148-78/00347910',
    booking: 'https://n797585.yclients.com/company/748226/personal/menu?o=',
    certificates: 'https://o8174.yclients.com/certificates',
    channel: 'https://t.me/Obschestvo_Chistyh_lits',
    mapQuery: 'Санкт-Петербург, Аптекарский проспект, 18А',
  },

  amounts: [3000, 5000, 7000, 10000, 15000, 20000],

  cats: [
    { id: 'care', name: 'Уход и чистки' },
    { id: 'hw', name: 'Аппаратные' },
    { id: 'laser', name: 'Лазерная эпиляция' },
    { id: 'consult', name: 'Консультация' },
  ],

  // goals — для подбора: clean · glow · lift · smooth
  procs: [
    { id: 'hydra', cat: 'care', goals: ['clean', 'glow'], name: 'Hydra Touch H2', price: 6500, hit: true,
      text: 'Вакуумная чистка, гидропилинг с двумя сыворотками, микротоки. Без уколов и безболезненно. Программа на выбор: очищение, увлажнение, омоложение или анти-акне.' },
    { id: 'holy', cat: 'care', goals: ['clean'], name: 'Чистка лица · Holy Land', price: 6800,
      text: 'Глубокое очищение пор на косметике Holy Land. Инструменты стерилизуются в автоклаве.' },
    { id: 'uclean', cat: 'care', goals: ['clean'], name: 'Чистка лица · Ultraceuticals', price: 8300,
      text: 'Чистка на австралийской космецевтике Ultraceuticals.' },
    { id: 'hydrate', cat: 'care', goals: ['glow'], name: 'Интенсивное увлажнение', price: 8100, hit: true,
      text: 'Уход Ultraceuticals для обезвоженной кожи — то, что нужно зимой.' },
    { id: 'bright', cat: 'care', goals: ['glow'], name: 'Мгновенное осветление', price: 8100,
      text: 'Уход для ровного тона и сияния кожи — к праздникам.' },
    { id: 'massage', cat: 'care', goals: ['lift', 'glow'], name: 'Авторский уход с массажем', price: 8100, hit: true,
      text: 'Уход с массажем лица от Ларисы Петровны Пташкиной.' },
    { id: 'm22', cat: 'hw', goals: ['glow'], name: 'Фототерапия M22 · лицо', price: 12900,
      text: 'Светотерапия для более ровного тона и текстуры кожи. Курс — 1–3 процедуры.' },
    { id: 'inus', cat: 'hw', goals: ['lift'], name: 'RF-лифтинг INUS · зона глаз', price: 18300,
      text: 'Вакуумно-микроигольчатый RF-лифтинг. Не требует долгого восстановления.' },
    { id: 'epbp', cat: 'laser', goals: ['smooth'], name: 'Лазерная эпиляция · бикини + подмышки', price: 4300,
      text: 'Гибридный лазер MBT Honor ICE (диодный + александритовый).' },
    { id: 'epall', cat: 'laser', goals: ['smooth'], name: 'Лазерная эпиляция · всё тело', price: 8600,
      text: 'Ноги полностью, руки, тотальное бикини, подмышки и одна малая зона.' },
    { id: 'consult', cat: 'consult', goals: [], name: 'Консультация косметолога', price: 2900,
      text: 'Врач разберёт состояние кожи, подберёт процедуры и домашний уход.' },
  ],

  covers: [
    { id: 'winter', name: 'Зимний вечер' },
    { id: 'paper', name: 'Чистый лист' },
    { id: 'powder', name: 'Пудра' },
    { id: 'graphite', name: 'Графит' },
  ],

  wishes: [
    'С Новым годом! Пусть кожа сияет так же, как ты ✨',
    'Это время — только для тебя. Отдыхай и ни о чём не думай',
    'Спасибо, что ты рядом ❤️',
    'С днём рождения! Сияй',
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
      { id: 'clean', name: 'Чистая кожа', sub: 'чистки, очищение пор' },
      { id: 'glow', name: 'Сияние и увлажнение', sub: 'уходы, светотерапия' },
      { id: 'lift', name: 'Подтянутость', sub: 'массаж, RF-лифтинг' },
      { id: 'smooth', name: 'Гладкость', sub: 'лазерная эпиляция' },
      { id: 'any', name: 'Не знаю — пусть выберет сама', sub: 'сертификат на сумму' },
    ],
    budget: [
      { id: 7000, name: 'до 7 000 ₽' },
      { id: 15000, name: 'до 15 000 ₽' },
      { id: 0, name: 'Не важно' },
    ],
  },
};
