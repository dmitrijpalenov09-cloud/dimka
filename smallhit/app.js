(() => {
  'use strict';

  const D = window.SH; const S = D.shop;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rub = (n) => Number(n).toLocaleString('ru-RU') + ' ₽';
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const master = (id) => D.masters.find((m) => m.id === id);
  const level = (id) => D.levels.find((l) => l.id === id);
  const svc = (id) => D.services.find((s) => s.id === id);
  const priceOf = (m, s) => level(m.level).price[s];
  const dayDate = (off) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
  const dayLabel = (off) => (off === 0 ? 'Сегодня' : off === 1 ? 'Завтра' : `${WD[dayDate(off).getDay()]}, ${dayDate(off).getDate()}`);
  const dayLong = (off) => { const d = dayDate(off); return `${off === 0 ? 'сегодня, ' : off === 1 ? 'завтра, ' : ''}${WD[d.getDay()]} ${d.toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}`; };
  const initials = (m) => m.name[0];
  // ?now=13:10 — зафиксировать время (для скриншотов презентации)
  const fixedNow = (location.search.match(/now=(\d{1,2}):(\d{2})/) || []).slice(1).map(Number);
  const nowMin = () => (fixedNow.length ? fixedNow[0] * 60 + fixedNow[1] : new Date().getHours() * 60 + new Date().getMinutes());

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
  };
  if (inTG) {
    tg.ready(); tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#0E0E0F'); tg.setBackgroundColor('#0E0E0F'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#0E0E0F');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Окна (демо: детерминированные по дате; в рабочей версии — из YCLIENTS) ─
  const rnd = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
  function slotsFor(m, off, sid) {
    if (off < m.nearest) return [];
    const dur = svc(sid).dur; const d = dayDate(off); const key = `${m.id}-${d.getMonth()}-${d.getDate()}`;
    const free = (h) => rnd(`${key}-${h}`) > m.busy;
    const nowM = nowMin();
    const out = [];
    for (let h = S.open; h * 60 + dur <= S.close * 60; h++) {
      const t = h * 60 + (rnd(`${key}-m${h}`) > 0.6 ? 30 : 0);
      if (t + dur > S.close * 60) continue;
      if (off === 0 && t < nowM + 30) continue;
      if (free(h) && (dur <= 60 || free(h + 1))) out.push(t);
    }
    // У мастера с окнами «сегодня» в YCLIENTS — гарантируем хотя бы пару окон, пока день не кончился
    if (off === m.nearest && out.length < 2) {
      for (let t = Math.ceil((off === 0 ? nowM + 40 : S.open * 60) / 30) * 30; t + dur <= S.close * 60 && out.length < 2; t += 90) if (!out.includes(t)) out.push(t);
      out.sort((a, b) => a - b);
    }
    return out.filter((t) => !bookings.some((b) => b.master === m.id && b.day === dateKey(off) && Math.abs(b.time - t) < 60));
  }
  const dateKey = (off) => { const d = dayDate(off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const offOfKey = (k) => Math.round((new Date(k + 'T00:00:00') - dayDate(0)) / 864e5);
  function allSlots(off, sid) {
    return D.masters.flatMap((m) => slotsFor(m, off, sid).map((t) => ({ m, t, off }))).sort((a, b) => a.t - b.t || priceOf(a.m, sid) - priceOf(b.m, sid));
  }
  function nextSlot(sid) { for (let off = 0; off < 7; off++) { const s = allSlots(off, sid); if (s.length) return s[0]; } return null; }

  // ── Хранение записей ─────────────────────────────────
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* память */ } };
  let bookings = load('sh_bookings', []).filter((b) => offOfKey(b.day) >= 0);
  const save = () => { store('sh_bookings', bookings); if (tgAtLeast('6.9')) tg.CloudStorage.setItem('sh_bookings', JSON.stringify(bookings), () => {}); updateBadge(); };

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'now', svc: 'head', day: 0, screen: null, pick: null, doneId: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');
  let ctaHandler = null;
  function setCTA(text, handler) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: '#FF5A1F', text_color: '#160A04', is_active: true, is_visible: true }); }
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
    const html = state.screen === 'book' ? renderBook() : state.screen === 'done' ? renderDone()
      : ({ now: renderNow, team: renderTeam, prices: renderPrices, my: renderMy })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    after();
  }
  function goBack() { haptic.tap(); if (state.screen === 'done') { state.screen = null; state.tab = 'my'; } else state.screen = null; render(); }

  const svcChips = () => `<div class="chips">${D.services.map((s) => `<button type="button" class="chip ${s.id === state.svc ? 'on' : ''}" data-act="svc" data-id="${s.id}">${esc(s.short)}</button>`).join('')}</div>`;
  const ava = (m, big) => `<span class="ava ${big ? 'big' : ''} lv-${m.level}">${esc(initials(m))}</span>`;
  const slotBtn = (x) => {
    const mins = x.off === 0 ? x.t - (nowMin()) : 999;
    return `<button type="button" class="slot" data-act="pick" data-m="${x.m.id}" data-off="${x.off}" data-t="${x.t}">
      ${mins < 90 ? '<span class="soon">скоро</span>' : ''}<div class="t">${hm(x.t)}</div>
      <div class="m">${ava(x.m)}<div><div class="nm">${esc(x.m.name)}</div><div class="lv">${level(x.m.level).name}</div></div></div>
      <span class="price">${rub(priceOf(x.m, state.svc))}</span></button>`;
  };

  // ── Сегодня ──────────────────────────────────────────
  function renderNow() {
    const n = nextSlot(state.svc);
    const list = allSlots(state.day, state.svc);
    const todayCount = allSlots(0, state.svc).length;
    let nextHtml = '';
    if (n) {
      const mins = n.off === 0 ? n.t - (nowMin()) : null;
      const inTxt = mins !== null ? (mins < 60 ? `через ${mins} мин` : `через ${Math.floor(mins / 60)} ч ${mins % 60 ? (mins % 60) + ' мин' : ''}`) : dayLabel(n.off).toLowerCase();
      nextHtml = `<section class="next"><div class="eyebrow">Ближайшее окно · ${esc(svc(state.svc).short.toLowerCase())}</div>
        <div class="time">${hm(n.t)}</div><div class="who">${esc(n.m.name)} · ${level(n.m.level).name} <span class="in">${inTxt}</span></div>
        <div class="row"><span class="price">${rub(priceOf(n.m, state.svc))}</span><button type="button" class="go" data-act="pick" data-m="${n.m.id}" data-off="${n.off}" data-t="${n.t}">Забрать окно →</button></div></section>`;
    }
    const lv = D.levels; const max = Math.max(...lv.map((l) => l.price[state.svc]));
    const cheap = lv[0].price[state.svc]; const top = lv[lv.length - 1].price[state.svc];
    return `<div class="top"><div class="logo">Small <i>Hit</i><small>${esc(S.address)} · барбершоп</small></div>
        <div class="pill"><span class="dot"></span>${todayCount ? `Сегодня ${todayCount} ${plural(todayCount, 'окно', 'окна', 'окон')}` : 'Окна на завтра'}</div></div>
      ${svcChips()}
      ${nextHtml}
      <div class="h3">Свободные окна <span class="muted" style="font:600 12px var(--sans);text-transform:none">${list.length}</span></div>
      <div class="chips">${[0, 1, 2, 3, 4, 5, 6].map((o) => `<button type="button" class="chip ${o === state.day ? 'on' : ''}" data-act="day" data-id="${o}">${dayLabel(o)}</button>`).join('')}</div>
      ${list.length ? `<div class="slots">${list.slice(0, 10).map(slotBtn).join('')}</div>${list.length > 10 ? `<div style="height:8px"></div><button type="button" class="btn ghost" data-act="tab" data-id="team">Ещё ${list.length - 10} — по мастерам</button>` : ''}`
        : '<div class="empty">На этот день окон нет — загляните на завтра</div>'}
      <div class="h3">Почему разные цены</div>
      <div class="ladder">${lv.map((l) => `<div class="step"><b>${l.name}</b><div class="bar"><i class="lv-${l.id}" style="width:${Math.round(100 * l.price[state.svc] / max)}%"></i></div><span class="price">${rub(l.price[state.svc])}</span></div>`).join('')}
        <div class="tip"><b>Хотите сегодня и дешевле?</b> У BARBER и PRO чаще есть окна — та же аккуратность на ${rub(top - cheap)} дешевле, чем у EXPERT.</div></div>
      <button type="button" class="gift" data-act="gift"><span class="ic">🎁</span><span><b>Подарить стрижку</b><span class="muted">Сертификат к Новому году — в Telegram, за минуту</span></span><span class="arr">›</span></button>
      <p class="footnote">Концепт приложения для барбершопа Small Hit.<br>Цены и мастера — из вашего YCLIENTS. Окна в демо примерные, в рабочей версии — живые.</p>`;
  }

  // ── Мастера ──────────────────────────────────────────
  function renderTeam() {
    return `<div class="eyebrow">Команда Small Hit</div><h1 class="title">Мастера</h1>${svcChips()}
      ${D.masters.map((m) => {
        let off = m.nearest; let sl = slotsFor(m, off, state.svc);
        while (!sl.length && off < 6) { off += 1; sl = slotsFor(m, off, state.svc); }
        return `<div class="mcard"><div class="hd">${ava(m, true)}<div><div class="nm">${esc(m.name)}</div><span class="badge-lv">${level(m.level).name}</span></div></div>
          <div class="stats"><div><b>${m.reviews}</b>${plural(m.reviews, 'отзыв', 'отзыва', 'отзывов')}</div><div><b>${rub(priceOf(m, state.svc))}</b>${esc(svc(state.svc).short.toLowerCase())}</div><div><b>${dayLabel(off)}</b>ближайшее</div></div>
          <div class="times">${sl.map((t) => `<button type="button" data-act="pick" data-m="${m.id}" data-off="${off}" data-t="${t}">${hm(t)}</button>`).join('')}</div>
          ${m.reviews < 10 ? '<div class="new">🆕 Новый мастер — запишитесь и оставьте отзыв</div>' : ''}</div>`;
      }).join('')}`;
  }

  // ── Цены ─────────────────────────────────────────────
  function renderPrices() {
    const short = { barber: 'BARB', pro: 'PRO', top: 'TOP', expert: 'EXP' };
    return `<div class="eyebrow">Прайс</div><h1 class="title">Цены <em>по уровням</em></h1>
      <div class="ptable"><div class="r hd"><span>Услуга</span>${D.levels.map((l) => `<span>${short[l.id]}</span>`).join('')}</div>
        ${D.services.map((s) => `<div class="r"><span>${esc(s.name)}<div class="muted" style="font-size:11px">${s.dur / 60} ч</div></span>${D.levels.map((l) => `<span>${l.price[s.id].toLocaleString('ru-RU')}</span>`).join('')}</div>`).join('')}</div>
      <div class="h3">Уровни мастеров</div>
      ${D.levels.map((l) => `<div class="svc"><div style="display:flex;gap:10px;align-items:center"><span class="ava lv-${l.id}" style="width:12px;height:12px"></span><b>${l.name}</b></div><div class="muted" style="margin-top:4px">${esc(l.text)}</div></div>`).join('')}
      <div class="h3">Услуги</div>
      ${D.services.map((s) => `<div class="svc"><b>${esc(s.name)}</b><div class="muted" style="margin-top:4px">${esc(s.text)}</div></div>`).join('')}`;
  }

  // ── Запись ───────────────────────────────────────────
  function renderBook() {
    const p = state.pick; const m = master(p.m);
    return `${backlink()}<div class="eyebrow">Запись</div>
      <div class="bk-time">${hm(p.t)}</div><div class="bk-day">${dayLong(p.off)}</div>
      <div class="bk-master">${ava(m, true)}<div><b style="font:700 17px var(--head);text-transform:uppercase">${esc(m.name)}</b><div class="muted">${level(m.level).name} · ${m.reviews} ${plural(m.reviews, 'отзыв', 'отзыва', 'отзывов')}</div></div></div>
      <div class="h3" style="margin-top:18px">Что делаем</div>
      ${D.services.map((s) => { const fits = p.t + s.dur <= S.close * 60; return `<button type="button" class="opt ${s.id === state.svc ? 'on' : ''}" data-act="bsvc" data-id="${s.id}" ${fits ? '' : 'disabled'}>
        <span class="${fits ? '' : 'off'}"><b>${esc(s.name)}</b><div class="muted">${s.dur / 60} ч · до ${hm(p.t + s.dur)}</div></span><span class="price">${rub(priceOf(m, s.id))}</span></button>`; }).join('')}
      <div class="note">🔔 Напомним в Telegram за 2 часа. Перенести или отменить — в одно нажатие, без звонков.</div>
      ${inTG ? '' : '<div class="note">Имя и телефон в рабочей версии — из профиля Telegram, вводить не нужно.</div>'}`;
  }
  function confirm() {
    const p = state.pick; const m = master(p.m);
    const b = { id: 'SH' + String(Date.now()).slice(-5), master: m.id, day: dateKey(p.off), time: p.t, svc: state.svc, price: priceOf(m, state.svc) };
    bookings.push(b); bookings.sort((a, c) => (a.day + pad(a.time)).localeCompare(c.day + pad(c.time))); save();
    haptic.ok(); state.screen = 'done'; state.doneId = b.id; render();
  }
  const ticket = (b) => { const m = master(b.master); const off = offOfKey(b.day); return `<div class="ticket">
      <div class="eyebrow">${esc(dayLong(off))}</div><div class="t" style="margin-top:6px">${hm(b.time)}–${hm(b.time + svc(b.svc).dur)}</div>
      <div class="rows"><div><span>Мастер</span><span>${esc(m.name)} · ${level(m.level).name}</span></div><div><span>Услуга</span><span>${esc(svc(b.svc).name)}</span></div>
        <div><span>Адрес</span><span>${esc(S.address)}</span></div><div><span>Стоимость</span><span class="price">${rub(b.price)}</span></div></div></div>`; };
  function renderDone() {
    const b = bookings.find((x) => x.id === state.doneId);
    if (!b) { state.screen = null; state.tab = 'my'; return renderMy(); }
    return `<div class="ok-ring">✓</div><h1 class="title" style="text-align:center">Вы <em>записаны</em></h1>
      <p class="muted" style="text-align:center">${tgUser ? esc(tgUser.first_name) + ', ж' : 'Ж'}дём вас — подтверждение придёт сюда, в Telegram</p>
      ${ticket(b)}
      <div class="btn-row"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="cal">В календарь</button></div>
      <div class="remind"><span class="ic">✂️</span><div><b>Через 3 недели напомним</b><div class="muted">«Пора освежить стрижку» — и сразу предложим окно у вашего мастера</div></div></div>`;
  }

  // ── Мои ──────────────────────────────────────────────
  function renderMy() {
    if (!bookings.length) return `<div class="eyebrow">Мои записи</div><h1 class="title">Пока <em>пусто</em></h1>
      <div class="empty">Запишитесь в пару нажатий — свободные окна на главной.</div><div style="height:12px"></div><button type="button" class="btn" data-act="tab" data-id="now">Смотреть окна</button>`;
    return `<div class="eyebrow">Мои записи</div><h1 class="title">Скоро <em>стрижка</em></h1>
      ${bookings.map((b) => `${ticket(b)}<div class="btn-row"><button type="button" class="btn ghost" data-act="move" data-id="${b.id}">Перенести</button><button type="button" class="btn ghost" data-act="cancel" data-id="${b.id}">Отменить</button></div>`).join('')}
      <div class="remind"><span class="ic">🔁</span><div><b>Повторить через 3 недели</b><div class="muted">Тот же мастер и услуга — одной кнопкой</div></div></div>
      <p class="footnote">В рабочей версии записи и отмены сразу попадают в YCLIENTS.</p>`;
  }

  function after() {
    if (state.screen === 'book') { const m = master(state.pick.m); setCTA(`Записаться · ${rub(priceOf(m, state.svc))}`, confirm); }
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset;
    switch (act) {
      case 'tab': state.screen = null; state.tab = id; haptic.tap(); render(); break;
      case 'back': goBack(); break;
      case 'svc': state.svc = id; haptic.tap(); render(true); break;
      case 'day': state.day = Number(id); haptic.tap(); render(true); break;
      case 'pick': {
        const p = { m: el.dataset.m, off: Number(el.dataset.off), t: Number(el.dataset.t) };
        if (p.t + svc(state.svc).dur > S.close * 60) state.svc = 'head';
        state.pick = p; state.screen = 'book'; haptic.tap(); render(); break;
      }
      case 'bsvc': state.svc = id; haptic.tap(); render(true); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(S.mapQuery)}`); break;
      case 'cal': toast('В рабочей версии — добавится в календарь телефона'); break;
      case 'gift': toast('Сертификаты — как в нашем демо для салонов, под ваш стиль'); break;
      case 'move': toast('Выберите новое окно — старое освободится само'); bookings = bookings.filter((b) => b.id !== id); save(); state.tab = 'now'; render(); break;
      case 'cancel': {
        const go = () => { bookings = bookings.filter((b) => b.id !== id); save(); haptic.ok(); render(true); toast('Запись отменена — окно освободилось для других'); };
        if (inTG && tgAtLeast('6.2')) tg.showConfirm('Отменить запись?', (ok) => ok && go()); else if (window.confirm('Отменить запись?')) go();
        break;
      }
    }
  });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.screen) goBack(); });

  function updateBadge() { const b = $('.tabs .badge'); b.hidden = !bookings.length; b.textContent = bookings.length; }
  updateBadge();
  render();
})();
