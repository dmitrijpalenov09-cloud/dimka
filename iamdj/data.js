// Концепт для IamDj®. Вещи, цены, сроки и остатки — с сайта iamdjj.ru (Tilda Store, 23.10.2026); фото с производства и розыгрыш — из канала t.me/iamddjj.
// Очередь отправки и трекинг — механика для демо. stock: null — предзаказ, 0 — sold out.
window.DJ = {
  brand: {
    name: 'IamDj®',
    motto: 'Вещи с эффектом уверенности на танцполе',
    site: 'https://iamdjj.ru',
    support: 'https://t.me/IamDjsupport',
    reviews: 'https://t.me/iamdjreview',
    channel: 'https://t.me/iamddjj',
    subs: '18,2K',
  },
  models: [
    { id: 'reverse', name: 'Reverse Zip-Hoodie', price: 7190, ship: 'pre21', cat: 'hoodie', hot: true,
      note: 'Бархатная зип-худи навыворот. Предзаказ — отправка 21 рабочий день.',
      variants: [
        { color: 'Black/Red', hex: '#B3122A', uid: '834559407492', photos: ['834559407492_0', '834559407492_1'], chart: '834559407492_2', stock: { S: 0, M: 0, L: 0, XL: 0 } },
        { color: 'Black/Red · без принта', hex: '#7E0E1F', uid: '861918629802', photos: ['861918629802_0', '861918629802_1'], chart: '861918629802_2', stock: { S: 0, M: 0, L: 0, XL: 0 } },
        { color: 'Black/Pink', hex: '#F2A0C0', uid: '264503771123', photos: ['264503771123_0', '264503771123_1'], chart: '264503771123_2', stock: null },
        { color: 'Black/Purple', hex: '#6A2C8C', uid: '848734640933', photos: ['848734640933_0', '848734640933_1'], chart: '848734640933_2', stock: null },
        { color: 'Black/White', hex: '#EDEDED', uid: '168630497512', photos: ['168630497512_0', '168630497512_1'], chart: '168630497512_2', stock: null },
      ] },
    { id: 'thermo', name: 'Thermochrome Zip-Hoodie', price: 6490, ship: 'fast', cat: 'hoodie', isNew: true,
      note: 'Меняет цвет от тепла рук. Отправка 1–3 рабочих дня.',
      variants: [{ color: 'Thermochrome', hex: '#E6A2C8', uid: '834713376832', photos: ['834713376832_1'], chart: '834713376832_2', stock: null }] },
    { id: 'suitd', name: 'Velvet Suit · Trousers double', price: 12490, ship: 'pre21', cat: 'suit',
      note: 'Костюм: зип-худи + штаны double fabric. Кофта с принтом или без.',
      variants: [{ color: 'Black/Red', hex: '#B3122A', uid: '713523498983', photos: ['713523498983_0'], chart: '713523498983_1', stock: { S: 0, M: 0, L: 0, XL: 0 } }] },
    { id: 'suitf', name: 'Velvet Suit · Trousers fabric', price: 11490, ship: 'pre21', cat: 'suit',
      note: 'Костюм: зип-худи + штаны fabric. Кофта с принтом или без.',
      variants: [{ color: 'Black/Red', hex: '#B3122A', uid: '272035955043', photos: ['272035955043_0'], chart: '272035955043_1', stock: { S: 0, M: 0, L: 0, XL: 0 } }] },
    { id: 'trd', name: 'Trousers double fabric', price: 6490, ship: 'pre14', cat: 'pants',
      note: 'Штаны с бархатным поясом. Отправка 14 рабочих дней.',
      variants: [{ color: 'Black/Red', hex: '#B3122A', uid: '371001625013', photos: ['371001625013_0', '371001625013_1'], chart: '371001625013_2', stock: null }] },
    { id: 'trp', name: 'Trousers patches', price: 5490, ship: 'pre14', cat: 'pants',
      note: 'Штаны с бархатными нашивками. Отправка 14 рабочих дней.',
      variants: [{ color: 'Black/Red', hex: '#B3122A', uid: '359838378623', photos: ['359838378623_0', '359838378623_1'], chart: '359838378623_2', stock: null }] },
    { id: 'djzip', name: 'DJ Zip-Hoodie', price: 5490, ship: 'fast', cat: 'hoodie',
      note: 'Классическая зип-худи с принтом на спине.',
      variants: [
        { color: 'Black', hex: '#141414', uid: '133798281362', photos: ['133798281362_0'], chart: '133798281362_1', stock: { S: 0, M: 0, L: 0 } },
        { color: 'White', hex: '#EDEDED', uid: '135261302432', photos: ['135261302432_0'], chart: '135261302432_1', stock: { 'One size': 0 }, old: 5490, price: 4690 },
      ] },
    { id: 'tee', name: 'DJ T-shirt', price: 2290, old: 2990, ship: 'fast', cat: 'tee',
      note: 'Футболка с принтом на спине.',
      variants: [
        { color: 'Black', hex: '#141414', uid: '337020814302', photos: ['337020814302_0'], chart: '337020814302_1', stock: { 'One size': 0 } },
        { color: 'White', hex: '#EDEDED', uid: '836135023182', photos: ['836135023182_0'], stock: { 'One size': 0 } },
      ] },
  ],
  cats: [{ id: 'all', name: 'Всё' }, { id: 'hoodie', name: 'Худи' }, { id: 'suit', name: 'Костюмы' }, { id: 'pants', name: 'Штаны' }, { id: 'tee', name: 'Футболки' }],
  // Из канала: «С понедельника начали отправлять… кофты уходят в порядке очереди»
  queue: { total: 1180, perDay: 120 },
  production: ['327_0', '327_1', '337_2', '337_1'],
  soon: { title: 'Куртки и джинсы', text: 'Покажем, как только отправим все кофты — включи уведомление, чтобы не пропустить старт.' },
  // Из поста 23.10: «Розыгрыш на 2 призовых места… Итоги 30 октября»
  giveaway: { places: 2, until: '2026-10-30T20:00:00+03:00', partner: 'MARROWS', img: '343_0' },
};
