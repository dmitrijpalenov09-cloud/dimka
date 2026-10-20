(() => {
  'use strict';

  const D = window.OCHL;
  const C = D.clinic;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rub = (n) => Number(n).toLocaleString('ru-RU') + ' ₽';
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const proc = (id) => D.procs.find((p) => p.id === id);
  const valueOf = (g) => (g.type === 'proc' && proc(g.proc) ? proc(g.proc).price : g.amount);

  // ── Тема: фирменная бежевая, тёмная — если в Telegram/системе тёмная ─
  const isDark = () => (inTG ? tg.colorScheme === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches));
  function applyTheme() {
    const dark = isDark();
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const bg = dark ? '#161514' : '#F5F3F1';
    $('meta[name="theme-color"]').setAttribute('content', bg);
    if (tgAtLeast('6.9')) { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor(bg);
  }
  applyTheme();

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    soft: () => inTG && tg.HapticFeedback && tg.HapticFeedback.impactOccurred('soft'),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready();
    tg.expand();
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    tg.onEvent('themeChanged', () => { applyTheme(); render(true); });
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const openTgLink = (url) => { if (inTG) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Хранение (демо: на устройстве + облако Telegram) ─
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) || def; } catch { return def; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* живём в памяти */ } };
  let gifts = load('ochl_gifts', []);      // купленные
  let received = load('ochl_received', []); // полученные
  const save = () => {
    store('ochl_gifts', gifts); store('ochl_received', received); updateBadge();
    if (tgAtLeast('6.9')) tg.CloudStorage.setItem('ochl_data', JSON.stringify({ gifts, received }), () => {});
  };
  if (tgAtLeast('6.9')) {
    tg.CloudStorage.getItem('ochl_data', (err, val) => {
      if (err || !val) return;
      try {
        const c = JSON.parse(val);
        if (Array.isArray(c.gifts) && c.gifts.length > gifts.length) gifts = c.gifts;
        if (Array.isArray(c.received) && c.received.length > received.length) received = c.received;
        updateBadge(); if (state.tab === 'my' && !state.screen) render(true);
      } catch { /* игнор */ }
    });
  }

  // ── Ссылка-подарок: данные сертификата в адресе (#gift=…) ─
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const pack = (g) => b64e(JSON.stringify({ t: g.type, a: g.amount, p: g.proc, c: g.cover, to: g.to, fr: g.from, m: g.msg, id: g.id }));
  const unpack = (s) => { const o = JSON.parse(b64d(s)); return { type: o.t, amount: o.a, proc: o.p, cover: o.c, to: o.to || '', from: o.fr || '', msg: o.m || '', id: o.id }; };
  const baseUrl = () => location.href.split('#')[0].split('?')[0];
  const giftLink = (g) => `${baseUrl()}#gift=${pack(g)}`;

  // ── Сертификат: орнаменты обложек (SVG, без картинок) ─
  const flake = (x, y, r) => [0, 60, 120].map((a) => `<line x1="${x - r}" y1="${y}" x2="${x + r}" y2="${y}" transform="rotate(${a} ${x} ${y})"/>`).join('');
  const ORN = {
    winter: `<circle cx="400" cy="0" r="150" fill="none" stroke="#E3CC98" stroke-opacity=".14"/><circle cx="400" cy="0" r="190" fill="none" stroke="#E3CC98" stroke-opacity=".07"/>
      <g stroke="#E3CC98" stroke-opacity=".55" stroke-width="1.2" stroke-linecap="round">${[[318, 112, 10], [366, 152, 6], [266, 134, 4], [232, 64, 3], [352, 88, 3], [214, 186, 4], [290, 176, 5]].map((f) => flake(...f)).join('')}</g>`,
    paper: `<rect x="10" y="10" width="380" height="232" rx="12" fill="none" stroke="#CBC5B4"/><rect x="15" y="15" width="370" height="222" rx="9" fill="none" stroke="#CBC5B4" stroke-opacity=".5"/>
      <g fill="none" stroke="#B4A88F" stroke-width="1.1" stroke-linecap="round"><path d="M392 120 C 350 140 320 175 300 238"/>${[[372, 132, -35], [352, 146, -48], [336, 164, -58], [322, 184, -66], [312, 206, -72], [360, 128, 30], [340, 150, 20], [326, 172, 12]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="4" transform="rotate(${a} ${x} ${y})"/>`).join('')}</g>`,
    powder: `<circle cx="345" cy="38" r="92" fill="#fff" fill-opacity=".28"/><circle cx="40" cy="250" r="80" fill="#fff" fill-opacity=".22"/><path d="M190 252 A 170 170 0 0 1 400 70" fill="none" stroke="#fff" stroke-opacity=".6"/>`,
    graphite: `<g stroke="#fff" stroke-opacity=".035">${Array.from({ length: 34 }, (_, i) => `<line x1="${i * 16 - 120}" y1="0" x2="${i * 16 + 32}" y2="252"/>`).join('')}</g><circle cx="338" cy="64" r="56" fill="none" stroke="#CBC5B4" stroke-opacity=".4"/><circle cx="338" cy="64" r="76" fill="none" stroke="#CBC5B4" stroke-opacity=".14"/>`,
  };
  const orn = (c) => `<svg class="orn" viewBox="0 0 400 252" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ORN[c] || ''}</svg>`;

  function faces(g) {
    const p = g.type === 'proc' ? proc(g.proc) : null;
    const value = p ? `<div class="gc-value proc">${esc(p.name)}</div><div class="gc-sub">процедура · ${rub(p.price)}</div>`
      : `<div class="gc-value">${rub(g.amount)}</div><div class="gc-sub">на услуги клиники</div>`;
    const logo = '<div class="gc-logo">общество<br>чистых лиц</div>';
    return `<div class="gc-face gc-front">${orn(g.cover)}
        <div class="gc-head">${logo}<div class="gc-type">подарочный<br>сертификат</div></div>
        <div class="gc-mid">${value}</div>
        <div class="gc-foot"><div class="gc-to"><small>для</small>${esc(g.to || 'самого близкого')}</div><div class="gc-num">${esc(g.id || '№ ОЧЛ-······')}</div></div></div>
      <div class="gc-face gc-back">${orn(g.cover)}
        <div class="gc-head">${logo}<div class="gc-type">${g.id ? esc(g.id) : 'с любовью'}</div></div>
        <div class="gc-msg">${esc(g.msg || 'Здесь будут ваши слова')}</div>
        <div class="gc-foot"><div class="gc-from">${g.from ? '— ' + esc(g.from) : ''}</div><div class="gc-meta">${esc(C.address)}<br>${esc(C.phone)}</div></div></div>`;
  }
  const cardHTML = (g, { mini = false, flipped = false, live = true, cls = '' } = {}) =>
    `<div class="gc-wrap ${cls}"><div class="gc-float ${live && !mini ? 'idle' : ''}"><div class="gc ${mini ? 'mini' : ''} ${flipped ? 'flipped' : ''} ${live && !mini ? 'live' : ''}" data-cover="${esc(g.cover)}">${faces(g)}</div></div></div>`;

  // Живая карточка: наклон за курсором/телефоном, переворот по нажатию
  function bindCards() {
    $$('.gc.live').forEach((gc) => {
      const wrap = gc.closest('.gc-wrap'); const fl = gc.parentElement;
      wrap.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'touch') return;
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5;
        fl.classList.remove('idle'); gc.classList.add('tilting');
        gc.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg'); gc.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg');
      });
      wrap.addEventListener('pointerleave', () => { gc.classList.remove('tilting'); gc.style.setProperty('--ry', '0deg'); gc.style.setProperty('--rx', '0deg'); fl.classList.add('idle'); });
      wrap.addEventListener('click', () => { gc.classList.remove('tilting'); gc.classList.toggle('flipped'); haptic.soft(); if (state.tab === 'home' && !state.screen) heroFlipped = gc.classList.contains('flipped'); });
    });
  }
  // Наклон от гироскопа (Telegram 8.0+)
  let orient = null;
  if (tgAtLeast('8.0') && tg.DeviceOrientation) {
    try {
      tg.onEvent('deviceOrientationChanged', () => {
        const o = tg.DeviceOrientation; if (o.beta == null) return;
        if (!orient) orient = { b: o.beta, g: o.gamma };
        const clamp = (v) => Math.max(-14, Math.min(14, v));
        const ry = clamp((o.gamma - orient.g) * 40); const rx = clamp(-(o.beta - orient.b) * 40);
        $$('.gc.live:not(.tilting)').forEach((gc) => { gc.style.setProperty('--ry', ry.toFixed(1) + 'deg'); gc.style.setProperty('--rx', rx.toFixed(1) + 'deg'); });
      });
      tg.DeviceOrientation.start({ refresh_rate: 60 });
    } catch { /* без гироскопа */ }
  }

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'home', screen: null, step: 1, draft: null, doneId: null, gift: null, giftOpen: false, giftSaved: false, quiz: { step: 0 }, from: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');
  let heroCover = 0; let heroFlipped = false; let heroTimer = null;

  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      const dark = isDark();
      tg.MainButton.setParams({ text, color: enabled ? (dark ? '#E9E3DA' : '#2D2D2D') : (dark ? '#34312E' : '#E1DCD4'), text_color: enabled ? (dark ? '#1D1D1D' : '#F5F3F1') : '#8A857C', is_active: enabled, is_visible: true });
    } else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.disabled = !enabled; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);
  const setBack = (v) => { if (inTG) { if (v) tg.BackButton.show(); else tg.BackButton.hide(); } };
  if (inTG) tg.BackButton.onClick(() => goBack());
  const backlink = (text = '‹ Назад') => (inTG ? '' : `<button type="button" class="backlink" data-act="back">${text}</button>`);

  function render(soft = false) {
    clearInterval(heroTimer);
    const sub = !!state.screen;
    tabs.hidden = sub;
    view.classList.toggle('no-tabs', sub);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(sub || (state.tab === 'quiz' && state.quiz.step > 0));
    const html = state.screen === 'builder' ? renderBuilder() : state.screen === 'done' ? renderDone() : state.screen === 'gift' ? renderGift()
      : ({ home: renderHome, quiz: renderQuiz, my: renderMy, clinic: renderClinic })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    bindCards();
    after();
  }

  function goBack() {
    haptic.tap();
    if (state.screen === 'builder') {
      if (state.step > 1) { state.step -= 1; render(); return; }
      state.screen = null; state.tab = state.from || 'home';
    } else if (state.screen === 'done') { state.screen = null; state.tab = 'my'; }
    else if (state.screen === 'gift') { state.screen = null; state.gift = null; history.replaceState(null, '', baseUrl()); }
    else if (state.tab === 'quiz' && state.quiz.step > 0) { state.quiz.step -= 1; }
    render();
  }

  const nyDays = () => { const n = new Date(); const ny = new Date(n.getFullYear() + 1, 0, 1); return Math.ceil((ny - n) / 864e5); };

  // ── Главная ──────────────────────────────────────────
  function sampleGift() {
    return { type: 'sum', amount: 10000, cover: D.covers[heroCover].id, to: 'тебя', from: (tgUser && tgUser.first_name) || 'Деда Мороза', msg: D.wishes[0] };
  }
  function renderHome() {
    const nd = nyDays();
    const hits = [...D.procs].sort((a, b) => (b.hit ? 1 : 0) - (a.hit ? 1 : 0));
    return `<div class="top"><div class="mark">общество<br>чистых лиц<small>клиника · Петербург</small></div>
        ${nd <= 75 ? `<div class="ny">🎄 До Нового года <b>${nd} ${plural(nd, 'день', 'дня', 'дней')}</b></div>` : ''}</div>
      <div id="hero-card">${cardHTML(sampleGift(), { flipped: heroFlipped })}</div>
      <div class="covers-dots">${D.covers.map((c, i) => `<i class="${i === heroCover ? 'on' : ''}" data-act="hero-cover" data-id="${i}"></i>`).join('')}</div>
      <div class="flip-hint">Нажмите на сертификат — на обороте ваши слова</div>
      <div class="hero-txt"><div class="eyebrow">Подарочный сертификат</div>
        <h1 class="title">Подарок, которому <i>будут рады</i></h1>
        <p class="lead">Соберите сертификат за минуту и отправьте прямо в Telegram — в красивом конверте, с вашими словами.</p></div>
      <button type="button" class="btn" data-act="create">Создать сертификат</button>
      <div class="how"><div><b>1</b>Сумма или процедура</div><div><b>2</b>Дизайн и пожелание</div><div><b>3</b>Пересылаете в Telegram</div></div>
      <button type="button" class="quiz-promo" data-act="tab" data-id="quiz"><span class="ic">✨</span><span><b>Не знаете, что подарить?</b><span class="muted">Подберём за 3 нажатия</span></span><span class="arr">›</span></button>
      <div class="h3">Дарят чаще всего</div>
      <div class="hscroll">${hits.slice(0, 7).map((p) => `<button type="button" class="pcard" data-act="create-proc" data-id="${p.id}">
          <div class="nm">${esc(p.name)}</div><div class="tx">${esc(p.text)}</div>
          <div class="row"><span class="price">${rub(p.price)}</span><span class="gift">Подарить</span></div></button>`).join('')}</div>
      <div class="h3">Почему дарят нас</div>
      <div class="trust">
        <div><b>Анестезия включена</b>Не нужно доплачивать за анестезию и канюли</div>
        <div><b>Медицинская лицензия</b>${esc(C.license)}</div>
        <div><b>Оригинальные препараты</b>Аппараты и препараты — от официальных продавцов</div>
        <div><b>«Просто спросить»</b>Бесплатная консультация 10 минут</div></div>
      <p class="footnote">Концепт приложения для клиники «Общество Чистых Лиц».<br>Цены — с сайта клиники. Оплата в демо не списывается.</p>`;
  }
  function startHeroCycle() {
    heroTimer = setInterval(() => {
      if (heroFlipped || state.screen || state.tab !== 'home') return;
      heroCover = (heroCover + 1) % D.covers.length;
      const gc = $('#hero-card .gc'); if (!gc) return;
      gc.dataset.cover = D.covers[heroCover].id; gc.innerHTML = faces(sampleGift());
      $$('.covers-dots i').forEach((d, i) => d.classList.toggle('on', i === heroCover));
    }, 3200);
  }

  // ── Конструктор ──────────────────────────────────────
  const newDraft = (preset = {}) => ({ type: 'sum', amount: 10000, proc: null, cover: 'winter', to: '', from: (tgUser && tgUser.first_name) || '', msg: '', delivery: 'self', date: '0101', consent: false, ...preset });
  const STEP_NAMES = ['Что дарим', 'Дизайн', 'Пожелание', 'Как вручить'];
  const DATES = [['1231', '31 декабря'], ['0101', '1 января'], ['0214', '14 февраля'], ['0308', '8 марта']];
  const dateName = (id) => (DATES.find((d) => d[0] === id) || DATES[1])[1];

  function renderBuilder() {
    const d = state.draft; const s = state.step;
    let body = '';
    if (s === 1) {
      body = `<div class="seg"><button type="button" class="${d.type === 'sum' ? 'on' : ''}" data-act="type" data-id="sum">На сумму</button><button type="button" class="${d.type === 'proc' ? 'on' : ''}" data-act="type" data-id="proc">На процедуру</button></div>`;
      if (d.type === 'sum') {
        body += `<div class="amounts">${D.amounts.map((a) => `<button type="button" class="${a === d.amount ? 'on' : ''}" data-act="amount" data-id="${a}">${(a / 1000).toLocaleString('ru-RU')}&thinsp;000</button>`).join('')}</div>
          <div class="range"><div class="row"><span>Своя сумма</span><b id="amount-label">${rub(d.amount)}</b></div><input type="range" id="f-amount" min="1000" max="50000" step="500" value="${d.amount}"></div>
          <div class="note">Получатель сам выберет процедуру. Не знает какую — администратор поможет, а консультация «Просто спросить» бесплатна.</div>`;
      } else {
        body += D.cats.map((c) => {
          const list = D.procs.filter((p) => p.cat === c.id);
          return `<div class="cat-h">${esc(c.name)}</div><div class="plist">${list.map((p) => `<button type="button" class="pitem ${d.proc === p.id ? 'on' : ''}" data-act="proc" data-id="${p.id}">
            <span class="rad"></span><span><div class="nm">${esc(p.name)}</div><div class="tx">${esc(p.text)}</div></span><span class="price">${rub(p.price)}</span></button>`).join('')}</div>`;
        }).join('');
        if (d.proc && proc(d.proc).cat === 'hw') body += '<div class="note">Перед аппаратной процедурой — консультация врача. В день процедуры она <b>бесплатна</b>.</div>';
      }
    } else if (s === 2) {
      body = `<div class="cover-pick">${D.covers.map((c) => `<button type="button" class="${d.cover === c.id ? 'on' : ''}" data-act="cover" data-id="${c.id}">${cardHTML({ ...d, cover: c.id }, { mini: true, live: false })}<div class="nm">${esc(c.name)}</div></button>`).join('')}</div>`;
    } else if (s === 3) {
      body = `<label class="field"><span>Кому</span><input id="f-to" maxlength="24" value="${esc(d.to)}" placeholder="Например, Анна"></label>
        <div class="field" style="margin-bottom:6px"><span>Пожелание — нажмите, чтобы вставить</span></div>
        <div class="chips wish">${D.wishes.map((w, i) => `<button type="button" class="chip" data-act="wish" data-id="${i}">${esc(w)}</button>`).join('')}</div>
        <label class="field"><span>Ваши слова <span class="cnt" id="msg-cnt">${d.msg.length}/120</span></span><textarea id="f-msg" maxlength="120" placeholder="Напишите от себя…">${esc(d.msg)}</textarea></label>
        <label class="field"><span>От кого</span><input id="f-from" maxlength="24" value="${esc(d.from)}" placeholder="Ваше имя"></label>`;
    } else {
      const v = valueOf(d);
      body = `<button type="button" class="opt ${d.delivery === 'self' ? 'on' : ''}" data-act="delivery" data-id="self"><span class="ic">✈️</span><span><b>Перешлю сам в Telegram</b><div class="muted">Получатель откроет конверт прямо в чате — и сразу запишется</div></span></button>
        <button type="button" class="opt ${d.delivery === 'date' ? 'on' : ''}" data-act="delivery" data-id="date"><span class="ic">⏰</span><span><b>Сюрприз в нужный день</b><div class="muted">Бот клиники сам пришлёт конверт утром в выбранную дату</div></span></button>
        ${d.delivery === 'date' ? `<div class="chips wrap">${DATES.map(([id, n]) => `<button type="button" class="chip ${d.date === id ? 'on' : ''}" data-act="date" data-id="${id}">${n}</button>`).join('')}</div>` : ''}
        <button type="button" class="opt ${d.delivery === 'print' ? 'on' : ''}" data-act="delivery" data-id="print"><span class="ic">🖨</span><span><b>Распечатать</b><div class="muted">Красивый PDF — вложить в открытку или вручить лично</div></span></button>
        <div class="h3" style="margin-top:18px">Итого</div>
        <div class="sum"><div class="row"><span>Сертификат</span><span>${d.type === 'proc' ? esc(proc(d.proc).name) : 'на сумму'}</span></div>
          <div class="row"><span>Дизайн</span><span>${esc(D.covers.find((c) => c.id === d.cover).name)}</span></div>
          <div class="row"><span>Для</span><span>${esc(d.to || 'самого близкого')}</span></div>
          <div class="row"><span>Вручение</span><span>${d.delivery === 'self' ? 'в Telegram' : d.delivery === 'date' ? dateName(d.date) : 'PDF для печати'}</span></div>
          <div class="row total"><span>К оплате</span><span>${rub(v)}</span></div></div>
        <label class="opt" style="margin-top:12px;align-items:center"><input type="checkbox" id="f-consent" ${d.consent ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent)"><span class="muted" style="margin:0">Согласен(на) с условиями сертификата и на обработку персональных данных</span></label>`;
    }
    return `${backlink(s > 1 ? '‹ Назад' : '‹ Закрыть')}
      <div class="builder-card">${cardHTML(d, { flipped: s === 3 && !!d.msg })}</div>
      <div class="steps">${STEP_NAMES.map((_, i) => `<span class="${i < s ? 'on' : ''}"></span>`).join('')}</div>
      <div class="eyebrow">Шаг ${s} из 4</div><div class="step-title">${STEP_NAMES[s - 1]}</div>
      ${body}`;
  }
  const previewGc = () => $('.builder-card .gc');
  function updatePreview(flip) {
    const gc = previewGc(); if (!gc) return;
    gc.dataset.cover = state.draft.cover; gc.innerHTML = faces(state.draft);
    if (flip !== undefined) gc.classList.toggle('flipped', flip);
  }
  const stepOk = () => { const d = state.draft; return state.step !== 1 || d.type === 'sum' ? (state.step !== 4 || d.consent) : !!d.proc; };

  // ── Оплата (демо) ────────────────────────────────────
  const sheet = $('#sheet');
  function openPay() {
    const v = valueOf(state.draft);
    sheet.innerHTML = `<div class="panel"><div class="grab"></div>
      <div class="eyebrow">Оплата</div><div class="step-title" style="margin-bottom:14px">${rub(v)}</div>
      <button type="button" class="pay-opt" data-act="pay"><span class="ic">⚡</span>СБП<span class="muted">через приложение банка</span></button>
      <button type="button" class="pay-opt" data-act="pay"><span class="ic">💳</span>Банковская карта<span class="muted">Мир, Visa, MC</span></button>
      <div class="note" style="margin-bottom:0">Демо: деньги не списываются. В рабочей версии оплата идёт через кассу клиники (YCLIENTS или ЮKassa), чек — на почту.</div></div>`;
    sheet.hidden = false; haptic.tap();
    if (inTG) tg.MainButton.hide();
  }
  function closeSheet() { sheet.hidden = true; if (state.screen === 'builder') after(); }
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  function pay() {
    $('.panel', sheet).innerHTML = '<div class="grab"></div><div class="spinner"></div><div class="center muted" style="padding-bottom:26px">Проводим оплату…</div>';
    setTimeout(() => {
      const d = state.draft;
      const g = { type: d.type, amount: d.type === 'sum' ? d.amount : proc(d.proc).price, proc: d.type === 'proc' ? d.proc : null, cover: d.cover,
        to: d.to.trim(), from: d.from.trim(), msg: d.msg.trim(), delivery: d.delivery, date: d.date,
        id: 'ОЧЛ-' + String(Date.now() % 1e6).padStart(6, '0'), created: Date.now(), sent: false };
      gifts.unshift(g); save();
      sheet.hidden = true; haptic.ok();
      state.screen = 'done'; state.doneId = g.id; state.draft = null; state.step = 1;
      render(); confetti();
    }, 1400);
  }

  // ── Готово ───────────────────────────────────────────
  function renderDone() {
    const g = gifts.find((x) => x.id === state.doneId);
    if (!g) { state.screen = null; state.tab = 'my'; return renderMy(); }
    const tip = g.delivery === 'date'
      ? `<div class="note">⏰ <b>${dateName(g.date)}</b> утром бот клиники пришлёт ${g.to ? esc(g.to) : 'получателю'} конверт с сертификатом. В рабочей версии — по нику или номеру в Telegram.</div>`
      : g.delivery === 'print' ? '<div class="note">🖨 Откроется печать: лицевая сторона и оборот с вашими словами. Можно сохранить как PDF.</div>'
        : '<div class="note">✈️ Получатель увидит конверт с печатью — откроет, прочитает ваши слова и запишется в пару нажатий.</div>';
    return `<div class="center"><span class="done-badge">✓ Оплачено</span></div>
      <h1 class="title center" style="margin-top:12px">Готово! <i>Подарок ждёт</i></h1>
      <div class="print-area">${cardHTML(g, { cls: 'fly-in' })}</div>
      <div class="flip-hint">Нажмите, чтобы перевернуть</div>
      ${tip}
      <div class="stack">
        ${inTG ? '' : `<button type="button" class="btn" data-act="${g.delivery === 'print' ? 'print' : 'share'}" data-id="${esc(g.id)}">${g.delivery === 'print' ? 'Распечатать / PDF' : 'Переслать в Telegram'}</button>`}
        <button type="button" class="btn ghost" data-act="preview-gift" data-id="${esc(g.id)}">👀 Как увидит получатель</button>
        ${g.delivery !== 'self' ? `<button type="button" class="btn ghost" data-act="share" data-id="${esc(g.id)}">Всё же переслать самому</button>` : ''}
        <button type="button" class="btn ghost" data-act="tab" data-id="my">Мои сертификаты</button></div>`;
  }
  function share(g) {
    const link = giftLink(g);
    const text = `🎁 ${g.to ? g.to + ', это' : 'Это'} тебе — подарок в «Общество Чистых Лиц»${g.from ? ' от ' + g.from : ''}. Открой конверт:`;
    g.sent = true; save();
    if (inTG) { openTgLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`); return; }
    if (navigator.share) { navigator.share({ title: 'Подарок', text, url: link }).catch(() => {}); return; }
    const done = () => toast('Ссылка на подарок скопирована');
    if (navigator.clipboard) navigator.clipboard.writeText(`${text} ${link}`).then(done, () => window.prompt('Скопируйте ссылку:', link));
    else window.prompt('Скопируйте ссылку:', link);
  }
  function printGift(g) {
    if (inTG) { openLink(giftLink(g) + '&print=1'); return; }
    window.print();
  }

  // ── Получатель: конверт ──────────────────────────────
  function renderGift() {
    const g = state.gift;
    if (!state.giftOpen) {
      return `<div class="gift-stage">
        <div class="eyebrow">общество чистых лиц</div>
        <h1 class="title" style="margin-top:10px">${g.to ? esc(g.to) + ', вам' : 'Вам'} <i>подарок</i></h1>
        <div class="lead">${g.from ? esc(g.from) + ' приготовил(а) его специально для вас' : 'Его приготовили специально для вас'}</div>
        <div class="envelope" id="env" data-act="open-env"><div class="env-back"></div><div class="env-card">${cardHTML(g, { mini: true, live: false })}</div><div class="env-flap"></div><div class="env-front"></div><div class="seal">оч</div></div>
        <div class="tap-hint">Нажмите на печать, чтобы открыть</div></div>`;
    }
    const p = g.type === 'proc' ? proc(g.proc) : null;
    return `<div class="reveal"><div class="center eyebrow" style="margin-bottom:6px">подарочный сертификат</div>
      <div class="print-area">${cardHTML(g, { cls: 'fly-in' })}</div>
      <div class="flip-hint">Нажмите, чтобы перевернуть</div>
      <div class="h3" style="margin-top:20px">${p ? esc(p.name) : 'Выберите процедуру сами'}</div>
      <p class="lead">${p ? esc(p.text) : `Сертификат на ${rub(g.amount)} — можно выбрать любую процедуру. Не знаете какую — запишитесь на бесплатную консультацию «Просто спросить» (10 минут).`}</p>
      <div class="note">Назовите администратору номер <b>${esc(g.id)}</b> — или запишитесь здесь, сертификат подтянется сам.</div>
      <div class="stack">
        ${inTG ? '' : '<button type="button" class="btn" data-act="book">Записаться по сертификату</button>'}
        <button type="button" class="btn ghost" data-act="save-gift">${state.giftSaved ? '✓ Сохранён в «Мои»' : 'Сохранить в «Мои»'}</button>
        <button type="button" class="btn ghost" data-act="route">Как добраться · ${esc(C.address)}</button></div>
      <p class="footnote">Концепт приложения для клиники «Общество Чистых Лиц».</p></div>`;
  }
  function openEnvelope() {
    const env = $('#env'); if (!env || env.classList.contains('open')) return;
    env.classList.add('open'); env.closest('.gift-stage').classList.add('opening'); haptic.ok();
    setTimeout(() => { state.giftOpen = true; render(); confetti(); setTimeout(() => { const gc = $('.print-area .gc'); if (gc) gc.classList.add('flipped'); }, 2200); }, 1500);
  }

  // ── Подбор подарка ───────────────────────────────────
  function quizResults() {
    const q = state.quiz; const budget = q.budget;
    const fits = (p) => !budget || p.price <= budget;
    let list = q.goal === 'any' ? [] : D.procs.filter((p) => p.goals.includes(q.goal) && fits(p)).sort((a, b) => (b.hit ? 1 : 0) - (a.hit ? 1 : 0) || b.price - a.price).slice(0, 2);
    const sumAmount = budget || (list[0] ? Math.max(10000, Math.ceil(list[0].price / 5000) * 5000) : 10000);
    return { list, sumAmount };
  }
  function renderQuiz() {
    const q = state.quiz; const Q = D.quiz;
    const head = (n, t) => `<div class="q-step">Вопрос ${n} из 3</div><h1 class="title">${t}</h1>`;
    if (q.step === 0) return `${head(1, 'Кому <i>подарок?</i>')}<div class="qgrid">${Q.who.map((w) => `<button type="button" class="qbtn" data-act="q-who" data-id="${w.id}"><span class="e">${w.e}</span>${w.name}</button>`).join('')}</div>`;
    if (q.step === 1) return `${backlink()}${head(2, q.who === 'me' ? 'Что хочется <i>себе?</i>' : 'Что ей <i>важнее?</i>')}<div class="qlist">${Q.goal.map((g) => `<button type="button" class="qbtn" data-act="q-goal" data-id="${g.id}">${g.name}<span class="muted">${g.sub}</span></button>`).join('')}</div>`;
    if (q.step === 2) return `${backlink()}${head(3, 'Какой <i>бюджет?</i>')}<div class="qlist">${Q.budget.map((b) => `<button type="button" class="qbtn" data-act="q-budget" data-id="${b.id}">${b.name}</button>`).join('')}</div>`;
    const { list, sumAmount } = quizResults();
    const goalName = Q.goal.find((g) => g.id === q.goal).name.toLowerCase();
    return `${backlink()}<div class="q-step">Наш совет</div><h1 class="title">${q.who === 'me' ? 'Себя порадовать — <i>правильно</i>' : 'Вот что <i>понравится</i>'}</h1>
      ${list.map((p, i) => `<div class="result"><div class="tag">${i === 0 ? 'Лучший выбор' : 'Ещё вариант'}</div><div class="nm">${esc(p.name)}</div><div class="muted">${esc(p.text)}</div>
        <div class="row"><span class="price">${rub(p.price)}</span><button type="button" class="btn small" data-act="create-proc" data-id="${p.id}">Подарить</button></div></div>`).join('')}
      ${!list.length && q.goal !== 'any' ? `<div class="note">В этом бюджете процедур на «${esc(goalName)}» нет. Лучше подарить сумму — а процедуру подберут на бесплатной консультации «Просто спросить».</div>` : ''}
      <div class="result"><div class="tag">Беспроигрышно</div><div class="nm">Сертификат на ${rub(sumAmount)}</div><div class="muted">Получатель сам выберет процедуру — а вы точно не ошибётесь.</div>
        <div class="row"><span class="price">${rub(sumAmount)}</span><button type="button" class="btn small" data-act="create-sum" data-id="${sumAmount}">Подарить</button></div></div>
      <button type="button" class="btn ghost" data-act="q-reset" style="margin-top:6px">Пройти заново</button>`;
  }

  // ── Мои ──────────────────────────────────────────────
  const giftLabel = (g) => (g.type === 'proc' && proc(g.proc) ? proc(g.proc).name : `на ${rub(g.amount)}`);
  function sentStatus(g) {
    if (g.delivery === 'date') return `<span class="status">⏰ придёт ${dateName(g.date)}</span>`;
    if (g.sent) return '<span class="status ok">✓ отправлен</span>';
    return g.delivery === 'print' ? '<span class="status ok">оплачен · PDF</span>' : '<span class="status">оплачен · перешлите</span>';
  }
  function renderMy() {
    if (!gifts.length && !received.length) {
      return `<h1 class="title">Мои <i>сертификаты</i></h1><div class="empty"><span class="e">🎁</span>Пока пусто.<br>Здесь будут подаренные и полученные сертификаты — с остатком и кнопкой записи.</div>
        <button type="button" class="btn" data-act="create">Создать сертификат</button>`;
    }
    const row = (g, act, status) => `<button type="button" class="mine" data-act="${act}" data-id="${esc(g.id)}">${cardHTML(g, { mini: true, live: false })}
      <div class="body"><b>${esc(giftLabel(g))}</b><div class="muted">${act === 'open-mine' ? 'кому: ' + esc(g.to || 'не указано') : 'от: ' + esc(g.from || 'близкий человек')} · ${esc(g.id)}</div>${status}</div></button>`;
    return `<h1 class="title">Мои <i>сертификаты</i></h1>
      ${received.length ? `<div class="cat-h">Мне подарили</div>${received.map((g) => row(g, 'open-received', '<span class="status ok">✓ действует · записаться</span>')).join('')}` : ''}
      ${gifts.length ? `<div class="cat-h">Я подарил(а)</div>${gifts.map((g) => row(g, 'open-mine', sentStatus(g))).join('')}` : ''}
      <div style="height:8px"></div><button type="button" class="btn ghost" data-act="create">Подарить ещё один</button>
      <p class="footnote">В рабочей версии здесь же — остаток по сертификату на сумму и срок действия из YCLIENTS.</p>`;
  }

  // ── Клиника ──────────────────────────────────────────
  function renderClinic() {
    return `<div class="eyebrow">Клиника эстетической медицины</div><h1 class="title">Понятная <i>косметология</i></h1>
      <div class="info">
        <div class="row"><span class="ic">📍</span><span>${esc(C.address)}<div class="muted">Петроградская сторона</div></span></div>
        <div class="row"><span class="ic">📞</span><span>${esc(C.phone)}</span></div>
        <div class="row"><span class="ic">📄</span><span>Медицинская лицензия<div class="muted">${esc(C.license)}</div></span></div></div>
      <div class="stack">
        <button type="button" class="btn" data-act="book">Записаться онлайн</button>
        <button type="button" class="btn ghost" data-act="book">«Просто спросить» — бесплатно, 10 минут</button>
        <div class="btn-row"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="call">Позвонить</button><button type="button" class="btn ghost" data-act="channel">Канал</button></div></div>
      <div class="note" style="margin-top:14px">В рабочей версии запись идёт прямо здесь, через ваш YCLIENTS: врач, дата, время — и напоминание в Telegram накануне.</div>
      <p class="footnote">Концепт приложения для клиники «Общество Чистых Лиц».<br>Сделано как пример — по вашему сайту и прайсу.</p>`;
  }

  // ── После отрисовки: кнопки и поля ───────────────────
  function after() {
    if (state.screen === 'builder') {
      const d = state.draft; const s = state.step;
      if (s === 1) {
        const r = $('#f-amount');
        if (r) r.addEventListener('input', () => {
          d.amount = Number(r.value); $('#amount-label').textContent = rub(d.amount);
          $$('.amounts button').forEach((b) => b.classList.toggle('on', Number(b.dataset.id) === d.amount));
          updatePreview();
        });
      }
      if (s === 3) {
        const bind = (id, key, flip) => {
          const el = $(id);
          el.addEventListener('focus', () => { const gc = previewGc(); if (gc) gc.classList.toggle('flipped', flip); });
          el.addEventListener('input', () => { d[key] = el.value; if (key === 'msg') $('#msg-cnt').textContent = `${el.value.length}/120`; updatePreview(); });
        };
        bind('#f-to', 'to', false); bind('#f-msg', 'msg', true); bind('#f-from', 'from', true);
      }
      if (s === 4) $('#f-consent').addEventListener('change', (e) => { d.consent = e.target.checked; after(); });
      const v = valueOf(d);
      setCTA(s < 4 ? 'Дальше' : `Оплатить ${rub(v)}`, stepOk(), () => {
        if (!stepOk()) { haptic.warn(); return; }
        if (s < 4) { state.step += 1; haptic.tap(); render(); } else openPay();
      });
    } else if (state.screen === 'done' && inTG) {
      const g = gifts.find((x) => x.id === state.doneId);
      if (g) setCTA(g.delivery === 'print' ? 'Распечатать / PDF' : 'Переслать в Telegram', true, () => (g.delivery === 'print' ? printGift(g) : share(g)));
    } else if (state.screen === 'gift' && state.giftOpen && inTG) {
      setCTA('Записаться по сертификату', true, book);
    } else if (!state.screen && state.tab === 'home') startHeroCycle();
  }

  function book() { haptic.tap(); openLink(C.booking); }
  function startBuilder(preset) { state.from = state.screen ? 'home' : state.tab; state.screen = 'builder'; state.step = 1; state.draft = newDraft(preset); haptic.tap(); render(); }

  // ── Конфетти (золото и бежевый) ──────────────────────
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = $('#fx'); const ctx = cv.getContext('2d'); const dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    const cols = ['#CDB688', '#E3CC98', '#E1DCD4', '#B39A6B', '#F1D9D1', '#FFFFFF'];
    const ps = Array.from({ length: 90 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.38, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 10 - 3, r: Math.random() * 4 + 2, c: cols[Math.floor(Math.random() * cols.length)], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, sq: Math.random() > 0.5 }));
    const t0 = performance.now();
    (function frame(t) {
      const k = (t - t0) / 2200; ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (k >= 1) return;
      ps.forEach((p) => { p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
        if (p.sq) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); else { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.5, 0, 7); ctx.fill(); }
        ctx.restore(); });
      requestAnimationFrame(frame);
    })(t0);
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset; const d = state.draft;
    switch (act) {
      case 'tab': state.screen = null; state.tab = id; if (id === 'quiz') state.quiz = { step: 0 }; haptic.tap(); render(); break;
      case 'back': goBack(); break;
      case 'create': startBuilder(); break;
      case 'create-proc': startBuilder({ type: 'proc', proc: id }); break;
      case 'create-sum': startBuilder({ type: 'sum', amount: Number(id) }); break;
      case 'hero-cover': heroCover = Number(id); heroFlipped = false; haptic.tap(); render(true); break;
      case 'type': d.type = id; if (id === 'proc' && !d.proc) d.proc = null; haptic.tap(); render(true); break;
      case 'amount': d.amount = Number(id); haptic.tap(); render(true); break;
      case 'proc': d.proc = id; haptic.tap(); render(true); break;
      case 'cover': d.cover = id; haptic.tap(); $$('.cover-pick button').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); updatePreview(false); break;
      case 'wish': { d.msg = D.wishes[Number(id)]; const t = $('#f-msg'); t.value = d.msg; $('#msg-cnt').textContent = `${d.msg.length}/120`; updatePreview(true); haptic.tap(); break; }
      case 'delivery': d.delivery = id; haptic.tap(); render(true); break;
      case 'date': d.date = id; haptic.tap(); render(true); break;
      case 'pay': pay(); break;
      case 'share': share(gifts.find((x) => x.id === id)); render(true); break;
      case 'print': printGift(gifts.find((x) => x.id === id)); break;
      case 'preview-gift': { const g = gifts.find((x) => x.id === id); state.gift = { ...g }; state.giftOpen = false; state.giftSaved = true; state.screen = 'gift'; haptic.tap(); render(); break; }
      case 'open-env': openEnvelope(); break;
      case 'save-gift': if (!received.some((x) => x.id === state.gift.id) && !gifts.some((x) => x.id === state.gift.id)) { received.unshift({ ...state.gift, savedAt: Date.now() }); save(); }
        state.giftSaved = true; haptic.ok(); toast('Сохранили в «Мои» 🤍'); render(true); break;
      case 'open-mine': state.screen = 'done'; state.doneId = id; haptic.tap(); render(); break;
      case 'open-received': state.gift = received.find((x) => x.id === id); state.giftOpen = true; state.giftSaved = true; state.screen = 'gift'; haptic.tap(); render(); break;
      case 'q-who': state.quiz.who = id; state.quiz.step = 1; haptic.tap(); render(); break;
      case 'q-goal': state.quiz.goal = id; state.quiz.step = 2; haptic.tap(); render(); break;
      case 'q-budget': state.quiz.budget = Number(id); state.quiz.step = 3; haptic.ok(); render(); break;
      case 'q-reset': state.quiz = { step: 0 }; haptic.tap(); render(); break;
      case 'book': book(); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(C.mapQuery)}`); break;
      case 'call': if (inTG) toast(`Телефон клиники: ${C.phone}`); else location.href = `tel:${C.phoneRaw}`; break;
      case 'channel': openTgLink(C.channel); break;
    }
  });

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.screen = null; state.tab = b.dataset.tab; if (state.tab === 'quiz') state.quiz = { step: 0 }; haptic.tap(); render();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!sheet.hidden) closeSheet(); else if (state.screen || (state.tab === 'quiz' && state.quiz.step > 0)) goBack();
  });

  function updateBadge() { const b = $('.tabs .badge'); const n = gifts.length + received.length; b.hidden = !n; b.textContent = n; }
  updateBadge();

  // Открыли по ссылке-подарку?
  const m = location.hash.match(/^#gift=([^&]+)(&print=1)?/);
  if (m) {
    try {
      state.gift = unpack(m[1]); state.screen = 'gift';
      state.giftSaved = received.some((x) => x.id === state.gift.id) || gifts.some((x) => x.id === state.gift.id);
      if (m[2]) { state.giftOpen = true; render(); const go = () => setTimeout(() => window.print(), 400); if (document.fonts) document.fonts.ready.then(go); else go(); }
      else render();
    } catch { history.replaceState(null, '', baseUrl()); render(); }
  } else render();
})();
