// Контент демо-салона. Под реального клиента меняется только этот файл и фото в img/.
window.SALON_DATA = {
  salon: {
    name: 'Velvet Room',
    tagline: 'Маникюр, волосы, брови и уход.\nЗапись за 30 секунд — прямо в Telegram.',
    area: 'Центр Петербурга · м. Достоевская',
    hours: 'Ежедневно 10:00–22:00',
    open: 10 * 60,
    close: 22 * 60,
    phone: '+7 (900) 000-00-00',
    mapQuery: 'Санкт-Петербург, метро Достоевская',
  },

  categories: [
    { id: 'nails', name: 'Ногти' },
    { id: 'hair', name: 'Волосы' },
    { id: 'brows', name: 'Брови и макияж' },
    { id: 'care', name: 'Уход' },
  ],

  services: [
    { id: 'mani-gel', cat: 'nails', name: 'Маникюр с покрытием', desc: 'Аппаратный, выравнивание, гель-лак', price: 2400, dur: 90, img: 'nails-dark', popular: true },
    { id: 'mani-design', cat: 'nails', name: 'Маникюр с дизайном', desc: 'Покрытие и дизайн на все ногти', price: 3200, dur: 120, img: 'nails-art' },
    { id: 'nail-ext', cat: 'nails', name: 'Наращивание', desc: 'Любая длина и форма', price: 3500, from: true, dur: 150, img: 'nails-gel' },
    { id: 'pedi', cat: 'nails', name: 'Педикюр SMART', desc: 'С покрытием гель-лаком', price: 2900, dur: 90, img: 'nails-pastel' },
    { id: 'nail-care', cat: 'nails', name: 'Снятие и уход', desc: 'Без покрытия, массаж рук', price: 900, dur: 40, img: 'nails-care' },

    { id: 'haircut', cat: 'hair', name: 'Стрижка и укладка', desc: 'Консультация, мытьё, стрижка, укладка', price: 2800, dur: 60, img: 'hair-styling', popular: true },
    { id: 'blowout', cat: 'hair', name: 'Укладка', desc: 'Брашинг или локоны', price: 1800, dur: 45, img: 'hair-blowout' },
    { id: 'color', cat: 'hair', name: 'Окрашивание', desc: 'Тон в тон или сложное, уход в подарок', price: 5500, from: true, dur: 180, img: 'hair-waves' },
    { id: 'hair-spa', cat: 'hair', name: 'SPA-уход для волос', desc: 'Глубокое восстановление', price: 2500, dur: 60, img: 'hair-wash' },

    { id: 'brows', cat: 'brows', name: 'Архитектура бровей', desc: 'Коррекция и окрашивание', price: 1600, dur: 45, img: 'brows-makeup', popular: true },
    { id: 'brow-lami', cat: 'brows', name: 'Ламинирование бровей', desc: 'Долговременная укладка, 6–8 недель', price: 2200, dur: 60, img: 'brows-makeup' },
    { id: 'makeup', cat: 'brows', name: 'Вечерний макияж', desc: 'Стойкий макияж для события', price: 3500, dur: 60, img: 'brushes' },

    { id: 'facial', cat: 'care', name: 'Уходовая чистка лица', desc: 'Очищение, маска, массаж', price: 4200, dur: 75, img: 'facial-care' },
    { id: 'mask', cat: 'care', name: 'Альгинатная маска', desc: 'Увлажнение и сияние', price: 1900, dur: 40, img: 'facial-mask' },
  ],

  masters: [
    { id: 'alina', name: 'Алина', nameTo: 'Алине', role: 'Топ-мастер маникюра', exp: '7 лет', rating: 4.9, reviews: 212, photo: 'master-alina', cats: ['nails'], works: ['nails-dark', 'nails-art', 'nails-pastel'] },
    { id: 'maria', name: 'Мария', nameTo: 'Марии', role: 'Колорист, стилист', exp: '5 лет', rating: 4.8, reviews: 156, photo: 'master-maria', cats: ['hair'], works: ['hair-waves', 'hair-styling', 'hair-blowout'] },
    { id: 'eva', name: 'Ева', nameTo: 'Еве', role: 'Бровист, визажист', exp: '4 года', rating: 5.0, reviews: 98, photo: 'master-eva', cats: ['brows'], works: ['brows-makeup', 'brushes', 'facial-mask'] },
    { id: 'sofia', name: 'София', nameTo: 'Софии', role: 'Косметолог, мастер маникюра', exp: '6 лет', rating: 4.9, reviews: 131, photo: 'master-sofia', cats: ['care', 'nails'], works: ['facial-care', 'facial-mask', 'nails-care'] },
  ],

  promos: [
    { title: '−20% на первый визит', text: 'Для новых гостей на любую услугу', img: 'interior' },
    { title: 'Маникюр + педикюр', text: 'Комплекс за 3 900 ₽ вместо 5 300 ₽', img: 'nails-process' },
    { title: 'Приведи подругу', text: '−500 ₽ вам обеим', img: 'hair-waves' },
  ],
};
