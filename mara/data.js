// Концепт для салона Mara. (СПб, Авиационная ул., 18). Услуги, цены, уровни мастеров и спецпредложения —
// из открытой онлайн-записи YCLIENTS (n338865, филиал 324769) и канала @marasalonspb, 16.10.2026.
// Свободные окошки и часы работы в демо — пример.
window.KOMNATA = {
  salon: {
    name: 'Mara.',
    tagline: 'Колористы, стрижки и SPA-уходы для волос.\n1 минута от м. Московская.',
    address: 'Авиационная ул., 18',
    metro: '1 минута от м. Московская',
    mapQuery: 'Санкт-Петербург, Авиационная улица, 18',
    rating: '4,9 · 275 отзывов в 2ГИС',
    open: 11 * 60,
    close: 22 * 60,
  },

  branches: [
    { id: 'cut', name: 'Стрижки', ico: '✂️', note: 'Стрижки, камуфляж седины', img: 'hair-styling', slotLabel: 'Стрижка / тонирование / уход' },
    { id: 'color', name: 'Окрашивание', ico: '🎨', note: 'Тон, контуринг, airtouch, балаяж', img: 'hair-waves', slotLabel: 'Сложное окрашивание', feedDur: 300 },
    { id: 'care', name: 'Уход и SPA', ico: '✨', note: 'TOKIO INKARAMI, LE LUMISS, LEBEL, AVEDA', img: 'hair-wash', slotLabel: 'SPA-уход для волос' },
  ],

  services: [
    { id: 'cut-basic', branch: 'cut', group: 'Стрижки', name: 'Стрижка базовая', desc: 'Кончики по контуру, чёлка, стрижка на сухие волосы', img: 'hair-blowout',
      options: [{ label: 'Юниор-стилист', price: 1500, dur: 90 }] },
    { id: 'cut', branch: 'cut', group: 'Стрижки', name: 'Стрижка', desc: 'Создание или изменение формы, слои, проработка густоты', img: 'hair-styling', popular: true,
      options: [{ label: 'Юниор-стилист', price: 2000, dur: 90 }, { label: 'Стилист', price: 2750, dur: 90 }, { label: 'Топ-стилист', price: 4000, dur: 90 }] },
    { id: 'cut-men', branch: 'cut', group: 'Стрижки', name: 'Мужская стрижка', desc: 'У топ-стилиста', img: 'hair-styling',
      options: [{ label: 'Топ-стилист', price: 3000, dur: 60 }] },
    { id: 'gray', branch: 'cut', group: 'Стрижки', name: 'Камуфляж мужской седины', desc: 'Деликатно маскирует седину', img: 'hair-blowout',
      options: [{ label: 'Юниор-стилист', price: 3000, dur: 90 }, { label: 'Стилист', price: 3500, dur: 90 }, { label: 'Топ-стилист', price: 4000, dur: 60 }] },

    { id: 'tone', branch: 'color', group: 'Тон и тонирование', name: 'Тонирование', desc: 'Полуперманентный краситель', img: 'hair-waves', from: true, popular: true,
      options: [{ label: 'Young-стилист', price: 5500, dur: 150 }, { label: 'Стилист', price: 6500, dur: 120 }, { label: 'Топ-стилист', price: 7500, dur: 120 }] },
    { id: 'color-tone', branch: 'color', group: 'Тон и тонирование', name: 'Окрашивание в тон', desc: 'Стойкое окрашивание', img: 'hair-waves', from: true,
      options: [{ label: 'Young-стилист', price: 6500, dur: 180 }, { label: 'Стилист', price: 7500, dur: 180 }, { label: 'Топ-стилист', price: 8500, dur: 180 }] },
    { id: 'contour', branch: 'color', group: 'Сложные техники', name: 'Контуринг', desc: 'Рассветление прядей у лица + тонирование длины', img: 'hair-waves', from: true,
      options: [{ label: 'Young-стилист', price: 8500, dur: 210 }, { label: 'Стилист', price: 9500, dur: 210 }, { label: 'Топ-стилист', price: 11500, dur: 210 }, { label: 'Ведущий колорист', price: 13500, dur: 210 }] },
    { id: 'complex', branch: 'color', group: 'Сложные техники', name: 'Сложное окрашивание', desc: 'Shatush, airtouch, балаяж, мелирование', img: 'hair-waves', from: true, popular: true,
      options: [{ label: 'Young-стилист', price: 11500, dur: 330 }, { label: 'Стилист', price: 14500, dur: 330 }, { label: 'Топ-стилист', price: 15500, dur: 300 }, { label: 'Ведущий колорист', price: 18500, dur: 270 }] },
    { id: 'out-blond', branch: 'color', group: 'Сложные техники', name: '«Выход из блонда»', desc: 'Двойное тонирование под натуральный корень', img: 'hair-waves', from: true,
      options: [{ label: 'Стилист', price: 9500, dur: 210 }, { label: 'Топ-стилист', price: 10500, dur: 150 }] },

    { id: 'happy', branch: 'care', group: 'Восстановление', name: 'LEBEL «Абсолютное счастье для волос»', desc: '11 этапов ухода на молекулярном уровне', img: 'hair-wash', popular: true,
      options: [{ label: 'FIX на любую длину', price: 6500, dur: 90 }] },
    { id: 'tokio', branch: 'care', group: 'Восстановление', name: 'SPA-ритуал TOKIO INKARAMI', desc: 'Восстановление структуры волоса до глубоких слоёв', img: 'hair-wash', from: true,
      options: [{ label: 'Процедура', price: 10500, dur: 90 }] },
    { id: 'lumiss', branch: 'care', group: 'Восстановление', name: 'LE LUMISS — японское восстановление', desc: 'Гладкость, плотность и блеск после первой процедуры', img: 'hair-wash', from: true,
      options: [{ label: 'Процедура', price: 10500, dur: 90 }] },
    { id: 'aveda', branch: 'care', group: 'Восстановление', name: 'AVEDA Botanical Repair', desc: 'Специальная цена (обычно 6 500 ₽)', img: 'hair-blowout',
      options: [{ label: 'Процедура', price: 3800, dur: 90 }] },
    { id: 'davines', branch: 'care', group: 'Уходы', name: 'Хелатирующий уход DAVINES — новинка', desc: 'Очищает от жёсткой воды, готовит к окрашиванию', img: 'hair-wash',
      options: [{ label: 'Процедура', price: 4000, dur: 60 }] },
    { id: 'scalp', branch: 'care', group: 'Уходы', name: 'AVEDA Scalp Therapy', desc: 'Спа-уход для кожи головы', img: 'hair-wash',
      options: [{ label: 'Процедура', price: 5000, dur: 60 }] },
    { id: 'olaplex', branch: 'care', group: 'Уходы', name: 'OLAPLEX во время окрашивания', desc: 'Защита волос при осветлении', img: 'hair-blowout',
      options: [{ label: 'Процедура', price: 3500, dur: 30 }] },
  ],

  // В этом салоне дизайнов ногтей нет — оставляем пустой список для шаблона
  designs: [{ id: 'none', name: 'Без дизайна', price: 0, dur: 0 }],
  drinks: [],

  specials: [
    { title: 'FIX 6 500 ₽ — «Абсолютное счастье»', text: '11-этапный уход LEBEL на любую длину и густоту', svc: 'happy', img: 'hair-wash' },
    { title: 'AVEDA Botanical Repair — 3 800 ₽', text: 'SOS-восстановление после окрашивания по специальной цене', svc: 'aveda', img: 'hair-blowout' },
    { title: 'Сложное окрашивание у ведущего колориста', text: 'Airtouch, балаяж, shatush — от 18 500 ₽', svc: 'complex', img: 'hair-waves' },
  ],
  newClient: { title: 'Скидка на первую запись', text: 'Например, −10% на все новые записи, как в ваших постах. Включается и выключается в админке за минуту.' },
};
