(() => {
  'use strict';

  const tg = window.Telegram && window.Telegram.WebApp;

  // Ссылка t.me/<бот>?startapp=komnata открывает персональный концепт для клиента из папки komnata/
  const PITCHES = ['komnata', 'budsoboy', 'labuket', 'mmdance'];
  const startParam = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;
  if (PITCHES.includes(startParam)) { location.replace(`${startParam}/${location.hash}`); return; }

  const D = window.SALON_DATA;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (name) => `img/${name}.jpg`;
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const fmtDur = (m) => [Math.floor(m / 60) && `${Math.floor(m / 60)} ч`, m % 60 && `${m % 60} мин`].filter(Boolean).join(' ');
  const priceOf = (s) => (s.from ? 'от ' : '') + rub(s.price);
  const service = (id) => D.services.find((s) => s.id === id);
  const master = (id) => D.masters.find((m) => m.id === id);
  const mastersFor = (svc) => D.masters.filter((m) => m.cats.includes(svc.cat));
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
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#0E0D0C'); tg.setBackgroundColor('#0E0D0C'); } // свои HEX-цвета — с версии 6.9
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#0E0D0C');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;

  function openLink(url) {
    if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener');
  }

  function confirmDialog(text) {
    return new Promise((resolve) => {
      if (tgAtLeast('6.2')) tg.showConfirm(text, (ok) => resolve(ok));
      else resolve(window.confirm(text));
    });
  }

  // ── Хранилище записей (демо: на устройстве; в Telegram ещё и в облаке Telegram) ──
  const KEY = 'velvet_demo_bookings';
  let bookings = [];
  try { bookings = JSON.parse(localStorage.getItem(KEY)) || []; } catch { bookings = []; }

  function save() {
    const json = JSON.stringify(bookings);
    try { localStorage.setItem(KEY, json); } catch { /* приватный режим: живём в памяти */ }
    if (tgAtLeast('6.9')) tg.CloudStorage.setItem(KEY, json, () => {});
    updateDot();
  }

  if (tgAtLeast('6.9')) {
    tg.CloudStorage.getItem(KEY, (err, val) => {
      if (err || !val) return;
      try {
        const cloud = JSON.parse(val);
        if (Array.isArray(cloud) && cloud.length >= bookings.length) { bookings = cloud; updateDot(); if (state.tab === 'mine' && !state.flow) render(); }
      } catch { /* битые данные игнорируем */ }
    });
  }

  const upcoming = () => bookings.filter((b) => startOf(b) > new Date()).sort((a, b) => startOf(a) - startOf(b));
  const past = () => bookings.filter((b) => startOf(b) <= new Date()).sort((a, b) => startOf(b) - startOf(a));

  // ── Свободное время (демо-генерация, стабильная для мастера и дня) ──
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  function isFree(m, dKey, start, dur, ignoreId) {
    const end = start + dur;
    for (let t = start; t < end; t += 30) {
      if (hash(`${m.id}|${dKey}|${t}`) % 100 < 30) return false; // «занято» другими гостями
    }
    return !bookings.some((b) => b.id !== ignoreId && b.master === m.id && b.date === dKey &&
      start < b.time + service(b.service).dur && b.time < end);
  }

  function slotsFor(svc, masterId, dKey, ignoreId) {
    const list = masterId === 'any' ? mastersFor(svc) : [master(masterId)];
    const now = new Date();
    const nowMin = dKey === dateKey(now) ? now.getHours() * 60 + now.getMinutes() + 30 : -1;
    const out = [];
    for (let t = D.salon.open; t + svc.dur <= D.salon.close; t += 30) {
      if (t <= nowMin) continue;
      const free = list.find((m) => isFree(m, dKey, t, svc.dur, ignoreId));
      if (free) out.push({ time: t, master: free.id });
    }
    return out;
  }

  function nextDays(n) {
    const out = []; const d = new Date();
    for (let i = 0; i < n; i++) { out.push(dateKey(d)); d.setDate(d.getDate() + 1); }
    return out;
  }

  // ── Состояние ────────────────────────────────────────
  const state = {
    tab: 'home',
    cat: D.categories[0].id,
    flow: null, // { step, service, master, lockedMaster, date, time, slotMaster, name, phone, comment, consent, editId, from }
    done: null, // id только что созданной записи
  };

  const view = $('#view');
  const tabs = $('#tabs');
  const cta = $('#cta');
  const ctaBtn = $('#cta-btn');

  // ── Нижняя кнопка: Telegram MainButton или своя ─────
  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      tg.MainButton.setParams({ text, color: enabled ? '#C9A86A' : '#3A342C', text_color: enabled ? '#1A140B' : '#8A8278', is_active: enabled, is_visible: true });
    } else {
      cta.hidden = !text;
      ctaBtn.textContent = text || '';
      ctaBtn.disabled = !enabled;
    }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);

  function setBack(visible) {
    if (!inTG) return;
    if (visible) tg.BackButton.show(); else tg.BackButton.hide();
  }
  if (inTG) tg.BackButton.onClick(() => goBack());

  // ── Рендер ───────────────────────────────────────────
  // soft: обновить экран на месте (без анимации и прокрутки наверх)
  function render(soft = false) {
    const inFlow = !!state.flow;
    tabs.hidden = inFlow;
    view.classList.toggle('no-tabs', inFlow);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(inFlow || !!state.done);

    let html;
    if (inFlow) html = renderFlow();
    else if (state.done) html = renderDone();
    else html = ({ home: renderHome, services: renderServices, masters: renderMasters, mine: renderMine })[state.tab]();

    const daysScroll = soft && $('.days') ? $('.days').scrollLeft : null;
    view.innerHTML = html;
    if (!soft) {
      view.style.animation = 'none'; void view.offsetWidth; view.style.animation = '';
      window.scrollTo(0, 0);
    }
    if (daysScroll != null && $('.days')) $('.days').scrollLeft = daysScroll;
    if (inFlow) afterFlowRender(soft);
  }

  function svcCard(s, opts = {}) {
    return `<button type="button" class="svc ${opts.sel ? 'sel' : ''}" data-act="${opts.act || 'book-svc'}" data-id="${s.id}">
      <img class="ph" src="${img(s.img)}" alt="" loading="lazy">
      <div class="body"><div class="name">${esc(s.name)}</div><div class="desc">${esc(s.desc)}</div>
      <div class="meta"><span class="price">${priceOf(s)}</span> <span class="muted">· ${fmtDur(s.dur)}</span></div></div>
      ${opts.noPlus ? '' : '<span class="plus">+</span>'}
    </button>`;
  }

  function renderHome() {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = tgUser && tgUser.first_name ? `, ${esc(tgUser.first_name)}` : '';
    const next = upcoming()[0];
    return `
      <div class="greet">${hello}${name}</div>
      <section class="hero">
        <img src="${img('hero')}" alt="">
        <span class="badge">BEAUTY STUDIO · СПб</span>
        <h1>${esc(D.salon.name)}</h1>
        <p>${esc(D.salon.tagline)}</p>
        <button type="button" class="btn" data-act="book">Записаться</button>
      </section>
      ${next ? `<div class="h3">Ваш ближайший визит</div>${apptCard(next, true)}` : ''}
      <div class="h3">Акции</div>
      <div class="hscroll">${D.promos.map((p) => `
        <button type="button" class="promo" data-act="book"><img src="${img(p.img)}" alt="" loading="lazy"><b>${esc(p.title)}</b><span>${esc(p.text)}</span></button>`).join('')}
      </div>
      <div class="h3">Популярное <button type="button" data-act="tab" data-id="services">все услуги</button></div>
      ${D.services.filter((s) => s.popular).map((s) => svcCard(s)).join('')}
      <div class="h3">О салоне</div>
      <section class="about">
        <img src="${img('interior')}" alt="Интерьер салона" loading="lazy">
        <div class="in">
          <b>${esc(D.salon.name)}</b>
          <div class="muted">${esc(D.salon.area)}<br>${esc(D.salon.hours)}</div>
          <div class="btn-row">
            <button type="button" class="btn ghost" data-act="route">Маршрут</button>
            <button type="button" class="btn ghost" data-act="call">Позвонить</button>
          </div>
        </div>
      </section>
      <p class="footnote">Демо-приложение. Салон, мастера и цены вымышлены.<br>Фото: Unsplash</p>`;
  }

  function renderServices() {
    return `
      <h1 class="title">Услуги</h1>
      <div class="chips">${D.categories.map((c) => `<button type="button" class="chip ${c.id === state.cat ? 'on' : ''}" data-act="cat" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
      ${D.services.filter((s) => s.cat === state.cat).map((s) => svcCard(s)).join('')}`;
  }

  function renderMasters() {
    return `
      <h1 class="title">Мастера</h1>
      ${D.masters.map((m) => `
        <article class="master">
          <div class="top">
            <img class="avatar" src="${img(m.photo)}" alt="" loading="lazy">
            <div><div class="name">${esc(m.name)}</div><div class="muted">${esc(m.role)} · ${esc(m.exp)}</div>
            <div class="stars">★★★★★ <span class="muted">${m.rating.toFixed(1)} · ${m.reviews} отзывов</span></div></div>
          </div>
          <div class="works">${m.works.map((w) => `<img src="${img(w)}" alt="" loading="lazy">`).join('')}</div>
          <button type="button" class="btn ghost" data-act="book-master" data-id="${m.id}">Записаться к ${esc(m.nameTo || m.name)}</button>
        </article>`).join('')}`;
  }

  function apptCard(b, compact) {
    const s = service(b.service); const m = master(b.master);
    const isPast = startOf(b) <= new Date();
    return `<div class="appt ${isPast ? 'past' : ''}">
      <b>${esc(s.name)}</b>
      <div class="muted">${esc(m.name)} · ${esc(D.salon.name)}</div>
      <div class="row"><span class="price">${fmtDay(b.date)} · ${hm(b.time)}</span><span class="price">${priceOf(s)}</span></div>
      ${isPast || compact ? '' : `<div class="btn-row">
        <button type="button" class="btn ghost" data-act="resched" data-id="${b.id}">Перенести</button>
        <button type="button" class="btn danger" data-act="cancel" data-id="${b.id}">Отменить</button></div>
        <button type="button" class="btn ghost" style="margin-top:8px" data-act="calendar" data-id="${b.id}">Добавить в календарь</button>`}
    </div>`;
  }

  function renderMine() {
    const up = upcoming(); const old = past();
    if (!up.length && !old.length) {
      return `<h1 class="title">Мои записи</h1>
        <div class="empty">Пока нет записей.<br>Выберите услугу — это займёт полминуты.</div>
        <div style="height:14px"></div><button type="button" class="btn" data-act="book">Записаться</button>`;
    }
    return `<h1 class="title">Мои записи</h1>
      ${up.map((b) => apptCard(b)).join('') || '<div class="empty">Предстоящих визитов нет</div>'}
      ${old.length ? `<div class="h3">Прошедшие</div>${old.map((b) => apptCard(b)).join('')}` : ''}`;
  }

  function renderDone() {
    const b = bookings.find((x) => x.id === state.done);
    if (!b) { state.done = null; return renderMine(); }
    return `
      <div class="ok">✓</div>
      <div class="center title" style="margin-bottom:4px">${b.edited ? 'Запись перенесена' : 'Вы записаны'}</div>
      <div class="center muted" style="margin-bottom:20px">Ждём вас! В рабочей версии бот напомнит о визите за день.</div>
      ${apptCard(b, true)}
      <div class="stack" style="margin-top:14px">
        <button type="button" class="btn ghost" data-act="calendar" data-id="${b.id}">Добавить в календарь</button>
        <button type="button" class="btn ghost" data-act="tab" data-id="mine">Мои записи</button>
        <button type="button" class="btn ghost" data-act="tab" data-id="home">На главную</button>
      </div>`;
  }

  // ── Мастер записи ────────────────────────────────────
  function startFlow(init = {}) {
    state.done = null;
    state.flow = Object.assign({
      step: 1, service: null, master: null, lockedMaster: false, date: null, time: null, slotMaster: null,
      name: (tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')) || '',
      phone: '', comment: '', consent: false, editId: null, from: state.tab,
    }, init);
    const f = state.flow;
    if (f.service && f.step === 1) f.step = 2;
    if (f.step === 2 && f.master) f.step = 3;
    // Если мастер один — шаг выбора мастера пропускаем
    if (f.step === 2 && mastersFor(service(f.service)).length === 1) { f.master = mastersFor(service(f.service))[0].id; f.step = 3; }
    haptic.tap();
    render();
  }

  function goBack() {
    if (state.done) { state.done = null; state.tab = 'mine'; render(); return; }
    const f = state.flow; if (!f) return;
    let step = f.step - 1;
    if (f.editId) step = 0; // перенос начинается сразу с выбора времени
    if (step === 2 && (f.lockedMaster || mastersFor(service(f.service)).length === 1)) step = 1;
    if (step === 1 && f.preService) step = 0;
    if (step < 1) { state.tab = f.from; state.flow = null; } else f.step = step;
    haptic.tap();
    render();
  }

  function renderFlow() {
    const f = state.flow;
    const s = f.service && service(f.service);
    const stepsBar = `<div class="steps">${[1, 2, 3, 4].map((i) => `<span class="${i <= f.step ? 'on' : ''}"></span>`).join('')}</div>`;
    const head = `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <div class="muted">${f.editId ? 'Перенос записи' : `Шаг ${f.step} из 4`}</div>${stepsBar}`;
    const summary = s ? `<div class="summary"><img src="${img(s.img)}" alt=""><div><b>${esc(s.name)}</b> · <span class="price">${priceOf(s)}</span><br>
      <span class="muted">${f.master ? (f.master === 'any' ? 'Любой мастер' : 'Мастер: ' + esc(master(f.master).name)) + ' · ' : ''}${fmtDur(s.dur)}</span></div></div>` : '';

    if (f.step === 1) {
      const pool = D.services.filter((x) => !f.master || f.master === 'any' || master(f.master).cats.includes(x.cat));
      return `${head}<h1 class="title">Выберите услугу</h1>
        ${D.categories.filter((c) => pool.some((x) => x.cat === c.id)).map((c) => `
          <div class="h3" style="margin-top:6px">${esc(c.name)}</div>
          ${pool.filter((x) => x.cat === c.id).map((x) => svcCard(x, { act: 'f-svc', sel: x.id === f.service, noPlus: true })).join('')}`).join('')}`;
    }

    if (f.step === 2) {
      return `${head}${summary}<h1 class="title">Выберите мастера</h1>
        <button type="button" class="pick ${f.master === 'any' ? 'sel' : ''}" data-act="f-master" data-id="any">
          <span class="any">✦</span><div><b>Любой свободный мастер</b><div class="muted">Покажем больше свободного времени</div></div></button>
        ${mastersFor(s).map((m) => `
          <button type="button" class="pick ${f.master === m.id ? 'sel' : ''}" data-act="f-master" data-id="${m.id}">
            <img class="avatar" src="${img(m.photo)}" alt=""><div><b>${esc(m.name)}</b><div class="muted">${esc(m.role)}</div>
            <div class="stars">★ ${m.rating.toFixed(1)} <span class="muted">· ${m.reviews} отзывов</span></div></div></button>`).join('')}`;
    }

    if (f.step === 3) {
      const days = nextDays(14);
      if (!f.date || !days.includes(f.date)) f.date = days.find((k) => slotsFor(s, f.master, k, f.editId).length) || days[0];
      const slots = slotsFor(s, f.master, f.date, f.editId);
      const month = parseKey(f.date).toLocaleString('ru-RU', { month: 'long' });
      return `${head}${summary}<h1 class="title">Дата и время</h1>
        <div class="month">${month}</div>
        <div class="days">${days.map((k) => { const d = parseKey(k); return `
          <button type="button" class="day ${k === f.date ? 'on' : ''}" data-act="f-day" data-id="${k}"><small>${WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>
        ${slots.length ? `<div class="slots">${slots.map((x) => `
          <button type="button" class="slot ${x.time === f.time ? 'on' : ''}" data-act="f-time" data-id="${x.time}" data-m="${x.master}">${hm(x.time)}</button>`).join('')}</div>`
          : '<div class="empty">На этот день всё занято.<br>Выберите другую дату.</div>'}`;
    }

    // Шаг 4 — контакты
    return `${head}${summary}<h1 class="title">Ваши контакты</h1>
      <div class="muted" style="margin:-6px 0 14px">${fmtDay(f.date)}, ${hm(f.time)} · ${esc(master(f.slotMaster).name)}</div>
      <label class="field"><span>Имя</span><input id="f-name" autocomplete="name" value="${esc(f.name)}" placeholder="Как к вам обращаться"></label>
      <label class="field"><span>Телефон</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" placeholder="+7 900 000-00-00"></label>
      <label class="field"><span>Комментарий (необязательно)</span><textarea id="f-comment" placeholder="Пожелания мастеру">${esc(f.comment)}</textarea></label>
      <label class="consent"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''}>
        <span>Согласен(на) на обработку персональных данных в соответствии с <button type="button" data-act="policy">политикой конфиденциальности</button></span></label>`;
  }

  const phoneOk = (p) => p.replace(/\D/g, '').length >= 10;
  const formOk = (f) => f.name.trim().length >= 2 && phoneOk(f.phone) && f.consent;

  function afterFlowRender(soft) {
    const f = state.flow;
    if (f.step === 3) {
      const label = f.time != null ? `Продолжить · ${fmtDay(f.date)}, ${hm(f.time)}` : 'Выберите время';
      setCTA(label, f.time != null, () => { f.step = 4; haptic.tap(); render(); });
      const days = $('.days'); const on = $('.day.on');
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
    const data = { service: f.service, master: f.slotMaster, date: f.date, time: f.time, name: f.name.trim(), phone: f.phone.trim(), comment: f.comment.trim() };
    let id;
    if (f.editId) {
      const b = bookings.find((x) => x.id === f.editId);
      Object.assign(b, data, { edited: true }); id = b.id;
    } else {
      id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      bookings.push(Object.assign({ id, created: Date.now() }, data));
    }
    save();
    haptic.ok();
    state.flow = null; state.done = id; state.tab = 'mine';
    render();
  }

  // ── Календарь ────────────────────────────────────────
  function addToCalendar(b) {
    const s = service(b.service);
    const start = startOf(b); const end = new Date(start.getTime() + s.dur * 60000);
    const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = `${s.name} — ${D.salon.name}`;
    const details = `Мастер: ${master(b.master).name}. ${D.salon.area}`;
    if (inTG) {
      // В Telegram скачивание файлов ограничено — открываем Google Календарь
      openLink(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${utc(start)}/${utc(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(D.salon.area)}`);
      return;
    }
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Velvet Room demo//RU', 'BEGIN:VEVENT',
      `UID:${b.id}@velvet-demo`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${details}`, `LOCATION:${D.salon.area}`,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Скоро визит', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'velvet-room.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ── Тост и модалка ──────────────────────────────────
  let toastTimer;
  function toast(text) {
    const t = $('#toast'); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function showPolicy() {
    const m = $('#modal');
    m.innerHTML = `<div class="sheet"><div class="title" style="font-size:22px;margin:0">Политика конфиденциальности</div>
      <p>Это демо. В рабочей версии здесь будет политика салона: какие данные собираются (имя, телефон), зачем, где хранятся (на сервере в России) и как отозвать согласие.</p>
      <button type="button" class="btn" data-act="close-modal">Понятно</button></div>`;
    m.hidden = false;
  }

  // ── События ─────────────────────────────────────────
  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) { if (e.target.id === 'modal') $('#modal').hidden = true; return; }
    const { act, id } = el.dataset;
    const f = state.flow;

    switch (act) {
      case 'tab': state.flow = null; state.done = null; state.tab = id; haptic.tap(); render(); break;
      case 'book': startFlow(); break;
      case 'book-svc': startFlow({ service: id, preService: true }); break;
      case 'book-master': startFlow({ master: id, lockedMaster: true }); break;
      case 'cat': state.cat = id; haptic.tap(); render(true); break;
      case 'back': goBack(); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.salon.mapQuery)}`); break;
      case 'call': toast(`Демо: здесь будет звонок на ${D.salon.phone}`); break;
      case 'policy': e.preventDefault(); showPolicy(); break;
      case 'close-modal': $('#modal').hidden = true; break;
      case 'calendar': addToCalendar(bookings.find((b) => b.id === id)); break;

      case 'f-svc': {
        f.service = id; f.time = null;
        if (f.master && f.master !== 'any' && !master(f.master).cats.includes(service(id).cat)) f.master = null;
        const list = mastersFor(service(id));
        if (f.master) f.step = 3;
        else if (list.length === 1) { f.master = list[0].id; f.step = 3; }
        else f.step = 2;
        haptic.tap(); render(); break;
      }
      case 'f-master': f.master = id; f.time = null; f.step = 3; haptic.tap(); render(); break;
      case 'f-day': f.date = id; f.time = null; haptic.tap(); render(true); break;
      case 'f-time': f.time = Number(id); f.slotMaster = el.dataset.m; haptic.tap(); render(true); break;

      case 'resched': {
        const b = bookings.find((x) => x.id === id);
        startFlow({ step: 3, service: b.service, master: b.master, lockedMaster: true, date: b.date, editId: b.id, name: b.name, phone: b.phone, comment: b.comment, consent: true });
        break;
      }
      case 'cancel': {
        const b = bookings.find((x) => x.id === id);
        const ok = await confirmDialog(`Отменить запись «${service(b.service).name}» на ${fmtDay(b.date)}, ${hm(b.time)}?`);
        if (!ok) return;
        bookings = bookings.filter((x) => x.id !== id); save(); haptic.warn(); toast('Запись отменена'); render();
        break;
      }
    }
  });

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.flow = null; state.done = null; state.tab = b.dataset.tab; haptic.tap(); render();
  });

  // В браузере кнопка «Назад» системы тоже работает как шаг назад в записи
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (state.flow || state.done)) goBack(); });

  function updateDot() { $('.tabs .dot').hidden = upcoming().length === 0; }

  // Плашка «ДЕМО» видна всегда
  const tag = document.createElement('div'); tag.className = 'demo-tag'; tag.textContent = 'ДЕМО'; document.body.appendChild(tag);

  updateDot();
  render();
})();
