// Концепт для «ТА студии» (Москва, Новая Башиловка, 4). Услуги, цены, длительность и мастера — из открытой онлайн-записи DIKIDI (dikidi.net/908476), 15.10.2026.
// Показана часть из 175 услуг; часы работы и свободные окна в демо — пример.
window.SALON_DATA = {
  salon: {
    name: 'ТА студия',
    tagline: 'Ногти, волосы, брови, массаж и депиляция.\n175 услуг — подберём нужную за 3 нажатия.',
    area: 'Москва, Новая Башиловка, 4 · есть парковка',
    hours: 'Ежедневно до 21:00 · после 21:00 — по двойному тарифу',
    open: 10 * 60,
    close: 21 * 60,
    phone: '+7 (916) 379-89-39',
    mapQuery: 'Москва, Новая Башиловка, 4',
    rating: '5,0 · 150 оценок',
  },

  categories: [
    { id: 'nails', name: 'Ногти', ico: '💅' },
    { id: 'hair', name: 'Волосы', ico: '✂️' },
    { id: 'brows', name: 'Брови и ресницы', ico: '👁' },
    { id: 'wax', name: 'Депиляция', ico: '🌿' },
    { id: 'massage', name: 'Массаж', ico: '💆' },
    { id: 'makeup', name: 'Макияж', ico: '💄' },
  ],

  // Вопросы подбора: шаг 2 по направлению; для волос — ещё длина
  quiz: {
    nails: [['hands', 'Руки'], ['feet', 'Ноги'], ['fix', 'Ремонт, дизайн, снятие']],
    hair: [['cut', 'Стрижка'], ['color', 'Окрашивание'], ['care', 'Уход и укладка']],
    brows: [['brows', 'Брови'], ['lashes', 'Ресницы']],
    wax: [['face', 'Лицо'], ['body', 'Тело'], ['combo', 'Комплексы — выгоднее']],
    massage: [['body', 'Всё тело'], ['face', 'Лицо'], ['back', 'Спина и шея']],
    makeup: [['all', 'Макияж']],
  },
  lengths: [['short', 'Короткие'], ['mid', 'Средние'], ['long', 'Длинные']],

  services: [
    // Ногти
    { id: 'm-cover-s', cat: 'nails', q: 'hands', name: 'Комплекс: маникюр, снятие и покрытие (S)', desc: 'Короткая длина', price: 2500, dur: 75, img: 'nails-dark', popular: true },
    { id: 'm-cover-m', cat: 'nails', q: 'hands', name: 'Комплекс: маникюр, снятие и покрытие (M)', desc: 'Средняя длина', price: 2700, dur: 90, img: 'nails-dark' },
    { id: 'm-gel-m', cat: 'nails', q: 'hands', name: 'Комплекс-гелем: маникюр, снятие, покрытие, укрепление (M)', desc: 'Средняя длина', price: 4700, dur: 120, img: 'nails-gel' },
    { id: 'm-classic', cat: 'nails', q: 'hands', name: 'Маникюр классический', desc: 'Без покрытия', price: 1500, dur: 60, img: 'nails-care' },
    { id: 'm-ext', cat: 'nails', q: 'hands', name: 'Наращивание ногтей до 2 см', desc: 'Любая форма', price: 4500, from: true, dur: 135, img: 'nails-gel' },
    { id: 'p-smart', cat: 'nails', q: 'feet', name: 'SMART-педикюр с покрытием', desc: 'Стопы и пальчики', price: 3500, dur: 75, img: 'nails-pastel', popular: true },
    { id: 'p-complex', cat: 'nails', q: 'feet', name: 'Педикюр комплекс', desc: 'Снятие, покрытие, обработка стоп и пальчиков', price: 3200, dur: 90, img: 'nails-pastel' },
    { id: 'p-nocover', cat: 'nails', q: 'feet', name: 'Педикюр без покрытия', desc: 'Обработка стоп и пальчиков', price: 2000, dur: 60, img: 'nails-care' },
    { id: 'n-design', cat: 'nails', q: 'fix', name: 'Дизайн', desc: 'Френч, лунки и любые идеи', price: 350, from: true, dur: 30, img: 'nails-art' },
    { id: 'n-repair', cat: 'nails', q: 'fix', name: 'Ремонт ногтей', desc: 'Быстро, если сломался ноготь', price: 300, from: true, dur: 20, img: 'nails-process' },
    { id: 'n-paraffin', cat: 'nails', q: 'fix', name: 'Парафинотерапия рук', desc: 'Увлажнение и уход', price: 400, dur: 30, img: 'nails-care' },

    // Волосы
    { id: 'h-cut-short', cat: 'hair', q: 'cut', len: 'short', name: 'Стрижка женская (короткие)', desc: 'Форма под черты лица', price: 1700, dur: 60, img: 'hair-styling' },
    { id: 'h-cut-mid', cat: 'hair', q: 'cut', len: 'mid', name: 'Стрижка женская (средние)', desc: 'Форма под черты лица', price: 2000, dur: 60, img: 'hair-styling', popular: true },
    { id: 'h-cut-long', cat: 'hair', q: 'cut', len: 'long', name: 'Стрижка женская (длинные)', desc: 'Форма под черты лица', price: 2500, dur: 60, img: 'hair-styling' },
    { id: 'h-hot', cat: 'hair', q: 'cut', name: 'Стрижка горячими ножницами', desc: 'Запаивает кончики', price: 3000, dur: 60, img: 'hair-blowout' },
    { id: 'h-men', cat: 'hair', q: 'cut', name: 'Стрижка мужская', desc: 'Машинка и ножницы', price: 1500, from: true, dur: 40, img: 'hair-styling' },
    { id: 'h-tone-short', cat: 'hair', q: 'color', len: 'short', name: 'Окрашивание в 1 тон (короткие)', desc: 'Тонирование', price: 4000, dur: 90, img: 'hair-waves' },
    { id: 'h-tone-mid', cat: 'hair', q: 'color', len: 'mid', name: 'Окрашивание в 1 тон (средние)', desc: 'Тонирование', price: 5000, dur: 90, img: 'hair-waves' },
    { id: 'h-tone-long', cat: 'hair', q: 'color', len: 'long', name: 'Окрашивание в 1 тон (длинные)', desc: 'Тонирование', price: 6000, dur: 90, img: 'hair-waves' },
    { id: 'h-melir-mid', cat: 'hair', q: 'color', len: 'mid', name: 'Мелирование на фольгу (средние)', desc: 'Объём и игра оттенков', price: 6500, from: true, dur: 120, img: 'hair-waves' },
    { id: 'h-balayage-mid', cat: 'hair', q: 'color', len: 'mid', name: 'Сложное окрашивание (шатуш, балаяж), средние', desc: 'Натуральные переходы', price: 9000, from: true, dur: 270, img: 'hair-waves' },
    { id: 'h-balayage-long', cat: 'hair', q: 'color', len: 'long', name: 'Сложное окрашивание (шатуш, балаяж), длинные', desc: 'Натуральные переходы', price: 12000, from: true, dur: 300, img: 'hair-waves' },
    { id: 'h-express', cat: 'hair', q: 'color', name: 'Экспресс-тонирование', desc: '15 минут — свежий цвет', price: 1500, from: true, dur: 15, img: 'hair-blowout' },
    { id: 'h-restore', cat: 'hair', q: 'care', name: 'Глубокая реставрация + стрижка горячими ножницами', desc: 'Кератин, протеины, аминокислоты', price: 10500, from: true, dur: 120, img: 'hair-wash' },
    { id: 'h-lebel', cat: 'hair', q: 'care', name: 'Уход «Счастье для волос» LEBEL', desc: 'Восстановление и блеск', price: 4000, dur: 90, img: 'hair-wash' },
    { id: 'h-style-mid', cat: 'hair', q: 'care', len: 'mid', name: 'Укладка (средние)', desc: 'С укладочными средствами', price: 1700, dur: 60, img: 'hair-blowout' },
    { id: 'h-style-long', cat: 'hair', q: 'care', len: 'long', name: 'Укладка (длинные)', desc: 'С укладочными средствами', price: 2300, dur: 75, img: 'hair-blowout' },
    { id: 'h-style-short', cat: 'hair', q: 'care', len: 'short', name: 'Укладка (короткие)', desc: 'С укладочными средствами', price: 1500, dur: 60, img: 'hair-blowout' },

    // Брови и ресницы
    { id: 'b-arch', cat: 'brows', q: 'brows', name: 'Архитектура бровей', desc: 'Подбор формы, окрашивание, коррекция, уход', price: 1600, dur: 60, img: 'brows-makeup', popular: true },
    { id: 'b-halal', cat: 'brows', q: 'brows', name: 'Брови «Халяль» — новинка', desc: 'Без выщипывания: моделирование и укладка', price: 1800, dur: 90, img: 'brows-makeup' },
    { id: 'b-lami', cat: 'brows', q: 'brows', name: 'Ламинирование бровей с коррекцией и окрашиванием', desc: 'Долговременная укладка', price: 2900, dur: 90, img: 'brows-makeup' },
    { id: 'b-henna', cat: 'brows', q: 'brows', name: 'Окрашивание бровей хной', desc: 'Стойкий цвет', price: 900, dur: 60, img: 'brows-makeup' },
    { id: 'l-lami', cat: 'brows', q: 'lashes', name: 'Ламинирование ресниц с окрашиванием', desc: 'Изгиб и цвет', price: 3000, dur: 90, img: 'brushes' },
    { id: 'l-tint', cat: 'brows', q: 'lashes', name: 'Окрашивание ресниц', desc: 'Выразительный взгляд', price: 800, dur: 30, img: 'brushes' },

    // Депиляция
    { id: 'w-face', cat: 'wax', q: 'face', name: 'Воск: верхняя губа и подбородок', desc: 'Бережно и быстро', price: 700, dur: 50, img: 'facial-care' },
    { id: 'w-cheeks', cat: 'wax', q: 'face', name: 'Воск: щёки', desc: 'Без раздражения', price: 800, dur: 45, img: 'facial-care' },
    { id: 'w-legs', cat: 'wax', q: 'body', name: 'Воск: ноги полностью', desc: 'Включая стопы и пальцы', price: 2100, dur: 90, img: 'facial-mask' },
    { id: 'w-bikini', cat: 'wax', q: 'body', name: 'Воск: глубокое бикини', desc: 'Эффект на несколько недель', price: 2000, dur: 60, img: 'facial-mask' },
    { id: 'w-arm', cat: 'wax', q: 'body', name: 'Воск: подмышечные впадины', desc: 'Быстро', price: 800, dur: 30, img: 'facial-mask' },
    { id: 'w-c1', cat: 'wax', q: 'combo', name: 'Комплекс №1: лицо, подмышки, ноги, руки, бикини', desc: 'Всё за один визит', price: 4500, dur: 155, img: 'facial-mask', popular: true },
    { id: 'w-c2', cat: 'wax', q: 'combo', name: 'Комплекс №2: глубокое бикини + подмышки', desc: 'Выгоднее, чем по отдельности', price: 2500, dur: 90, img: 'facial-mask' },
    { id: 'w-c3', cat: 'wax', q: 'combo', name: 'Комплекс №3: ноги полностью + подмышки', desc: 'Выгоднее, чем по отдельности', price: 2600, dur: 100, img: 'facial-mask' },

    // Массаж
    { id: 'ms-classic', cat: 'massage', q: 'body', name: 'Массаж классический', desc: 'Всё тело, 1 час', price: 3500, dur: 60, img: 'massage', popular: true },
    { id: 'ms-lymph', cat: 'massage', q: 'body', name: 'Лимфодренажный массаж', desc: 'Уходят отёки, тело подтянутое', price: 3500, dur: 60, img: 'massage' },
    { id: 'ms-sculpt', cat: 'massage', q: 'body', name: 'Скульптурирующий массаж (авторская методика)', desc: 'Контуры, отёчность, мышечные зажимы', price: 5500, dur: 90, img: 'massage' },
    { id: 'ms-anticell', cat: 'massage', q: 'body', name: 'Антицеллюлитный массаж', desc: 'Ручная техника', price: 4500, dur: 60, img: 'massage' },
    { id: 'ms-face', cat: 'massage', q: 'face', name: 'Массаж лица', desc: 'Минус отёки, плюс тонус', price: 2300, dur: 30, img: 'facial-care' },
    { id: 'ms-combo', cat: 'massage', q: 'face', name: 'Классический массаж + массаж лица', desc: 'Полная перезагрузка', price: 5000, dur: 90, img: 'massage' },
    { id: 'ms-back', cat: 'massage', q: 'back', name: 'Массаж спины', desc: 'Классический, 30 минут', price: 2000, dur: 30, img: 'massage' },
    { id: 'ms-neck', cat: 'massage', q: 'back', name: 'Шейно-воротниковая зона', desc: 'Снимает напряжение после работы', price: 1500, dur: 20, img: 'massage' },

    // Макияж
    { id: 'mk-day', cat: 'makeup', q: 'all', name: 'Макияж дневной', desc: 'Запись — на следующий рабочий день мастера', price: 1500, dur: 90, img: 'brushes' },
    { id: 'mk-evening', cat: 'makeup', q: 'all', name: 'Вечерний макияж', desc: 'Запись — на следующий рабочий день мастера', price: 2500, dur: 120, img: 'brushes' },
  ],

  // Имена и рейтинги — как в онлайн-записи салона
  masters: [
    { id: 'alina', name: 'Алина', nameTo: 'Алине', role: 'Мастер ногтевого сервиса', ico: '💅', rating: 5.0, reviews: 10, cats: ['nails'] },
    { id: 'vlada', name: 'Влада', nameTo: 'Владе', role: 'Мастер ногтевого сервиса', ico: '💅', rating: 5.0, reviews: 1, cats: ['nails'] },
    { id: 'tatiana-h', name: 'Татьяна', nameTo: 'Татьяне', role: 'Стилист-парикмахер', ico: '✂️', rating: 5.0, reviews: 28, cats: ['hair'] },
    { id: 'elena', name: 'Елена', nameTo: 'Елене', role: 'Стилист-парикмахер', ico: '✂️', rating: 5.0, reviews: 7, cats: ['hair'] },
    { id: 'diana', name: 'Диана', nameTo: 'Диане', role: 'Парикмахер', ico: '✂️', rating: 5.0, reviews: 1, cats: ['hair'] },
    { id: 'maria', name: 'Мария', nameTo: 'Марии', role: 'Бровист, визажист, мастер депиляции', ico: '👁', rating: 5.0, reviews: 16, cats: ['brows', 'wax', 'makeup'] },
    { id: 'tatiana-m', name: 'Татьяна', nameTo: 'Татьяне', role: 'Массажист', ico: '💆', rating: 5.0, reviews: 23, cats: ['massage'] },
  ],

  promos: [
    { title: 'Абонемент на массаж 10 + 1', text: 'Купите 10 сеансов — 11-й в подарок', img: 'massage' },
    { title: 'Брови «Халяль» — новинка', text: 'Без выщипывания, 1 800 ₽', img: 'brows-makeup' },
    { title: 'Депиляция: комплекс №1', text: 'Лицо, подмышки, ноги, руки, бикини — 4 500 ₽', img: 'facial-mask' },
  ],
};
