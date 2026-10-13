(() => {
  'use strict';

  const D = window.LB;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (name) => `img/${name}.jpg`;
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const fmtDay = (k) => { const d = parseKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${d.toLocaleString('ru-RU', { month: 'short' }).replace('.', '')}`; };
  const ALL = [...D.items, ...D.dayDeals];
  const item = (id) => ALL.find((x) => x.id === id);

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready();
    tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#180F1F'); tg.setBackgroundColor('#140D1A'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#140D1A');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Корзина и заказы (демо: на устройстве; заказы — ещё и в облаке Telegram) ─
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* живём в памяти */ } };
  let cart = load('labuket_cart', []);
  let orders = load('labuket_orders', []);
  const saveCart = () => { store('labuket_cart', cart); updateBadge(); };
  const saveOrders = () => { store('labuket_orders', orders); if (tgAtLeast('6.9')) tg.CloudStorage.setItem('labuket_orders', JSON.stringify(orders), () => {}); };
  if (tgAtLeast('6.9')) {
    tg.CloudStorage.getItem('labuket_orders', (err, val) => {
      if (err || !val) return;
      try { const c = JSON.parse(val); if (Array.isArray(c) && c.length >= orders.length) { orders = c; if (state.tab === 'orders' && !state.item && !state.checkout) render(); } } catch { /* игнор */ }
    });
  }
  const inCart = (id) => cart.find((l) => l.id === id);
  const cartSum = () => cart.reduce((s, l) => s + item(l.id).price * l.qty, 0);
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
  // Бесплатно от порога; ниже — тариф магазина (в концепте не знаем его, поэтому не придумываем цифру)
  const delivery = (sum) => (sum >= D.shop.freeFrom ? 0 : null);
  const delivText = (sum) => (delivery(sum) === 0 ? 'бесплатно' : 'по тарифу магазина');
  const totalText = (sum) => rub(sum) + (delivery(sum) === null ? ' + доставка' : '');
  function addToCart(id) { const l = inCart(id); if (l) l.qty += 1; else cart.push({ id, qty: 1 }); saveCart(); haptic.ok(); }

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'home', cat: 'all', price: 'all', item: null, checkout: false, done: null, form: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');

  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      tg.MainButton.setParams({ text, color: enabled ? '#F08DC8' : '#3A2848', text_color: enabled ? '#1B0B22' : '#B09BBE', is_active: enabled, is_visible: true });
    } else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.disabled = !enabled; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);
  const setBack = (v) => { if (inTG) { if (v) tg.BackButton.show(); else tg.BackButton.hide(); } };
  if (inTG) tg.BackButton.onClick(() => goBack());

  function render(soft = false) {
    const sub = !!(state.item || state.checkout);
    tabs.hidden = sub;
    view.classList.toggle('no-tabs', sub);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(sub || !!state.done);
    const html = state.item ? renderItem() : state.checkout ? renderCheckout() : state.done ? renderDone()
      : ({ home: renderHome, catalog: renderCatalog, cart: renderCart, orders: renderOrders })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    after();
  }

  function goBack() {
    if (state.item) state.item = null;
    else if (state.checkout) { state.checkout = false; state.tab = 'cart'; }
    else if (state.done) { state.done = null; state.tab = 'orders'; }
    haptic.tap(); render();
  }

  const card = (x) => `<button type="button" class="card" data-act="item" data-id="${x.id}">
      ${x.sale ? '<span class="flag sale">акция</span>' : x.hit ? '<span class="flag">хит</span>' : ''}
      <img src="${img(x.img)}" alt="" loading="lazy">
      <div class="in"><div class="nm">${esc(x.name)}</div>
      <div class="row"><span class="price">${rub(x.price)}</span><span class="add ${inCart(x.id) ? 'in-cart' : ''}" data-act="add" data-id="${x.id}">${inCart(x.id) ? '✓' : '+'}</span></div></div></button>`;

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = tgUser && tgUser.first_name ? `, ${esc(tgUser.first_name)}` : '';
    return `<div class="muted" style="margin-bottom:10px">${hello}${name} 💜</div>
      <section class="hero"><img src="${img('hero')}" alt="">
        <span class="tag">Цветы · Петербург</span><h1>${esc(D.shop.name)}</h1><p>${esc(D.shop.tagline)}</p>
        <button type="button" class="btn" data-act="tab" data-id="catalog">Выбрать букет</button></section>
      <div class="perks"><div class="perk"><b>${D.shop.years} лет</b>на рынке</div><div class="perk"><b>от ${rub(D.shop.freeFrom).replace(' ₽', '')} ₽</b>доставка бесплатно</div><div class="perk"><b>каждый день</b>свежие поставки</div></div>
      <div class="h3">Гиганты дня по акции 🔥</div>
      <div class="hscroll">${D.dayDeals.map(card).join('')}</div>
      <div class="h3">Хиты <button type="button" data-act="tab" data-id="catalog">весь каталог</button></div>
      <div class="hscroll">${D.items.filter((x) => x.hit).map(card).join('')}</div>
      <div class="h3">Сегодня поехали</div>
      ${D.feed.map((f) => `<div class="feed"><img src="${img(f.img)}" alt="" loading="lazy"><div class="body">${esc(f.text)} — <span class="price">${rub(f.price)}</span><div class="muted">🚚 ${esc(f.where)}</div></div></div>`).join('')}
      <div class="h3">Магазин</div>
      <section class="feed" style="display:block"><b>${esc(D.shop.address)}</b><div class="muted">${esc(D.shop.hours)} · воскресенье — выходной</div>
        <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="chat">Написать флористу</button></div></section>
      <p class="footnote">Концепт приложения для LaBuket. Цены — из постов канала магазина.<br>Фото — Unsplash, в приложении будут ваши.</p>`;
  }

  // ── Каталог ──────────────────────────────────────────
  const PRICES = [['all', 'Любая цена'], ['lt5', 'до 5 000'], ['5to15', '5–15 тыс.'], ['gt15', 'от 15 тыс.']];
  const priceOk = (p) => state.price === 'all' || (state.price === 'lt5' && p <= 5000) || (state.price === '5to15' && p > 5000 && p <= 15000) || (state.price === 'gt15' && p > 15000);
  function renderCatalog() {
    const list = ALL.filter((x) => (state.cat === 'all' || x.cat.includes(state.cat)) && priceOk(x.price)).sort((a, b) => a.price - b.price);
    return `<h1 class="title">Каталог</h1>
      <div class="chips">${D.cats.map((c) => `<button type="button" class="chip ${c.id === state.cat ? 'on' : ''}" data-act="cat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
      <div class="chips">${PRICES.map(([id, n]) => `<button type="button" class="chip ${id === state.price ? 'on' : ''}" data-act="price" data-id="${id}">${n}</button>`).join('')}</div>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">По этим фильтрам букетов нет</div>'}`;
  }

  // ── Букет ────────────────────────────────────────────
  function renderItem() {
    const x = item(state.item);
    return `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <img class="pimg" src="${img(x.img)}" alt="">
      <h1 class="title" style="margin-bottom:6px">${esc(x.name)}</h1>
      <div class="price" style="font-size:22px">${rub(x.price)}</div>
      <p class="muted" style="margin-top:8px;font-size:14px">${esc(x.text)}</p>
      ${x.price >= D.shop.freeFrom ? '<div class="note ok">🚚 Доставка по Петербургу — бесплатно</div>' : ''}
      <div class="note">📸 Перед отправкой флорист пришлёт фото именно вашего букета — прямо в этот чат</div>
      <div class="muted">🤫 Возможна анонимная доставка · 💌 открытка с вашим текстом</div>`;
  }

  // ── Корзина ──────────────────────────────────────────
  function freeBar(sum) {
    const left = D.shop.freeFrom - sum;
    return `<div class="progress">${left > 0 ? `Ещё <b>${rub(left)}</b> — и доставка бесплатно` : '🚚 Доставка бесплатно!'}<div class="bar"><i style="width:${Math.min(100, Math.round(100 * sum / D.shop.freeFrom))}%"></i></div></div>`;
  }
  function renderCart() {
    if (!cart.length) return `<h1 class="title">Корзина</h1><div class="empty">Пока пусто.<br>Загляните в «Гиганты дня» — там акции.</div><div style="height:14px"></div><button type="button" class="btn" data-act="tab" data-id="catalog">В каталог</button>`;
    const sum = cartSum();
    return `<h1 class="title">Корзина</h1>
      ${cart.map((l) => { const x = item(l.id); return `<div class="line"><img src="${img(x.img)}" alt=""><div class="body">${esc(x.name)}<div class="price">${rub(x.price * l.qty)}</div></div>
        <div class="qty"><button type="button" data-act="dec" data-id="${x.id}">−</button><b>${l.qty}</b><button type="button" data-act="inc" data-id="${x.id}">+</button></div></div>`; }).join('')}
      ${freeBar(sum)}
      <div class="sum"><div class="row"><span>Букеты</span><span>${rub(sum)}</span></div><div class="row"><span>Доставка</span><span>${delivText(sum)}</span></div>
        <div class="row total"><span>Итого</span><span>${totalText(sum)}</span></div></div>
      <div style="height:14px"></div><button type="button" class="btn" data-act="checkout">Оформить доставку · ${totalText(sum)}</button>`;
  }

  // ── Оформление ───────────────────────────────────────
  const dayOptions = () => { const out = []; const d = new Date(); for (let i = 0; i < 7; i++) { if (d.getDay() !== 0) out.push(dateKey(d)); d.setDate(d.getDate() + 1); } return out; };
  const slotFree = (dKey, slot) => { if (dKey !== dateKey(new Date())) return true; const start = Number(slot.slice(0, 2)); return new Date().getHours() + 2 <= start; };

  function renderCheckout() {
    const f = state.form; const sum = cartSum();
    const days = dayOptions();
    if (!days.includes(f.date)) f.date = days.find((k) => D.slots.some((s) => slotFree(k, s))) || days[0];
    if (f.slot && !slotFree(f.date, f.slot)) f.slot = null;
    const label = (k, i) => (k === dateKey(new Date()) ? 'Сегодня' : i <= 1 && k === dateKey(new Date(Date.now() + 864e5)) ? 'Завтра' : fmtDay(k));
    return `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <h1 class="title">Доставка</h1>
      <div class="h3" style="margin-top:0">Когда</div>
      <div class="chips">${days.map((k, i) => `<button type="button" class="chip ${k === f.date ? 'on' : ''}" data-act="date" data-id="${k}">${label(k, i)}</button>`).join('')}</div>
      <div class="chips wrap">${D.slots.map((s) => slotFree(f.date, s) ? `<button type="button" class="chip ${s === f.slot ? 'on' : ''}" data-act="slot" data-id="${s}">${s}</button>` : '').join('') || '<span class="muted">На сегодня интервалы закончились — выберите другой день</span>'}</div>
      <div class="h3">Кому</div>
      <label class="field"><span>Имя получателя</span><input id="f-rname" value="${esc(f.rname)}" placeholder="Например, Мария"></label>
      <label class="field"><span>Телефон получателя</span><input id="f-rphone" type="tel" inputmode="tel" value="${esc(f.rphone)}" placeholder="+7 900 000-00-00"></label>
      <label class="field"><span>Адрес доставки</span><input id="f-addr" value="${esc(f.addr)}" placeholder="Улица, дом, квартира"></label>
      <label class="field"><span>Текст открытки (необязательно)</span><textarea id="f-card" placeholder="С днём рождения! ❤️">${esc(f.card)}</textarea></label>
      <label class="toggle"><span>🤫 Анонимно — не называть отправителя</span><input type="checkbox" id="f-anon" ${f.anon ? 'checked' : ''}></label>
      <div class="h3">От кого</div>
      <label class="field"><span>Ваше имя</span><input id="f-name" value="${esc(f.name)}" placeholder="Как к вам обращаться"></label>
      ${inTG ? '<div class="note">💬 Ваш номер не нужен: подтверждение и фото букета придут сюда, в Telegram</div>'
        : '<label class="field"><span>Ваш телефон</span><input id="f-phone" type="tel" inputmode="tel" value="' + esc(f.phone) + '" placeholder="+7 900 000-00-00"></label>'}
      <label class="consent"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''}><span>Согласен(на) на обработку персональных данных</span></label>
      <div class="sum" style="margin-top:8px"><div class="row"><span>Букеты</span><span>${rub(sum)}</span></div><div class="row"><span>Доставка</span><span>${delivText(sum)}</span></div>
        <div class="row total"><span>Итого</span><span>${totalText(sum)}</span></div></div>
      <p class="muted" style="margin-top:8px">Оплата — после подтверждения флористом. В рабочей версии: онлайн-оплата картой или СБП.</p>`;
  }

  const formOk = (f) => f.slot && f.rname.trim().length >= 2 && f.rphone.replace(/\D/g, '').length >= 10 && f.addr.trim().length >= 5 && f.name.trim().length >= 2 && (inTG || f.phone.replace(/\D/g, '').length >= 10) && f.consent;

  function after() {
    if (state.item) {
      const x = item(state.item); const l = inCart(x.id);
      setCTA(l ? `В корзине (${l.qty}) — перейти` : `В корзину · ${rub(x.price)}`, true, () => {
        if (l) { state.item = null; state.tab = 'cart'; haptic.tap(); render(); } else { addToCart(x.id); toast('Добавили в корзину 💜'); render(true); }
      });
    } else if (state.checkout) {
      const f = state.form;
      const ids = ['rname', 'rphone', 'addr', 'card', 'name'].concat(inTG ? [] : ['phone']);
      const sync = () => {
        ids.forEach((k) => { f[k] = $(`#f-${k}`).value; });
        f.anon = $('#f-anon').checked; f.consent = $('#f-consent').checked;
        setCTA(`Оформить заказ · ${totalText(cartSum())}`, formOk(f), submit);
      };
      ids.forEach((k) => $(`#f-${k}`).addEventListener('input', sync));
      ['#f-anon', '#f-consent'].forEach((s) => $(s).addEventListener('change', sync));
      sync();
    }
  }

  function submit() {
    const f = state.form; if (!formOk(f)) { haptic.warn(); return; }
    const sum = cartSum();
    const order = { id: 'LB-' + String(Date.now()).slice(-5), created: Date.now(), date: f.date, slot: f.slot, items: cart.map((l) => ({ id: l.id, qty: l.qty, price: item(l.id).price })),
      sum, delivery: delivery(sum), total: sum, rname: f.rname.trim(), addr: f.addr.trim(), card: f.card.trim(), anon: f.anon };
    orders.unshift(order); saveOrders();
    cart = []; saveCart(); haptic.ok();
    state.done = order.id; state.checkout = false; state.form = null; state.tab = 'orders';
    render();
  }

  // ── Заказы ───────────────────────────────────────────
  const STEPS = ['Принят', 'Собираем', 'В пути', 'Доставлен'];
  function stepOf(o) {
    const today = dateKey(new Date());
    if (o.date < today) return 3;
    if (o.date > today) return 0;
    const h = new Date().getHours(); const start = Number(o.slot.slice(0, 2)); const end = Number(o.slot.slice(6, 8));
    return h < start - 1 ? 1 : h < end ? 2 : 3;
  }
  function orderCard(o) {
    const st = stepOf(o);
    return `<div class="order"><div style="display:flex;justify-content:space-between"><b>Заказ ${esc(o.id)}</b><span class="price">${rub(o.total)}${o.delivery === null ? ' + доставка' : ''}</span></div>
      <div class="muted">${o.items.map((l) => `${esc(item(l.id).name)}${l.qty > 1 ? ' ×' + l.qty : ''}`).join(', ')}</div>
      <div class="muted">🚚 ${fmtDay(o.date)}, ${esc(o.slot)} · ${esc(o.rname)}${o.anon ? ' · анонимно' : ''}</div>
      <div class="steps">${STEPS.map((_, i) => `<span class="${i <= st ? 'on' : ''}"></span>`).join('')}</div>
      <div class="st-labels">${STEPS.map((s, i) => (i === st ? `<b>${s}</b>` : `<span>${s}</span>`)).join('')}</div>
      <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="repeat" data-id="${esc(o.id)}">Повторить заказ</button></div></div>`;
  }
  function renderOrders() {
    if (!orders.length) return `<h1 class="title">Заказы</h1><div class="empty">Заказов пока нет.<br>Здесь будет статус доставки и кнопка «Повторить» — удобно к праздникам.</div>`;
    return `<h1 class="title">Заказы</h1>${orders.map(orderCard).join('')}`;
  }
  function renderDone() {
    const o = orders.find((x) => x.id === state.done);
    if (!o) { state.done = null; return renderOrders(); }
    return `<div class="ok">✓</div><div class="center title" style="margin-bottom:4px">Заказ принят</div>
      <div class="center muted">Спасибо, что выбираете LaBuket 💜</div>
      <div class="note">📸 В рабочей версии флорист подтвердит заказ и пришлёт фото букета перед отправкой — прямо в этот чат.</div>
      ${orderCard(o)}
      <div class="stack" style="margin-top:12px"><button type="button" class="btn ghost" data-act="tab" data-id="orders">Мои заказы</button><button type="button" class="btn ghost" data-act="tab" data-id="home">На главную</button></div>`;
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset;
    switch (act) {
      case 'tab': state.item = null; state.checkout = false; state.done = null; state.tab = id; haptic.tap(); render(); break;
      case 'item': state.item = id; haptic.tap(); render(); break;
      case 'add': e.stopPropagation(); if (inCart(id)) { state.item = null; state.tab = 'cart'; render(); } else { addToCart(id); toast('Добавили в корзину 💜'); render(true); } break;
      case 'back': goBack(); break;
      case 'checkout':
        state.checkout = true;
        state.form = state.form || { date: null, slot: null, rname: '', rphone: '', addr: '', card: '', anon: false, name: (tgUser && tgUser.first_name) || '', phone: '', consent: false };
        haptic.tap(); render(); break;
      case 'cat': state.cat = id; haptic.tap(); render(true); break;
      case 'price': state.price = id; haptic.tap(); render(true); break;
      case 'inc': inCart(id).qty += 1; saveCart(); haptic.tap(); render(true); break;
      case 'dec': { const l = inCart(id); l.qty -= 1; if (l.qty <= 0) cart = cart.filter((x) => x.id !== id); saveCart(); haptic.tap(); render(true); break; }
      case 'date': state.form.date = id; state.form.slot = null; haptic.tap(); render(true); break;
      case 'slot': state.form.slot = id; haptic.tap(); render(true); break;
      case 'repeat': { const o = orders.find((x) => x.id === id); o.items.forEach((l) => { const c = inCart(l.id); if (c) c.qty += l.qty; else cart.push({ id: l.id, qty: l.qty }); }); saveCart(); haptic.ok(); state.done = null; state.tab = 'cart'; render(); toast('Букеты из заказа уже в корзине'); break; }
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.shop.mapQuery)}`); break;
      case 'chat': toast('В рабочей версии откроется чат с флористом'); break;
    }
  });

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.item = null; state.checkout = false; state.done = null; state.tab = b.dataset.tab; haptic.tap(); render();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (state.item || state.checkout || state.done)) goBack(); });

  function updateBadge() { const b = $('.tabs .badge'); const n = cartCount(); b.hidden = !n; b.textContent = n; }
  updateBadge();
  render();
})();
