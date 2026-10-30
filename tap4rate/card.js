// Рисует поверхности карты и экран телефона на <canvas> — из них делаются 3D-текстуры
// (и картинки для запасного 2D-режима, если WebGL недоступен).
(function () {
  const W = 1024, H = 650;

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function star(c, cx, cy, R, fill) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .45 : R;
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.closePath(); c.fillStyle = fill; c.fill();
  }
  function nfc(c, x, y, s, col) {
    c.strokeStyle = col; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.lineWidth = s * .09; c.globalAlpha = 1 - i * .22;
      c.beginPath(); c.arc(x, y, s * (.28 + i * .25), -Math.PI / 4, Math.PI / 4); c.stroke();
    }
    c.globalAlpha = 1;
  }
  function fit(c, text, max, size, weight, family) {
    let s = size;
    do { c.font = `${weight} ${s}px ${family}`; s -= 2; } while (c.measureText(text).width > max && s > 20);
    return s + 2;
  }
  function background(c, col, w, h) {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, col.bg[0]); g.addColorStop(1, col.bg[1]);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // мягкий блик + тонкая текстура
    const r = c.createRadialGradient(w * .85, -h * .1, 10, w * .85, -h * .1, w * .9);
    r.addColorStop(0, 'rgba(255,255,255,.16)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = r; c.fillRect(0, 0, w, h);
    c.globalAlpha = .035;
    for (let i = 0; i < 1400; i++) {
      c.fillStyle = i % 2 ? '#fff' : '#000';
      c.fillRect((i * 7919) % w, (i * 104729) % h, 2, 2);
    }
    c.globalAlpha = 1;
  }
  function soft(fg, a) {
    const n = parseInt(fg.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // cfg: { name, color, logo (Image|null), cta }
  function front(cfg, canvas) {
    const cv = canvas || document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), col = cfg.color, fg = col.fg;
    background(c, col, W, H);
    const accent = col.id === 'white' ? '#111' : (col.id === 'gold' ? '#F2C35B' : '#FFFFFF');

    // логотип
    const lx = 70, ly = 66, ls = 118;
    rr(c, lx, ly, ls, ls, 30);
    if (cfg.logo) {
      c.save(); c.clip();
      const im = cfg.logo, k = Math.max(ls / im.width, ls / im.height);
      c.drawImage(im, lx + (ls - im.width * k) / 2, ly + (ls - im.height * k) / 2, im.width * k, im.height * k);
      c.restore();
    } else {
      c.fillStyle = soft(fg, .12); c.fill();
      c.lineWidth = 3; c.strokeStyle = soft(fg, .3); c.stroke();
      const letter = (cfg.name || 'В').trim().charAt(0).toUpperCase() || 'В';
      c.fillStyle = accent; c.font = '800 64px Unbounded, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(letter, lx + ls / 2, ly + ls / 2 + 4);
    }
    nfc(c, W - 118, 128, 120, soft(fg, .85));

    // название
    const name = (cfg.name || 'Ваше заведение').trim() || 'Ваше заведение';
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = fg;
    fit(c, name, W - 140, 74, 800, 'Unbounded, sans-serif');
    c.fillText(name, 70, 300);

    // звёзды и призыв
    for (let i = 0; i < 5; i++) star(c, 96 + i * 62, 382, 26, col.id === 'white' ? '#F2B01E' : '#F5C451');
    c.fillStyle = soft(fg, .86); c.font = '600 36px Inter, sans-serif';
    c.fillText(cfg.cta || 'Оцените нас — приложите телефон', 70, 470);

    // плашки карт
    c.font = '700 26px Inter, sans-serif';
    let x = 70;
    ['Яндекс Карты', '2ГИС'].forEach(t => {
      const w = c.measureText(t).width + 44;
      rr(c, x, 528, w, 56, 28); c.fillStyle = soft(fg, .1); c.fill();
      c.lineWidth = 2; c.strokeStyle = soft(fg, .28); c.stroke();
      c.fillStyle = fg; c.fillText(t, x + 22, 566); x += w + 14;
    });
    c.fillStyle = soft(fg, .4); c.font = '600 22px Inter, sans-serif'; c.textAlign = 'right';
    c.fillText('tap4rate', W - 64, 566);
    return cv;
  }

  // псевдо-QR (в рабочей версии — настоящий QR на ссылку заведения)
  function qr(c, x, y, size, seed, fg) {
    const n = 25, m = size / n;
    let h = 2166136261;
    for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    c.fillStyle = fg;
    const finder = (fx, fy) => {
      c.fillRect(x + fx * m, y + fy * m, 7 * m, 7 * m);
      c.clearRect(x + (fx + 1) * m, y + (fy + 1) * m, 5 * m, 5 * m);
      c.fillRect(x + (fx + 2) * m, y + (fy + 2) * m, 3 * m, 3 * m);
    };
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const inF = (i < 8 && j < 8) || (i > 16 && j < 8) || (i < 8 && j > 16);
      if (!inF && rnd() > .52) c.fillRect(x + i * m, y + j * m, m + .5, m + .5);
    }
    finder(0, 0); finder(18, 0); finder(0, 18);
  }

  function back(cfg, canvas) {
    const cv = canvas || document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d'), col = cfg.color, fg = col.fg;
    background(c, col, W, H);
    // белая подложка под QR
    rr(c, 600, 120, 380, 380, 36); c.fillStyle = '#FFFFFF'; c.fill();
    const q = document.createElement('canvas'); q.width = q.height = 320;
    qr(q.getContext('2d'), 0, 0, 320, cfg.name || 'tap4rate', '#111');
    c.drawImage(q, 630, 150);
    c.fillStyle = fg; c.textAlign = 'left';
    c.font = '800 52px Unbounded, sans-serif'; c.fillText('Нет NFC?', 70, 220);
    c.font = '600 34px Inter, sans-serif'; c.fillStyle = soft(fg, .8);
    c.fillText('Наведите камеру', 70, 290); c.fillText('на QR-код →', 70, 336);
    nfc(c, 110, 470, 90, soft(fg, .5));
    c.font = '700 26px Inter, sans-serif'; c.fillStyle = soft(fg, .5);
    c.fillText('Работает на iPhone и Android', 160, 482);
    c.textAlign = 'right'; c.font = '600 22px Inter, sans-serif';
    c.fillText('tap4rate · отзыв за 20 секунд', W - 50, 600);
    return cv;
  }

  // экран телефона: 'lock' — заставка, 'review' — открытая карточка заведения
  function screen(state, name, canvas) {
    const w = 512, h = 1040;
    const cv = canvas || document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d');
    if (state === 'lock') {
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#1B2B4A'); g.addColorStop(1, '#0B0F1A');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#fff'; c.textAlign = 'center';
      c.font = '700 120px Inter, sans-serif'; c.fillText('12:30', w / 2, 300);
      c.font = '500 30px Inter, sans-serif'; c.fillStyle = 'rgba(255,255,255,.7)';
      c.fillText('Поднесите к стенду', w / 2, 360);
      nfc(c, w / 2 - 30, 760, 160, 'rgba(255,255,255,.6)');
      return cv;
    }
    c.fillStyle = '#F4F5F7'; c.fillRect(0, 0, w, h);
    // «карта» сверху
    const g = c.createLinearGradient(0, 0, w, 360);
    g.addColorStop(0, '#DDE7D7'); g.addColorStop(1, '#C9D8E6');
    c.fillStyle = g; c.fillRect(0, 0, w, 360);
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(-20, 250); c.lineTo(540, 120); c.stroke();
    c.beginPath(); c.moveTo(180, -20); c.lineTo(300, 380); c.stroke();
    c.fillStyle = '#E8433A'; c.beginPath(); c.arc(256, 170, 26, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(256, 170, 10, 0, 7); c.fill();
    // карточка
    rr(c, 0, 330, w, h - 330, 40); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = '#111'; c.textAlign = 'left';
    fit(c, name || 'Ваше заведение', w - 80, 46, 800, 'Inter, sans-serif');
    c.fillText(name || 'Ваше заведение', 40, 420);
    c.font = '500 26px Inter, sans-serif'; c.fillStyle = '#7A7F87';
    c.fillText('Кофейня · открыто до 22:00', 40, 466);
    c.fillStyle = '#111'; c.font = '800 34px Inter, sans-serif'; c.fillText('Оцените место', 40, 580);
    for (let i = 0; i < 5; i++) star(c, 78 + i * 86, 680, 34, '#F5B71E');
    rr(c, 40, 760, w - 80, 120, 24); c.fillStyle = '#F1F2F4'; c.fill();
    c.fillStyle = '#9AA0A8'; c.font = '500 26px Inter, sans-serif'; c.fillText('Расскажите, как всё прошло…', 70, 830);
    rr(c, 40, 920, w - 80, 84, 22); c.fillStyle = '#FFD43B'; c.fill();
    c.fillStyle = '#111'; c.textAlign = 'center'; c.font = '700 30px Inter, sans-serif';
    c.fillText('Отправить отзыв', w / 2, 974);
    return cv;
  }

  // надпись-гравировка на подставке
  function engraving(text, canvas) {
    const cv = canvas || document.createElement('canvas');
    cv.width = 1024; cv.height = 128;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 1024, 128);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fit(c, text, 900, 60, 700, 'Unbounded, sans-serif');
    c.fillText(text, 512, 66);
    return cv;
  }

  window.CardArt = { front, back, screen, engraving, W, H };
})();
