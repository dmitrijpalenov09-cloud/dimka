(() => {
  'use strict';

  const D = window.AB; const M = window.AB_CATALOG;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgAtLeast = (v) => inTG && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast(v);

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rub = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const pimg = (uid) => `img/p/${uid}.jpg`;
  const img = (n) => `img/${n}.jpg`;
  const model = (id) => M.find((m) => m.id === id);
  const byName = (n) => M.find((m) => m.name === n);
  const vTotal = (v) => Object.values(v.stock).reduce((s, x) => s + x, 0);
  const mTotal = (m) => m.variants.reduce((s, v) => s + vTotal(v), 0);
  const pad = (n) => String(n).padStart(2, '0');

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

  // ── Данные покупателя (демо: на устройстве + облако Telegram) ─
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
  const fresh = () => ({ remind: false, notify: [], draw: null, votes: [], orders: [], bonus: 1240, spent: 18400 });
  let P = load('ab_state', fresh());
  const save = () => { try { localStorage.setItem('ab_state', JSON.stringify(P)); } catch { /* */ } if (tgAtLeast('6.9')) tg.CloudStorage.setItem('ab_state', JSON.stringify(P), () => {}); updateBadge(); };

  // ── Время: дроп и итоги розыгрыша ────────────────────
  const dropAt = () => { let t = new Date(D.drop.at).getTime(); while (t < Date.now() - 6 * 3600e3) t += 7 * 864e5; return t; };
  const nextMonNoon = () => { const d = new Date(); const msk = new Date(d.getTime() + (d.getTimezoneOffset() + 180) * 6e4); const add = (8 - msk.getDay()) % 7 || 7; msk.setDate(msk.getDate() + add); msk.setHours(12, 0, 0, 0); return msk.getTime() - (d.getTimezoneOffset() + 180) * 6e4; };
  const parts = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; };
  let timer = null;
  function tick() {
    $$('[data-cd]').forEach((el) => { const p = parts(Number(el.dataset.cd) - Date.now()); $$('b', el).forEach((b, i) => { b.textContent = pad(p[i]); }); });
  }

  // ── Каркас ───────────────────────────────────────────
  const state = { tab: 'drop', screen: null, prod: null, vi: 0, size: null, cat: 'all', dc: 0, ds: null, dimg: 0, pay: 'card', ship: 'cdek', useBonus: false };
  const view = $('#view'); const tabs = $('#tabs'); const cta = $('#cta'); const ctaBtn = $('#cta-btn'); const sheet = $('#sheet');
  let ctaHandler = null;
  function setCTA(text, handler, kind) {
    ctaHandler = handler;
    if (inTG) { cta.hidden = true; if (!text) { tg.MainButton.hide(); return; } tg.MainButton.setParams({ text, color: kind === 'red' ? '#E1262D' : kind === 'off' ? '#2A2A2A' : '#F5F5F3', text_color: kind === 'red' ? '#FFFFFF' : kind === 'off' ? '#8A8A86' : '#0A0A0A', is_active: true, is_visible: true }); }
    else { cta.hidden = !text; ctaBtn.textContent = text || ''; ctaBtn.className = 'btn' + (kind === 'red' ? ' red' : kind === 'off' ? ' ghost' : ''); }
    cta.style.bottom = tabs.hidden ? '0' : 'calc(var(--tabs-h) + var(--safe-bottom))';
    view.classList.toggle('tg-cta', inTG && !!text);
    view.classList.toggle('cta-tabs', !inTG && !!text && !tabs.hidden);
  }
  if (inTG) tg.MainButton.onClick(() => ctaHandler && ctaHandler()); else ctaBtn.addEventListener('click', () => ctaHandler && ctaHandler());
  if (inTG) tg.BackButton.onClick(() => goBack());
  const backlink = () => (inTG ? '' : '<button type="button" class="backlink" data-act="back">‹ Назад</button>');

  function render(soft = false) {
    clearInterval(timer);
    const sub = !!state.screen;
    tabs.hidden = sub; view.classList.toggle('no-tabs', sub);
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
    setCTA(null);
    if (inTG) { if (sub) tg.BackButton.show(); else tg.BackButton.hide(); }
    const html = state.screen === 'prod' ? renderProd() : ({ drop: renderDrop, shop: renderShop, draw: renderDraw, club: renderClub })[state.tab]();
    const y = window.scrollY;
    view.innerHTML = html;
    if (!soft) { view.style.animation = 'none'; void view.offsetWidth; view.style.animation = ''; window.scrollTo(0, 0); } else window.scrollTo(0, y);
    if ($('[data-cd]')) { tick(); timer = setInterval(tick, 1000); }
    after();
  }
  function goBack() { haptic.tap(); state.screen = null; render(); }

  const cd = (t) => `<div class="count" data-cd="${t}"><div><b>00</b><span>дней</span></div><div><b>00</b><span>часов</span></div><div><b>00</b><span>минут</span></div><div><b>00</b><span>секунд</span></div></div>`;
  const pc = (m) => {
    const t = mTotal(m); const v = m.variants.find((x) => vTotal(x) > 0) || m.variants[0];
    const badge = t === 0 ? '<span class="badge-s out">sold out</span>' : t <= 12 ? `<span class="badge-s low">осталось ${t}</span>` : '';
    return `<button type="button" class="pc ${t === 0 ? 'sold' : ''}" data-act="prod" data-id="${m.id}"><div class="ph"><img src="${pimg(v.uid)}" alt="" loading="lazy">${badge}</div>
      <div class="nm">${esc(m.name)}</div><div class="row"><span class="price">${rub(m.price)}</span><span class="dots">${m.variants.slice(0, 5).map((x) => `<i style="background:${x.hex}"></i>`).join('')}</span></div></button>`;
  };

  // ── Дроп ─────────────────────────────────────────────
  function renderDrop() {
    const at = dropAt(); const live = at <= Date.now();
    const low = M.filter((m) => { const t = mTotal(m); return t > 0 && t <= 12; }).sort((a, b) => mTotal(a) - mTotal(b)).slice(0, 8);
    const winter = ['Пуховик Marshmallow', 'Свитер A-A Back', 'Шарф Striped', 'Шапка RAW'].map(byName).filter(Boolean);
    const dm = byName(D.draw.model);
    return `<div class="topbar"><div><div class="wordmark">abuse<sup>®</sup></div><div class="muted">${esc(D.brand.motto)}</div></div><span class="subs"><b>${D.brand.subs}</b> в канале</span></div>
      <section class="drop"><img src="${img(D.drop.img)}" alt=""><div class="in">
        <span class="live"><i></i>${live ? 'дроп идёт' : 'следующий дроп'}</span>
        <h2>${esc(D.drop.title.toLowerCase())}</h2><div class="sub">${esc(D.drop.sub)}</div>
        ${live ? '' : cd(at)}
        <div class="lines">${D.drop.lines.map(([n, p]) => `<span>${n} <b>${rub(p)}</b></span>`).join('')}</div>
        ${live ? `<button type="button" class="btn red" data-act="prod" data-id="${byName(D.drop.model).id}">Купить сейчас</button>`
          : `<button type="button" class="btn remind ${P.remind ? 'on' : ''}" data-act="remind">${P.remind ? '✓ Напомним за 10 минут' : 'Напомнить за 10 минут'}</button>`}
      </div></section>
      <button type="button" class="drawcard" data-act="tab" data-id="draw"><img src="${img('1258_1')}" alt=""><div class="in">
        <span class="tag ${P.draw ? 'ok' : 'red'}">${P.draw ? '✓ ты участвуешь' : 'розыгрыш открыт'}</span>
        <div><b>${esc(D.draw.model)}</b><div class="muted" style="color:#BDBDB8;margin-top:4px">${dm && mTotal(dm) === 0 ? 'Sold out за 1,5 часа. Следующая партия — через розыгрыш' : ''}</div></div></div></button>
      ${low.length ? `<div class="h3">Заканчивается <button type="button" data-act="tab" data-id="shop">весь магазин</button></div><div class="hscroll">${low.map(pc).join('')}</div>` : ''}
      <div class="h3">Winter drop</div><div class="hscroll">${winter.map(pc).join('')}</div>
      <div class="h3">Lookbook</div><div class="look">${D.lookbook.map((n) => `<img src="${img(n)}" alt="" loading="lazy">`).join('')}</div>
      <div class="note"><b>Бутик:</b> ${esc(D.brand.boutique)}<div style="margin-top:10px"><button type="button" class="btn small ghost" data-act="route">Маршрут</button></div></div>
      <p class="footnote">Концепт приложения для Abuse®.<br>Каталог, цены и остатки — с abuse.moscow, фото — из канала. Розыгрыш и голосование — механика для демо.</p>`;
  }

  // ── Магазин ──────────────────────────────────────────
  function renderShop() {
    const list = M.filter((m) => state.cat === 'all' || m.cat === state.cat).sort((a, b) => (mTotal(b) > 0) - (mTotal(a) > 0));
    return `<div class="pad" style="padding-top:16px"><div class="eyebrow">${M.length} моделей · ${M.reduce((s, m) => s + m.variants.length, 0)} цветов</div><h1 class="title">Магазин</h1></div>
      <div class="chips">${D.cats.map((c) => `<button type="button" class="chip ${state.cat === c.id ? 'on' : ''}" data-act="cat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="grid">${list.map(pc).join('')}</div>`;
  }

  // ── Товар ────────────────────────────────────────────
  function renderProd() {
    const m = model(state.prod); const v = m.variants[state.vi]; const out = vTotal(v) === 0;
    const notify = P.notify.includes(v.uid);
    return `${backlink()}<div class="pimg"><img src="${pimg(v.uid)}" alt="">${out ? '<span class="badge-s out" style="left:16px;top:16px">sold out</span>' : ''}</div>
      <div class="pname">${esc(m.name)}</div><div class="pprice">${rub(m.price)} <span class="muted" style="font-weight:600">· +${Math.round(m.price * levelOf().pct / 100)} бонусов</span></div>
      <div class="lbl"><span>Цвет · ${esc(v.color)}</span></div>
      <div class="swatches">${m.variants.map((x, i) => `<button type="button" class="sw ${i === state.vi ? 'on' : ''}" style="background:${x.hex}" data-act="vi" data-id="${i}" aria-label="${esc(x.color)}"></button>`).join('')}</div>
      <div class="lbl"><span>Размер</span>${v.sizes.length > 1 ? '<span>в наличии сейчас</span>' : ''}</div>
      <div class="sizes" style="${v.sizes.length === 1 ? 'grid-template-columns:1fr' : ''}">${v.sizes.map((s) => { const q = v.stock[s] || 0; return `<button type="button" class="sz ${q === 0 ? 'out' : ''} ${state.size === s ? 'on' : ''}" data-act="size" data-id="${esc(s)}">${esc(s)}${q > 0 && q <= 5 ? `<small>ост. ${q}</small>` : ''}</button>`; }).join('')}</div>
      ${out ? `<div class="note">Этот цвет закончился. Нажмите «Сообщить о рестоке» — пришлём уведомление в этот чат, как только вернётся.</div>`
        : `<div class="note">Оплата картой, СБП, Сплитом или долями. Доставка СДЭК по России или самовывоз из бутика на Кривоколенном.</div>`}
      ${notify && out ? '<div class="note" style="color:var(--ok)"><b style="color:var(--ok)">✓ Сообщим о рестоке</b></div>' : ''}`;
  }

  // ── Оформление (демо) ────────────────────────────────
  const SHIP = [['cdek', 'СДЭК', 0], ['courier', 'Курьер по Москве', 0], ['pickup', 'Бутик', 0]];
  const PAY = [['card', 'Карта · СБП'], ['split', 'Сплит'], ['dolyami', 'Долями']];
  function openCheckout() {
    const m = model(state.prod); const v = m.variants[state.vi];
    const maxB = Math.min(P.bonus, Math.floor(m.price * 0.3));
    const total = m.price - (state.useBonus ? maxB : 0);
    sheet.innerHTML = `<div class="panel"><div class="grab"></div>
      <div class="line"><div class="im"><img src="${pimg(v.uid)}" alt=""></div><div><b>${esc(m.name)}</b><div class="muted">${esc(v.color)} · ${esc(state.size)}</div><div class="price" style="margin-top:4px">${rub(m.price)}</div></div></div>
      <div class="lbl" style="margin:14px 0 8px">Доставка</div><div class="pay">${SHIP.map(([id, n]) => `<button type="button" class="${state.ship === id ? 'on' : ''}" data-act="ship" data-id="${id}">${n}</button>`).join('')}</div>
      <div class="lbl" style="margin:4px 0 8px">Оплата</div><div class="pay">${PAY.map(([id, n]) => `<button type="button" class="${state.pay === id ? 'on' : ''}" data-act="pay" data-id="${id}">${n}</button>`).join('')}</div>
      <button type="button" class="toggle" data-act="bonus"><span>Списать бонусы <span class="muted">· до ${rub(maxB)}</span></span><span class="tg ${state.useBonus ? 'on' : ''}"></span></button>
      <div class="sum"><div class="r"><span>Товар</span><span>${rub(m.price)}</span></div>${state.useBonus ? `<div class="r"><span>Бонусы</span><span>−${rub(maxB)}</span></div>` : ''}
        <div class="r t"><span>${state.pay === 'dolyami' ? 'Сегодня (1 из 4)' : 'Итого'}</span><span>${rub(state.pay === 'dolyami' ? Math.ceil(total / 4) : total)}</span></div></div>
      <div style="height:12px"></div><button type="button" class="btn red" data-act="buy">Оплатить ${rub(state.pay === 'dolyami' ? Math.ceil(total / 4) : total)}</button>
      <div class="muted" style="text-align:center;margin-top:10px;font-size:11.5px">Демо — оплата не списывается. В рабочей версии — та же касса, что на abuse.moscow</div></div>`;
    sheet.hidden = false; if (inTG) tg.MainButton.hide();
  }
  function buy() {
    $('.panel', sheet).innerHTML = '<div class="grab"></div><div class="spinner"></div><div class="muted" style="text-align:center;padding-bottom:26px">Оплата…</div>';
    setTimeout(() => {
      const m = model(state.prod); const v = m.variants[state.vi];
      const maxB = Math.min(P.bonus, Math.floor(m.price * 0.3)); const used = state.useBonus ? maxB : 0;
      const earn = Math.round((m.price - used) * levelOf().pct / 100);
      v.stock[state.size] = Math.max(0, (v.stock[state.size] || 0) - 1);
      P.bonus = P.bonus - used + earn; P.spent += m.price - used;
      const no = 'AB-' + String(Date.now()).slice(-6); P.orders.unshift({ no, name: m.name, color: v.color, size: state.size }); save(); haptic.ok();
      $('.panel', sheet).innerHTML = `<div class="grab"></div><div style="text-align:center"><span class="smile">:)</span><div class="title" style="font-size:22px">Заказ ${no}</div>
        <div class="muted">${esc(m.name)} · ${esc(v.color)} · ${esc(state.size)}<br>+${earn} бонусов на карту · трек пришлём сюда, в Telegram</div>
        <div style="height:16px"></div><button type="button" class="btn" data-act="close">Готово</button></div>`;
      state.useBonus = false;
    }, 1300);
  }

  // ── Розыгрыш ─────────────────────────────────────────
  function renderDraw() {
    const d = D.draw; const res = nextMonNoon();
    if (P.draw) {
      return `<div class="dhero"><img src="${img(d.imgs[0])}" alt=""><div class="in"><span class="tag ok">✓ ты в розыгрыше</span><h2>${esc(d.model)}</h2></div></div>
        <div class="ticket"><div class="eyebrow">твой билет</div><div class="no">№ ${P.draw.no}</div>
          <div class="muted">${esc(P.draw.color)} · размер ${esc(P.draw.size)} · ${rub(d.price)}</div>
          <div class="row"><span>шансов</span><b>${P.draw.chances}</b></div><div class="row" style="border-top:0;margin-top:0;padding-top:4px"><span>итоги</span><b>${d.results}</b></div></div>
        <div class="pad"><div class="eyebrow" style="margin-bottom:6px">до итогов</div>${cd(res)}</div>
        <div class="steps"><div class="step done"><span class="n">✓</span><div><b>Регистрация</b><span class="muted">до ${d.closes}</span></div></div>
          <div class="step cur"><span class="n">2</span><div><b>Итоги — ${d.results}</b><span class="muted">победителям придёт сообщение в этот чат</span></div></div>
          <div class="step"><span class="n">3</span><div><b>2 часа на оплату</b><span class="muted">не оплатил — право переходит следующему</span></div></div></div>
        <div class="pad" style="margin-top:6px"><button type="button" class="btn ghost" data-act="sharedraw">${P.draw.shared ? '✓ +1 шанс за приглашение' : 'Позвать друга — +1 шанс'}</button>
          <div style="height:8px"></div><button type="button" class="btn ghost" data-act="undraw" style="border:0;color:var(--muted);font-size:13px">Отменить участие</button></div>`;
    }
    return `<div class="dhero"><img src="${img(d.imgs[state.dimg])}" alt=""><div class="in"><span class="tag red">розыгрыш · ${rub(d.price)}</span><h2>${esc(d.model)}</h2><div class="muted" style="color:#CFCFCB">${esc(d.story)}</div></div></div>
      <div class="thumbs">${d.imgs.map((n, i) => `<img src="${img(n)}" class="${i === state.dimg ? 'on' : ''}" data-act="dimg" data-id="${i}" alt="">`).join('')}</div>
      <div class="lbl"><span>Цвет · ${esc(d.colors[state.dc].n)}</span></div>
      <div class="swatches">${d.colors.map((c, i) => `<button type="button" class="sw ${i === state.dc ? 'on' : ''}" style="background:${c.hex}" data-act="dc" data-id="${i}"></button>`).join('')}</div>
      <div class="lbl"><span>Размер</span></div>
      <div class="sizes" style="grid-template-columns:repeat(4,1fr)">${d.sizes.map((s) => `<button type="button" class="sz ${state.ds === s ? 'on' : ''}" data-act="ds" data-id="${s}">${s}</button>`).join('')}</div>
      <div class="steps"><div class="step cur"><span class="n">1</span><div><b>Регистрация</b><span class="muted">до ${d.closes} · бесплатно</span></div></div>
        <div class="step"><span class="n">2</span><div><b>Итоги — ${d.results}</b><span class="muted">случайный выбор, честно и без ботов</span></div></div>
        <div class="step"><span class="n">3</span><div><b>2 часа на оплату</b><span class="muted">шапка в подарок, как на пресейле</span></div></div></div>
      <div class="note">Участники с уровнем <b>Anti-Abuse Club</b> получают +1 шанс. Один аккаунт Telegram — одна заявка: перекупам не пройти.</div>`;
  }

  // ── Клуб ─────────────────────────────────────────────
  function levelOf() { return [...D.levels].reverse().find((l) => P.spent >= l.from); }
  function renderClub() {
    const lv = levelOf(); const nx = D.levels[D.levels.indexOf(lv) + 1];
    const pct = nx ? Math.round(100 * (P.spent - lv.from) / (nx.from - lv.from)) : 100;
    const ugc = [...D.ugc].map((u) => ({ ...u, v: u.votes + (P.votes.includes(u.img) ? 1 : 0) })).sort((a, b) => b.v - a.v);
    return `<div class="pad" style="padding-top:16px"><div class="eyebrow">Программа лояльности</div><h1 class="title">Anti-abuse <em>club</em></h1></div>
      <div class="lcard"><div class="wordmark">abuse<sup>®</sup></div><div><div class="bal">${P.bonus.toLocaleString('ru-RU')}<span>бонусов · 1 бонус = 1 ₽</span></div></div>
        <div class="row"><span>${esc(tgUser && tgUser.first_name ? tgUser.first_name : 'Твоя карта')} · ${lv.n}</span><span>${lv.pct}% бонусами</span></div></div>
      <div class="lv">${D.levels.map((l) => `<div class="${l === lv ? 'on' : ''}"><b>${l.pct}%</b>${l.n}</div>`).join('')}</div>
      ${nx ? `<div class="bar"><i style="width:${pct}%"></i></div><div class="pad muted" style="margin-top:6px">До «${nx.n}» — ещё ${rub(nx.from - P.spent)} покупок</div>` : ''}
      <div class="pad" style="margin-top:12px"><button type="button" class="btn ghost" data-act="wallet">Добавить карту в Wallet</button></div>
      <div class="h3">Эдиты недели <button type="button" data-act="upload">+ свой эдит</button></div>
      <div class="pad muted" style="margin:-4px 0 10px">Снимайте распаковки и эдиты, голосуйте — топ-3 недели получают подарки</div>
      <div class="ugc">${ugc.map((u, i) => `<div class="u"><img src="${img(u.img)}" alt="" loading="lazy">${i < 3 ? `<span class="rank">#${i + 1}</span>` : ''}
        <div class="meta"><span>${esc(u.who)}</span><button type="button" class="vote ${P.votes.includes(u.img) ? 'on' : ''}" data-act="vote" data-id="${u.img}">♥ ${u.v}</button></div></div>`).join('')}</div>
      <div class="h3">Связь</div>
      <div class="pad" style="display:flex;gap:8px"><button type="button" class="btn ghost small" data-act="support" style="flex:1">Поддержка</button><button type="button" class="btn ghost small" data-act="channel" style="flex:1">Канал</button></div>
      <p class="footnote">Проценты 3/7/10% — из вашей программы. Названия уровней, пороги и голоса — пример.</p>`;
  }

  function after() {
    if (state.screen === 'prod') {
      const m = model(state.prod); const v = m.variants[state.vi];
      if (vTotal(v) === 0) { const on = P.notify.includes(v.uid); setCTA(on ? '✓ Сообщим о рестоке' : 'Сообщить о рестоке', () => { P.notify = on ? P.notify.filter((x) => x !== v.uid) : [...P.notify, v.uid]; save(); haptic.ok(); render(true); }, on ? 'off' : undefined); }
      else setCTA(state.size ? `Купить · ${rub(m.price)}` : 'Выберите размер', () => { if (!state.size) { haptic.warn(); toast('Выберите размер'); return; } openCheckout(); }, state.size ? 'red' : undefined);
    } else if (!state.screen && state.tab === 'draw' && !P.draw) {
      setCTA(state.ds ? 'Участвовать в розыгрыше' : 'Выберите размер', () => {
        if (!state.ds) { haptic.warn(); toast('Выберите размер'); return; }
        P.draw = { no: 'M-' + String(Math.floor(1000 + Math.random() * 9000)), color: D.draw.colors[state.dc].n, size: state.ds, chances: levelOf().pct >= 10 ? 2 : 1 };
        save(); haptic.heavy(); setTimeout(haptic.ok, 120); render(); toast('Ты в розыгрыше 🔥');
      }, state.ds ? 'red' : undefined);
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
      case 'remind': P.remind = !P.remind; save(); haptic.ok(); render(true); if (P.remind) toast('Напомним за 10 минут до старта'); break;
      case 'prod': { const m = model(id); state.prod = id; state.vi = Math.max(0, m.variants.findIndex((v) => vTotal(v) > 0)); state.size = null; state.screen = 'prod'; haptic.tap(); render(); break; }
      case 'vi': state.vi = Number(id); state.size = null; haptic.tap(); render(true); break;
      case 'size': state.size = id; haptic.tap(); render(true); break;
      case 'cat': state.cat = id; haptic.tap(); render(true); break;
      case 'ship': state.ship = id; haptic.tap(); openCheckout(); break;
      case 'pay': state.pay = id; haptic.tap(); openCheckout(); break;
      case 'bonus': state.useBonus = !state.useBonus; haptic.tap(); openCheckout(); break;
      case 'buy': buy(); break;
      case 'close': sheet.hidden = true; render(true); break;
      case 'dc': state.dc = Number(id); state.dimg = [0, 3, 0][state.dc] ?? 0; haptic.tap(); render(true); break;
      case 'ds': state.ds = id; haptic.tap(); render(true); break;
      case 'dimg': state.dimg = Number(id); haptic.tap(); render(true); break;
      case 'sharedraw': if (!P.draw.shared) { P.draw.shared = true; P.draw.chances += 1; save(); haptic.ok(); } openTg(`https://t.me/share/url?url=${encodeURIComponent('https://t.me/abusers')}&text=${encodeURIComponent('Розыгрыш пуховиков Abuse — заходи, пока открыт')}`); render(true); break;
      case 'undraw': P.draw = null; save(); haptic.tap(); render(); break;
      case 'vote': P.votes = P.votes.includes(id) ? P.votes.filter((x) => x !== id) : [...P.votes, id]; save(); haptic.tap(); render(true); break;
      case 'upload': toast('В рабочей версии — вставляешь ссылку на TikTok/Reels, и эдит попадает в голосование'); break;
      case 'wallet': toast('В рабочей версии — карта сразу в Apple/Google Wallet'); break;
      case 'route': openLink(`https://yandex.ru/maps/?text=${encodeURIComponent(D.brand.map)}`); break;
      case 'support': openTg('https://t.me/abuse_support_bot'); break;
      case 'channel': openTg(D.brand.channel); break;
    }
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) { sheet.hidden = true; after(); } });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-tab]'); if (!b) return; state.screen = null; state.tab = b.dataset.tab; haptic.tap(); render(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!sheet.hidden) sheet.hidden = true; else if (state.screen) goBack(); } });

  function updateBadge() { const b = $('.tabs .badge'); b.hidden = !!P.draw; }
  document.addEventListener('error', (e) => { const t = e.target; if (t.tagName === 'IMG' && t.src.includes('/img/p/')) t.style.visibility = 'hidden'; }, true);
  updateBadge();
  render();
})();
