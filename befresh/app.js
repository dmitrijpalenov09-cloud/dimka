(() => {
  'use strict';

  const D = window.SIMON;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const V = (id) => D.videos[id];
  const thumb = (id) => `img/${id}.jpg`;
  const views = (n) => (n >= 1000 ? (n >= 10000 ? Math.round(n / 1000) : (n / 1000).toFixed(1).replace('.', ',').replace(',0', '')) + ' тыс.' : n) + ' просмотров';
  const ago = (date) => {
    const d = Math.floor((Date.now() - new Date(date + 'T12:00:00')) / 864e5);
    if (d < 1) return 'сегодня'; if (d < 2) return 'вчера'; if (d < 7) return `${d} дн. назад`;
    if (d < 30) return `${Math.floor(d / 7)} нед. назад`; if (d < 365) return `${Math.floor(d / 30)} мес. назад`; return `${Math.floor(d / 365)} г. назад`;
  };
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready(); tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#000000');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const openTg = (url) => { if (inTG) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Прогресс (на устройстве + облако Telegram) ───────
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* память */ } };
  let P = load('befresh_progress', { level: null, watched: {}, days: [], member: false, applied: false });
  const save = () => { store('befresh_progress', P); if (tgAtLeast('6.9')) tg.CloudStorage.setItem('befresh_progress', JSON.stringify(P), () => {}); };
  if (tgAtLeast('6.9')) tg.CloudStorage.getItem('befresh_progress', (e, v) => { if (!e && v) { try { const c = JSON.parse(v); if (Object.keys(c.watched || {}).length >= Object.keys(P.watched).length) { P = c; render(true); } } catch { /* */ } } });
  const today = () => new Date().toISOString().slice(0, 10);
  function markWatched(id) {
    if (P.watched[id]) return false;
    P.watched[id] = today();
    if (!P.days.includes(today())) P.days.push(today());
    save(); return true;
  }
  const streak = () => { let n = 0; const d = new Date(); for (;;) { const k = d.toISOString().slice(0, 10); if (P.days.includes(k)) { n++; d.setDate(d.getDate() - 1); } else break; } return n; };
  const pathVideos = () => D.path.flatMap((s) => s.videos || []);
  const doneCount = () => pathVideos().filter((id) => P.watched[id]).length;
  const startStage = () => (D.levels.find((l) => l.id === P.level) || D.levels[0]).start;
  function nextVideo() {
    const order = D.path.filter((s) => !s.locked); const i = order.findIndex((s) => s.id === startStage());
    for (const s of [...order.slice(i), ...order.slice(0, i)]) for (const id of s.videos) if (!P.watched[id]) return id;
    return null;
  }

  // ── Состояние и каркас ───────────────────────────────
  const state = { tab: 'home', screen: null, video: null, playing: false, plan: 'm3', rub: 'all', form: { name: (tgUser && tgUser.first_name) || '', income: null, goal: '', consent: false } };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn'); const sheet = $('#sheet');
  let ctaHandler = null;
  function setCTA(text, handler, color) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: color === 'gold' ? '#FFFFFF' : color === 'green' ? '#C6FF3D' : '#FFFFFF', text_color: '#111111', is_active: true, is_visible: true }); }
    else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.className = 'btn' + (color === 'green' ? ' green' : ''); if (color === 'gold') ctaBtn.style.cssText = 'background:#FFFFFF;color:#000000;box-shadow:0 10px 30px -10px rgba(255,255,255,.6)'; else ctaBtn.style.cssText = ''; }
    view.classList.toggle('tg-cta', inTG && !!text);
    cta.style.bottom = tabs.hidden ? '0' : 'calc(var(--tabs-h) + var(--safe-bottom))';
    view.classList.toggle('cta-tabs', !inTG && !!text && !tabs.hidden);
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
    const html = state.screen === 'video' ? renderVideo() : state.screen === 'mentor' ? renderMentor() : state.screen === 'welcome' ? renderWelcome()
      : ({ home: renderHome, path: renderPath, videos: renderVideos, club: renderClub })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    after();
  }
  function goBack() { haptic.tap(); state.screen = null; state.playing = false; render(); }

  const thumbHTML = (id, { play = false, big = false } = {}) => `<div class="thumb"><img src="${thumb(id)}" alt="" loading="lazy">
      ${P.watched[id] ? '<span class="done">✓ просмотрено</span>' : (Date.now() - new Date(V(id).date) < 10 * 864e5 ? '<span class="new">новое</span>' : '')}
      ${play || big ? '<span class="play"></span>' : ''}<span class="dur">${V(id).min} мин</span>${P.watched[id] ? '<span class="prog" style="width:100%"></span>' : ''}</div>`;
  const vcard = (id) => `<button type="button" class="vcard" data-act="video" data-id="${id}">${thumbHTML(id)}<div class="t">${esc(V(id).t)}</div><div class="meta">${views(V(id).views)} · ${ago(V(id).date)}</div></button>`;
  const vrow = (id) => `<button type="button" class="vrow" data-act="video" data-id="${id}">${thumbHTML(id)}<div><div class="t">${esc(V(id).t)}</div><div class="meta">${views(V(id).views)} · ${ago(V(id).date)}</div></div></button>`;

  // ── Главная ──────────────────────────────────────────
  function renderHome() {
    const latest = Object.keys(D.videos).sort((a, b) => V(b).date.localeCompare(V(a).date))[0];
    const popular = Object.keys(D.videos).sort((a, b) => V(b).views - V(a).views).slice(0, 5);
    const nx = nextVideo(); const lvl = D.levels.find((l) => l.id === P.level);
    const hi = tgUser && tgUser.first_name ? `${esc(tgUser.first_name)}, ` : '';
    return `<section class="hero"><div class="row"><img class="ava" src="img/avatar.jpg" alt=""><div><div class="nm">${esc(D.me.name)}</div><div class="motto">«${esc(D.me.motto)}»</div></div></div>
        <div class="stats">${D.me.stats.map((s) => `<div><b>${s.v}</b><span>${s.l}</span></div>`).join('')}</div></section>
      ${P.level ? `<div class="h3">${hi ? hi + 'твой' : 'Твой'} следующий шаг <button type="button" data-act="tab" data-id="path">весь путь</button></div>
          ${nx ? `<button type="button" class="vbig" data-act="video" data-id="${nx}">${thumbHTML(nx, { big: true })}<div class="in"><div class="t">${esc(V(nx).t)}</div><div class="meta">${lvl.e} ${esc(lvl.name)} · пройдено ${doneCount()} из ${pathVideos().length}</div></div></button>`
            : '<div class="note"><b>Открытый путь пройден 🔥</b> Дальше — программа BE FRESH SYSTEM.</div>'}`
        : `<div class="h3">Что хочешь прокачать?</div><p class="muted" style="margin:-6px 0 12px">Соберу путь из видео be fresh под твою цель</p>
          <div class="levels">${D.levels.map((l) => `<button type="button" class="lvl" data-act="level" data-id="${l.id}"><span class="e">${l.e}</span><span><b>${l.name}</b><span class="muted">${l.sub}</span></span><span class="arr">›</span></button>`).join('')}</div>`}
      <div class="h3">Новое видео</div>
      <button type="button" class="vbig" data-act="video" data-id="${latest}">${thumbHTML(latest, { big: true })}<div class="in"><div class="t">${esc(V(latest).t)}</div><div class="meta">${views(V(latest).views)} · ${ago(V(latest).date)}</div></div></button>
      <div class="h3">Самое смотримое <button type="button" data-act="tab" data-id="videos">все видео</button></div>
      <div class="hscroll">${popular.map(vcard).join('')}</div>
      <div class="h3">Бесплатный закрытый клуб</div>
      <button type="button" class="vbig" data-act="free" style="padding:16px"><div style="display:flex;gap:12px;align-items:center"><span style="font-size:30px">🔐</span><div><div class="t">Вступай бесплатно</div><div class="meta">Закрытый Telegram-канал be fresh — то, что не влезает в ролики</div></div><span style="margin-left:auto;color:var(--blue2);font-size:22px">›</span></div></button>
      <div class="h3">Платная программа</div>
      <button type="button" class="vbig" data-act="tab" data-id="club" style="padding:16px;background:radial-gradient(100% 90% at 100% 0%,rgba(255,255,255,.2),transparent 60%),var(--card)">
        <div style="display:flex;gap:12px;align-items:center"><span style="font-size:30px">🔒</span><div><div class="t">BE FRESH SYSTEM</div><div class="meta">30 дней, 4 аспекта, чек-ины и закрытый чат · оплата звёздами Telegram</div></div><span style="margin-left:auto;color:var(--gold);font-size:22px">›</span></div></button>
      <p class="footnote">Концепт приложения для be fresh.<br>Видео — с YouTube-канала be fresh (@befreshhh). Состав и цены SYSTEM — пример.</p>`;
  }
  const caseCard = (c) => `<div class="case"><button type="button" style="display:block;width:100%" data-act="video" data-id="${c.video}">${thumbHTML(c.video, { play: true })}</button>
      <div class="nums"><div><span class="muted">было</span><b>${c.from}</b></div><div class="arr">→</div><div class="to"><span class="muted">стало</span><b>${c.to}</b></div><div><span class="muted">срок</span><b style="font-size:15px;padding:4px 0">${c.time}</b></div></div>
      <div style="padding:0 14px 14px" class="muted">${esc(c.who)} — полный разбор: что делал, где ошибался, сколько заработал.</div></div>`;

  // ── Путь ─────────────────────────────────────────────
  function renderPath() {
    const total = pathVideos().length; const done = doneCount(); const st = streak();
    const cur = D.path.find((s) => !s.locked && s.videos.some((id) => !P.watched[id]));
    return `<div class="eyebrow">Путь be fresh</div><h1 class="title">Стань <span class="g">лучшей версией</span> себя</h1>
      <div class="streak"><span class="fire">${st ? '🔥' : '🌱'}</span><div class="bar-wrap" style="flex:1"><b>${done}</b> <span class="muted">из ${total} видео</span>
        <div class="bar"><i style="width:${Math.round(100 * done / total)}%"></i></div></div><div style="text-align:right"><b>${st}</b><div class="muted">${plural(st, 'день', 'дня', 'дней')} подряд</div></div></div>
      ${P.level ? '' : '<div class="note">Выбери на главной «где ты сейчас» — подсветим, с чего начать.</div>'}
      ${D.path.map((s) => {
        if (s.locked && P.member) return `<div class="stage cur"><div class="num">🔓</div><div class="hd"><b>${s.n}. ${esc(s.name)}</b><div class="muted">Открыто для тебя · ${s.count} дней</div></div>
          <div class="box" style="padding:14px"><div class="muted" style="margin-bottom:10px">Задание на каждый день — здесь будет чек-лист с отметками и серией.</div><button type="button" class="btn small" data-act="channel">Перейти в закрытый канал</button></div></div>`;
        if (s.locked) return `<div class="stage lock"><div class="num">🔒</div><div class="hd"><b>${s.n}. ${esc(s.name)}</b><div class="muted">${esc(s.sub)}</div></div>
          <div class="box"><div style="font-size:26px">🔒</div><b>${s.count} дней программы</b><div class="muted" style="margin:4px 0 12px">Открываются в BE FRESH SYSTEM</div><button type="button" class="btn small" data-act="tab" data-id="club" style="background:var(--gold);color:#000000;box-shadow:none">Открыть систему</button></div></div>`;
        const ok = s.videos.every((id) => P.watched[id]);
        const n = s.videos.filter((id) => P.watched[id]).length;
        return `<div class="stage ${ok ? 'ok' : cur && cur.id === s.id ? 'cur' : ''}"><div class="num">${ok ? '✓' : s.n}</div>
          <div class="hd"><b>${esc(s.name)}</b><div class="muted">${esc(s.sub)} · ${n}/${s.videos.length}${s.id === startStage() && P.level ? ' · <span style="color:var(--blue2)">начни отсюда</span>' : ''}</div></div>
          <div class="box">${s.videos.map(vrow).join('')}</div></div>`;
      }).join('')}`;
  }

  // ── Видео ────────────────────────────────────────────
  const RUBS = [['all', 'Все'], ['path', 'Прокачка'], ['life', 'Девушки и отношения']];
  function renderVideos() {
    let ids = Object.keys(D.videos);
    if (state.rub === 'path') ids = pathVideos(); else if (state.rub === 'case') ids = D.cases.map((c) => c.video); else if (state.rub === 'life') ids = D.life;
    ids = [...ids].sort((a, b) => V(b).date.localeCompare(V(a).date));
    return `<div class="eyebrow">YouTube · ${Object.keys(D.videos).length} видео</div><h1 class="title">Все <em>видео</em></h1>
      <div class="chips">${RUBS.map(([id, n]) => `<button type="button" class="chip ${state.rub === id ? 'on' : ''}" data-act="rub" data-id="${id}">${n}</button>`).join('')}</div>
      ${ids.map(vrow).join('')}`;
  }
  function renderVideo() {
    const id = state.video; const v = V(id);
    const stage = D.path.find((s) => (s.videos || []).includes(id));
    const nextIn = stage ? stage.videos[stage.videos.indexOf(id) + 1] : null;
    return `${backlink()}<div class="player">${state.playing
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<img src="${thumb(id)}" alt=""><button type="button" class="play" data-act="play" aria-label="Смотреть"></button>`}</div>
      <div class="vtitle">${esc(v.t)}</div><div class="meta">${views(v.views)} · ${ago(v.date)} · ${v.min} мин${stage ? ` · этап «${esc(stage.name)}»` : ''}</div>
      <div class="row2"><button type="button" class="btn ghost" data-act="yt">Открыть в YouTube</button><button type="button" class="btn ghost" data-act="share">Поделиться</button></div>
      ${P.watched[id] ? '<div class="note" style="color:var(--green)"><b style="color:var(--green)">✓ Просмотрено</b> — прогресс сохранён в «Пути».</div>' : ''}
      ${nextIn ? `<div class="h3">Дальше по пути</div>${vrow(nextIn)}` : ''}
      <div class="h3">Ещё видео</div>${Object.keys(D.videos).filter((x) => x !== id && x !== nextIn).sort((a, b) => V(b).views - V(a).views).slice(0, 3).map(vrow).join('')}
      <div class="note">Если YouTube не грузится без VPN — в рабочей версии те же видео можно залить на Kinescope или VK Видео, приложение не поменяется.</div>`;
  }

  // ── Клуб ─────────────────────────────────────────────
  function renderClub() {
    const C = D.club; const plan = C.plans.find((p) => p.id === state.plan);
    if (P.member) return `<div class="club-hero"><div class="lock">🔓</div><h1 class="title">Ты в <em>системе</em></h1><div class="muted">Программа на 30 дней открыта в «Пути»</div></div>
      <div style="height:12px"></div><button type="button" class="btn" data-act="channel">Перейти в закрытый чат</button>
      <div style="height:8px"></div><button type="button" class="btn ghost" data-act="mentor">Задать вопрос в разбор</button>
      <div class="h3">Новое в системе</div>${C.locked.map((l) => `<div class="locked"><div class="t" style="filter:none">${esc(l.t)}</div><div class="w">${l.when}</div></div>`).join('')}
      <button type="button" class="btn ghost" data-act="reset" style="margin-top:14px">Сбросить демо</button>`;
    return `<div class="club-hero"><div class="lock">🔒</div><div class="eyebrow" style="color:var(--gold)">BE FRESH SYSTEM</div>
        <h1 class="title">Не смотри — <em>делай</em></h1><div class="muted">30 дней заданий по 4 аспектам: внешность, общение, деньги, голова</div>
        <div class="members"><span class="faces"><span></span><span></span><span></span></span>уже прокачиваются вместе</div></div>
      <div class="h3">Что внутри</div>
      <div style="background:var(--card);border:1px solid var(--line);border-radius:20px;padding:4px 14px">${C.perks.map((p) => `<div class="perk"><span class="e">${p.e}</span><div><b>${esc(p.t)}</b><div class="muted">${esc(p.s)}</div></div></div>`).join('')}</div>
      <div class="h3">Последние посты <span class="muted" style="font-size:12px;font-weight:600">только участникам</span></div>
      ${C.locked.map((l) => `<div class="locked"><div class="t">${esc(l.t)}</div><div class="w">${l.when}</div><span class="k">🔒</span></div>`).join('')}
      <div class="h3">Тариф</div>
      <div class="plans">${C.plans.map((p) => `<button type="button" class="plan ${p.id === state.plan ? 'on' : ''}" data-act="plan" data-id="${p.id}">${p.best ? '<span class="tag">выбор участников</span>' : ''}
        <span><b>${p.name}</b>${p.note ? `<div class="muted">${p.note}</div>` : ''}</span><span class="p">⭐ ${p.stars.toLocaleString('ru-RU')}</span></button>`).join('')}</div>
      <div class="note">Оплата — <b>звёздами Telegram</b> прямо здесь: без карт и сторонних сайтов. Подписка продлевается сама, отменить можно в настройках Telegram.</div>
      <button type="button" class="btn ghost" data-act="free">Сначала — бесплатный закрытый клуб</button><div style="height:8px"></div><button type="button" class="btn ghost" data-act="mentor">Задать вопрос в разбор</button>
      <p class="footnote">Демо: оплата не списывается. Цены и программа — пример, заполняет be fresh.</p>`;
  }
  function openPay() {
    const plan = D.club.plans.find((p) => p.id === state.plan);
    sheet.innerHTML = `<div class="panel"><div class="grab"></div><div class="star">⭐</div><div class="title" style="font-size:24px;margin:6px 0 2px">${plan.stars.toLocaleString('ru-RU')} звёзд</div>
      <div class="muted">BE FRESH SYSTEM · ${plan.name}</div><div style="height:16px"></div>
      <button type="button" class="btn" data-act="pay" style="background:var(--gold);color:#000000;box-shadow:none">Подтвердить и оплатить</button>
      <div class="muted" style="margin-top:10px;font-size:11.5px">Демо — звёзды не списываются</div></div>`;
    sheet.hidden = false; haptic.tap(); if (inTG) tg.MainButton.hide();
  }
  sheet.addEventListener('click', (e) => { if (e.target === sheet) { sheet.hidden = true; after(); } });
  function pay() {
    $('.panel', sheet).innerHTML = '<div class="grab"></div><div class="spinner"></div><div class="muted" style="padding-bottom:26px">Оплата звёздами…</div>';
    setTimeout(() => { sheet.hidden = true; P.member = true; save(); haptic.ok(); state.screen = 'welcome'; render(); }, 1300);
  }
  function renderWelcome() {
    return `<div style="text-align:center;padding-top:30px"><div style="font-size:64px">🔓</div><div class="eyebrow" style="color:var(--gold);margin-top:10px">Оплачено</div>
      <h1 class="title">Добро пожаловать в <em>систему</em></h1><p class="muted">День 1 уже ждёт в «Пути». Ссылка в закрытый чат пришла от бота сюда.</p></div>
      <div style="height:16px"></div><button type="button" class="btn ghost" data-act="tab" data-id="path">Открыть путь</button>`;
  }

  // ── Наставничество ───────────────────────────────────
  const INCOMES = ['Внешность', 'Общение', 'Деньги', 'Голова'];
  function renderMentor() {
    if (P.applied) return `${backlink()}<div style="text-align:center;padding-top:20px"><div style="font-size:54px">📩</div><h1 class="title">Вопрос <em>принят</em></h1>
      <p class="muted">Разберём в ближайшем эфире — уведомление придёт сюда. Имя не покажем.</p></div><div style="height:14px"></div><button type="button" class="btn ghost" data-act="back">Готово</button>`;
    const f = state.form;
    return `${backlink()}<div class="eyebrow">Анонимно</div><h1 class="title">Вопрос в <em>разбор</em></h1>
      <p class="muted" style="margin-bottom:16px">Спроси что угодно про внешность, общение, деньги или голову — ответ будет в эфире.</p>
      <label class="field"><span>Как подписать (можно ник)</span><input id="f-name" value="${esc(f.name)}" placeholder="Имя"></label>
      <div class="field"><span>Тема</span></div>
      <div class="chips" style="flex-wrap:wrap;margin:0 0 12px;padding:0">${INCOMES.map((x) => `<button type="button" class="chip ${f.income === x ? 'on' : ''}" data-act="income" data-id="${x}">${x}</button>`).join('')}</div>
      <label class="field"><span>Твой вопрос</span><textarea id="f-goal" placeholder="Например: как начать разговор и не зависнуть?">${esc(f.goal)}</textarea></label>
      <label style="display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--muted);margin-top:6px"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--blue);flex:none">Согласен(на) на обработку персональных данных</label>`;
  }
  const formOk = () => state.form.name.trim().length >= 2 && state.form.income && state.form.goal.trim().length >= 5 && state.form.consent;

  function after() {
    if (state.screen === 'video') {
      const id = state.video;
      if (!P.watched[id]) setCTA('✓ Я посмотрел', () => { markWatched(id); haptic.ok(); toast(`+1 в пути · ${doneCount()} из ${pathVideos().length} 🔥`); render(true); }, 'green');
    } else if (state.screen === 'mentor' && !P.applied) {
      const sync = () => { state.form.name = $('#f-name').value; state.form.goal = $('#f-goal').value; state.form.consent = $('#f-consent').checked; };
      ['#f-name', '#f-goal'].forEach((s) => $(s).addEventListener('input', sync)); $('#f-consent').addEventListener('change', sync);
      setCTA('Отправить вопрос', () => { sync(); if (!formOk()) { haptic.warn(); toast('Заполни все поля и поставь галочку'); return; } P.applied = true; save(); haptic.ok(); render(); });
    } else if (!state.screen && state.tab === 'club' && !P.member) {
      const plan = D.club.plans.find((p) => p.id === state.plan);
      setCTA(`Вступить · ⭐ ${plan.stars.toLocaleString('ru-RU')}`, openPay, 'gold');
    }
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
      case 'level': P.level = id; save(); haptic.ok(); render(true); toast('Путь собран — начни с первого видео'); break;
      case 'video': state.video = id; state.playing = false; state.screen = 'video'; haptic.tap(); render(); break;
      case 'play': state.playing = true; haptic.tap(); render(true); break;
      case 'yt': openLink(`https://www.youtube.com/watch?v=${state.video}`); break;
      case 'share': openTg(`https://t.me/share/url?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + state.video)}&text=${encodeURIComponent(V(state.video).t)}`); break;
      case 'rub': state.rub = id; haptic.tap(); render(true); break;
      case 'plan': state.plan = id; haptic.tap(); render(true); break;
      case 'pay': pay(); break;
      case 'mentor': state.screen = 'mentor'; haptic.tap(); render(); break;
      case 'income': state.form.income = id; state.form.name = $('#f-name').value; state.form.goal = $('#f-goal').value; haptic.tap(); render(true); break;
      case 'free': openTg(D.me.freeClub); break;
      case 'channel': toast('В рабочей версии — вход в закрытый чат по личной ссылке'); break;
      case 'reset': P = { level: null, watched: {}, days: [], member: false, applied: false }; save(); state.tab = 'home'; render(); break;
    }
  });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!sheet.hidden) { sheet.hidden = true; after(); } else if (state.screen) goBack(); } });

  render();
})();
