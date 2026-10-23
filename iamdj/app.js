(() => {
  'use strict';

  const D = window.DJ; const M = D.models;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const pimg = (n) => `img/p/${n}.jpg`;
  const img = (n) => `img/${n}.jpg`;
  const model = (id) => M.find((m) => m.id === id);
  const pad = (n) => String(n).padStart(2, '0');
  const sizesOf = (v) => (v.stock ? Object.keys(v.stock) : ['S', 'M', 'L', 'XL']);
  const canBuy = (v, s) => !v.stock || (v.stock[s] || 0) > 0;
  const vOpen = (v) => !v.stock || Object.values(v.stock).some((q) => q > 0);
  const mOpen = (m) => m.variants.some(vOpen);
  const priceOf = (m, v) => (v && v.price) || m.price;
  const oldOf = (m, v) => (v && v.old) || m.old;
  const addWorkDays = (d, n) => { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6) n--; } return x; };
  const fmt = (d) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const shipText = (m) => (m.ship === 'fast' ? 'Отправка 1–3 рабочих дня' : `Предзаказ · отправка ~ ${fmt(addWorkDays(Date.now(), m.ship === 'pre14' ? 14 : 21))}`);

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    heavy: () => inTG && tg.HapticFeedback && tg.HapticFeedback.impactOccurred('heavy'),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready(); tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#0A0A0A'); tg.setBackgroundColor('#0A0A0A'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#0A0A0A');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const openTg = (url) => { if (inTG) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Данные покупателя (демо) ─────────────────────────
  // Пример заказа: оформлен на предзаказе, сшит, ждёт отправки в очереди — как в канале 20.10
  const demoOrder = () => ({ no: 'DJ-1043', model: 'reverse', vi: 2, size: 'M', price: 7190, placed: Date.now() - 26 * 864e5, stage: 2, pos: 214, demo: true });
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  let P = load('dj_state', { orders: [demoOrder()], notify: [], soon: false, give: null, faq: null });
  const save = () => { try { localStorage.setItem('dj_state', JSON.stringify(P)); } catch { /* */ } if (tgAtLeast('6.9')) tg.CloudStorage.setItem('dj_state', JSON.stringify(P), () => {}); updateBadge(); };

  const state = { tab: 'home', screen: null, prod: null, vi: 0, size: null, ph: 0, cat: 'all', oi: 0 };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn'); const sheet = $('#sheet');
  let ctaHandler = null; let timer = null;
  function setCTA(text, handler, kind) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: kind === 'red' ? '#C4162A' : '#F5F5F3', text_color: kind === 'red' ? '#FFFFFF' : '#0A0A0A', is_active: true, is_visible: true }); }
    else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.className = 'btn' + (kind === 'red' ? ' red' : ''); }
    cta.style.bottom = tabs.hidden ? '0' : 'calc(var(--tabs-h) + var(--safe-bottom))';
    view.classList.toggle('tg-cta', inTG && !!text);
    view.classList.toggle('cta-tabs', !inTG && !!text && !tabs.hidden);
  }
  if (inTG) tg.MainButton.onClick(() => ctaHandler && ctaHandler()); else ctaBtn.addEventListener('click', () => ctaHandler && ctaHandler());
  if (inTG) tg.BackButton.onClick(() => goBack());
  const backlink = () => (inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>');
  const parts = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; };
  const cd = (t) => `<div class="count" data-cd="${t}"><div><b>00</b><span>дней</span></div><div><b>00</b><span>часов</span></div><div><b>00</b><span>минут</span></div><div><b>00</b><span>секунд</span></div></div>`;
  const tick = () => $$('[data-cd]').forEach((el) => { const p = parts(Number(el.dataset.cd) - Date.now()); $$('b', el).forEach((b, i) => { b.textContent = pad(p[i]); }); });

  function render(soft = false) {
    clearInterval(timer);
    const sub = !!state.screen;
    tabs.hidden = sub; view.classList.toggle('no-tabs', sub);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    if (inTG) { if (sub) tg.BackButton.show(); else tg.BackButton.hide(); }
    const html = state.screen === 'prod' ? renderProd() : ({ home: renderHome, shop: renderShop, order: renderOrder, give: renderGive })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    if ($('[data-cd]')) { tick(); timer = setInterval(tick, 1000); }
    after();
  }
  function goBack() { haptic.tap(); state.screen = null; render(); }

  const pc = (m) => {
    const v = m.variants.find(vOpen) || m.variants[0]; const open = mOpen(m);
    return `<button type="button" class="pc ${open ? '' : 'sold'}" data-act="prod" data-id="${m.id}"><div class="ph"><img src="${pimg(v.photos[0])}" alt="" loading="lazy">
      ${!open ? '<span class="badge-s out">sold out</span>' : m.isNew ? '<span class="badge-s low">new</span>' : m.ship !== 'fast' ? '<span class="badge-s">предзаказ</span>' : ''}</div>
      <div class="nm">${esc(m.name)}</div><div class="row"><span class="price">${rub(priceOf(m, v))}${oldOf(m, v) ? ` <s class="muted" style="font-weight:500">${rub(oldOf(m, v))}</s>` : ''}</span>
      <span class="dots">${m.variants.slice(0, 5).map((x) => `<i style="background:${x.hex}"></i>`).join('')}</span></div></button>`;
  };

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const r = model('reverse'); const o = P.orders[0];
    return `<div class="topbar"><div><div class="wordmark">${esc(D.brand.name)}</div><div class="muted">${esc(D.brand.motto)}</div></div><span class="subs"><b>${D.brand.subs}</b> в канале</span></div>
      ${o ? `<button type="button" class="drawcard" data-act="tab" data-id="order" style="height:auto;display:block;background:linear-gradient(135deg,#2A0710,#141414);border:1px solid #3A1018">
        <div class="in" style="max-width:100%;height:auto;gap:8px"><span class="tag red">мой заказ ${esc(o.no)}</span>
        <b style="font-size:17px">${o.stage >= 3 ? 'Отправлен — трек внутри' : o.stage === 2 ? `Сшит · в очереди на отправку: ${o.pos}-й` : 'Оплачен · ждёт пошива'}</b>
        <span class="muted" style="color:#CFCFCB">Нажми, чтобы посмотреть статус — без вопросов в поддержку</span></div></button>` : ''}
      <section class="drop" style="margin-top:12px"><img src="${img('343_0')}" alt=""><div class="in">
        <span class="live"><i></i>hot</span><h2 style="font:400 40px/0.95 var(--head);text-transform:none">Reverse<br>Zip-Hoodie</h2>
        <div class="sub">Красные почти все раскупили. Pink, Purple и White — ещё в предзаказе.</div>
        <div class="lines" style="margin-top:12px"><span>Бархат навыворот <b>${rub(r.price)}</b></span></div>
        <button type="button" class="btn red" data-act="prod" data-id="reverse">Выбрать цвет</button></div></section>
      <div class="note" style="display:flex;gap:12px;align-items:center"><span style="font-size:28px">🧥</span><div style="flex:1"><b>Скоро: ${esc(D.soon.title)}</b><div>${esc(D.soon.text)}</div></div>
        <button type="button" class="btn small ${P.soon ? 'ghost' : 'red'}" data-act="soon">${P.soon ? '✓' : 'Напомнить'}</button></div>
      <button type="button" class="drawcard" data-act="tab" data-id="give"><img src="${img('337_2')}" alt=""><div class="in"><span class="tag ${P.give ? 'ok' : 'red'}">${P.give ? '✓ ты участвуешь' : `розыгрыш · ${D.giveaway.places} места`}</span>
        <div><b>Розыгрыш с ${esc(D.giveaway.partner)}</b><div class="muted" style="color:#CFCFCB;margin-top:4px">Итоги 30 октября</div></div></div></button>
      <div class="h3">Магазин <button type="button" data-act="tab" data-id="shop">все вещи</button></div><div class="hscroll">${M.filter(mOpen).map(pc).join('')}</div>
      <div class="h3">Как шьём ваши кофты</div><div class="look">${D.production.map((n) => `<img src="${img(n)}" alt="" loading="lazy">`).join('')}</div>
      <p class="footnote">Концепт приложения для IamDj®.<br>Вещи, цены и сроки — с iamdjj.ru, фото — из канала. Очередь и трекинг — пример.</p>`;
  }

  // ── Магазин ──────────────────────────────────────────
  function renderShop() {
    const list = M.filter((m) => state.cat === 'all' || m.cat === state.cat).sort((a, b) => mOpen(b) - mOpen(a));
    return `<div class="pad" style="padding-top:16px"><div class="eyebrow">${M.length} моделей</div><h1 class="title">Магазин</h1></div>
      <div class="chips">${D.cats.map((c) => `<button type="button" class="chip ${state.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="grid">${list.map(pc).join('')}</div>`;
  }

  // ── Товар ────────────────────────────────────────────
  function renderProd() {
    const m = model(state.prod); const v = m.variants[state.vi]; const open = vOpen(v);
    const ph = v.photos[Math.min(state.ph, v.photos.length - 1)];
    return `${backlink()}<div class="pimg" style="aspect-ratio:1/1"><img src="${pimg(ph)}" alt="">${!open ? '<span class="badge-s out" style="left:16px;top:16px">sold out</span>' : ''}</div>
      ${v.photos.length > 1 ? `<div class="thumbs">${v.photos.map((n, i) => `<img src="${pimg(n)}" class="${i === state.ph ? 'on' : ''}" data-act="ph" data-id="${i}" alt="">`).join('')}</div>` : ''}
      <div class="pname" style="text-transform:none">${esc(m.name)}</div>
      <div class="pprice">${rub(priceOf(m, v))}${oldOf(m, v) ? ` <s class="muted" style="font-weight:500">${rub(oldOf(m, v))}</s>` : ''}</div>
      <div class="pad muted" style="margin-top:6px">${esc(m.note)}</div>
      <div class="lbl"><span>Цвет · ${esc(v.color)}</span></div>
      <div class="swatches">${m.variants.map((x, i) => `<button type="button" class="sw ${i === state.vi ? 'on' : ''}" style="background:${x.hex}" data-act="vi" data-id="${i}"></button>`).join('')}</div>
      <div class="lbl"><span>Размер</span>${v.chart ? '<button type="button" data-act="chart" style="color:var(--pink);font-weight:800;letter-spacing:.1em">РАЗМЕРНАЯ СЕТКА</button>' : ''}</div>
      <div class="sizes" style="grid-template-columns:repeat(${Math.min(4, sizesOf(v).length)},1fr)">${sizesOf(v).map((s) => `<button type="button" class="sz ${canBuy(v, s) ? '' : 'out'} ${state.size === s ? 'on' : ''}" data-act="size" data-id="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <div class="note">${open ? `📦 <b>${shipText(m)}</b><br>Статус заказа — в разделе «Мой заказ»: пошив, место в очереди, трек.` : 'Этот цвет разобрали. Нажми «Сообщить о рестоке» — напишем сюда, когда вернётся.'}</div>`;
  }
  function openChart() {
    const v = model(state.prod).variants[state.vi];
    sheet.innerHTML = `<div class="panel"><div class="grab"></div><div class="lbl" style="margin:0 0 10px">Размерная сетка</div><img class="chart" src="${pimg(v.chart)}" alt=""><div style="height:12px"></div><button type="button" class="btn" data-act="close">Понятно</button></div>`;
    sheet.hidden = false; if (inTG) tg.MainButton.hide();
  }
  function openCheckout() {
    const m = model(state.prod); const v = m.variants[state.vi];
    sheet.innerHTML = `<div class="panel"><div class="grab"></div>
      <div class="line"><div class="im" style="background:#0E0E0E"><img src="${pimg(v.photos[0])}" alt="" style="object-fit:cover;width:100%;height:100%;border-radius:12px"></div><div><b>${esc(m.name)}</b><div class="muted">${esc(v.color)} · ${esc(state.size)}</div><div class="price" style="margin-top:4px">${rub(priceOf(m, v))}</div></div></div>
      <div class="note" style="margin:14px 0">${shipText(m)}. Статус пошива и очереди — сразу в приложении, трек — сюда, в Telegram.</div>
      <div class="sum"><div class="r t"><span>К оплате</span><span>${rub(priceOf(m, v))}</span></div></div>
      <div style="height:12px"></div><button type="button" class="btn red" data-act="buy">Оплатить ${rub(priceOf(m, v))}</button>
      <div class="muted" style="text-align:center;margin-top:10px;font-size:11.5px">Демо — оплата не списывается. В рабочей версии — та же касса, что на iamdjj.ru</div></div>`;
    sheet.hidden = false; if (inTG) tg.MainButton.hide();
  }
  function buy() {
    $('.panel', sheet).innerHTML = '<div class="grab"></div><div class="spinner"></div><div class="muted" style="text-align:center;padding-bottom:26px">Оплата…</div>';
    setTimeout(() => {
      const m = model(state.prod); const v = m.variants[state.vi];
      const no = 'DJ-' + String(1100 + P.orders.length * 37 + Math.floor(Math.random() * 30));
      P.orders.unshift({ no, model: m.id, vi: state.vi, size: state.size, price: priceOf(m, v), placed: Date.now(), stage: m.ship === 'fast' ? 2 : 0, pos: m.ship === 'fast' ? 38 : null });
      save(); haptic.ok();
      $('.panel', sheet).innerHTML = `<div class="grab"></div><div style="text-align:center"><div style="font-size:54px">🏹</div><div class="title" style="font-size:22px;text-transform:none">Заказ ${no}</div>
        <div class="muted">${esc(m.name)} · ${esc(v.color)} · ${esc(state.size)}<br>${shipText(m)}</div><div style="height:16px"></div>
        <button type="button" class="btn red" data-act="goorder">Следить за заказом</button></div>`;
    }, 1300);
  }

  // ── Мой заказ ────────────────────────────────────────
  const STAGES = ['Оплачен', 'Пошив', 'Очередь на отправку', 'Отправлен', 'Получен'];
  const FAQ = [
    ['Где мой заказ?', 'Всё видно здесь: этап, место в очереди и ориентир по дате. Как только посылка уйдёт — пришлём трек в этот чат.'],
    ['Почему отправка в порядке очереди?', 'Вещи шьются партиями на производстве. Как только партия готова — отправляем каждый день, по порядку оформления.'],
    ['Хочу поменять размер', 'Нажмите «Написать в поддержку» — менеджер ответит в Telegram.'],
  ];
  function renderOrder() {
    if (!P.orders.length) return `<div class="pad" style="padding-top:16px"><h1 class="title">Мой заказ</h1><div class="note">Заказов пока нет. Оформи что-нибудь в магазине — статус появится здесь.</div></div>`;
    const o = P.orders[Math.min(state.oi, P.orders.length - 1)]; const m = model(o.model); const v = m.variants[o.vi];
    const q = D.queue; const days = o.pos ? Math.max(1, Math.ceil(o.pos / q.perDay)) : null;
    return `<div class="pad" style="padding-top:16px"><div class="eyebrow">${P.orders.length > 1 ? `${P.orders.length} заказа` : 'статус в реальном времени'}</div><h1 class="title" style="text-transform:none">Заказ ${esc(o.no)}</h1></div>
      ${P.orders.length > 1 ? `<div class="chips">${P.orders.map((x, i) => `<button type="button" class="chip ${i === state.oi ? 'on' : ''}" data-act="oi" data-id="${i}">${esc(x.no)}</button>`).join('')}</div>` : ''}
      <div class="line" style="margin:0 16px;border:0"><div class="im" style="background:#0E0E0E;width:76px;height:76px"><img src="${pimg(v.photos[0])}" alt="" style="object-fit:cover;width:100%;height:100%;border-radius:12px"></div>
        <div><b>${esc(m.name)}</b><div class="muted">${esc(v.color)} · ${esc(o.size)} · ${rub(o.price)}</div><div class="muted">оформлен ${fmt(o.placed)}${o.demo ? ' · пример' : ''}</div></div></div>
      ${o.stage === 2 && o.pos ? `<div class="queue"><div class="eyebrow" style="color:#E7A3B5">твоё место в очереди на отправку</div><div class="big">${o.pos}<span>из ${q.total.toLocaleString('ru-RU')}</span></div>
        <div class="qbar"><i style="width:${Math.round(100 * (1 - o.pos / q.total))}%"></i></div><div class="muted">Отправляем ~${q.perDay} заказов в день → ориентир: <b style="color:#fff">${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</b></div></div>`
        : o.stage < 2 ? `<div class="queue"><div class="eyebrow" style="color:#E7A3B5">ориентир отправки</div><div class="big" style="font-size:34px">${fmt(addWorkDays(o.placed, m.ship === 'pre14' ? 14 : 21))}</div><div class="muted">Пошив партии — фото с производства появятся здесь</div></div>` : ''}
      <div class="steps track">${STAGES.map((s, i) => `<div class="step ${i < o.stage ? 'done' : i === o.stage ? 'cur' : ''}"><span class="n">${i < o.stage ? '✓' : i + 1}</span><div><b>${s}</b>
        ${i === 1 && o.stage >= 1 ? `<span class="muted">Фото с производства — ваша партия</span><div class="ph">${D.production.slice(0, 3).map((n) => `<img src="${img(n)}" alt="">`).join('')}</div>` : ''}
        ${i === 3 ? '<span class="muted">Трек СДЭК придёт в этот чат</span>' : ''}</div></div>`).join('')}</div>
      <div class="h3">Частые вопросы</div>
      <div class="faq">${FAQ.map(([qq, a], i) => `<button type="button" data-act="faq" data-id="${i}"><span>${qq}</span><span>${P.faq === i ? '−' : '+'}</span></button>${P.faq === i ? `<div class="a">${a}</div>` : ''}`).join('')}</div>
      <div class="pad" style="margin-top:12px"><button type="button" class="btn ghost" data-act="support">Написать в поддержку</button></div>
      <p class="footnote">Сейчас статус приходится объяснять постами в канале. Здесь каждый видит свой заказ сам.</p>`;
  }

  // ── Розыгрыш ─────────────────────────────────────────
  function renderGive() {
    const g = D.giveaway; const t = new Date(g.until).getTime();
    return `<div style="padding-top:16px"></div><div class="gw"><img src="${img(g.img)}" alt=""><div class="in"><span class="tag ${P.give ? 'ok' : 'red'}">${P.give ? '✓ ты участвуешь' : `${g.places} призовых места`}</span>
        <h2 style="font:400 30px/1 var(--head);margin:10px 0 4px">Розыгрыш IamDj × ${esc(g.partner)}</h2><div class="muted" style="color:#D0D0CC">Итоги 30 октября</div></div></div>
      <div class="pad" style="margin-top:14px">${cd(t)}</div>
      <div class="cond"><div><span class="ck ok">✓</span>Подписаться на ${esc(g.partner)}</div><div><span class="ck ok">✓</span>Подписаться на IAMDJ</div><div><span class="ck ${P.give ? 'ok' : ''}">${P.give ? '✓' : '3'}</span>Нажать «Участвовать»</div></div>
      ${P.give ? `<div class="ticket"><div class="eyebrow">твой номер</div><div class="no">№ ${P.give}</div><div class="muted">Итоги придут сообщением в этот чат 30 октября</div></div>` : ''}
      <div class="note">Подписки проверяются автоматически — без сторонних ботов. Победителю сразу приходит сообщение с выбором размера.</div>`;
  }

  function after() {
    if (state.screen === 'prod') {
      const m = model(state.prod); const v = m.variants[state.vi];
      if (!vOpen(v)) { const on = P.notify.includes(v.uid); setCTA(on ? '✓ Сообщим о рестоке' : 'Сообщить о рестоке', () => { P.notify = on ? P.notify.filter((x) => x !== v.uid) : [...P.notify, v.uid]; save(); haptic.ok(); render(true); }); }
      else setCTA(state.size ? `${m.ship === 'fast' ? 'Купить' : 'Предзаказ'} · ${rub(priceOf(m, v))}` : 'Выберите размер', () => { if (!state.size) { haptic.warn(); toast('Выберите размер'); return; } openCheckout(); }, state.size ? 'red' : undefined);
    } else if (!state.screen && state.tab === 'give' && !P.give) {
      setCTA('Участвовать', () => { P.give = String(Math.floor(1000 + Math.random() * 9000)); save(); haptic.heavy(); setTimeout(haptic.ok, 120); render(true); toast('Ты в розыгрыше 🔥'); }, 'red');
    }
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200); };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset;
    switch (act) {
      case 'tab': state.screen = null; state.tab = id; haptic.tap(); render(); break;
      case 'back': goBack(); break;
      case 'prod': { const m = model(id); state.prod = id; state.vi = Math.max(0, m.variants.findIndex(vOpen)); state.size = null; state.ph = 0; state.screen = 'prod'; haptic.tap(); render(); break; }
      case 'vi': state.vi = Number(id); state.size = null; state.ph = 0; haptic.tap(); render(true); break;
      case 'ph': state.ph = Number(id); haptic.tap(); render(true); break;
      case 'size': state.size = id; haptic.tap(); render(true); break;
      case 'chart': openChart(); break;
      case 'cat': state.cat = id; haptic.tap(); render(true); break;
      case 'buy': buy(); break;
      case 'close': sheet.hidden = true; after(); break;
      case 'goorder': sheet.hidden = true; state.screen = null; state.tab = 'order'; state.oi = 0; render(); break;
      case 'oi': state.oi = Number(id); haptic.tap(); render(true); break;
      case 'faq': P.faq = P.faq === Number(id) ? null : Number(id); save(); haptic.tap(); render(true); break;
      case 'soon': P.soon = !P.soon; save(); haptic.ok(); render(true); if (P.soon) toast('Напишем, когда стартуют куртки и джинсы'); break;
      case 'support': openTg(D.brand.support); break;
    }
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) { sheet.hidden = true; after(); } });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!sheet.hidden) sheet.hidden = true; else if (state.screen) goBack(); } });

  function updateBadge() { const b = $('.tabs .badge'); b.hidden = !P.orders.length; }
  updateBadge();
  render();
})();
