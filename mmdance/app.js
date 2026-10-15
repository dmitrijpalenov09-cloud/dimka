(() => {
  'use strict';

  const D = window.MM;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (name) => `img/${name}.jpg`;
  const rub = (n) => (n ? n.toLocaleString('ru-RU') + ' ₽' : 'бесплатно');
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const fmtDay = (k) => { const d = parseKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${d.toLocaleString('ru-RU', { month: 'short' }).replace('.', '')}`; };
  const startOf = (c) => { const d = parseKey(c.date); d.setMinutes(c.time); return d; };
  const nextDays = (n) => { const out = []; const d = new Date(); for (let i = 0; i < n; i++) { out.push(dateKey(d)); d.setDate(d.getDate() + 1); } return out; };
  function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const plural = (n, a, b, c) => (n % 10 === 1 && n % 100 !== 11 ? a : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? b : c);

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready();
    tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#170D10'); tg.setBackgroundColor('#120B0D'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#120B0D');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const confirmDialog = (text) => new Promise((resolve) => {
    if (tgAtLeast('6.2')) tg.showConfirm(text, (ok) => resolve(ok)); else resolve(window.confirm(text));
  });

  // ── Записи (демо: на устройстве и в облаке Telegram) ─
  const KEY = 'mmdance_concept_bookings';
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
      try { const c = JSON.parse(val); if (Array.isArray(c) && c.length >= bookings.length) { bookings = c; updateDot(); if (!state.cls) render(); } } catch { /* игнор */ }
    });
  }
  const myBooking = (id) => bookings.find((b) => b.id === id);
  const upcoming = () => bookings.filter((b) => startOf(b) > new Date()).sort((a, b) => startOf(a) - startOf(b));
  const past = () => bookings.filter((b) => startOf(b) <= new Date()).sort((a, b) => startOf(b) - startOf(a));

  // ── Расписание ───────────────────────────────────────
  const cup = D.events[0];
  function classesFor(k) {
    const list = (D.week[parseKey(k).getDay()] || []).map(([t, dir]) => {
      const d = D.dirs[dir];
      return { id: `${k}|${t}|${dir}`, date: k, time: toMin(t), dir, kind: d.kind, dur: d.dur };
    });
    if (k === cup.date) list.push({ id: `${k}|${cup.time}|cup`, date: k, time: toMin(cup.time), dir: 'cup', kind: 'event', dur: 240 });
    return list.sort((a, b) => a.time - b.time);
  }
  const findClass = (id) => classesFor(id.split('|')[0]).find((c) => c.id === id);
  const dirName = (c) => (c.dir === 'cup' ? cup.title : D.dirs[c.dir].name);
  const dirImg = (c) => (c.dir === 'cup' ? cup.img : D.dirs[c.dir].img);

  // Пары: сколько партнёров и партнёрш уже записано (демо), места по 10 на каждую роль. Соло: до 14 человек.
  function seats(c) {
    const h = hash(c.id); const mine = myBooking(c.id);
    if (c.kind === 'pair') {
      let lead = 3 + (h % 7); let follow = 3 + ((h >>> 5) % 8);
      if (mine) { if (mine.role !== 'follow') lead += 1; if (mine.role !== 'lead') follow += 1; }
      return { lead: Math.min(lead, 10), follow: Math.min(follow, 10), cap: 10 };
    }
    const cap = c.kind === 'event' ? cup.cap : 14;
    const taken = Math.min(cap, 4 + (h % (cap - 5)) + (mine ? 1 : 0));
    return { taken, left: cap - taken, cap };
  }
  const balanceHint = (s) => (s.lead < s.follow ? 'Ждём партнёров — приходи без пары' : s.follow < s.lead ? 'Ждём партнёрш — приходи без пары' : 'Баланс идеальный');

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'home', day: dateKey(new Date()), kind: 'all', cls: null, form: null, done: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');

  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      tg.MainButton.setParams({ text, color: enabled ? '#FF5A6E' : '#3A2327', text_color: enabled ? '#2A060D' : '#B89CA1', is_active: enabled, is_visible: true });
    } else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.disabled = !enabled; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);
  const setBack = (v) => { if (inTG) { if (v) tg.BackButton.show(); else tg.BackButton.hide(); } };
  if (inTG) tg.BackButton.onClick(() => goBack());

  function render(soft = false) {
    tabs.hidden = !!state.cls;
    view.classList.toggle('no-tabs', !!state.cls);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(!!(state.cls || state.done));
    const html = state.cls ? renderClass() : state.done ? renderDone()
      : ({ home: renderHome, schedule: renderSchedule, prices: renderPrices, mine: renderMine })[state.tab]();
    const daysScroll = soft && $('.days') ? $('.days').scrollLeft : null; const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    if (daysScroll != null && $('.days')) $('.days').scrollLeft = daysScroll;
    if (state.cls) afterClassRender();
    if (!soft && state.tab === 'schedule' && !state.cls) { const d = $('.days'); const on = $('.dayb.on'); if (d && on) d.scrollLeft = on.offsetLeft - 16; }
  }

  function goBack() {
    if (state.cls) { state.cls = null; state.form = null; } else if (state.done) { state.done = null; state.tab = 'mine'; }
    haptic.tap(); render();
  }

  const clsCard = (c, withDate) => {
    const s = seats(c); const mine = myBooking(c.id);
    const right = c.kind === 'pair'
      ? `<div class="seats"><b style="font-size:13px">♂${s.lead} · ♀${s.follow}</b>из ${s.cap}+${s.cap}</div>`
      : `<div class="seats ${s.left <= 3 ? 'low' : ''}"><b>${s.left}</b>из ${s.cap}<div class="bar"><i style="width:${Math.round(100 * s.taken / s.cap)}%"></i></div></div>`;
    return `<button type="button" class="cls ${mine ? 'mine' : ''}" data-act="cls" data-id="${esc(c.id)}">
      <div class="tm"><b>${hm(c.time)}</b><span>${withDate ? fmtDay(c.date) : c.kind === 'pair' ? 'в паре' : c.kind === 'event' ? 'событие' : 'соло'}</span></div>
      <div class="body"><div class="name">${esc(dirName(c))}</div>
        ${c.kind === 'pair' ? `<div class="balance">${esc(balanceHint(s))}</div>` : `<div class="tags"><span class="tag2 lvl">${c.kind === 'event' ? '🎃 турнир + afterparty' : 'с нуля'}</span></div>`}
        ${mine ? '<div class="tags"><span class="tag2" style="color:var(--ok)">✓ вы записаны</span></div>' : ''}</div>
      ${right}</button>`;
  };

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = tgUser && tgUser.first_name ? `, ${esc(tgUser.first_name)}` : '';
    const now = new Date(); const today = dateKey(now);
    const soon = nextDays(4).flatMap((k) => classesFor(k)).filter((c) => startOf(c) > now && c.kind !== 'event').slice(0, 4);
    const daysTo = Math.round((parseKey(cup.date) - parseKey(today)) / 864e5);
    const next = upcoming()[0];
    return `<div class="muted" style="margin-bottom:10px">${hello}${name} ❤️</div>
      <section class="hero"><img src="${img('social')}" alt="">
        <span class="tag">Танцы для взрослых · Петроградка</span><h1>${esc(D.studio.name)}</h1><p>${esc(D.studio.tagline)}</p>
        <div class="btn-row"><button type="button" class="btn" data-act="trial">Пробный — бесплатно</button><button type="button" class="btn ghost" data-act="tab" data-id="schedule">Расписание</button></div></section>
      ${next ? `<div class="h3">Ваше занятие</div>${apptCard(next, true)}` : ''}
      <div style="height:14px"></div>
      <div class="nopair"><span class="i">💃🕺</span><div><b>Нет пары? Не проблема</b><div class="muted">У каждой парной группы видно, кого сейчас ждут — партнёров или партнёрш. Приходи один или одна.</div></div></div>
      <div class="h3">Ближайшие занятия <button type="button" data-act="tab" data-id="schedule">всё расписание</button></div>
      ${soon.map((c) => clsCard(c, c.date !== today)).join('')}
      ${daysTo >= 0 ? `<div class="h3">Событие</div>
      <button type="button" class="event" data-act="cls" data-id="${cup.date}|${cup.time}|cup"><img src="${img(cup.img)}" alt="" loading="lazy">
        <div class="k">${fmtDay(cup.date)} · ${cup.time}</div><div class="t">${esc(cup.title)}</div><div class="s">${esc(cup.text)}</div>
        <span class="cd">${daysTo === 0 ? 'сегодня' : `через ${daysTo} ${plural(daysTo, 'день', 'дня', 'дней')}`}</span></button>` : ''}
      <div class="h3">Подарок паре</div>
      <button type="button" class="box perk" style="width:100%;text-align:left" data-act="tab" data-id="prices"><span class="i">🌹</span><div><b>«Танцевальное свидание» — 6 990 ₽</b><div class="muted">Два тренера, двое вас и целый зал. Можно подарочным сертификатом</div></div></button>
      <div class="h3">Как добраться</div>
      <section class="box"><b>${esc(D.studio.address)}</b><div class="muted">${esc(D.studio.metro)}</div>
        <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="chat">Написать</button></div></section>
      <p class="footnote">Концепт приложения для студии MMDance.<br>Расписание и цены — с сайта студии, места и баланс в группах — пример. Фото — Unsplash.</p>`;
  }

  // ── Расписание ───────────────────────────────────────
  function renderSchedule() {
    const days = nextDays(14);
    if (!days.includes(state.day)) state.day = days[0];
    const now = new Date();
    const list = classesFor(state.day).filter((c) => startOf(c) > now).filter((c) => state.kind === 'all' || c.kind === state.kind || c.kind === 'event');
    const chip = (id, label) => `<button type="button" class="chip ${state.kind === id ? 'on' : ''}" data-act="kind" data-id="${id}">${label}</button>`;
    return `<h1 class="title">Расписание</h1>
      <div class="days">${days.map((k) => { const d = parseKey(k); const has = classesFor(k).length; return `<button type="button" class="dayb ${k === state.day ? 'on' : ''}" data-act="day" data-id="${k}" ${has ? '' : 'style="opacity:.45"'}>${k === cup.date ? '<span class="hw">🏆</span>' : ''}<small>${WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>
      <div class="chips">${chip('all', 'Все')}${chip('pair', 'Парные')}${chip('solo', 'Сольные')}</div>
      ${list.map((c) => clsCard(c)).join('') || '<div class="empty">В этот день занятий нет — выберите другой</div>'}
      <p class="footnote">♂ партнёры · ♀ партнёрши — сколько уже записано в группу</p>`;
  }

  // ── Занятие и запись ─────────────────────────────────
  const payOptions = (c) => {
    if (c.kind === 'event') return [{ id: 'cup-dancer', name: 'Участник турнира', price: 0, note: 'стоимость уточнит студия' }, { id: 'cup-guest', name: 'Зритель + afterparty', price: 0, note: 'стоимость уточнит студия' }];
    const opts = [];
    if (!bookings.some((b) => b.pay === 'trial')) opts.push({ id: 'trial', name: 'Пробный урок', price: 0, note: 'в этот день — скидки на абонементы' });
    opts.push({ id: 'single', name: 'Разовое занятие', price: 1200 });
    opts.push({ id: 'sub', name: 'По абонементу', price: 0, note: 'спишется одно занятие' });
    return opts;
  };
  const ROLES = [['lead', 'Партнёр', 'веду'], ['follow', 'Партнёрша', 'ведомая'], ['couple', 'Мы пара', 'двое']];

  function renderClass() {
    const c = findClass(state.cls); const s = seats(c); const mine = myBooking(c.id); const f = state.form;
    const isEvent = c.kind === 'event'; const pair = c.kind === 'pair';
    const text = isEvent ? cup.text : D.dirs[c.dir].text;
    const head = `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <img class="detail-ph" src="${img(dirImg(c))}" alt="">
      <h1 class="title" style="margin-bottom:4px">${esc(dirName(c))}</h1>
      <div class="muted">${fmtDay(c.date)} · ${hm(c.time)}–${hm(c.time + c.dur)} · ${esc(D.studio.address)}</div>
      <p class="muted" style="margin-top:8px;font-size:14px">${esc(text)}</p>
      ${pair ? `<div class="roles"><div class="role ${s.lead < s.follow ? 'need' : ''}"><small>партнёры</small><b>${s.lead}/${s.cap}</b>${s.lead < s.follow ? '<small>ждём вас!</small>' : ''}</div>
        <div class="role ${s.follow < s.lead ? 'need' : ''}"><small>партнёрши</small><b>${s.follow}/${s.cap}</b>${s.follow < s.lead ? '<small>ждём вас!</small>' : ''}</div></div>
        <div class="note">💃🕺 Пара не нужна: в группе партнёры меняются, тренер следит за балансом.</div>`
        : `<div class="facts"><div class="fact"><span>Формат</span><b>${isEvent ? 'Турнир' : 'Соло, с нуля'}</b></div><div class="fact"><span>Свободно мест</span><b>${s.left} из ${s.cap}</b></div></div>`}`;

    if (mine) {
      return `${head}<div class="note" style="margin-top:14px">✓ Вы записаны${mine.roleName ? ` — ${esc(mine.roleName.toLowerCase())}` : ''}. ${isEvent ? '' : 'Если планы изменятся — отмените, место освободится для других.'}</div>
        <button type="button" class="btn danger" data-act="cancel" data-id="${esc(c.id)}">Отменить запись</button>`;
    }
    const opts = payOptions(c);
    if (!opts.some((o) => o.id === f.pay)) f.pay = opts[0].id;
    const roleFull = pair && f.role && ((f.role !== 'follow' && s.lead >= s.cap) || (f.role !== 'lead' && s.follow >= s.cap));
    const opt = opts.find((o) => o.id === f.pay);
    return `${head}
      ${pair ? `<div class="h3">Кто вы в паре</div><div class="chips wrap">${ROLES.map(([id, n, sub]) => `<button type="button" class="chip ${f.role === id ? 'on' : ''}" data-act="role" data-id="${id}">${n} <small>${sub}</small></button>`).join('')}</div>
        ${roleFull ? '<div class="note warn">На эту роль мест нет — запишем в лист ожидания.</div>' : ''}` : ''}
      <div class="h3">${isEvent ? 'Участие' : 'Оплата'}</div>
      ${opts.map((o) => `<button type="button" class="pay ${o.id === f.pay ? 'sel' : ''}" data-act="pay" data-id="${o.id}"><span><b>${esc(o.name)}</b>${o.note ? `<small>${esc(o.note)}</small>` : ''}</span><span class="price">${o.id === 'sub' || isEvent ? '' : rub(o.price * (f.role === 'couple' ? 2 : 1))}</span></button>`).join('')}
      <div class="h3">Ваши данные</div>
      <label class="field"><span>Имя</span><input id="f-name" autocomplete="name" value="${esc(f.name)}" placeholder="Как к вам обращаться"></label>
      ${inTG ? '<div class="note">💬 Номер не нужен: подтверждение и напоминание придут сюда, в Telegram. Менеджеру не нужно перезванивать.</div>'
        : `<label class="field"><span>Телефон</span><input id="f-phone" type="tel" inputmode="tel" value="${esc(f.phone)}" placeholder="+7 900 000-00-00"></label>`}
      <label class="consent"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''}><span>Согласен(на) на обработку персональных данных и с офертой студии</span></label>
      ${!isEvent && opt.price ? `<div class="total"><span>Итого</span><span>${rub(opt.price * (f.role === 'couple' ? 2 : 1))}</span></div>` : ''}`;
  }

  const formOk = (c, f) => (c.kind !== 'pair' || !!f.role) && f.name.trim().length >= 2 && (inTG || f.phone.replace(/\D/g, '').length >= 10) && f.consent;

  function afterClassRender() {
    const c = findClass(state.cls);
    if (myBooking(c.id)) return;
    const f = state.form; const s = seats(c);
    const full = c.kind === 'pair' ? f.role && ((f.role !== 'follow' && s.lead >= s.cap) || (f.role !== 'lead' && s.follow >= s.cap)) : s.left <= 0;
    const sync = () => {
      f.name = $('#f-name').value; if (!inTG) f.phone = $('#f-phone').value; f.consent = $('#f-consent').checked;
      setCTA(full ? 'Встать в лист ожидания' : c.kind === 'pair' && !f.role ? 'Выберите роль в паре' : `Записаться · ${fmtDay(c.date)}, ${hm(c.time)}`, formOk(c, f), full ? waitlist : submit);
    };
    $('#f-name').addEventListener('input', sync);
    if (!inTG) $('#f-phone').addEventListener('input', sync);
    $('#f-consent').addEventListener('change', sync);
    sync();
  }
  function waitlist() { haptic.ok(); toast('Вы в листе ожидания — напишем, когда место освободится'); goBack(); }

  function submit() {
    const c = findClass(state.cls); const f = state.form;
    if (!formOk(c, f)) { haptic.warn(); return; }
    const opt = payOptions(c).find((o) => o.id === f.pay); const role = ROLES.find((r) => r[0] === f.role);
    bookings.push({ id: c.id, date: c.date, time: c.time, dir: c.dir, kind: c.kind, pay: f.pay, payName: opt.name, role: f.role || '', roleName: role ? role[1] : '',
      price: opt.price * (f.role === 'couple' ? 2 : 1), name: f.name.trim(), phone: (f.phone || '').trim() });
    save(); haptic.ok();
    state.done = c.id; state.cls = null; state.form = null; state.tab = 'mine';
    render();
  }

  function renderDone() {
    const b = myBooking(state.done);
    if (!b) { state.done = null; return renderMine(); }
    return `<div class="ok">✓</div><div class="center title" style="margin-bottom:4px">Вы записаны</div>
      <div class="center muted">До встречи в MMDance ❤️</div>
      <div class="note">💬 В рабочей версии подтверждение и напоминание за день придут от бота студии — менеджеру не нужно перезванивать.</div>
      ${apptCard(b, true)}
      <div class="stack" style="margin-top:12px"><button type="button" class="btn ghost" data-act="tab" data-id="mine">Мои занятия</button><button type="button" class="btn ghost" data-act="tab" data-id="schedule">Записаться ещё</button></div>`;
  }

  // ── Мои занятия ──────────────────────────────────────
  function apptCard(b, compact) {
    const isPast = startOf(b) <= new Date();
    const name = b.dir === 'cup' ? cup.title : D.dirs[b.dir].name;
    return `<div class="appt ${isPast ? 'past' : ''}"><b>${esc(name)}</b>${b.roleName ? ` <span class="muted">· ${esc(b.roleName)}</span>` : ''}
      <div class="row"><span class="price">${fmtDay(b.date)} · ${hm(b.time)}</span><span class="muted">${esc(b.payName)}${b.price ? ' · ' + rub(b.price) : ''}</span></div>
      ${isPast || compact ? '' : `${b.kind !== 'event' ? `<div class="muted" style="margin-top:6px">Не получается прийти? Отмените — место достанется другому</div>` : ''}
        <div class="btn-row"><button type="button" class="btn ghost" data-act="cls" data-id="${esc(b.id)}">Подробнее</button><button type="button" class="btn danger" data-act="cancel" data-id="${esc(b.id)}">Отменить</button></div>`}</div>`;
  }
  function renderMine() {
    const up = upcoming(); const old = past();
    if (!up.length && !old.length) {
      return `<h1 class="title">Мои занятия</h1><div class="empty">Пока нет записей.<br>Первый урок — бесплатно, пара не нужна.</div>
        <div style="height:14px"></div><button type="button" class="btn" data-act="trial">Записаться на пробный</button>`;
    }
    return `<h1 class="title">Мои занятия</h1>${up.map((b) => apptCard(b)).join('') || '<div class="empty">Предстоящих занятий нет</div>'}
      ${old.length ? `<div class="h3">Прошедшие</div>${old.map((b) => apptCard(b)).join('')}` : ''}`;
  }

  // ── Цены ─────────────────────────────────────────────
  function renderPrices() {
    const row = (p) => `<div class="row"><span>${esc(p.name)}${p.note ? `<small>${esc(p.note)}</small>` : ''}</span><span class="price">${rub(p.price)}</span></div>`;
    return `<h1 class="title">Цены</h1>
      <div class="box plist">${D.prices.map(row).join('')}</div>
      <div class="h3">Индивидуально</div>
      <div class="box plist">${D.personal.map(row).join('')}</div>
      <div class="note">На групповые абонементы — скидка 20% после индивидуального занятия</div>
      <div class="h3">Ещё</div>
      <div class="chips wrap">${D.extras.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>
      <div style="height:14px"></div><button type="button" class="btn" data-act="trial">Записаться на пробный — бесплатно</button>
      <p class="footnote">В рабочей версии абонемент и сертификат можно будет оплатить прямо здесь</p>`;
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); };
  const openClass = (id) => {
    state.cls = id; state.done = null;
    state.form = { pay: null, role: null, name: (tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')) || '', phone: '', consent: false };
    haptic.tap(); render();
  };

  document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset;
    switch (act) {
      case 'tab': state.cls = null; state.done = null; state.tab = id; haptic.tap(); render(); break;
      case 'cls': openClass(id); break;
      case 'back': goBack(); break;
      case 'day': state.day = id; haptic.tap(); render(true); break;
      case 'kind': state.kind = id; haptic.tap(); render(true); break;
      case 'trial': state.cls = null; state.done = null; state.tab = 'schedule'; state.kind = 'all'; haptic.tap(); render(); toast('Выберите любое занятие — первое бесплатно'); break;
      case 'pay': state.form.pay = id; haptic.tap(); render(true); break;
      case 'role': state.form.role = id; haptic.tap(); render(true); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.studio.mapQuery)}`); break;
      case 'chat': toast('В рабочей версии откроется чат с администратором студии'); break;
      case 'cancel': {
        if (!(await confirmDialog('Отменить запись?'))) return;
        bookings = bookings.filter((x) => x.id !== id); save(); haptic.warn(); toast('Запись отменена');
        if (state.cls) { state.cls = null; state.form = null; }
        render();
        break;
      }
    }
  });
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.cls = null; state.done = null; state.tab = b.dataset.tab; haptic.tap(); render();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (state.cls || state.done)) goBack(); });

  function updateDot() { $('.tabs .dot').hidden = upcoming().length === 0; }
  updateDot();
  render();
})();
