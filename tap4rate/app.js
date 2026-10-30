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
    draft: Object.assign({ product: 'stand', name: 'Кофейня «Зерно»', color: 'black', finish: 'gloss', logo: null, yandex: '', gis: '' }, load('t4r_draft', {})),
    cart: load('t4r_cart', []),
    qty: 10,
    form: Object.assign({ name: '', contact: '', city: 'Краснодар', delivery: 'СДЭК', comment: '', agree: false }, load('t4r_form', {})),
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
    return { name: d.name, color: color(d.color), finish: finish(d.finish), logo: d.product === 'stand' ? null : logoImg, engrave: d.product !== 'stand' };
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
        <div class="eyebrow">Tap4Rate · NFC-стенды</div>
        <h1 class="title">Отзыв на картах <em>за одно касание</em></h1>
        <p class="lead">Стенд на кассу: гость прикладывает телефон — и сразу открывается ваша карточка в Яндекс Картах или 2ГИС. Без QR, камеры и поиска.</p>
        <div class="chips">
          <span>⚡ 1 секунда</span><span>🔋 чип без батарейки</span><span>📱 iPhone и Android</span><span>📦 СДЭК · Яндекс · OZON</span>
        </div>

        <h2 class="h2">Как это работает</h2>
        <div class="steps">
          <div><b>1</b><span>Выбираете стенд и вписываете название — оно будет на карте</span></div>
          <div><b>2</b><span>Присылаете ссылки на Яндекс Карты и 2ГИС — чип настраиваем мы</span></div>
          <div><b>3</b><span>Ставите на кассу. Гость касается телефоном и оставляет отзыв за 20 секунд</span></div>
        </div>

        <h2 class="h2">Сколько отзывов можно собрать</h2>
        <div class="calcbox">
          <div class="row"><span>Гостей в день</span><b id="gv">120</b></div>
          <input type="range" id="guests" min="20" max="400" step="10" value="120">
          <div class="big"><span id="rv">72</span><small>отзыва в месяц</small></div>
          <p class="muted small">Пример: если отзыв оставит 1 гость из 50. Сейчас без стенда обычно пишут единицы — лень искать заведение на картах.</p>
        </div>

        <h2 class="h2">Стенды</h2>
        <div class="plist">${D.products.map(p => `
          <button type="button" class="pitem" data-p="${p.id}">
            <span class="pthumb t-${p.id}"><i></i></span>
            <span class="pinfo">${p.hit ? '<em class="tag">Хит</em>' : ''}${p.old ? '<em class="tag">−20%</em>' : ''}<b>${esc(p.name)}</b><small>${esc(p.text)}</small></span>
            <span class="pprice">${rub(p.price)}${p.old ? `<s>${rub(p.old)}</s>` : ''}</span>
          </button>`).join('')}
        </div>
        <button type="button" class="biz" id="toopt"><b>Хотите продавать стенды в своём городе?</b><span>Опт от 475 ₽/шт и Starter Pack →</span></button>

        <div class="links">
          <button type="button" data-link="${D.reviews}">⭐ Отзывы клиентов</button>
          <button type="button" data-link="https://t.me/${D.manager}">💬 Менеджер</button>
        </div>
        <p class="foot">Концепт приложения для Tap4Rate. Цены — из канала Project2Profit.<br>Заказы в демо никуда не уходят без вашего подтверждения.</p>
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
    view.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { S.draft.product = b.dataset.p; save('t4r_draft', S.draft); go('make'); });
    $('#toopt').onclick = () => go('opt');
    view.querySelectorAll('[data-link]').forEach(b => b.onclick = () => openLink(b.dataset.link));
    cta('Собрать свой стенд →', () => go('make'));
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
        <div class="seg" id="seg">${D.products.map(x => `<button type="button" data-p="${x.id}" class="${x.id === d.product ? 'on' : ''}">${esc(x.name)}<small>${rub(x.price)}</small></button>`).join('')}</div>
        <p class="muted small mt8">${esc(p.text)}</p>

        <label class="field"><span>Название на карте</span>
          <input class="input" id="fname" maxlength="26" value="${esc(d.name)}" placeholder="Например, Coffee Lab"></label>

        <div class="field"><span>Цвет карты · <b id="cname">${esc(color(d.color).name)}</b></span>
          <div class="swatches">${D.colors.map(c => `<button type="button" class="sw ${c.id === d.color ? 'on' : ''}" data-c="${c.id}" style="background:linear-gradient(135deg,${c.bg[0]},${c.bg[1]})" aria-label="${esc(c.name)}"></button>`).join('')}</div></div>

        <div class="field"><span>Покрытие</span>
          <div class="chips sel">${D.finishes.map(f => `<button type="button" data-f="${f.id}" class="${f.id === d.finish ? 'on' : ''}">${f.name}</button>`).join('')}</div></div>

        <div class="field"><span>Логотип ${d.product === 'stand' ? '<em class="muted">— в стенде «С логотипом», +500 ₽</em>' : ''}</span>
          <label class="upload ${d.logo ? 'has' : ''}">
            <input type="file" accept="image/*" id="flogo" hidden>
            ${d.logo ? `<img src="${d.logo}" alt="">` : '<i>＋</i>'}
            <span>${d.logo ? 'Заменить логотип' : 'Загрузить логотип'}<small>PNG или JPG — сразу появится на 3D-карте</small></span>
          </label>${d.logo ? '<button type="button" class="linkbtn" id="nologo">Убрать логотип</button>' : ''}</div>

        <label class="field"><span>Ссылка на Яндекс Карты</span>
          <input class="input" id="fya" inputmode="url" value="${esc(d.yandex)}" placeholder="yandex.ru/maps/org/…"></label>
        <label class="field"><span>Ссылка на 2ГИС <em class="muted">— необязательно</em></span>
          <input class="input" id="fgis" inputmode="url" value="${esc(d.gis)}" placeholder="2gis.ru/…"></label>
        <div class="note">Нет ссылок под рукой? Оставьте пустым — менеджер найдёт карточку по названию и городу.</div>
        <div class="note">QR-код на обороте — для телефонов без NFC. Ссылку на чипе можно поменять бесплатно.</div>
      </div>`;
    Stage.mount($('#stage'), 'stand');
    Stage.setCard(cardCfg());
    $('#flip').onclick = () => Stage.flip();
    const persist = () => save('t4r_draft', S.draft);
    $('#seg').querySelectorAll('[data-p]').forEach(b => b.onclick = () => { haptic(); d.product = b.dataset.p; persist(); make(); });
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
            if (d.product === 'stand') { d.product = 'pro'; toast('Логотип — в стенде «С логотипом»'); }
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
        cfg: { name: d.name.trim(), color: d.color, finish: d.finish, logo: !!d.logo && p.id !== 'stand', yandex: d.yandex, gis: d.gis } });
      save('t4r_cart', S.cart); badge(); haptic('ok'); toast('Добавлено в корзину');
    });
  }

  // ---------- Опт ----------
  function opt() {
    view.innerHTML = `
      <div class="stage mid" id="stage"><div class="stage-ui"><span class="hint" id="shint"></span></div></div>
      <div class="pad">
        <div class="eyebrow">для перепродажи</div>
        <h1 class="title sm">NFC-карты <em>с подставками</em></h1>
        <p class="lead">Чистые карты для тех, кто продаёт стенды бизнесам. Инструкция по прошивке в комплекте, чипы проверены перед отправкой.</p>

        <div class="qtybox">
          <button type="button" data-q="-1">−</button>
          <div><b id="qv">${S.qty}</b><small>шт</small></div>
          <button type="button" data-q="1">+</button>
        </div>
        <input type="range" id="qr" min="3" max="100" value="${S.qty}">
        <div class="tiers" id="tiers"></div>
        <div class="calcbox" id="ocalc"></div>

        <h2 class="h2">Начать своё дело</h2>
        ${D.starter.map(s => `
          <div class="pack">
            <div><b>${esc(s.name)}</b><p>${esc(s.text)}</p></div>
            <div class="pack-buy"><span>${rub(s.price)}</span><button type="button" class="pill" data-s="${s.id}">В корзину</button></div>
          </div>`).join('')}
        <p class="foot">100+ шт — цена индивидуально, напишите менеджеру.</p>
      </div>`;
    Stage.mount($('#stage'), 'stack');
    const upd = () => {
      const q = S.qty, t = tierFor(q);
      $('#qv').textContent = q; $('#qr').value = q;
      $('#shint').textContent = `${q} карт в партии`;
      $('#tiers').innerHTML = D.tiers.map(x => `<div class="${x === t ? 'on' : ''}"><span>${x.min}–${x.max} шт</span><b>${x.price} ₽/шт</b></div>`).join('');
      const cost = q * t.price, resale = q * D.resale;
      $('#ocalc').innerHTML = `
        <div class="row"><span>${q} шт × ${t.price} ₽</span><b>${rub(cost)}</b></div>
        <div class="row"><span>Если продать бизнесам по ${rub(D.resale)}</span><b>${rub(resale)}</b></div>
        <div class="row total"><span>Возможная разница</span><b class="acc">+${rub(resale - cost)}</b></div>`;
      Stage.setStack(q);
      cta(`В корзину · ${q} шт × ${t.price} ₽`, () => {
        const ex = S.cart.find(i => i.kind === 'opt');
        if (ex) { ex.qty = q; ex.price = t.price; } else S.cart.push({ key: Date.now(), kind: 'opt', id: 'wholesale', title: 'NFC-карты + подставки (опт)', price: t.price, qty: q });
        save('t4r_cart', S.cart); badge(); haptic('ok'); toast(ex ? 'Количество обновлено' : 'Добавлено в корзину');
      });
    };
    view.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { haptic(); S.qty = Math.max(3, Math.min(100, S.qty + +b.dataset.q)); upd(); });
    $('#qr').oninput = e => { S.qty = +e.target.value; upd(); };
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
      const s = D.starter.find(x => x.id === b.dataset.s);
      if (S.cart.some(i => i.id === s.id)) { toast('Уже в корзине'); return; }
      S.cart.push({ key: Date.now(), kind: 'starter', id: s.id, title: s.name, price: s.price, qty: 1 });
      save('t4r_cart', S.cart); badge(); haptic('ok'); toast('Добавлено в корзину');
    });
    upd();
  }

  // ---------- Корзина ----------
  const total = () => S.cart.reduce((s, i) => s + i.price * i.qty, 0);
  function itemSub(i) {
    if (i.kind !== 'stand') return i.kind === 'opt' ? `${i.qty} шт × ${i.price} ₽` : '';
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
    const persist = () => save('t4r_form', S.form);
    view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const it = S.cart.find(i => i.key == b.dataset.m); it.qty = Math.max(1, Math.min(20, it.qty + +b.dataset.d));
      save('t4r_cart', S.cart); badge(); haptic(); cart();
    });
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      S.cart = S.cart.filter(i => i.key != b.dataset.del); save('t4r_cart', S.cart); badge(); haptic(); cart();
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
    const f = S.form, lines = ['Заказ Tap4Rate', ''];
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
      <p class="muted center">Менеджер подтвердит наличие и пришлёт реквизиты. В рабочей версии заказ сразу падает в бот Tap4Rate — без переписок.</p>
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
