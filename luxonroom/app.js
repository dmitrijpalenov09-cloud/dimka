(() => {
  'use strict';

  const D = window.LX;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const item = (id) => D.items.find((x) => x.id === id);
  const store = (id) => D.stores.find((s) => s.id === id);
  const img = (n) => `img/${n}.jpg`;
  const fits = (x, s) => !s || (s >= x.min && s <= x.max);
  const sizesOf = (x) => D.sizes.filter((s) => s >= x.min && s <= x.max);

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready(); tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#FBF7F2'); tg.setBackgroundColor('#FBF7F2'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#FBF7F2');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Состояние покупательницы (демо: на устройстве + облако Telegram) ─
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* память */ } if (tgAtLeast('6.9')) tg.CloudStorage.setItem(k, JSON.stringify(v), () => {}); };
  let my = load('lx_my', { size: null, store: 'spb', favs: [], holds: [], bonus: 350 });
  const persist = () => { save('lx_my', my); updateBadge(); };

  const state = { tab: 'home', screen: null, item: null, cat: 'all', onlyMine: true, pick: { size: null, color: null } };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn'); const sheet = $('#sheet');
  let ctaHandler = null;
  function setCTA(text, handler) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: '#23338C', text_color: '#FFFFFF', is_active: true, is_visible: true }); }
    else { cta.hidden = !text; ctaBtn.textContent = text || ''; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  if (inTG) tg.MainButton.onClick(() => ctaHandler && ctaHandler()); else ctaBtn.addEventListener('click', () => ctaHandler && ctaHandler());
  if (inTG) tg.BackButton.onClick(() => goBack());
  const backlink = () => (inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>');

  function render(soft = false) {
    const sub = !!state.screen;
    tabs.hidden = sub; view.classList.toggle('no-tabs', sub);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    if (inTG) { if (sub) tg.BackButton.show(); else tg.BackButton.hide(); }
    const html = state.screen === 'item' ? renderItem() : ({ home: renderHome, catalog: renderCatalog, holds: renderHolds, card: renderCard })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    after();
  }
  function goBack() { haptic.tap(); state.screen = null; render(); }

  const card = (x) => `<button type="button" class="card" data-act="item" data-id="${x.id}">
      <div class="ph"><img src="${img(x.imgs[0])}" alt="" loading="lazy">${x.isNew ? '<span class="flag new">новинка</span>' : x.hit ? '<span class="flag">хит</span>' : ''}
        <span class="fav" data-act="fav" data-id="${x.id}">${my.favs.includes(x.id) ? '♥' : '♡'}</span>${my.size && fits(x, my.size) ? `<span class="fit">есть ${my.size}</span>` : ''}</div>
      <div class="nm">${esc(x.name)}</div><div class="row"><span class="price">${rub(x.price)}</span><span class="sz-r">${x.min}–${x.max}</span></div></button>`;
  const sizeRow = (sel, act, list = D.sizes) => `<div class="sizes">${list.map((s) => `<button type="button" class="sz ${sel === s ? 'on' : ''}" data-act="${act}" data-id="${s}">${s}</button>`).join('')}</div>`;

  // ── Витрина ──────────────────────────────────────────
  function renderHome() {
    const hits = D.items.filter((x) => x.hit || x.isNew);
    const mine = my.size ? D.items.filter((x) => fits(x, my.size)).length : D.items.length;
    const hi = tgUser && tgUser.first_name ? esc(tgUser.first_name) + ', ' : '';
    return `<div class="top"><div class="logo">${esc(D.shop.name)}<small>${esc(D.shop.slogan)} 🌸</small></div>
        ${my.size ? `<button type="button" class="mysize" data-act="resize">Мой размер · ${my.size}</button>` : ''}</div>
      <div class="hero"><img class="a" src="${img('4206_0')}" alt=""><img src="${img('4220_0')}" alt=""><img src="${img('4239_0')}" alt="">
        <div class="tagline"><b>Новая осень</b><span>Костюмы, тренчи и ветровки 42–54</span></div></div>
      <div class="perks"><div class="perk"><b>42–54</b>размеры на любую фигуру</div><div class="perk"><b>Без предоплаты</b>бронь на примерку</div><div class="perk"><b>2 магазина</b>Политехническая и Всеволожск</div></div>
      ${my.size ? '' : `<div class="sizepick"><div style="font:600 19px var(--serif)">${hi}какой у вас размер?</div><div class="muted">Покажем только то, что точно подойдёт</div>${sizeRow(null, 'setsize')}</div>`}
      <div class="h3">Новинки и хиты <button type="button" data-act="tab" data-id="catalog">${my.size ? `ваш размер — ${mine}` : 'все'}</button></div>
      <div class="hscroll">${hits.map(card).join('')}</div>
      <div class="h3">Разделы</div>
      <div class="cats">${D.cats.slice(1).map((c) => { const x = D.items.find((i) => i.cat === c.id); return `<button type="button" class="cat" data-act="cat" data-id="${c.id}"><img src="${img(x.imgs[0])}" alt="" loading="lazy"><b>${c.name}</b></button>`; }).join('')}</div>
      <div class="note">💝 <b>Понравилось — бронируйте.</b> Отложим ваш размер и цвет в удобном магазине до конца следующего дня. Без предоплаты, как и сейчас.</div>
      <p class="footnote">Концепт приложения для Luxonroom.<br>Вещи, цены и фото — из вашего Telegram-канала. Наличие и бонусы — пример.</p>`;
  }

  // ── Каталог ──────────────────────────────────────────
  function renderCatalog() {
    const list = D.items.filter((x) => (state.cat === 'all' || x.cat === state.cat) && (!state.onlyMine || fits(x, my.size)));
    return `<div class="eyebrow">Каталог · ${D.items.length} вещей</div><h1 class="title">Одеваем <i>с любовью</i></h1>
      <div class="chips">${D.cats.map((c) => `<button type="button" class="chip ${c.id === state.cat ? 'on' : ''}" data-act="cat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
      ${my.size ? `<button type="button" class="toggle" data-act="mine"><span>Только мой размер · ${my.size}</span><span class="sw ${state.onlyMine ? 'on' : ''}"></span></button>`
        : `<div class="sizepick" style="margin:0 0 14px"><b>Укажите размер</b> — отметим, что вам подойдёт${sizeRow(null, 'setsize')}</div>`}
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : '<div class="empty"><span class="e">🌸</span>В этом разделе пока нет вашего размера.<br>Напишите нам — подберём.</div>'}`;
  }

  // ── Вещь ─────────────────────────────────────────────
  function renderItem() {
    const x = item(state.item); const p = state.pick; const sz = sizesOf(x);
    return `${backlink()}<div class="gal" id="gal">${x.imgs.map((n) => `<img src="${img(n)}" alt="">`).join('')}</div>
      ${x.imgs.length > 1 ? `<div class="dots">${x.imgs.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}
      <div class="iname">${esc(x.name)}</div><div class="iprice">${rub(x.price)}</div>
      <p class="muted" style="font-size:14px;margin-top:6px">${esc(x.note)}</p>
      <div class="lbl">Размер</div>${sizeRow(p.size, 'psize', sz)}
      ${x.colors ? `<div class="lbl">Цвет</div><div class="chips" style="flex-wrap:wrap;margin:0;padding:0">${x.colors.map((c) => `<button type="button" class="chip ${p.color === c ? 'on' : ''}" data-act="pcolor" data-id="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
      <div class="lbl">Где примерить</div>
      <div class="stores">${D.stores.map((s) => `<button type="button" class="store ${my.store === s.id ? 'on' : ''}" data-act="store" data-id="${s.id}"><span class="rad"></span><span><b>${s.addr}</b><div class="muted">${s.name} · ${s.hours}</div></span></button>`).join('')}</div>
      <div class="note">Отложим до конца завтрашнего дня. <b>Без предоплаты</b> — оплата при примерке.</div>
      <button type="button" class="btn ghost" data-act="fav" data-id="${x.id}">${my.favs.includes(x.id) ? '♥ В избранном' : '♡ В избранное'}</button>`;
  }
  function reserve() {
    const x = item(state.item); const p = state.pick;
    if (!p.size) { haptic.warn(); toast('Выберите размер'); return; }
    if (x.colors && !p.color) { haptic.warn(); toast('Выберите цвет'); return; }
    const until = new Date(); until.setDate(until.getDate() + 1);
    my.holds.unshift({ id: x.id, size: p.size, color: p.color, store: my.store, until: until.toISOString().slice(0, 10), at: Date.now() });
    persist(); haptic.ok();
    sheet.innerHTML = `<div class="panel"><div class="grab"></div><div class="ok-ring">✓</div><div style="font:600 22px var(--serif)">Отложили для вас</div>
      <p class="muted" style="margin:6px 0 14px">${esc(x.name)}, размер ${p.size}${p.color ? ', ' + esc(p.color) : ''}<br>${esc(store(my.store).addr)} · до конца завтрашнего дня</p>
      <button type="button" class="btn" data-act="goholds">Мои брони</button><div style="height:8px"></div><button type="button" class="btn ghost" data-act="close">Смотреть ещё</button>
      <div class="muted" style="margin-top:10px;font-size:11.5px">В рабочей версии продавец получит бронь в Telegram и подтвердит наличие.</div></div>`;
    sheet.hidden = false; if (inTG) tg.MainButton.hide();
  }

  // ── Брони ────────────────────────────────────────────
  const fmtD = (s) => new Date(s + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  function renderHolds() {
    const favs = D.items.filter((x) => my.favs.includes(x.id));
    return `<div class="eyebrow">Ждут вас в магазине</div><h1 class="title">Мои <i>брони</i></h1>
      ${my.holds.length ? my.holds.map((h, i) => { const x = item(h.id); return `<div class="hold"><img src="${img(x.imgs[0])}" alt=""><div class="b"><b>${esc(x.name)}</b>
        <div class="muted">Размер ${h.size}${h.color ? ' · ' + esc(h.color) : ''} · ${rub(x.price)}</div><div class="muted">${esc(store(h.store).addr)}</div>
        <span class="status">отложено до ${fmtD(h.until)}</span> <button type="button" class="muted" data-act="unhold" data-id="${i}" style="margin-left:6px;font-size:12px">отменить</button></div></div>`; }).join('')
        : '<div class="empty"><span class="e">🛍</span>Пока ничего не отложено.<br>Выберите вещь и нажмите «Забронировать».</div>'}
      ${favs.length ? `<div class="h3">Избранное</div><div class="grid">${favs.map(card).join('')}</div>` : ''}`;
  }

  // ── Карта и магазины ─────────────────────────────────
  function renderCard() {
    const next = 1000; const pct = Math.round(100 * my.bonus / next);
    const num = tgUser ? String(tgUser.id).slice(-6).padStart(6, '0') : '048 215';
    return `<div class="eyebrow">Бонусная программа</div><h1 class="title">Ваша <i>карта</i></h1>
      <div class="bcard"><div class="l">Luxonroom<small>${tgUser && tgUser.first_name ? esc(tgUser.first_name) : 'постоянная гостья'}</small></div>
        <div><div class="bal">${my.bonus}<span>бонусов</span></div></div>
        <div class="row"><span>№ ${num}</span><span>покажите на кассе</span></div></div>
      <div class="info" style="margin-top:12px"><b>До скидки 10% — ещё ${next - my.bonus} бонусов</b><div class="bar"><i style="width:${pct}%"></i></div>
        <div class="muted" style="margin-top:6px">Бонусы начисляются с каждой покупки. Условия — пример, настроим под вашу программу.</div></div>
      <div class="h3">Магазины</div>
      ${D.stores.map((s) => `<div class="info"><b>${s.addr}</b><div class="muted">${s.name} · ${s.hours} · ★ ${s.rating}</div>
        <div class="btns"><button type="button" class="btn ghost" data-act="route" data-id="${s.id}">Маршрут</button><button type="button" class="btn ghost" data-act="call">Позвонить</button></div></div>`).join('')}
      <div class="info"><b>Мы в соцсетях</b><div class="btns"><button type="button" class="btn ghost" data-act="vk">ВКонтакте</button><button type="button" class="btn ghost" data-act="tgch">Telegram</button></div></div>`;
  }

  function after() {
    if (state.screen === 'item') {
      const x = item(state.item);
      setCTA(`Забронировать · ${rub(x.price)}`, reserve);
      const gal = $('#gal');
      if (gal) gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / (gal.firstElementChild.offsetWidth + 8)); $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });
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
      case 'setsize': my.size = Number(id); persist(); haptic.ok(); render(true); toast(`Запомнили: ${id} размер`); break;
      case 'resize': my.size = null; persist(); haptic.tap(); render(true); break;
      case 'cat': state.cat = id; state.screen = null; state.tab = 'catalog'; haptic.tap(); render(); break;
      case 'mine': state.onlyMine = !state.onlyMine; haptic.tap(); render(true); break;
      case 'fav': e.stopPropagation(); my.favs = my.favs.includes(id) ? my.favs.filter((f) => f !== id) : [...my.favs, id]; persist(); haptic.tap(); render(true); break;
      case 'item': { const x = item(id); state.item = id; state.pick = { size: my.size && fits(x, my.size) ? my.size : null, color: null }; state.screen = 'item'; haptic.tap(); render(); break; }
      case 'psize': state.pick.size = Number(id); haptic.tap(); render(true); break;
      case 'pcolor': state.pick.color = id; haptic.tap(); render(true); break;
      case 'store': my.store = id; persist(); haptic.tap(); render(true); break;
      case 'goholds': sheet.hidden = true; state.screen = null; state.tab = 'holds'; render(); break;
      case 'close': sheet.hidden = true; state.screen = null; state.tab = 'catalog'; render(); break;
      case 'unhold': my.holds.splice(Number(id), 1); persist(); haptic.tap(); render(true); toast('Бронь отменена'); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(store(id).map)}`); break;
      case 'call': if (inTG) toast(`Телефон: ${D.shop.phone}`); else location.href = `tel:${D.shop.phoneRaw}`; break;
      case 'vk': openLink(D.shop.vk); break;
      case 'tgch': if (inTG) tg.openTelegramLink(D.shop.tg); else openLink(D.shop.tg); break;
    }
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) { sheet.hidden = true; after(); } });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!sheet.hidden) sheet.hidden = true; else if (state.screen) goBack(); } });

  function updateBadge() { const b = $('.tabs .badge'); b.hidden = !my.holds.length; b.textContent = my.holds.length; }
  updateBadge();
  render();
})();
