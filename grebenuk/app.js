(() => {
  'use strict';

  const D = window.GR;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const V = (id) => D.videos[id];
  const env = (id) => D.envs.find((e) => e.id === id);
  const ACC = { anomaly: 'Аномалию', proryv: 'Прорыв', exponenta: 'Экспоненту', decl: 'Декларацию' };
  const fmtDate = (s) => new Date(s + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const SER = { live: 'Гребенюк Live', decl: 'Декларация', razbor: 'Разбор' };

  // ── Telegram ─────────────────────────────────────────
  const haptic = {
    tap: () => inTG && tg.HapticFeedback && tg.HapticFeedback.selectionChanged(),
    ok: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('success'),
    warn: () => inTG && tg.HapticFeedback && tg.HapticFeedback.notificationOccurred('warning'),
  };
  if (inTG) {
    tg.ready(); tg.expand();
    if (tgAtLeast('6.9')) { tg.setHeaderColor('#07090D'); tg.setBackgroundColor('#07090D'); }
    if (tgAtLeast('7.10') && tg.setBottomBarColor) tg.setBottomBarColor('#07090D');
    if (tgAtLeast('7.7') && tg.disableVerticalSwipes) tg.disableVerticalSwipes();
  }
  const tgUser = inTG && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const openLink = (url) => { if (inTG) tg.openLink(url); else window.open(url, '_blank', 'noopener'); };
  const openTg = (url) => { if (inTG) tg.openTelegramLink(url); else window.open(url, '_blank', 'noopener'); };

  // ── Данные пользователя (демо: на устройстве + облако Telegram) ─
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* память */ } };
  const fresh = () => ({ quiz: {}, match: null, reported: false, weeks: 6, vote: null, applied: null, report: null });
  let P = load('gr_state', fresh());
  const save = () => { store('gr_state', P); if (tgAtLeast('6.9')) tg.CloudStorage.setItem('gr_state', JSON.stringify(P), () => {}); };

  // ── Каркас ───────────────────────────────────────────
  const state = { tab: 'home', screen: null, video: null, playing: false, ser: 'all', applyEnv: null,
    form: { name: (tgUser && tgUser.first_name) || '', city: '', niche: '', consent: false },
    rep: { rev: '', did: '', plan: '', score: null } };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn');
  let ctaHandler = null;
  function setCTA(text, handler) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: '#E5332A', text_color: '#FFFFFF', is_active: true, is_visible: true }); }
    else { cta.hidden = !text; ctaBtn.textContent = text || ''; }
    cta.style.bottom = tabs.hidden ? '0' : 'calc(var(--tabs-h) + var(--safe-bottom))';
    view.classList.toggle('tg-cta', inTG && !!text);
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
    const html = ({ video: renderVideo, apply: renderApply, applied: renderApplied, report: renderReport })[state.screen]?.()
      ?? ({ home: renderHome, ten: renderTen, decl: renderDecl, videos: renderVideos })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    after();
  }
  function goBack() { haptic.tap(); state.screen = null; state.playing = false; render(); }

  const lbl = (id) => { const v = V(id); return `<span class="lbl ${v.s === 'decl' ? 'decl' : ''}">${SER[v.s]}${v.n ? ' · ' + esc(v.n) : ''}</span>`; };
  const thumb = (id, play) => `<div class="thumb"><img src="img/${id}.jpg" alt="" loading="lazy">${lbl(id)}${play ? '<span class="play"></span>' : ''}</div>`;
  const vcard = (id) => `<button type="button" class="vcard" data-act="video" data-id="${id}">${thumb(id)}<div class="t">${esc(V(id).t)}</div><div class="meta">${fmtDate(V(id).date)}</div></button>`;
  const vrow = (id) => `<button type="button" class="vrow" data-act="video" data-id="${id}">${thumb(id)}<div><div class="t">${esc(V(id).t)}</div><div class="meta">${fmtDate(V(id).date)}</div></div></button>`;
  const byDate = (ids) => [...ids].sort((a, b) => V(b).date.localeCompare(V(a).date));

  // ── Среда (главная) ──────────────────────────────────
  const Q = [
    { k: 'stage', q: 'Где ты сейчас?', o: [['start', 'Только начинаю', 'идея или первые продажи'], ['grow', 'Есть бизнес', 'хочу расти быстрее'], ['big', 'Доход 10 млн+', 'нужна стая своего уровня'], ['team', 'Строю команду', 'хочу отдать операционку']] },
    { k: 'need', q: 'Что нужно больше всего?', o: [['env', 'Окружение', 'люди, которые делают'], ['disc', 'Дисциплина', 'отчёты и дедлайны'], ['scale', 'Масштаб', 'стратегия и партнёрства'], ['ceo', 'Сильный CEO', 'система вместо ручного']] },
  ];
  function pickEnv() {
    const { stage, need } = P.quiz;
    if (stage === 'big') return 'exponenta';
    if (stage === 'start') return 'anomaly';
    return need === 'scale' || need === 'ceo' || stage === 'team' ? 'proryv' : 'anomaly';
  }
  function quizHTML() {
    const step = P.quiz.stage ? (P.quiz.need ? 2 : 1) : 0;
    if (step === 2) {
      const e = env(P.match);
      return `<div class="quiz"><div class="eyebrow">Твоя среда</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
        <div style="font-size:24px;font-weight:900;letter-spacing:-.02em;color:${e.color}">${esc(e.name)}</div><button type="button" class="muted" data-act="requiz">пройти заново</button></div>
        <div class="muted" style="margin-top:4px">${esc(e.text)}</div></div>`;
    }
    const q = Q[step];
    return `<div class="quiz"><div class="dots"><i class="${step >= 0 ? 'on' : ''}"></i><i class="${step >= 1 ? 'on' : ''}"></i></div>
      <div style="font-size:19px;font-weight:800">${q.q}</div>
      <div class="opts">${q.o.map(([id, n, s]) => `<button type="button" class="opt" data-act="q" data-k="${q.k}" data-id="${id}">${n}<small>${s}</small></button>`).join('')}</div></div>`;
  }
  const envCard = (e) => `<div class="env ${P.match === e.id ? 'match' : ''}" style="--c:${e.color}">${P.match === e.id ? '<span class="badge-match">подходит тебе</span>' : ''}
      <div class="top"><span class="nm">${esc(e.name)}</span><span class="tag">${esc(e.tag)}</span></div>
      <div class="muted" style="margin-top:6px">${esc(e.text)}</div><ul>${e.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      <div style="margin-top:12px"><button type="button" class="btn small ${P.match === e.id ? '' : 'ghost'}" data-act="apply" data-id="${e.id}">${e.id === 'exponenta' ? 'На собеседование' : 'Хочу в ' + ACC[e.id]}</button></div></div>`;
  function renderHome() {
    const latest = byDate(Object.keys(D.videos)).slice(0, 6);
    const envs = P.match ? [env(P.match), ...D.envs.filter((e) => e.id !== P.match)] : D.envs;
    return `<section class="hero"><svg class="curve" viewBox="0 0 200 90" aria-hidden="true"><path d="M0 85 C 70 82, 110 70, 140 45 S 185 8, 200 4" fill="none" stroke="#2B59FF" stroke-width="2.5"/><circle cx="150" cy="36" r="4" fill="#E5332A"/></svg>
        <div class="row"><img class="ava" src="img/avatar.jpg" alt=""><div><div class="nm">${esc(D.me.name)}</div><div class="bio">${esc(D.me.bio)}</div></div></div>
        <div class="stats">${D.me.stats.map((s) => `<div><b>${s.v}</b><span>${s.l}</span></div>`).join('')}</div></section>
      <div class="h3"><span>Подберём <span class="u">твою среду</span></span></div>
      ${quizHTML()}
      <div class="h3">Среды</div>
      ${envs.map(envCard).join('')}
      <div class="h3">Новые серии <button type="button" data-act="tab" data-id="videos">все</button></div>
      <div class="hscroll">${latest.map(vcard).join('')}</div>
      <div class="h3">Ближайшее в среде <span class="demo">пример</span></div>
      <div class="box">${D.events.map((e) => `<div class="ev"><div class="d"><div><b>${e.n}</b><span>${e.d}</span></div></div><div><div class="t">${esc(e.t)}</div><div class="muted">${esc(e.w)}</div></div></div>`).join('')}</div>
      <div class="h3">Поколение</div>
      <button type="button" class="gen" data-act="gen"><span class="e">🤝</span><span><b>Стать наставником</b><span class="muted">Благотворительный проект: сильные предприниматели наставляют детей</span></span></button>
      <p class="footnote">Концепт приложения для Михаила Гребенюка.<br>Видео и факты о средах — из его Telegram-канала. Десятка, события и формы — пример.</p>`;
  }

  // ── Десятка ──────────────────────────────────────────
  function renderTen() {
    const T = D.ten; const me = { n: (tgUser && tgUser.first_name) || 'Ты', me: true, done: P.reported, g: P.reported ? 14 : 11 };
    const all = [me, ...T.members]; const done = all.filter((m) => m.done).length;
    const C = 2 * Math.PI * 36;
    return `<div class="eyebrow">Аномалия · твоя десятка <span class="demo">пример</span></div><h1 class="title">${esc(T.name)}</h1>
      <div class="tenhead"><div style="display:flex;gap:16px;align-items:center">
        <div class="ring"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="#222937" stroke-width="8"/><circle cx="42" cy="42" r="36" fill="none" stroke="#E5332A" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - T.progress / 100)}"/></svg><b>${T.progress}%</b></div>
        <div><div class="muted">Цель десятки</div><div style="font-weight:800;font-size:16px;line-height:1.25">${esc(T.goal)}</div><div class="muted" style="margin-top:6px">Отчёты недели: <b style="color:var(--text)">${done} из ${all.length}</b> · серия ${P.weeks + (P.reported ? 1 : 0)} нед.</div></div></div></div>
      <div class="note">🎯 ${esc(T.challenge)}</div>
      ${P.reported ? `<div class="note" style="color:var(--ok)"><b style="color:var(--ok)">✓ Отчёт сдан</b> — капитан и десятка видят твои цифры.</div>` : ''}
      <div class="h3">Участники <span class="muted">рост с начала квартала</span></div>
      <div class="box">${all.map((m) => `<div class="member"><span class="av" style="${m.me ? 'background:var(--red)' : ''}">${esc(m.n[0])}</span>
        <div><div class="nm">${esc(m.n)}${m.role ? ` <span class="muted">· ${m.role}</span>` : ''}${m.me && m.n !== 'Ты' ? ' <span class="muted">· ты</span>' : ''}</div><div style="display:flex;gap:8px;align-items:center"><div class="gbar"><i style="width:${Math.min(100, m.g * 3)}%"></i></div><span class="muted">+${m.g}%</span></div></div>
        <span class="st ${m.done ? 'ok' : 'wait'}">${m.done ? '✓ отчёт' : 'ждём'}</span></div>`).join('')}</div>
      <p class="footnote">Сейчас десятки ведут отчёты в чатах. Здесь — одна кнопка, напоминание в пятницу и цифры всей десятки на одном экране.</p>`;
  }
  function renderReport() {
    const r = state.rep;
    return `${backlink()}<div class="eyebrow">Отчёт за неделю</div><h1 class="title">Что <span class="u">сделал</span>?</h1>
      <label class="field"><span>Выручка за неделю, ₽</span><input id="r-rev" inputmode="numeric" value="${esc(r.rev)}" placeholder="Например, 380 000"></label>
      <label class="field"><span>Главное действие недели</span><textarea id="r-did" placeholder="Сделал, запустили, протестировал, закрыли…">${esc(r.did)}</textarea></label>
      <label class="field"><span>План на следующую неделю</span><textarea id="r-plan" placeholder="Одна цель, которую проверит десятка">${esc(r.plan)}</textarea></label>
      <div class="field"><span>Оценка недели</span></div>
      <div class="score">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<button type="button" class="${r.score === n ? 'on' : ''}" data-act="score" data-id="${n}">${n}</button>`).join('')}</div>
      <div class="note" style="margin-top:14px">«Работаю, стараюсь, меняюсь» — не считается. Пиши «сделал, запустили, протестировал, закрыли».</div>`;
  }

  // ── Декларация ───────────────────────────────────────
  function renderDecl() {
    return `<div class="declhero"><div class="eyebrow" style="color:var(--red)">Шоу на YouTube</div><h1 class="title">Декларация</h1>
        <div class="muted">4 месяца, разборы, психотерапия, партнёрства — и финал, где решает голосование. Второй сезон завершён.</div></div>
      <div class="h3">Финалисты сезона 2</div>
      ${D.finalists.map((f) => `<div class="fin ${P.vote === f.id ? 'voted' : ''}"><button type="button" style="display:block;width:100%" data-act="video" data-id="${f.video}">${thumb(f.video, true)}</button>
        <div class="in"><div class="biz">${esc(f.biz)}</div><div class="nm">${esc(f.name)}${P.vote === f.id ? '<span class="voted-tag">твой голос</span>' : ''}</div><div class="story">${esc(f.story)}</div>
        <div class="row"><button type="button" class="btn ghost" data-act="video" data-id="${f.video}">Смотреть финал</button>
        <button type="button" class="btn ${P.vote === f.id ? 'ghost' : ''}" data-act="vote" data-id="${f.id}">${P.vote === f.id ? '✓ Голос отдан' : 'Голосовать'}</button></div></div></div>`).join('')}
      <div class="note">Голосование сейчас идёт через бота. Здесь — сразу видео, история и кнопка голоса, а итог приходит уведомлением.</div>
      <button type="button" class="btn ghost" data-act="apply" data-id="decl">Хочу в третий сезон</button>`;
  }

  // ── Видео ────────────────────────────────────────────
  function renderVideos() {
    const ids = byDate(Object.keys(D.videos).filter((id) => state.ser === 'all' || V(id).s === state.ser));
    return `<div class="eyebrow">YouTube</div><h1 class="title">Смотреть</h1>
      <div class="chips">${D.series.map((s) => `<button type="button" class="chip ${state.ser === s.id ? 'on' : ''}" data-act="ser" data-id="${s.id}">${s.name}</button>`).join('')}</div>
      ${ids.map(vrow).join('')}`;
  }
  function renderVideo() {
    const id = state.video; const v = V(id);
    const more = byDate(Object.keys(D.videos).filter((x) => x !== id && V(x).s === v.s)).slice(0, 3);
    return `${backlink()}<div class="player">${state.playing
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<img src="img/${id}.jpg" alt=""><button type="button" class="play" data-act="play" aria-label="Смотреть"></button>`}</div>
      <div class="vtitle">${esc(v.t)}</div><div class="meta">${SER[v.s]}${v.n ? ' · ' + esc(v.n) : ''} · ${fmtDate(v.date)}</div>
      <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="btn ghost" data-act="yt" style="padding:12px">Открыть в YouTube</button><button type="button" class="btn ghost" data-act="share" style="padding:12px">Поделиться</button></div>
      ${more.length ? `<div class="h3">Ещё ${SER[v.s]}</div>${more.map(vrow).join('')}` : ''}`;
  }

  // ── Заявка ───────────────────────────────────────────
  function renderApply() {
    const e = state.applyEnv === 'decl' ? { color: '#E5332A' } : env(state.applyEnv); const f = state.form;
    return `${backlink()}<div class="eyebrow">Заявка</div><h1 class="title">В <span style="color:${e.color}">${ACC[state.applyEnv]}</span></h1>
      <p class="muted" style="margin-bottom:16px">${state.applyEnv === 'exponenta' ? 'Дальше — собеседование с действующими участниками: они вместе решают, брать или нет.' : 'Команда свяжется в Telegram — номер телефона не нужен.'}</p>
      <label class="field"><span>Имя</span><input id="f-name" value="${esc(f.name)}" placeholder="Как к тебе обращаться"></label>
      <label class="field"><span>Город</span><input id="f-city" value="${esc(f.city)}" placeholder="Например, Казань"></label>
      <label class="field"><span>Чем занимаешься</span><textarea id="f-niche" placeholder="Ниша, сколько лет бизнесу, главная задача">${esc(f.niche)}</textarea></label>
      <label style="display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--muted);margin-top:6px"><input type="checkbox" id="f-consent" ${f.consent ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--red);flex:none">Согласен(на) на обработку персональных данных</label>`;
  }
  function renderApplied() {
    const n = ACC[P.applied];
    return `<div class="ok-ring">✓</div><h1 class="title" style="text-align:center">Заявка в ${esc(n)} <span class="u">принята</span></h1>
      <p class="muted" style="text-align:center">${P.applied === 'exponenta' ? 'Позовём на собеседование с участниками. Уведомление придёт сюда.' : 'Команда напишет тебе в Telegram. Пока — посмотри последние серии.'}</p>
      <div style="height:16px"></div><button type="button" class="btn ghost" data-act="tab" data-id="videos">Смотреть серии</button>`;
  }

  function after() {
    if (state.screen === 'apply') {
      const f = state.form;
      const sync = () => { f.name = $('#f-name').value; f.city = $('#f-city').value; f.niche = $('#f-niche').value; f.consent = $('#f-consent').checked; };
      ['#f-name', '#f-city', '#f-niche'].forEach((s) => $(s).addEventListener('input', sync)); $('#f-consent').addEventListener('change', sync);
      setCTA('Отправить заявку', () => { sync(); if (f.name.trim().length < 2 || f.niche.trim().length < 3 || !f.consent) { haptic.warn(); toast('Заполни имя, нишу и поставь галочку'); return; } P.applied = state.applyEnv; save(); haptic.ok(); state.screen = 'applied'; render(); });
    } else if (state.screen === 'report') {
      const r = state.rep;
      const sync = () => { r.rev = $('#r-rev').value; r.did = $('#r-did').value; r.plan = $('#r-plan').value; };
      ['#r-rev', '#r-did', '#r-plan'].forEach((s) => $(s).addEventListener('input', sync));
      setCTA('Сдать отчёт', () => { sync(); if (!r.rev.trim() || r.did.trim().length < 3 || !r.score) { haptic.warn(); toast('Заполни выручку, действие и оценку'); return; } P.reported = true; P.report = { ...r }; save(); haptic.ok(); state.screen = null; state.tab = 'ten'; render(); toast('Отчёт сдан — десятка видит 🔥'); });
    } else if (!state.screen && state.tab === 'ten' && !P.reported) setCTA('Сдать отчёт за неделю', () => { state.screen = 'report'; haptic.tap(); render(); });
    else if (!state.screen && state.tab === 'home' && P.match) setCTA(P.match === 'exponenta' ? 'На собеседование в Экспоненту' : `Заявка в ${ACC[P.match]}`, () => openApply(P.match));
  }
  function openApply(id) { state.applyEnv = id; state.screen = 'apply'; haptic.tap(); render(); }

  // ── События ─────────────────────────────────────────
  let toastTimer;
  const toast = (text) => { const t = $('#toast'); t.textContent = text; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400); };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const { act, id } = el.dataset;
    switch (act) {
      case 'tab': state.screen = null; state.tab = id; haptic.tap(); render(); break;
      case 'back': goBack(); break;
      case 'q': P.quiz[el.dataset.k] = id; if (P.quiz.stage && P.quiz.need) { P.match = pickEnv(); haptic.ok(); } else haptic.tap(); save(); render(true); break;
      case 'requiz': P.quiz = {}; P.match = null; save(); haptic.tap(); render(true); break;
      case 'apply': openApply(id); break;
      case 'video': state.video = id; state.playing = false; state.screen = 'video'; haptic.tap(); render(); break;
      case 'play': state.playing = true; render(true); break;
      case 'yt': openLink(`https://www.youtube.com/watch?v=${state.video}`); break;
      case 'share': openTg(`https://t.me/share/url?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + state.video)}&text=${encodeURIComponent(V(state.video).t)}`); break;
      case 'ser': state.ser = id; haptic.tap(); render(true); break;
      case 'vote': P.vote = id; save(); haptic.ok(); render(true); toast('Голос принят — итог придёт уведомлением'); break;
      case 'score': state.rep.score = Number(id); state.rep.rev = $('#r-rev').value; state.rep.did = $('#r-did').value; state.rep.plan = $('#r-plan').value; haptic.tap(); render(true); break;
      case 'gen': toast('В рабочей версии — анкета наставника «Поколения»'); break;
    }
  });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.screen) goBack(); });

  render();
})();
