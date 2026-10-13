(() => {
  'use strict';

  const D = window.BS;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (name) => `img/${name}.jpg`;
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
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

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready();
    tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#0E1428'); tg.setBackgroundColor('#0B1020'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#0B1020');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const confirmDialog = (text) => new Promise((resolve) => {
    if (tgAtLeast('6.2')) tg.showConfirm(text, (ok) => resolve(ok)); else resolve(window.confirm(text));
  });

  // ── Записи (демо: на устройстве и в облаке Telegram) ─
  const KEY = 'budsoboy_concept_bookings';
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
  const shabash = D.events.find((e) => e.id === 'shabash');
  const psy = D.events.find((e) => e.id === 'psy');
  const inShabash = (k) => k >= shabash.from && k <= shabash.to;

  function classesFor(k) {
    const day = parseKey(k).getDay();
    const list = (D.week[day] || []).map(([t, dir, level, sch]) => {
      const d = D.dirs[dir];
      return { id: `${k}|${t}|${dir}`, date: k, time: toMin(t), dir, level, sch: !!sch, kind: d.kind, cap: d.cap || (d.kind === 'fit' ? 10 : 14), hw: inShabash(k) };
    });
    if (k === psy.date) list.push({ id: `${k}|${psy.time}|psy`, date: k, time: toMin(psy.time), dir: 'psy', level: 'Для всех', kind: 'event', cap: psy.cap, hw: false });
    return list.sort((a, b) => a.time - b.time);
  }
  const findClass = (id) => classesFor(id.split('|')[0]).find((c) => c.id === id);
  const dirName = (c) => (c.dir === 'psy' ? psy.title : D.dirs[c.dir].name);
  const dirImg = (c) => (c.dir === 'psy' ? 'yoga-sit' : D.dirs[c.dir].img);

  function seats(c) {
    const h = hash(c.id);
    let taken = h % 7 === 0 ? c.cap : Math.min(c.cap - 1, 3 + (h % (c.cap - 2)));
    if (myBooking(c.id) && taken < c.cap) taken += 1;
    return { taken, left: c.cap - taken, cap: c.cap };
  }

  // ── Состояние ────────────────────────────────────────
  const state = { tab: 'home', day: dateKey(new Date()), kind: 'all', level: 'all', cls: null, form: null, done: null };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');

  let ctaHandler = null;
  function setCTA(text, enabled, handler) {
    ctaHandler = handler;
    if (inTG) {
      cta.hidden = true;
      if (!text) { tg.MainButton.hide(); return; }
      tg.MainButton.setParams({ text, color: enabled ? '#7DB4FF' : '#24304F', text_color: enabled ? '#071226' : '#8E9BBF', is_active: enabled, is_visible: true });
    } else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.disabled = !enabled; }
    view.classList.toggle('tg-cta', inTG && !!text);
  }
  const runCTA = () => { if (ctaHandler) ctaHandler(); };
  if (inTG) tg.MainButton.onClick(runCTA); else ctaBtn.addEventListener('click', runCTA);
  const setBack = (v) => { if (inTG) { if (v) tg.BackButton.show(); else tg.BackButton.hide(); } };
  if (inTG) tg.BackButton.onClick(() => goBack());

  function render(soft = false) {
    const inner = !!(state.cls || state.done);
    tabs.hidden = !!state.cls;
    view.classList.toggle('no-tabs', !!state.cls);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    setBack(inner);
    const html = state.cls ? renderClass() : state.done ? renderDone()
      : ({ home: renderHome, schedule: renderSchedule, prices: renderPrices, mine: renderMine })[state.tab]();
    const daysScroll = soft && $('.days') ? $('.days').scrollLeft : null;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); }
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
    const seatsHtml = c.kind === 'event' ? `<div class="seats"><b>${s.left}</b>мест</div>`
      : s.left <= 0 ? '<div class="seats full"><b>мест нет</b>лист ожидания</div>'
        : `<div class="seats ${s.left <= 3 ? 'low' : ''}"><b>${s.left}</b>из ${s.cap}<div class="bar"><i style="width:${Math.round(100 * s.taken / s.cap)}%"></i></div></div>`;
    return `<button type="button" class="cls ${mine ? 'mine' : ''}" data-act="cls" data-id="${esc(c.id)}">
      <div class="tm"><b>${hm(c.time)}</b><span>${withDate ? fmtDay(c.date) : c.kind === 'fit' ? 'фитнес' : c.kind === 'event' ? 'событие' : 'танцы'}</span></div>
      <div class="body"><div class="name">${esc(dirName(c))}</div><div class="tags">
        <span class="tag2 lvl">${esc(c.level)}</span>${c.sch ? '<span class="tag2 sch">СЧ</span>' : ''}${c.hw ? '<span class="tag2 hw">🎃 шабаш</span>' : ''}${mine ? '<span class="tag2" style="color:var(--ok)">✓ вы записаны</span>' : ''}</div></div>
      ${seatsHtml}</button>`;
  };

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    const name = tgUser && tgUser.first_name ? `, ${esc(tgUser.first_name)}` : '';
    const now = new Date();
    const soon = nextDays(3).flatMap((k) => classesFor(k)).filter((c) => startOf(c) > now).slice(0, 4);
    const today = dateKey(now);
    const daysTo = Math.round((parseKey(shabash.from) - parseKey(today)) / 864e5);
    const cd = today > shabash.to ? '' : daysTo > 0 ? `через ${daysTo} ${daysTo % 10 === 1 && daysTo !== 11 ? 'день' : daysTo % 10 >= 2 && daysTo % 10 <= 4 && (daysTo < 10 || daysTo > 20) ? 'дня' : 'дней'}` : 'идёт сейчас';
    const next = upcoming()[0];
    return `
      <div class="muted" style="margin-bottom:10px">${hello}${name} 💙</div>
      <section class="hero">
        <img src="${img('hero')}" alt="">
        <span class="tag">Танцы и фитнес · Петроградка</span>
        <h1>${esc(D.studio.name)}</h1>
        <p>${esc(D.studio.tagline)}</p>
        <div class="btn-row"><button type="button" class="btn" data-act="tab" data-id="schedule">Расписание</button><button type="button" class="btn ghost" data-act="trial">Пробное · 650 ₽</button></div>
      </section>
      ${next ? `<div class="h3">Ваше занятие</div>${apptCard(next, true)}` : ''}
      <div class="h3">Ближайшие занятия <button type="button" data-act="tab" data-id="schedule">всё расписание</button></div>
      ${soon.map((c) => clsCard(c, c.date !== today)).join('') || '<div class="empty">Ближайших занятий нет — загляните в расписание</div>'}
      ${cd ? `<div class="h3">Хеллоуин</div>
      <button type="button" class="event" data-act="shabash"><img src="${img(shabash.img)}" alt="" loading="lazy">
        <div class="k">25–31 октября</div><div class="t">${esc(shabash.title)} 🎃</div><div class="s">${esc(shabash.text)}</div><span class="cd">${cd}</span></button>` : ''}
      ${psy.date >= today ? `<div class="h3">События</div>
      <button type="button" class="box" style="width:100%;text-align:left" data-act="cls" data-id="${psy.date}|${psy.time}|psy">
        <div class="muted">${fmtDay(psy.date)} · ${psy.time}</div><b>${esc(psy.title)}</b><div class="muted" style="margin-top:2px">${esc(psy.text)}</div></button>` : ''}
      <div class="h3">Почему удобно</div>
      <div class="stack">
        <div class="box perk"><span class="i">🔑</span><div><b>1 абонемент = все направления</b><div class="muted">Меняй стиль без доплат и ограничений</div></div></div>
        <div class="box perk"><span class="i">💬</span><div><b>Подтверждение — прямо в Telegram</b><div class="muted">Даже если номер телефона скрыт</div></div></div>
        <div class="box perk"><span class="i">👯</span><div><b>Приведи подругу</b><div class="muted">${esc(D.friend.replace('Приведи подругу — ', ''))}</div></div></div>
      </div>
      <div class="h3">Как добраться</div>
      <section class="box"><b>${esc(D.studio.address)}</b><div class="muted">${esc(D.studio.metro)}</div>
        <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="route">Маршрут</button><button type="button" class="btn ghost" data-act="chat">Написать</button></div></section>
      <p class="footnote">Концепт приложения для студии «Будь собой».<br>Направления и цены — с сайта студии, расписание — пример. Фото — Unsplash.</p>`;
  }

  // ── Расписание ───────────────────────────────────────
  function renderSchedule() {
    const days = nextDays(14);
    if (!days.includes(state.day)) state.day = days[0];
    const now = new Date();
    const list = classesFor(state.day).filter((c) => startOf(c) > now)
      .filter((c) => state.kind === 'all' || c.kind === state.kind || c.kind === 'event')
      .filter((c) => state.level === 'all' || c.level === state.level || c.kind !== 'dance');
    const chip = (act, id, label, cur) => `<button type="button" class="chip ${cur === id ? 'on' : ''}" data-act="${act}" data-id="${id}">${label}</button>`;
    return `<h1 class="title">Расписание</h1>
      <div class="days">${days.map((k) => { const d = parseKey(k); return `<button type="button" class="dayb ${k === state.day ? 'on' : ''}" data-act="day" data-id="${k}">${inShabash(k) ? '<span class="hw">🎃</span>' : ''}<small>${WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`; }).join('')}</div>
      <div class="chips">${chip('kind', 'all', 'Все', state.kind)}${chip('kind', 'dance', 'Танцы', state.kind)}${chip('kind', 'fit', 'Фитнес', state.kind)}</div>
      <div class="chips">${chip('level', 'all', 'Все уровни', state.level)}${chip('level', 'С нуля', 'С нуля', state.level)}${chip('level', 'Общий', 'Общий', state.level)}${chip('level', 'Средний', 'Средний', state.level)}</div>
      ${inShabash(state.day) ? '<div class="note">🎃 Неделя «Танцевального шабаша»: все занятия тематические, дресс-код — чем ярче, тем лучше!</div>' : ''}
      ${list.map((c) => clsCard(c)).join('') || '<div class="empty">На этот день занятий по фильтру нет</div>'}
      <p class="footnote">«СЧ» — занятия по абонементу «Счастливые часы»</p>`;
  }

  // ── Занятие и запись ─────────────────────────────────
  const payOptions = (c) => {
    if (c.kind === 'event') return [{ id: 'free', name: 'Вход свободный', price: 0 }];
    const opts = [];
    if (!bookings.some((b) => b.pay === 'trial')) opts.push({ id: 'trial', name: 'Пробное занятие', price: 650, note: 'бесплатно, если в тот же день купить абонемент' });
    opts.push({ id: 'single', name: 'Разовое занятие', price: 1000 });
    opts.push({ id: 'sub', name: 'По абонементу', price: 0, note: 'спишется одно занятие' });
    return opts;
  };
  const cancelUntil = (c) => new Date(startOf(c).getTime() - D.studio.cancelHours * 36e5);
  const fmtTime = (d) => `${hm(d.getHours() * 60 + d.getMinutes())}${dateKey(d) !== dateKey(new Date()) ? ', ' + fmtDay(dateKey(d)) : ''}`;

  function renderClass() {
    const c = findClass(state.cls); const s = seats(c); const mine = myBooking(c.id); const f = state.form;
    const isEvent = c.kind === 'event';
    const gear = (!isEvent && D.dirs[c.dir].gear) || [];
    const head = `${inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>'}
      <img class="detail-ph" src="${img(dirImg(c))}" alt="">
      <h1 class="title" style="margin-bottom:4px">${esc(dirName(c))}</h1>
      <div class="muted">${fmtDay(c.date)} · ${hm(c.time)}–${hm(c.time + 60)} · ${esc(D.studio.address)}</div>
      <div class="facts"><div class="fact"><span>${isEvent ? 'Формат' : 'Уровень'}</span><b>${esc(c.level)}</b></div>
        <div class="fact"><span>Свободно мест</span><b>${s.left > 0 ? `${s.left} из ${s.cap}` : 'нет'}</b></div></div>
      ${isEvent ? `<div class="muted">${esc(psy.text)}</div>` : `<div class="muted">${esc(D.levels[c.level] || '')}</div>`}
      ${c.hw ? '<div class="note">🎃 Занятие недели «Танцевальный шабаш» — приходи в образе!</div>' : ''}
      ${!isEvent ? '<div class="track">🎧 Трек к занятию появится здесь за день — не нужно искать его в чате</div>' : ''}`;

    if (mine) {
      const late = new Date() > cancelUntil(c);
      return `${head}<div class="note" style="margin-top:14px">✓ Вы записаны. ${late ? 'Бесплатная отмена уже недоступна — при отмене занятие сгорит.' : `Отменить без сгорания можно до ${fmtTime(cancelUntil(c))}.`}</div>
        <button type="button" class="btn danger" data-act="cancel" data-id="${esc(c.id)}">Отменить запись</button>`;
    }
    if (s.left <= 0) return `${head}<div class="note warn" style="margin-top:14px">Мест нет. Встаньте в лист ожидания — пришлём сообщение, если место освободится.</div>`;

    const opts = payOptions(c);
    if (!opts.some((o) => o.id === f.pay)) f.pay = opts[0].id;
    const total = opts.find((o) => o.id === f.pay).price + f.gear.reduce((sum, g) => sum + D.gear[g].price, 0);
    return `${head}
      <div class="h3">${isEvent ? 'Участие' : 'Оплата'}</div>
      ${opts.map((o) => `<button type="button" class="pay ${o.id === f.pay ? 'sel' : ''}" data-act="pay" data-id="${o.id}"><span><b>${esc(o.name)}</b>${o.note ? `<small>${esc(o.note)}</small>` : ''}</span><span class="price">${o.price ? rub(o.price) : o.id === 'sub' ? '' : 'бесплатно'}</span></button>`).join('')}
      ${gear.length ? `<div class="h3">Аренда в студии</div><div class="chips wrap">${gear.map((g) => `<button type="button" class="chip ${f.gear.includes(g) ? 'on' : ''}" data-act="gear" data-id="${g}">${esc(D.gear[g].name)} <small>+${rub(D.gear[g].price)}</small></button>`).join('')}</div>` : ''}
      <div class="h3">Ваши данные</div>
      <label class="field"><span>Имя</span><input id="f-name" autocomplete="name" value="${esc(f.name)}" placeholder="Как к вам обращаться"></label>
      ${inTG ? '<div class="note">💬 Номер телефона не нужен: подтверждение и напоминание придут сюда, в Telegram — даже если номер скрыт.</div>'
        : `<label class="field"><span>Телефон</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" placeholder="+7 900 000-00-00"></label>`}
      <label class="consent"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''}><span>Согласна на обработку персональных данных и с правилами студии</span></label>
      ${!isEvent ? `<div class="muted" style="margin-top:6px">Отмена без сгорания — не позднее чем за ${D.studio.cancelHours} часа до начала.</div>` : ''}
      <div class="total"><span>Итого</span><span>${total ? rub(total) : f.pay === 'sub' ? 'по абонементу' : 'бесплатно'}</span></div>`;
  }

  const formOk = (f) => f.name.trim().length >= 2 && (inTG || f.phone.replace(/\D/g, '').length >= 10) && f.consent;

  function afterClassRender() {
    const c = findClass(state.cls); const s = seats(c);
    if (myBooking(c.id)) return;
    if (s.left <= 0) { setCTA('Встать в лист ожидания', true, () => { haptic.ok(); toast('Вы в листе ожидания — напишем, если место освободится'); goBack(); }); return; }
    const f = state.form;
    const sync = () => {
      f.name = $('#f-name').value; if (!inTG) f.phone = $('#f-phone').value; f.consent = $('#f-consent').checked;
      setCTA(`Записаться · ${fmtDay(c.date)}, ${hm(c.time)}`, formOk(f), submit);
    };
    $('#f-name').addEventListener('input', sync);
    if (!inTG) $('#f-phone').addEventListener('input', sync);
    $('#f-consent').addEventListener('change', sync);
    sync();
  }

  function submit() {
    const c = findClass(state.cls); const f = state.form;
    if (!formOk(f)) { haptic.warn(); return; }
    const opt = payOptions(c).find((o) => o.id === f.pay);
    bookings.push({ id: c.id, date: c.date, time: c.time, dir: c.dir, level: c.level, pay: f.pay, payName: opt.name, gear: f.gear.slice(),
      price: opt.price + f.gear.reduce((sum, g) => sum + D.gear[g].price, 0), name: f.name.trim(), phone: (f.phone || '').trim() });
    save(); haptic.ok();
    state.done = c.id; state.cls = null; state.form = null; state.tab = 'mine';
    render();
  }

  function renderDone() {
    const b = myBooking(state.done);
    if (!b) { state.done = null; return renderMine(); }
    return `<div class="ok">✓</div>
      <div class="center title" style="margin-bottom:4px">Вы записаны</div>
      <div class="center muted">До встречи в «Будь собой» 💙</div>
      <div class="note">💬 В рабочей версии подтверждение придёт от бота студии в этот чат — номер телефона не нужен. За день пришлём трек и напоминание.</div>
      ${apptCard(b, true)}
      <div class="stack" style="margin-top:12px"><button type="button" class="btn ghost" data-act="tab" data-id="mine">Мои занятия</button>
        <button type="button" class="btn ghost" data-act="tab" data-id="schedule">Записаться ещё</button></div>`;
  }

  // ── Мои занятия ──────────────────────────────────────
  function apptCard(b, compact) {
    const isPast = startOf(b) <= new Date();
    const late = new Date() > cancelUntil(b);
    const name = b.dir === 'psy' ? psy.title : D.dirs[b.dir].name;
    const extra = [b.payName, ...(b.gear || []).map((g) => D.gear[g].short)].filter(Boolean).join(' · ');
    return `<div class="appt ${isPast ? 'past' : ''}"><b>${esc(name)}</b> <span class="muted">· ${esc(b.level)}</span>
      <div class="row"><span class="price">${fmtDay(b.date)} · ${hm(b.time)}</span><span class="muted">${esc(extra)}${b.price ? ' · ' + rub(b.price) : ''}</span></div>
      ${!isPast && b.dir !== 'psy' ? '<div class="track">🎧 Трек к занятию откроется за день</div>' : ''}
      ${isPast || compact ? '' : `<div class="muted" style="margin-top:6px">${late ? 'Бесплатная отмена уже недоступна' : `Отмена без сгорания — до ${fmtTime(cancelUntil(b))}`}</div>
        <div class="btn-row"><button type="button" class="btn ghost" data-act="cls" data-id="${esc(b.id)}">Подробнее</button><button type="button" class="btn danger" data-act="cancel" data-id="${esc(b.id)}">Отменить</button></div>`}</div>`;
  }

  function renderMine() {
    const up = upcoming(); const old = past();
    if (!up.length && !old.length) {
      return `<h1 class="title">Мои занятия</h1><div class="empty">Пока нет записей.<br>Первое занятие — пробное, а с абонементом в тот же день оно бесплатно.</div>
        <div style="height:14px"></div><button type="button" class="btn" data-act="tab" data-id="schedule">Открыть расписание</button>`;
    }
    return `<h1 class="title">Мои занятия</h1>${up.map((b) => apptCard(b)).join('') || '<div class="empty">Предстоящих занятий нет</div>'}
      ${old.length ? `<div class="h3">Прошедшие</div>${old.map((b) => apptCard(b)).join('')}` : ''}`;
  }

  // ── Абонементы ───────────────────────────────────────
  function renderPrices() {
    return `<h1 class="title">Абонементы и цены</h1>
      <div class="box plist">${D.prices.map((p) => `<div class="row"><span>${esc(p.name)}${p.note ? `<small>${esc(p.note)}</small>` : ''}</span><span class="price">${rub(p.price)}</span></div>`).join('')}</div>
      <div class="h3">Абонементы</div>
      <div class="box plist">${D.subs.map((p) => `<div class="row"><span>${esc(p.name)}<small>${esc(p.note)}</small></span><span class="muted">из прайса</span></div>`).join('')}</div>
      <div class="note">🔑 1 абонемент = все направления: танцы и фитнес без доплат</div>
      <div class="h3">Аренда</div>
      <div class="box plist">${Object.values(D.gear).map((g) => `<div class="row"><span>${esc(g.name)}</span><span class="price">${rub(g.price)}</span></div>`).join('')}</div>
      <div class="h3">Приведи подругу</div>
      <div class="box">${esc(D.friend)}</div>
      <div style="height:14px"></div><button type="button" class="btn" data-act="trial">Записаться на пробное</button>
      <p class="footnote">В рабочей версии абонемент можно будет купить прямо здесь</p>`;
  }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); };

  const openClass = (id) => {
    state.cls = id; state.done = null;
    state.form = { pay: null, gear: [], name: (tgUser && [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ')) || '', phone: '', consent: false };
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
      case 'level': state.level = id; haptic.tap(); render(true); break;
      case 'trial': state.cls = null; state.done = null; state.tab = 'schedule'; state.level = 'С нуля'; state.kind = 'dance'; haptic.tap(); render(); toast('Выберите занятие «С нуля» — первое будет пробным'); break;
      case 'shabash': state.tab = 'schedule'; state.day = shabash.from; state.kind = 'all'; state.level = 'all'; haptic.tap(); render(); break;
      case 'pay': state.form.pay = id; haptic.tap(); render(true); break;
      case 'gear': { const g = state.form.gear; const i = g.indexOf(id); if (i >= 0) g.splice(i, 1); else g.push(id); haptic.tap(); render(true); break; }
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.studio.mapQuery)}`); break;
      case 'chat': toast('В рабочей версии откроется чат с менеджером студии'); break;
      case 'cancel': {
        const b = myBooking(id); const late = new Date() > cancelUntil(b);
        const ok = await confirmDialog(late ? 'До занятия меньше 3 часов — при отмене оно сгорит. Всё равно отменить?' : 'Отменить запись? Занятие не сгорит.');
        if (!ok) return;
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
