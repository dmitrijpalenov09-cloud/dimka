(function () {
  const D = window.T4R;
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const $ = s => document.querySelector(s);
  const view = $('#view');
  const rub = n => n.toLocaleString('ru-RU') + ' ₽';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const color = id => D.colors.find(c => c.id === id) || D.colors[0];
  const finish = id => D.finishes.find(f => f.id === id) || D.finishes[0];
  const product = id => D.products.find(p => p.id === id);
  const tierFor = q => D.tiers.find(t => q >= t.min && q <= t.max);

  function load(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  const S = {
    tab: 'home',
    draft: Object.assign({ product: 'yandex', name: 'Кофейня «Зерно»', color: 'yellow', finish: 'matte', logo: null, yandex: '', gis: '' }, load('tp_draft', {})),
    cart: load('tp_cart', []),
    qty: 15, resale: 0,
    form: Object.assign({ name: '', contact: '', city: 'Краснодар', delivery: 'СДЭК', comment: '', agree: false }, load('tp_form', {})),
  };
  let logoImg = null;
  if (S.draft.logo) { logoImg = new Image(); logoImg.onload = () => updateCard(); logoImg.src = S.draft.logo; }

  function haptic(kind) {
    if (!inTG || !tg.HapticFeedback) return;
    try { kind === 'ok' ? tg.HapticFeedback.notificationOccurred('success') : kind === 'err' ? tg.HapticFeedback.notificationOccurred('error') : tg.HapticFeedback.selectionChanged(); } catch (e) {}
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    requestAnimationFrame(() => t.classList.add('on'));
    clearTimeout(t._h); t._h = setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.hidden = true, 250); }, 1900);
  }
  function openLink(url) {
    if (inTG && url.startsWith('https://t.me/')) tg.openTelegramLink(url);
    else if (inTG) tg.openLink(url); else window.open(url, '_blank');
  }

  function cardCfg(over) {
    const d = Object.assign({}, S.draft, over || {});
    return { name: d.name, color: color(d.color), finish: finish(d.finish), logo: d.product === 'custom' ? logoImg : null, engrave: false, maps: (product(d.product) || D.products[0]).maps };
  }
  let cardTimer = 0;
  function updateCard() { clearTimeout(cardTimer); cardTimer = setTimeout(() => Stage.setCard(cardCfg()), 60); }

  // ---------- CTA ----------
  let ctaFn = null;
  function cta(text, fn) {
    const box = $('#cta');
    if (!text) { box.hidden = true; ctaFn = null; document.body.classList.remove('has-cta'); return; }
    box.hidden = false; $('#cta-btn').innerHTML = text; ctaFn = fn;
    document.body.classList.add('has-cta');
  }
  $('#cta-btn').addEventListener('click', () => ctaFn && ctaFn());

  // ---------- вкладки ----------
  function badge() {
    const n = S.cart.reduce((s, i) => s + (i.kind === 'opt' ? 1 : i.qty), 0), b = $('.tabs .badge');
    b.hidden = !n; b.textContent = n;
  }
  function go(tab, push) {
    S.tab = tab;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    view.classList.remove('in'); void view.offsetWidth; view.classList.add('in');
    ({ home, make, opt, cart })[tab]();
    window.scrollTo(0, 0);
    if (push !== false) history.replaceState(null, '', '#' + tab);
    if (inTG) tab === 'home' ? tg.BackButton.hide() : tg.BackButton.show();
  }
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { haptic(); go(b.dataset.tab); }));

  // ---------- Главная ----------
  function home() {
    view.innerHTML = `
      <section class="hero">
        <div class="stage tall" id="stage">
          <div class="stage-ui">
            <button type="button" class="pill ghost" id="flip">↻ Оборот</button>
            <span class="hint">Покрутите карту пальцем</span>
          </div>
        </div>
        <button type="button" class="tapbtn" id="tap"><span class="pulse"></span>Приложить телефон</button>
      </section>
      <div class="pad">
        <div class="eyebrow">Tapio · NFC-карты</div>
        <h1 class="title">Отзыв на картах <em>за одно касание</em></h1>
        <p class="lead">Карта или стикер на кассу: гость прикладывает телефон — и сразу открывается окно отзыва в Яндекс Картах или 2ГИС. Без поиска и камеры.</p>
        <div class="chips">
          <span>⚡ 1 секунда</span><span>💳 от 1 штуки</span><span>📱 iPhone и Android</span><span>🚚 курьером по Брянску</span><span>📦 СДЭК · Яндекс · Почта</span>
        </div>

        <h2 class="h2">Как это работает</h2>
        <div class="steps">
          <div><b>1</b><span>Выбираете карту: под Яндекс Карты, 2ГИС или со своим логотипом</span></div>
          <div><b>2</b><span>Записываете ссылку заведения через приложение NFC Tools — это минута</span></div>
          <div><b>3</b><span>Карта на кассе. Гость касается телефоном и оставляет отзыв за 20 секунд</span></div>
        </div>

        <h2 class="h2">Сколько отзывов можно собрать</h2>
        <div class="calcbox">
          <div class="row"><span>Гостей в день</span><b id="gv">120</b></div>
          <input type="range" id="guests" min="20" max="400" step="10" value="120">
          <div class="big"><span id="rv">72</span><small>отзыва в месяц</small></div>
          <p class="muted small">Пример: если отзыв оставит 1 гость из 50. Покажите этот расчёт владельцу заведения — так карта продаётся легче.</p>
        </div>

        <h2 class="h2">Карты</h2>
        <div class="plist">${D.products.map(p => `
          <button type="button" class="pitem" data-p="${p.id}">
            <span class="pthumb t-${p.id}"><i></i></span>
            <span class="pinfo">${p.hit ? '<em class="tag">Хит</em>' : ''}${p.old ? '<em class="tag">−20%</em>' : ''}<b>${esc(p.name)}</b><small>${esc(p.text)}</small></span>
            <span class="pprice">${p.from ? 'от ' : ''}${rub(p.price)}${p.old ? `<s>${rub(p.old)}</s>` : ''}</span>
          </button>`).join('')}
        </div>
        <button type="button" class="biz" id="toopt"><b>Хотите зарабатывать на NFC-картах?</b><span>Опт 350 ₽ от 15 шт · калькулятор заработка →</span></button>

        <div class="links">
          <button type="button" data-link="https://t.me/${D.manager2}">💬 @${D.manager2}</button>
          <button type="button" data-link="https://t.me/${D.manager}">💬 @${D.manager}</button>
        </div>
        <p class="foot">Концепт приложения для Tapio. Цены — из канала Tapio NFC.<br>Заказы в демо никуда не уходят без вашего подтверждения.</p>
      </div>`;
    Stage.mount($('#stage'), 'stand');
    Stage.setCard(cardCfg());
    $('#flip').onclick = () => Stage.flip();
    $('#tap').onclick = () => {
      $('#tap').disabled = true; haptic();
      Stage.tap(() => reviewSheet());
    };
    const g = $('#guests'), calc = () => { $('#gv').textContent = g.value; $('#rv').textContent = Math.round(g.value * 30 / 50); };
    g.oninput = calc; calc();
    view.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.draft.product = b.dataset.p; S.draft.color = product(b.dataset.p).color; save('tp_draft', S.draft); go('make'); });
    $('#toopt').onclick = () => go('opt');
    view.querySelectorAll('[data-link]').forEach(b => b.onclick = () => openLink(b.dataset.link));
    cta('Собрать свою карту →', () => go('make'));
  }

  function reviewSheet() {
    sheet(`
      <div class="grab"></div>
      <div class="eyebrow">так это видит гость</div>
      <h2 class="h2 nomt">Карточка открылась сама</h2>
      <p class="muted">Без приложений и поиска: сразу «Оценить место» в Яндекс Картах или 2ГИС. Попробуйте поставить оценку:</p>
      <div class="rate">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-r="${i}">★</button>`).join('')}</div>
      <p class="muted small" id="rmsg">В рабочей версии чип ведёт на настоящую карточку заведения.</p>
      <button type="button" class="btn" id="rclose">Понятно</button>`, () => { Stage.reset(); const b = $('#tap'); if (b) b.disabled = false; });
    const s = $('#sheet');
    s.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      const r = +b.dataset.r;
      s.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', +x.dataset.r <= r));
      haptic('ok');
      $('#rmsg').textContent = 'Готово — 20 секунд, и отзыв в карточке. Так гости реально доходят до отзыва.';
    });
    $('#rclose').onclick = closeSheet;
  }

  // ---------- Конструктор ----------
  function make() {
    const d = S.draft, p = product(d.product);
    view.innerHTML = `
      <div class="stage sticky" id="stage">
        <div class="stage-ui"><button type="button" class="pill ghost" id="flip">↻ Оборот</button><span class="hint">Крутите пальцем</span></div>
      </div>
      <div class="pad">
        <div class="seg" id="seg">${D.products.map(x => `<button type="button" data-p="${x.id}" class="${x.id === d.product ? 'on' : ''}">${esc(x.name)}<small>${x.from ? 'от ' : ''}${rub(x.price)}</small></button>`).join('')}</div>
        <p class="muted small mt8">${esc(p.text)}</p>

        <label class="field"><span>Название на карте</span>
          <input class="input" id="fname" maxlength="26" value="${esc(d.name)}" placeholder="Например, Coffee Lab"></label>

        <div class="field"><span>Цвет карты · <b id="cname">${esc(color(d.color).name)}</b></span>
          <div class="swatches">${D.colors.map(c => `<button type="button" class="sw ${c.id === d.color ? 'on' : ''}" data-c="${c.id}" style="background:linear-gradient(135deg,${c.bg[0]},${c.bg[1]})" aria-label="${esc(c.name)}"></button>`).join('')}</div></div>

        <div class="field"><span>Покрытие</span>
          <div class="chips sel">${D.finishes.map(f => `<button type="button" data-f="${f.id}" class="${f.id === d.finish ? 'on' : ''}">${f.name}</button>`).join('')}</div></div>

        <div class="field"><span>Логотип ${d.product !== 'custom' ? '<em class="muted">— в варианте «Свой дизайн»</em>' : ''}</span>
          <label class="upload ${d.logo ? 'has' : ''}">
            <input type="file" accept="image/*" id="flogo" hidden>
            ${d.logo ? `<img src="${d.logo}" alt="">` : '<i>＋</i>'}
            <span>${d.logo ? 'Заменить логотип' : 'Загрузить логотип'}<small>PNG или JPG — сразу появится на 3D-карте</small></span>
          </label>${d.logo ? '<button type="button" class="linkbtn" id="nologo">Убрать логотип</button>' : ''}</div>

        <label class="field"><span>Ссылка на Яндекс Карты</span>
          <input class="input" id="fya" inputmode="url" value="${esc(d.yandex)}" placeholder="yandex.ru/maps/org/…"></label>
        <label class="field"><span>Ссылка на 2ГИС <em class="muted">— необязательно</em></span>
          <input class="input" id="fgis" inputmode="url" value="${esc(d.gis)}" placeholder="2gis.ru/…"></label>
        <div class="note">Нет ссылок? Оставьте пустым — запишете сами через NFC Tools или попросите нас.</div>
        <div class="note">QR-код на обороте — для телефонов без NFC. Ссылку на чипе можно перезаписать в любой момент.</div>
      </div>`;
    Stage.mount($('#stage'), 'stand');
    Stage.setCard(cardCfg());
    $('#flip').onclick = () => Stage.flip();
    const persist = () => save('tp_draft', S.draft);
    $('#seg').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { haptic(); d.product = b.dataset.p; d.color = product(d.product).color; persist(); make(); });
    $('#fname').oninput = e => { d.name = e.target.value; persist(); updateCard(); };
    view.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
      haptic(); d.color = b.dataset.c; persist(); updateCard();
      view.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b));
      $('#cname').textContent = color(d.color).name;
    });
    view.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      haptic(); d.finish = b.dataset.f; persist(); updateCard();
      view.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#flogo').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const im = new Image();
        im.onload = () => {
          // уменьшаем до 256px, чтобы поместилось в память браузера
          const cv = document.createElement('canvas'), k = 256 / Math.max(im.width, im.height);
          cv.width = Math.round(im.width * Math.min(1, k)); cv.height = Math.round(im.height * Math.min(1, k));
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          d.logo = cv.toDataURL('image/png');
          logoImg = new Image(); logoImg.onload = () => {
            if (d.product !== 'custom') { d.product = 'custom'; toast('Переключили на «Свой дизайн»'); }
            persist(); make();
          };
          logoImg.src = d.logo;
        };
        im.src = r.result;
      };
      r.readAsDataURL(f);
    };
    const nl = $('#nologo'); if (nl) nl.onclick = () => { d.logo = null; logoImg = null; persist(); make(); };
    $('#fya').oninput = e => { d.yandex = e.target.value.trim(); persist(); };
    $('#fgis').oninput = e => { d.gis = e.target.value.trim(); persist(); };
    cta(`В корзину · ${rub(p.price)}`, () => {
      if (!d.name.trim()) { haptic('err'); toast('Впишите название заведения'); $('#fname').focus(); return; }
      S.cart.push({ key: Date.now(), kind: 'stand', id: p.id, title: p.name, price: p.price, qty: 1,
        cfg: { name: d.name.trim(), color: d.color, finish: d.finish, logo: !!d.logo && p.id === 'custom', yandex: d.yandex, gis: d.gis } });
      save('tp_cart', S.cart); badge(); haptic('ok'); toast('Добавлено в корзину');
    });
  }

  // ---------- Заработок ----------
  const tierName = t => t.max === Infinity ? `от ${t.min} шт` : `${t.min}–${t.max} шт`;
  function opt() {
    if (!S.resale) S.resale = D.resale;
    view.innerHTML = `
      <div class="stage mid" id="stage"><div class="stage-ui"><span class="hint" id="shint"></span></div></div>
      <div class="pad">
        <div class="eyebrow">заработок на NFC-картах</div>
        <h1 class="title sm">Берёшь по 350 — <em>продаёшь от 1 000</em></h1>
        <p class="lead">Находишь кафе, кофейни, шаурмичные, барбершопы и предлагаешь им карты для отзывов. Скрипт продаж — в подарок к заказу.</p>

        <div class="qtybox">
          <button type="button" data-q="-1">−</button>
          <div><b id="qv">${S.qty}</b><small>карт</small></div>
          <button type="button" data-q="1">+</button>
        </div>
        <input type="range" id="qr" min="1" max="200" value="${S.qty}">
        <div class="tiers two" id="tiers"></div>

        <div class="field"><span>Продаю заведению по <b id="rsv"></b></span>
          <input type="range" id="rs" min="1000" max="2000" step="100" value="${S.resale}"></div>
        <div class="calcbox" id="ocalc"></div>

        <h2 class="h2">Как начать</h2>
        <div class="steps">
          <div><b>1</b><span>Заказываешь карты — можно от 1 штуки, чтобы попробовать</span></div>
          <div><b>2</b><span>Получаешь скрипт: что писать в личку и что говорить при визите</span></div>
          <div><b>3</b><span>Обходишь заведения рядом: кофейни, шаурмичные, барбершопы, салоны</span></div>
          <div><b>4</b><span>Записываешь ссылку заведения через NFC Tools и отдаёшь готовую карту</span></div>
        </div>
        <div class="pack gift"><b>🎁 Скрипт продаж в подарок</b><p>Готовые сообщения и ответы на «дорого» и «нам не надо» — придут вместе с заказом.</p></div>
        <p class="foot">Цена продажи зависит от договорённости с заведением — расчёт выше пример, а не обещание дохода.</p>
      </div>`;
    Stage.mount($('#stage'), 'stack');
    const upd = () => {
      const q = S.qty, t = tierFor(q);
      $('#qv').textContent = q; $('#qr').value = q;
      $('#shint').textContent = `${q} карт в заказе`;
      $('#rsv').textContent = rub(S.resale);
      $('#tiers').innerHTML = D.tiers.map(x => `<div class="${x === t ? 'on' : ''}"><span>${tierName(x)}</span><b>${x.price} ₽/шт</b></div>`).join('');
      const cost = q * t.price, sale = q * S.resale;
      const more = t.price > 350 && q < 15 ? `<div class="row"><span class="muted small">Ещё ${15 - q} шт — и цена станет 350 ₽ за каждую</span></div>` : '';
      $('#ocalc').innerHTML = `
        <div class="row"><span>${q} шт × ${t.price} ₽</span><b>${rub(cost)}</b></div>
        <div class="row"><span>Продашь ${q} шт по ${rub(S.resale)}</span><b>${rub(sale)}</b></div>${more}
        <div class="row total"><span>Твой заработок</span><b class="acc">+${rub(sale - cost)}</b></div>
        <div class="row"><span class="muted small">С одной карты</span><b class="small">+${rub(S.resale - t.price)}</b></div>`;
      Stage.setStack(q);
      cta(`В корзину · ${q} шт × ${t.price} ₽`, () => {
        const ex = S.cart.find(i => i.kind === 'opt');
        if (ex) { ex.qty = q; ex.price = t.price; } else S.cart.push({ key: Date.now(), kind: 'opt', id: 'wholesale', title: 'NFC-карты для перепродажи', price: t.price, qty: q });
        save('tp_cart', S.cart); badge(); haptic('ok'); toast(ex ? 'Количество обновлено' : 'Добавлено в корзину');
      });
    };
    view.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { haptic(); S.qty = Math.max(1, Math.min(200, S.qty + +b.dataset.q)); upd(); });
    $('#qr').oninput = e => { S.qty = +e.target.value; upd(); };
    $('#rs').oninput = e => { S.resale = +e.target.value; upd(); };
    upd();
  }

  // ---------- Корзина ----------
  const total = () => S.cart.reduce((s, i) => s + i.price * i.qty, 0);
  function itemSub(i) {
    if (i.kind !== 'stand') return i.kind === 'opt' ? `${i.qty} шт × ${i.price} ₽ · скрипт продаж в подарок` : '';
    const c = i.cfg;
    return `«${esc(c.name)}» · ${esc(color(c.color).name.toLowerCase())}, ${finish(c.finish).name.toLowerCase()}${c.logo ? ' · с логотипом' : ''}`;
  }
  function cart() {
    if (!S.cart.length) {
      view.innerHTML = `<div class="pad empty"><div class="emoji">🛒</div><h1 class="title sm">Корзина пуста</h1>
        <p class="lead">Соберите стенд с названием своего заведения — это займёт минуту.</p></div>`;
      cta('Открыть конструктор →', () => go('make'));
      return;
    }
    const f = S.form;
    view.innerHTML = `
      <div class="pad">
        <h1 class="title sm">Корзина</h1>
        <div class="items">${S.cart.map(i => `
          <div class="item">
            <span class="ithumb" style="${i.cfg ? `background:linear-gradient(135deg,${color(i.cfg.color).bg[0]},${color(i.cfg.color).bg[1]})` : ''}">${i.kind === 'opt' ? '▤' : i.kind === 'starter' ? '🚀' : '◉'}</span>
            <div class="iinfo"><b>${esc(i.title)}</b><small>${itemSub(i)}</small></div>
            <div class="iright">
              ${i.kind === 'stand' ? `<div class="mini"><button type="button" data-m="${i.key}" data-d="-1">−</button><span>${i.qty}</span><button type="button" data-m="${i.key}" data-d="1">+</button></div>` : ''}
              <b>${rub(i.price * i.qty)}</b>
              <button type="button" class="linkbtn" data-del="${i.key}">Убрать</button>
            </div>
          </div>`).join('')}
        </div>
        <div class="sum"><span>Итого</span><b>${rub(total())}</b></div>

        <h2 class="h2">Оформление</h2>
        <label class="field"><span>Имя</span><input class="input" id="oname" value="${esc(f.name)}" autocomplete="name"></label>
        <label class="field"><span>Telegram или телефон</span><input class="input" id="ocontact" value="${esc(f.contact)}" placeholder="@username или +7…"></label>
        <label class="field"><span>Город</span><select class="input" id="ocity">${D.cities.map(c => `<option ${c === f.city ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <div class="field"><span>Доставка</span><div class="chips sel">${D.delivery.map(x => `<button type="button" data-dl="${esc(x)}" class="${x === f.delivery ? 'on' : ''}">${esc(x)}</button>`).join('')}</div></div>
        <label class="field"><span>Комментарий</span><textarea class="input" id="ocomment" rows="2" placeholder="Например, нужно к пятнице">${esc(f.comment)}</textarea></label>
        <label class="agree"><input type="checkbox" id="oagree" ${f.agree ? 'checked' : ''}><span>Согласен на обработку персональных данных по <button type="button" class="linkbtn" id="policy">политике конфиденциальности</button></span></label>
      </div>`;
    const persist = () => save('tp_form', S.form);
    view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const it = S.cart.find(i => i.key == b.dataset.m); it.qty = Math.max(1, Math.min(20, it.qty + +b.dataset.d));
      save('tp_cart', S.cart); badge(); haptic(); cart();
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      S.cart = S.cart.filter(i => i.key != b.dataset.del); save('tp_cart', S.cart); badge(); haptic(); cart();
    });
    $('#oname').oninput = e => { f.name = e.target.value; persist(); };
    $('#ocontact').oninput = e => { f.contact = e.target.value; persist(); };
    $('#ocity').onchange = e => { f.city = e.target.value; persist(); };
    $('#ocomment').oninput = e => { f.comment = e.target.value; persist(); };
    $('#oagree').onchange = e => { f.agree = e.target.checked; persist(); };
    view.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => {
      haptic(); f.delivery = b.dataset.dl; persist();
      view.querySelectorAll('[data-dl]').forEach(x => x.classList.toggle('on', x === b));
    });
    $('#policy').onclick = () => sheet(`<div class="grab"></div><h2 class="h2 nomt">Персональные данные</h2>
      <p class="muted">Имя, контакт и город нужны только для связи по заказу и доставки. Не передаём третьим лицам, кроме службы доставки. Удалим по первой просьбе.</p>
      <p class="muted small">В рабочей версии здесь будет полный текст политики — его стоит согласовать с юристом.</p>
      <button type="button" class="btn" onclick="document.getElementById('sheet').dispatchEvent(new Event('close'))">Понятно</button>`);
    cta(`Оформить · ${rub(total())}`, checkout);
  }

  function orderText() {
    const f = S.form, lines = ['Заказ Tapio', ''];
    S.cart.forEach((i, n) => {
      lines.push(`${n + 1}. ${i.title} — ${i.qty} × ${rub(i.price)}`);
      if (i.cfg) {
        lines.push(`   Название: ${i.cfg.name}; цвет: ${color(i.cfg.color).name}; покрытие: ${finish(i.cfg.finish).name}${i.cfg.logo ? '; логотип: пришлю файлом' : ''}`);
        lines.push(`   Яндекс: ${i.cfg.yandex || 'найти по названию'}; 2ГИС: ${i.cfg.gis || '—'}`);
      }
    });
    lines.push('', `Итого: ${rub(total())}`, `Имя: ${f.name}`, `Контакт: ${f.contact}`, `Город: ${f.city}`, `Доставка: ${f.delivery}`);
    if (f.comment.trim()) lines.push(`Комментарий: ${f.comment.trim()}`);
    return lines.join('\n');
  }
  function checkout() {
    const f = S.form;
    const bad = !f.name.trim() ? ['oname', 'Укажите имя'] : !f.contact.trim() ? ['ocontact', 'Нужен контакт для связи'] : !f.agree ? ['oagree', 'Нужно согласие на обработку данных'] : null;
    if (bad) { haptic('err'); toast(bad[1]); $('#' + bad[0]).focus(); return; }
    const text = orderText();
    sheet(`
      <div class="grab"></div>
      <div class="done-ic">✓</div>
      <h2 class="h2 nomt center">Заказ собран</h2>
      <p class="muted center">Менеджер подтвердит наличие и пришлёт реквизиты. В рабочей версии заказ сразу падает в бот Tapio — без переписок.</p>
      <pre class="order">${esc(text)}</pre>
      <button type="button" class="btn" id="send">Отправить менеджеру</button>
      <p class="muted small center">Текст скопируется — останется вставить в чат @${D.manager}.</p>`);
    $('#send').onclick = async () => {
      try { await navigator.clipboard.writeText(text); toast('Текст заказа скопирован'); } catch (e) {}
      haptic('ok');
      setTimeout(() => openLink(`https://t.me/${D.manager}`), 400);
    };
  }

  // ---------- шторка ----------
  let onSheetClose = null;
  function sheet(html, onClose) {
    const s = $('#sheet');
    s.innerHTML = `<div class="sheet-bg"></div><div class="sheet-card">${html}</div>`;
    s.hidden = false; onSheetClose = onClose || null;
    requestAnimationFrame(() => s.classList.add('on'));
    s.querySelector('.sheet-bg').onclick = closeSheet;
    if (inTG) tg.BackButton.show();
  }
  function closeSheet() {
    const s = $('#sheet');
    if (s.hidden) return false;
    s.classList.remove('on');
    setTimeout(() => { s.hidden = true; s.innerHTML = ''; }, 280);
    const fn = onSheetClose; onSheetClose = null; fn && fn();
    if (inTG && S.tab === 'home') tg.BackButton.hide();
    return true;
  }
  $('#sheet').addEventListener('close', closeSheet);

  // ---------- старт ----------
  if (tg) {
    try {
      tg.ready(); tg.expand();
      tg.setHeaderColor && tg.setHeaderColor('#0A0B0E');
      tg.setBackgroundColor && tg.setBackgroundColor('#0A0B0E');
      tg.disableVerticalSwipes && tg.disableVerticalSwipes();
      tg.BackButton.onClick(() => { if (!closeSheet()) go('home'); });
    } catch (e) {}
  }
  if (!inTG) document.body.classList.add('web');
  badge();
  const start = (location.hash || '').slice(1);
  const run = () => go(['home', 'make', 'opt', 'cart'].includes(start) ? start : 'home', false);
  // ждём шрифты, чтобы надписи на 3D-карте нарисовались фирменным шрифтом
  (document.fonts && document.fonts.load ? Promise.race([
    Promise.all([document.fonts.load('800 70px Unbounded'), document.fonts.load('600 30px Inter'), document.fonts.load('700 30px Inter')]),
    new Promise(r => setTimeout(r, 1500)),
  ]) : Promise.resolve()).then(run, run);
})();
