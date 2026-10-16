(() => {
  'use strict';

  const D = window.KOMNATA;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (name) => `../img/${name}.jpg`;
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const fmtDur = (m) => [Math.floor(m / 60) && `${Math.floor(m / 60)} ч`, m % 60 && `${m % 60} мин`].filter(Boolean).join(' ');
  const service = (id) => D.services.find((s) => s.id === id);
  const branch = (id) => D.branches.find((b) => b.id === id);
  const designById = (id) => D.designs.find((d) => d.id === id) || D.designs[0];
  const minPrice = (s) => Math.min(...s.options.map((o) => o.price));
  const priceFrom = (s) => (s.options.length > 1 || s.from ? 'от ' : '') + rub(minPrice(s));
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const fmtDay = (k) => { const d = parseKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${d.toLocaleString('ru-RU', { month: 'short' }).replace('.', '')}`; };
  const startOf = (b) => { const d = parseKey(b.date); d.setMinutes(b.time); return d; };

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready();
    tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#161310'); tg.setBackgroundColor('#0F0D0B'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#0F0D0B');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const confirmDialog = (text) => new Promise((resolve) => {
    if (tgAtLeast('6.2')) tg.showConfirm(text, (ok) => resolve(ok)); else resolve(window.confirm(text));
  });

  // ── Записи (демо: на устройстве и в облаке Telegram) ─
  const KEY = 'komnata_concept_bookings';
  let bookings = [];
  try { bookings = JSON.parse(localStorage.getItem(KEY)) || []; } catch { bookings = []; }
  function save() {
    const json = JSON.stringify(bookings);
    try { localStorage.setItem(KEY, json); } catch { /* живём в памяти */ }
    if (tgAtLeast('6.9')) tg.CloudStorage.setItem(KEY, json, () => {});
    updateDot();
  }
  if (tgAtLeast('6.9')) {
    tg.CloudStorage.getItem(KEY, (err, val) => {
      if (err || !val) return;
      try { const c = JSON.parse(val); if (Array.isArray(c) && c.length >= bookings.length) { bookings = c; updateDot(); if (!state.flow) render(); } } catch { /* игнор */ }
    });
  }
  const upcoming = () => bookings.filter((b) => startOf(b) > new Date()).sort((a, b) => startOf(a) - startOf(b));
  const past = () => bookings.filter((b) => startOf(b) <= new Date()).sort((a, b) => startOf(b) - startOf(a));

  // ── Свободное время (демо-генерация, стабильная по дню) ─
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const feedFree = (br, dKey, t) => hash(`${br}|feed|${dKey}|${t}`) % 100 < 14;
  const nowMinFor = (dKey) => { const n = new Date(); return dKey === dateKey(n) ? n.getHours() * 60 + n.getMinutes() + 30 : -1; };

  // Окошко из «Свободного времени» всегда доступно; остальные — примерно 60% начал свободны
  function isFree(br, level, dKey, start, dur, ignoreId) {
    if (!(feedFree(br, dKey, start) || hash(`${br}|${level}|${dKey}|${start}`) % 100 >= 40)) return false;
    return !bookings.some((b) => b.id !== ignoreId && b.branch === br && b.level === level && b.date === dKey &&
      start < b.time + b.dur && b.time < start + dur);
  }

  function slotsFor(br, level, dur, dKey, ignoreId) {
    const out = []; const nowMin = nowMinFor(dKey);
    for (let t = D.salon.open; t + dur <= D.salon.close; t += 30) {
      if (t > nowMin && isFree(br, level, dKey, t, dur, ignoreId)) out.push(t);
    }
    return out;
  }

  function feedFor(br, dKey) {
    const out = []; const nowMin = nowMinFor(dKey);
    // Показываем только окошки, куда помещается самая долгая популярная услуга (до 2 ч)
    for (let t = D.salon.open; t + (branch(br).feedDur || 120) <= D.salon.close; t += 30) if (t > nowMin && feedFree(br, dKey, t)) out.push(t);
    return out.slice(0, 6);
  }

  const nextDays = (n) => { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { out.push(dateKey(d)); d.setDate(d.getDate() + 1); } return out; };

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'home', branch: D.branches[0].id, flow: null, done: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');

  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      tg.MainButton.setParams({ text, color: enabled ? '#C9A86A' : '#3A342C', text_color: enabled ? '#1A140B' : '#8A8278', is_active: enabled, is_visible: true });
    } else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.disabled = !enabled; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);
  const setBack = (v) => { if (inTG) { if (v) tg.BackButton.show(); else tg.BackButton.hide(); } };
  if (inTG) tg.BackButton.onClick(() => goBack());

  function render(soft = false) {
    const inFlow = !!state.flow;
    tabs.hidden = inFlow;
    view.classList.toggle('no-tabs', inFlow);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(inFlow || !!state.done);
    const html = inFlow ? renderFlow() : state.done ? renderDone()
      : ({ home: renderHome, services: renderServices, designs: renderDesigns, mine: renderMine })[state.tab]();
    const daysScroll = soft && $('.days') ? $('.days').scrollLeft : null;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); }
    if (daysScroll != null && $('.days')) $('.days').scrollLeft = daysScroll;
    if (inFlow) afterFlowRender(soft);
  }

  const svcCard = (s, act = 'book-svc', sel = false) => `
    <button type="button" class="svc ${sel ? 'sel' : ''}" data-act="${act}" data-id="${s.id}">
      <img class="ph" src="${img(s.img)}" alt="" loading="lazy">
      <div class="body"><div class="name">${esc(s.name)}</div><div class="desc">${esc(s.desc)}</div>
      <div class="meta"><span class="price">${priceFrom(s)}</span> <span class="muted">· ${fmtDur(Math.min(...s.options.map((o) => o.dur)))}${s.options.length > 1 ? '+' : ''}</span></div></div>
      ${act === 'book-svc' ? '<span class="plus">+</span>' : ''}
    </button>`;

  const nailsArt = (item) => `<div class="nails">${item.nails.map((n) => n.startsWith('#') ? `<span class="nail" style="background:linear-gradient(180deg,${n},${n}cc)"></span>` : `<span class="nail ${n}"></span>`).join('')}</div>`;

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = tgUser && tgUser.first_name ? `, ${esc(tgUser.first_name)}` : '';
    const days = nextDays(2);
    const feed = days.map((k, i) => {
      const rows = D.branches.map((b) => ({ b, times: feedFor(b.id, k) })).filter((r) => r.times.length);
      if (!rows.length) return '';
      return `<div class="day">${i === 0 ? 'Сегодня' : 'Завтра'}, ${fmtDay(k)}</div>${rows.map((r) => `
        <div class="row"><div class="lbl">${r.b.ico} ${esc(r.b.slotLabel)}</div>
        <div class="times">${r.times.map((t) => `<button type="button" class="time" data-act="feed" data-b="${r.b.id}" data-d="${k}" data-t="${t}">${hm(t)}</button>`).join('')}</div></div>`).join('')}`;
    }).join('');
    const next = upcoming()[0];
    return `
      <div class="muted" style="margin-bottom:10px">${hello}${name}</div>
      <section class="hero">
        <img src="${img('hero')}" alt="">
        <span class="tag">Салон красоты · ★ ${esc(D.salon.rating)}</span>
        <h1>${esc(D.salon.name)}</h1>
        <p>${esc(D.salon.tagline)}</p>
        <button type="button" class="btn" data-act="book">Записаться</button>
      </section>
      ${next ? `<div class="h3">Ваш визит</div>${apptCard(next, true)}` : ''}
      <div class="h3">Свободные окошки</div>
      <section class="free">
        <span class="live">обновляется само</span>
        ${feed || '<div class="muted" style="margin-top:8px">На сегодня и завтра всё занято — загляните в запись на другие дни</div>'}
        <div class="hint">Нажмите на время — запишем на него. В рабочей версии окошки берутся из YCLIENTS сами, без ручных постов.</div>
      </section>
      <div class="h3">Куда записаться</div>
      <div class="doors">${D.branches.map((b) => `
        <button type="button" class="door" data-act="branch" data-id="${b.id}"><img src="${img(b.img)}" alt="" loading="lazy"><b>${b.ico} ${esc(b.name)}</b><span>${esc(b.note)}</span></button>`).join('')}
      </div>
      <div class="h3">Спецпредложения <button type="button" data-act="tab" data-id="designs">все</button></div>
      ${D.specials.slice(0, 2).map((p) => `<button type="button" class="drop-card" style="margin-bottom:8px" data-act="book-svc" data-id="${p.svc}"><img src="${img(p.img)}" alt="" style="width:56px;height:56px;border-radius:12px;object-fit:cover;flex:none"><div><div class="t">${esc(p.title)}</div><div class="s">${esc(p.text)}</div></div></button>`).join('')}
      <section class="partner" style="margin-top:2px"><b>🎁 ${esc(D.newClient.title)}</b><div class="muted" style="margin-top:4px">${esc(D.newClient.text)}</div></section>
      <div class="h3">Контакты</div>
      <section class="contacts">
        <b>${esc(D.salon.address)}</b>
        <div class="muted">${esc(D.salon.metro)}</div>
        <div class="btn-row"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="chat">Написать</button></div>
      </section>
      <p class="footnote">Концепт приложения для салона Mara.<br>Услуги, цены и уровни мастеров — из открытой онлайн-записи салона. Окошки — пример. Фото — Unsplash.</p>`;
  }

  // ── Услуги ───────────────────────────────────────────
  const seg = (act) => `<div class="seg">${D.branches.map((b) => `<button type="button" class="${b.id === state.branch ? 'on' : ''}" data-act="${act}" data-id="${b.id}">${b.ico} ${esc(b.name)}</button>`).join('')}</div>`;

  function servicesList(br, act, selId) {
    const list = D.services.filter((s) => s.branch === br);
    const groups = [...new Set(list.map((s) => s.group))];
    return groups.map((g) => `<div class="group">${esc(g)}</div>${list.filter((s) => s.group === g).map((s) => svcCard(s, act, s.id === selId)).join('')}`).join('');
  }

  function renderServices() {
    return `<h1 class="title">Услуги</h1>${seg('seg')}${servicesList(state.branch, 'book-svc')}
      <p class="footnote">Цены — как в онлайн-записи салона</p>`;
  }

  // ── Дизайны месяца ───────────────────────────────────
  function renderDesigns() {
    return `<h1 class="title">Акции</h1>
      ${D.specials.map((p) => `<article class="design"><img src="${img(p.img)}" alt="" style="width:100%;height:150px;object-fit:cover;border-radius:14px;margin:4px 0 10px"><b>${esc(p.title)}</b><div class="muted">${esc(p.text)}</div>
        <button type="button" class="btn" data-act="book-svc" data-id="${p.svc}">Записаться</button></article>`).join('')}
      <section class="partner"><b>🎁 ${esc(D.newClient.title)}</b><div class="muted" style="margin-top:4px">${esc(D.newClient.text)}</div></section>
      <p class="footnote">Акции — из онлайн-записи и постов салона</p>`;
  }

  // ── Мои записи ───────────────────────────────────────
  function apptCard(b, compact) {
    const s = service(b.service); const isPast = startOf(b) <= new Date();
    const extra = [b.level, b.design && b.design !== 'none' ? designById(b.design).name + (b.designName ? ` «${b.designName}»` : '') : '', b.drink ? '☕ ' + b.drink : ''].filter(Boolean).join(' · ');
    return `<div class="appt ${isPast ? 'past' : ''}"><b>${esc(s.name)}</b>
      <div class="muted">${esc(branch(b.branch).name)} · ${esc(extra)}</div>
      <div class="row"><span class="price">${fmtDay(b.date)} · ${hm(b.time)}</span><span class="price">${rub(b.price)}</span></div>
      ${isPast || compact ? '' : `<div class="btn-row"><button type="button" class="btn ghost" data-act="resched" data-id="${b.id}">Перенести</button>
        <button type="button" class="btn danger" data-act="cancel" data-id="${b.id}">Отменить</button></div>`}</div>`;
  }

  function renderMine() {
    const up = upcoming(); const old = past();
    if (!up.length && !old.length) {
      return `<h1 class="title">Мои записи</h1><div class="empty">Пока нет записей.<br>Стрижка, окрашивание или SPA-уход — запись за полминуты.</div>
        <div style="height:14px"></div><button type="button" class="btn" data-act="book">Записаться</button>`;
    }
    return `<h1 class="title">Мои записи</h1>${up.map((b) => apptCard(b)).join('') || '<div class="empty">Предстоящих визитов нет</div>'}
      ${old.length ? `<div class="h3">Прошедшие</div>${old.map((b) => apptCard(b)).join('')}` : ''}`;
  }

  function renderDone() {
    const b = bookings.find((x) => x.id === state.done);
    if (!b) { state.done = null; return renderMine(); }
    return `<div class="ok">✓</div>
      <div class="center title" style="margin-bottom:4px">${b.edited ? 'Запись перенесена' : 'Вы записаны'}</div>
      <div class="center muted">Ждём вас в ${esc(D.salon.name)}${b.drink ? ' — и ' + esc(b.drink.toLowerCase()) : ''}!</div>
      <div class="note">В рабочей версии запись сразу попадает в YCLIENTS салона — администратору ничего не нужно переносить. Подтверждение и напоминание придут от бота салона.</div>
      ${apptCard(b, true)}
      <div class="stack" style="margin-top:12px">
        <button type="button" class="btn ghost" data-act="tab" data-id="mine">Мои записи</button>
        <button type="button" class="btn ghost" data-act="tab" data-id="home">На главную</button></div>`;
  }

  // ── Запись: 1 услуга → 2 детали → 3 время → 4 контакты ─
  const needDetails = (s) => s.options.length > 1 || !!s.design;
  const flowDur = (f) => { const s = service(f.service); return s.options[f.opt].dur + (s.design ? designById(f.design).dur : 0); };
  const flowPrice = (f) => { const s = service(f.service); return s.options[f.opt].price + (s.design ? designById(f.design).price : 0); };

  function startFlow(init = {}) {
    state.done = null;
    state.flow = Object.assign({
      step: 1, branch: state.branch, service: null, opt: 0, design: 'none', designName: '', date: null, time: null, prefTime: null,
      name: (tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')) || '', phone: '', comment: '', drink: '', consent: false,
      editId: null, from: state.tab,
    }, init);
    const f = state.flow;
    if (f.service && f.step === 1) f.step = needDetails(service(f.service)) ? 2 : 3;
    haptic.tap(); render();
  }

  function goBack() {
    if (state.done) { state.done = null; state.tab = 'mine'; render(); return; }
    const f = state.flow; if (!f) return;
    let step = f.step - 1;
    if (f.editId) step = 0;
    if (step === 2 && !needDetails(service(f.service))) step = 1;
    if (step === 1 && f.lockService) step = 0;
    if (step < 1) { state.tab = f.from; state.flow = null; } else f.step = step;
    haptic.tap(); render();
  }

  function renderFlow() {
    const f = state.flow;
    const s = f.service && service(f.service);
    const head = `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <div class="muted">${f.editId ? 'Перенос записи' : `Шаг ${f.step} из 4`}</div>
      <div class="steps">${[1, 2, 3, 4].map((i) => `<span class="${i <= f.step ? 'on' : ''}"></span>`).join('')}</div>`;
    const summary = s ? `<div class="summary"><img src="${img(s.img)}" alt=""><div><b>${esc(s.name)}</b><br>
      <span class="muted">${f.step > 2 ? esc(s.options[f.opt].label) + (s.design && f.design !== 'none' ? ' · ' + esc(designById(f.design).name) : '') + ' · ' : ''}${fmtDur(flowDur(f))}</span>
      · <span class="price">${rub(flowPrice(f))}</span></div></div>` : '';

    if (f.step === 1) {
      const pref = f.prefTime != null ? `<div class="note gold">Окошко ${fmtDay(f.date)}, ${hm(f.prefTime)} — выберите услугу</div>` : '';
      return `${head}<h1 class="title">Что делаем?</h1>${pref}${f.prefTime != null ? '' : seg('f-branch')}${servicesList(f.branch, 'f-svc', f.service)}`;
    }

    if (f.step === 2) {
      const opts = s.options.length > 1 ? `<div class="h3" style="margin-top:0">${esc(s.optTitle || 'Уровень мастера')}</div>
        ${s.options.map((o, i) => `<button type="button" class="opt ${i === f.opt ? 'sel' : ''}" data-act="f-opt" data-id="${i}"><span><b>${esc(o.label)}</b><br><span class="muted">${fmtDur(o.dur)}</span></span><span class="price">${rub(o.price)}</span></button>`).join('')}` : '';
      const des = s.design ? `<div class="h3">Дизайн</div><div class="chips">${D.designs.map((d) => `<button type="button" class="chip ${d.id === f.design ? 'on' : ''}" data-act="f-design" data-id="${d.id}">${esc(d.name)}${d.price ? ` <small>+${rub(d.price)}</small>` : ''}</button>`).join('')}</div>
        ${f.design === 'month' ? `<div class="muted" style="margin:12px 0 6px">Какой из октябрьских?</div><div class="chips">${D.monthDrop.items.map((it) => `<button type="button" class="chip ${it.name === f.designName ? 'on' : ''}" data-act="f-dname" data-id="${esc(it.name)}">${esc(it.name)}</button>`).join('')}</div>` : ''}` : '';
      return `${head}${summary}<h1 class="title">Детали</h1>${opts}${des}<div class="total"><span>Итого</span><span>${rub(flowPrice(f))} · ${fmtDur(flowDur(f))}</span></div>`;
    }

    if (f.step === 3) {
      const days = nextDays(14); const dur = flowDur(f); const level = s.options[f.opt].label;
      if (!f.date || !days.includes(f.date)) f.date = days.find((k) => slotsFor(f.branch, level, dur, k, f.editId).length) || days[0];
      const slots = slotsFor(f.branch, level, dur, f.date, f.editId);
      if (f.prefTime != null && f.time == null && slots.includes(f.prefTime)) f.time = f.prefTime;
      return `${head}${summary}<h1 class="title">Дата и время</h1>
        <div class="month">${parseKey(f.date).toLocaleString('ru-RU', { month: 'long' })}</div>
        <div class="days">${days.map((k) => { const d = parseKey(k); return `<button type="button" class="dayb ${k === f.date ? 'on' : ''}" data-act="f-day" data-id="${k}"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>
        ${slots.length ? `<div class="slots">${slots.map((t) => `<button type="button" class="slot ${t === f.time ? 'on' : ''}" data-act="f-time" data-id="${t}">${hm(t)}</button>`).join('')}</div>`
          : '<div class="empty">На этот день всё занято.<br>Выберите другую дату.</div>'}`;
    }

    return `${head}${summary}<h1 class="title">Почти готово</h1>
      <div class="muted" style="margin:-6px 0 14px">${fmtDay(f.date)}, ${hm(f.time)} · ${esc(branch(f.branch).name)}</div>
      <label class="field"><span>Имя</span><input id="f-name" autocomplete="name" value="${esc(f.name)}" placeholder="Как к вам обращаться"></label>
      <label class="field"><span>Телефон</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" placeholder="+7 900 000-00-00"></label>
      ${D.drinks.length ? `<div class="field"><span>Кофе или чай к визиту</span><div class="chips">
        <button type="button" class="chip ${!f.drink ? 'on' : ''}" data-act="f-drink" data-id="">Не нужно</button>
        ${D.drinks.map((g) => g.items.map((d) => `<button type="button" class="chip ${f.drink === `${g.group}: ${d}` ? 'on' : ''}" data-act="f-drink" data-id="${esc(`${g.group}: ${d}`)}">${g.group === 'Кофе' ? '☕' : '🍵'} ${esc(d)}</button>`).join('')).join('')}
      </div></div>` : ''}
      <label class="field"><span>Комментарий мастеру</span><textarea id="f-comment" placeholder="Например, референс или пожелания">${esc(f.comment)}</textarea></label>
      <label class="consent"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''}><span>Согласен(на) на обработку персональных данных и с политикой конфиденциальности салона</span></label>
      <div class="total"><span>К оплате в салоне</span><span>${rub(flowPrice(f))}</span></div>`;
  }

  const formOk = (f) => f.name.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 10 && f.consent;

  function afterFlowRender(soft) {
    const f = state.flow;
    if (f.step === 2) setCTA(`Выбрать время · ${rub(flowPrice(f))}`, !(f.design === 'month' && !f.designName && service(f.service).design), () => { f.step = 3; haptic.tap(); render(); });
    if (f.step === 3) {
      setCTA(f.time != null ? `Продолжить · ${fmtDay(f.date)}, ${hm(f.time)}` : 'Выберите время', f.time != null, () => { f.step = 4; haptic.tap(); render(); });
      const days = $('.days'); const on = $('.dayb.on');
      if (!soft && days && on) days.scrollLeft = on.offsetLeft - days.clientWidth / 2 + on.offsetWidth / 2;
    }
    if (f.step === 4) {
      const sync = () => {
        f.name = $('#f-name').value; f.phone = $('#f-phone').value; f.comment = $('#f-comment').value; f.consent = $('#f-consent').checked;
        setCTA(f.editId ? 'Перенести запись' : 'Записаться', formOk(f), submit);
      };
      ['#f-name', '#f-phone', '#f-comment'].forEach((sel) => $(sel).addEventListener('input', sync));
      $('#f-consent').addEventListener('change', sync);
      sync();
    }
  }

  function submit() {
    const f = state.flow;
    if (!formOk(f)) { haptic.warn(); return; }
    const s = service(f.service);
    const data = { branch: f.branch, service: f.service, level: s.options[f.opt].label, opt: f.opt, design: s.design ? f.design : 'none', designName: f.design === 'month' ? f.designName : '',
      dur: flowDur(f), price: flowPrice(f), date: f.date, time: f.time, drink: f.drink, name: f.name.trim(), phone: f.phone.trim(), comment: f.comment.trim() };
    let id;
    if (f.editId) { const b = bookings.find((x) => x.id === f.editId); Object.assign(b, data, { edited: true }); id = b.id; }
    else { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); bookings.push(Object.assign({ id }, data)); }
    save(); haptic.ok();
    state.flow = null; state.done = id; state.tab = 'mine';
    render();
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); };

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset; const f = state.flow;
    switch (act) {
      case 'tab': state.flow = null; state.done = null; state.tab = id; haptic.tap(); render(); break;
      case 'book': startFlow(); break;
      case 'branch': state.branch = id; startFlow({ branch: id }); break;
      case 'book-svc': startFlow({ branch: service(id).branch, service: id, lockService: true }); break;
      case 'seg': state.branch = id; haptic.tap(); render(true); break;
      case 'feed': startFlow({ branch: el.dataset.b, date: el.dataset.d, prefTime: Number(el.dataset.t) }); break;
      case 'want': {
        const it = D.monthDrop.items.find((x) => x.id === id);
        startFlow({ branch: 'nails', service: 'gel', design: 'month', designName: it.name, lockService: false });
        break;
      }
      case 'back': goBack(); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.salon.mapQuery)}`); break;
      case 'chat': toast('В рабочей версии откроется чат с администратором салона'); break;

      case 'f-branch': f.branch = id; state.branch = id; f.service = null; haptic.tap(); render(true); break;
      case 'f-svc': f.service = id; f.opt = 0; f.time = null; if (!service(id).design) f.design = 'none'; f.step = needDetails(service(id)) ? 2 : 3; haptic.tap(); render(); break;
      case 'f-opt': f.opt = Number(id); f.time = null; haptic.tap(); render(true); break;
      case 'f-design': f.design = id; if (id !== 'month') f.designName = ''; f.time = null; haptic.tap(); render(true); break;
      case 'f-dname': f.designName = id; haptic.tap(); render(true); break;
      case 'f-day': f.date = id; f.time = null; haptic.tap(); render(true); break;
      case 'f-time': f.time = Number(id); haptic.tap(); render(true); break;
      case 'f-drink': f.drink = id; haptic.tap(); render(true); break;

      case 'resched': {
        const b = bookings.find((x) => x.id === id);
        startFlow({ step: 3, branch: b.branch, service: b.service, opt: b.opt, design: b.design, designName: b.designName, date: b.date, editId: b.id,
          name: b.name, phone: b.phone, comment: b.comment, drink: b.drink, consent: true });
        break;
      }
      case 'cancel': {
        const b = bookings.find((x) => x.id === id);
        if (!(await confirmDialog(`Отменить запись «${service(b.service).name}» на ${fmtDay(b.date)}, ${hm(b.time)}?`))) return;
        bookings = bookings.filter((x) => x.id !== id); save(); haptic.warn(); toast('Запись отменена'); render();
        break;
      }
    }
  });

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.flow = null; state.done = null; state.tab = b.dataset.tab; haptic.tap(); render();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (state.flow || state.done)) goBack(); });

  function updateDot() { $('.tabs .dot').hidden = upcoming().length === 0; }
  updateDot();
  render();
})();
