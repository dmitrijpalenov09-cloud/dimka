// 3D-сцена: NFC-карта на акриловой подставке, телефон для «касания», стопка карт для опта.
// Если WebGL недоступен — показываем плоскую карту с CSS-наклоном.
(function () {
  const Art = window.CardArt;
  const Stage = { ok: false };
  window.Stage = Stage;

  let cfg = null;               // текущая карта: { name, color, finish, logo, engrave }
  let host = null, mode = 'stand';

  // ---------- запасной 2D-режим ----------
  function flatMount(el) {
    host = el;
    el.querySelector('.flat')?.remove();
    el.insertAdjacentHTML('beforeend', '<div class="flat"><div class="flat-card"><img alt=""></div><div class="flat-base"></div></div>');
    flatDraw();
  }
  function flatDraw() {
    if (!host || !cfg) return;
    const img = host.querySelector('.flat img');
    if (img) img.src = Art.front(cfg).toDataURL('image/jpeg', .9);
  }

  let THREE_ = window.THREE, R = null;
  try {
    if (THREE_) {
      const test = document.createElement('canvas');
      if (test.getContext('webgl2') || test.getContext('webgl')) {
        R = new THREE_.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      }
    }
  } catch (e) { R = null; }

  if (!R) {
    Stage.mount = (el) => flatMount(el);
    Stage.setCard = (c) => { cfg = c; flatDraw(); };
    Stage.flip = () => host && host.querySelector('.flat-card')?.classList.toggle('flipped');
    Stage.tap = (done) => { setTimeout(done, 300); return Promise.resolve(); };
    Stage.setStack = () => {};
    Stage.reset = () => {};
    return;
  }

  const T = THREE_;
  Stage.ok = true;
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  R.outputEncoding = T.sRGBEncoding;
  R.toneMapping = T.LinearToneMapping;
  R.toneMappingExposure = .95;
  const canvas = R.domElement;
  canvas.className = 'gl';

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, .3, 7.9);

  // ---------- окружение для отражений (студийные софтбоксы) ----------
  (function env() {
    const e = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x14161b, side: T.BackSide }));
    e.add(room);
    const box = (w, h, x, y, z, ry, c) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry; m.lookAt(0, 0, 0); e.add(m);
    };
    box(8, 3, 0, 8, 2, 0, new T.Color(6, 6, 6));
    box(3, 8, -8, 2, 4, 0, new T.Color(3.2, 3.2, 3.4));
    box(3, 6, 8, 1, 2, 0, new T.Color(.9, 2.6, 1.6));
    box(6, 2, 2, -2, 9, 0, new T.Color(2, 2, 2.2));
    const pm = new T.PMREMGenerator(R);
    scene.environment = pm.fromScene(e, .04).texture;
  })();

  scene.add(new T.AmbientLight(0xffffff, .45));
  const key = new T.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new T.PointLight(window.T4R.accent, 2.2, 14); rim.position.set(3, 2, -3); scene.add(rim);

  function rounded(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function canvasTex(cv, w, h) {
    const t = new T.CanvasTexture(cv);
    t.encoding = T.sRGBEncoding; t.anisotropy = R.capabilities.getMaxAnisotropy();
    if (w) { t.repeat.set(1 / w, 1 / h); t.offset.set(.5, .5); }
    return t;
  }

  // ---------- карта ----------
  const CW = 3.4, CH = 2.16, CD = .05, BV = .012;
  const cardShape = rounded(CW, CH, .16);
  const bodyGeo = new T.ExtrudeGeometry(cardShape, { depth: CD, bevelEnabled: true, bevelThickness: BV, bevelSize: BV, bevelSegments: 3, curveSegments: 12 });
  bodyGeo.translate(0, 0, -CD / 2);
  const faceGeo = new T.ShapeGeometry(cardShape, 12);
  const Z = CD / 2 + BV + .0015;

  const frontCv = document.createElement('canvas'), backCv = document.createElement('canvas');
  const frontTex = canvasTex(frontCv, CW, CH), backTex = canvasTex(backCv, CW, CH);
  const frontMat = new T.MeshPhysicalMaterial({ map: frontTex, roughness: .5, clearcoatRoughness: .12, envMapIntensity: .55 });
  const backMat = new T.MeshPhysicalMaterial({ map: backTex, roughness: .5, clearcoatRoughness: .12 });
  const edgeMat = new T.MeshPhysicalMaterial({ color: 0x111111, roughness: .4 });

  function makeCard(fm, bm, em) {
    const g = new T.Group();
    g.add(new T.Mesh(bodyGeo, em));
    const f = new T.Mesh(faceGeo, fm); f.position.z = Z; g.add(f);
    const b = new T.Mesh(faceGeo, bm); b.position.z = -Z; b.rotation.y = Math.PI; g.add(b);
    return g;
  }

  const rig = new T.Group(); scene.add(rig);
  const card = makeCard(frontMat, backMat, edgeMat);
  card.position.y = .58; card.rotation.x = -.09;
  rig.add(card);

  // акриловая подставка
  const baseShape = rounded(2.9, 1.1, .2);
  const baseGeo = new T.ExtrudeGeometry(baseShape, { depth: .3, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 4, curveSegments: 12 });
  baseGeo.rotateX(-Math.PI / 2); baseGeo.translate(0, -.78, 0);
  const acrylic = new T.MeshPhysicalMaterial({
    color: 0xdff1ff, transparent: true, opacity: .2, roughness: .04, metalness: 0,
    clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 2.4, depthWrite: false,
  });
  const base = new T.Mesh(baseGeo, acrylic); rig.add(base);
  const slot = new T.Mesh(new T.BoxGeometry(3.0, .06, .14), new T.MeshPhysicalMaterial({ color: 0x9fb4c6, transparent: true, opacity: .35, roughness: .2, depthWrite: false }));
  slot.position.set(0, -.47, .02); rig.add(slot);
  const edges = new T.LineSegments(new T.EdgesGeometry(baseGeo, 30), new T.LineBasicMaterial({ color: 0xcff6ff, transparent: true, opacity: .5 }));
  rig.add(edges);

  // гравировка на подставке
  const engCv = document.createElement('canvas');
  const engTex = canvasTex(engCv);
  const engr = new T.Mesh(new T.PlaneGeometry(2.4, .3), new T.MeshBasicMaterial({ map: engTex, transparent: true, opacity: .75, depthWrite: false }));
  engr.position.set(0, -.62, .585); rig.add(engr);

  // мягкая тень
  const shCv = document.createElement('canvas'); shCv.width = shCv.height = 256;
  { const c = shCv.getContext('2d'), g = c.createRadialGradient(128, 128, 10, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }
  const shadow = new T.Mesh(new T.PlaneGeometry(5.4, 2.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shCv), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.82; rig.add(shadow);

  // без подставки: карта парит над тенью
  const STAND = window.T4R.stand !== false;
  if (!STAND) {
    base.visible = slot.visible = edges.visible = engr.visible = false;
    card.position.y = .22; card.rotation.x = 0; shadow.position.y = -1.15;
  }

  // волны NFC
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const m = new T.Mesh(new T.RingGeometry(.9, 1, 64), new T.MeshBasicMaterial({ color: window.T4R.accent, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.set(1.28, .64, Z + .01); m.scale.setScalar(.01);
    card.add(m); rings.push(m);
  }

  // ---------- телефон ----------
  const phone = new T.Group();
  const PW = 1.3, PH = 2.7;
  const phoneGeo = new T.ExtrudeGeometry(rounded(PW, PH, .24), { depth: .1, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 12 });
  phoneGeo.translate(0, 0, -.05);
  phone.add(new T.Mesh(phoneGeo, new T.MeshPhysicalMaterial({ color: 0x1b1c20, metalness: .8, roughness: .28, clearcoat: 1 })));
  const scrCv = document.createElement('canvas');
  const scrTex = canvasTex(scrCv, PW - .1, PH - .1);
  const scr = new T.Mesh(new T.ShapeGeometry(rounded(PW - .1, PH - .1, .18), 10), new T.MeshBasicMaterial({ map: scrTex, toneMapped: false }));
  scr.position.z = .072; phone.add(scr);
  const isl = new T.Mesh(new T.ShapeGeometry(rounded(.34, .09, .045)), new T.MeshBasicMaterial({ color: 0x000000 }));
  isl.position.set(0, PH / 2 - .17, .074); phone.add(isl);
  phone.visible = false;
  scene.add(phone);

  // ---------- стопка для опта ----------
  const stack = new T.Group(); stack.visible = false; scene.add(stack);
  const stackFront = document.createElement('canvas'), stackBack = document.createElement('canvas');
  const sfMat = new T.MeshPhysicalMaterial({ map: canvasTex(stackFront, CW, CH), roughness: .35, clearcoat: .7 });
  const sbMat = new T.MeshPhysicalMaterial({ map: canvasTex(stackBack, CW, CH), roughness: .35, clearcoat: .7 });
  const seMat = new T.MeshPhysicalMaterial({ color: 0x0c0c0e, roughness: .4 });
  const pool = [];
  let stackWant = 0, stackDrawn = false;
  function rnd(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

  // ---------- управление ----------
  let rotY = 0, rotX = 0, tRotY = 0, flipped = false, dragging = false, lastX = 0, lastY = 0, busy = false;
  let camTo = new T.Vector3(0, .3, 7.9), lookTo = new T.Vector3(0, .1, 0), look = lookTo.clone();
  canvas.addEventListener('pointerdown', e => { if (busy || mode !== 'stand') return; dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    tRotY += (e.clientX - lastX) * .012; rotX = Math.max(-.4, Math.min(.4, rotX + (e.clientY - lastY) * .006));
    lastX = e.clientX; lastY = e.clientY;
  });
  const up = () => {
    if (!dragging) return; dragging = false;
    const base = flipped ? Math.PI : 0, turns = Math.round((tRotY - base) / (2 * Math.PI));
    const near = base + turns * 2 * Math.PI;
    // если докрутили до обратной стороны — оставляем её
    if (Math.abs(tRotY - near) > Math.PI / 2) { flipped = !flipped; tRotY = (flipped ? Math.PI : 0) + Math.round((tRotY - (flipped ? Math.PI : 0)) / (2 * Math.PI)) * 2 * Math.PI; }
    else tRotY = near;
  };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  // наклон телефона (гироскоп), если доступен
  let gyroX = 0, gyroY = 0;
  window.addEventListener('deviceorientation', e => {
    if (e.gamma == null) return;
    gyroY = Math.max(-1, Math.min(1, e.gamma / 35)) * .35;
    gyroX = Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 35)) * .2;
  });

  // ---------- анимации ----------
  const ease = k => 1 - Math.pow(1 - k, 3), inout = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const anims = [];
  function anim(dur, fn, e = ease) { return new Promise(res => anims.push({ t0: performance.now(), dur, fn, e, res })); }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const lerpV = (a, b, k) => a.clone().lerp(b, k);

  function haptic(kind) {
    const h = window.Telegram?.WebApp?.HapticFeedback;
    if (!h) return;
    try { kind === 'ok' ? h.notificationOccurred('success') : h.impactOccurred(kind || 'light'); } catch (e) {}
  }

  // ---------- публичные методы ----------
  Stage.mount = function (el, m) {
    host = el; mode = m || 'stand';
    el.appendChild(canvas);
    resize();
    rig.visible = mode === 'stand';
    stack.visible = mode === 'stack';
    if (mode === 'stack') { camTo.set(0, 4.6, 8.2); lookTo.set(0, .7, 0); }
    else { camTo.set(0, .3, 7.9); lookTo.set(0, .05, 0); }
    camera.position.copy(camTo); look.copy(lookTo);
  };

  Stage.setCard = function (c) {
    cfg = c;
    Art.front(c, frontCv); Art.back(c, backCv);
    frontTex.needsUpdate = true; backTex.needsUpdate = true;
    const f = c.finish;
    [frontMat, backMat].forEach(m => { m.roughness = f.rough; m.clearcoat = f.clear; m.metalness = f.metal; });
    edgeMat.color.set(c.color.edge); edgeMat.metalness = f.metal; edgeMat.roughness = f.rough;
    engr.visible = !!c.engrave && STAND;
    if (c.engrave) { Art.engraving(c.name || 'Ваше заведение', engCv); engTex.needsUpdate = true; }
    Art.screen('lock', c.name, scrCv); scrTex.needsUpdate = true;
  };

  Stage.flip = function () {
    if (busy) return;
    flipped = !flipped; tRotY += Math.PI; haptic('light');
  };

  // «Касание»: телефон подлетает к NFC-метке, волны, на экране открывается карточка заведения
  Stage.tap = async function (onOpen) {
    if (busy || mode !== 'stand') return;
    busy = true;
    if (flipped) { flipped = false; tRotY = Math.round(tRotY / (2 * Math.PI)) * 2 * Math.PI; }
    Art.screen('lock', cfg.name, scrCv); scrTex.needsUpdate = true;
    const p0 = new T.Vector3(4.6, 2.6, 3.2), p1 = new T.Vector3(1.6, card.position.y + .45, .95), p2 = new T.Vector3(1.45, card.position.y + .42, .42);
    const r0 = new T.Euler(.4, -.9, -.6), r1 = new T.Euler(-.12, .05, -.32);
    phone.position.copy(p0); phone.rotation.copy(r0); phone.visible = true;
    await anim(850, k => {
      phone.position.copy(lerpV(p0, p1, k));
      phone.rotation.set(r0.x + (r1.x - r0.x) * k, r0.y + (r1.y - r0.y) * k, r0.z + (r1.z - r0.z) * k);
    });
    await anim(220, k => phone.position.copy(lerpV(p1, p2, k)), inout);
    haptic('medium');
    rings.forEach((m, i) => anim(1100, k => {
      const kk = Math.max(0, Math.min(1, k * (1 + i * .18) - i * .18));
      m.scale.setScalar(.05 + kk * 1.25); m.material.opacity = kk > 0 && kk < 1 ? (1 - kk) * .9 : 0;
    }, k => k));
    await wait(380);
    Art.screen('review', cfg.name, scrCv); scrTex.needsUpdate = true;
    haptic('ok');
    await wait(420);
    const p3 = new T.Vector3(0, .62, 3.3), r3 = new T.Euler(0, 0, 0), pA = phone.position.clone(), rA = phone.rotation.clone();
    await anim(700, k => {
      phone.position.copy(lerpV(pA, p3, k));
      phone.rotation.set(rA.x + (r3.x - rA.x) * k, rA.y + (r3.y - rA.y) * k, rA.z + (r3.z - rA.z) * k);
    }, inout);
    onOpen && onOpen();
  };

  Stage.reset = async function () {
    if (!phone.visible) { busy = false; return; }
    const pA = phone.position.clone(), p0 = new T.Vector3(4.8, -2.6, 2.4);
    await anim(550, k => { phone.position.copy(lerpV(pA, p0, k)); phone.rotation.z = -.6 * k; }, inout);
    phone.visible = false; busy = false;
  };

  Stage.setStack = function (n) {
    stackWant = Math.max(0, Math.min(40, n));
    if (!stackDrawn) {
      stackDrawn = true;
      Art.front({ name: 'Ваш клиент', color: window.T4R.colors[0], cta: 'Оцените нас — приложите телефон' }, stackFront);
      Art.back({ name: 'stack', color: window.T4R.colors[0] }, stackBack);
      sfMat.map.needsUpdate = sbMat.map.needsUpdate = true;
    }
    while (pool.length < stackWant) {
      const i = pool.length, g = makeCard(sfMat, sbMat, seMat);
      g.rotation.x = -Math.PI / 2;
      g.rotation.z = (rnd(i) - .5) * .5;
      g.userData = { x: (rnd(i + 7) - .5) * .35, z: (rnd(i + 3) - .5) * .25, y: i * .066, born: performance.now() };
      g.position.set(g.userData.x, g.userData.y + 4, g.userData.z);
      stack.add(g); pool.push(g);
    }
    pool.forEach((g, i) => { g.visible = i < stackWant; if (i >= stackWant) g.userData.born = 0; });
    lookTo.set(0, .4 + stackWant * .035, 0);
    camTo.set(0, 4.6 + stackWant * .05, 8.2);
  };

  // ---------- размер и цикл ----------
  function resize() {
    if (!host) return;
    const w = host.clientWidth || 360, h = host.clientHeight || 320;
    R.setSize(w, h, false);
    camera.aspect = w / h;
    // на узком экране отодвигаем камеру, чтобы карта не обрезалась
    camera.zoom = Math.min(1, w / h / 1.12);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(document.body);

  const clock = new T.Clock();
  function loop(now) {
    requestAnimationFrame(loop);
    if (!host || !canvas.isConnected || document.hidden) return;
    const t = clock.getElapsedTime();
    for (let i = anims.length - 1; i >= 0; i--) {
      const a = anims[i], k = Math.min(1, (now - a.t0) / a.dur);
      a.fn(a.e(k));
      if (k >= 1) { anims.splice(i, 1); a.res(); }
    }
    if (mode === 'stand') {
      const sway = (dragging || busy) ? 0 : Math.sin(t * .55) * .32 + gyroY;
      rotY += (tRotY + sway - rotY) * .085;
      if (!dragging) rotX += ((busy ? 0 : Math.sin(t * .8) * .05 + gyroX) - rotX) * .06;
      rig.rotation.y = rotY; rig.rotation.x = rotX;
      rig.position.y = busy ? 0 : Math.sin(t * 1.1) * .04;
    } else {
      stack.rotation.y = Math.sin(t * .4) * .35;
      pool.forEach((g, i) => {
        if (!g.visible) return;
        if (!g.userData.born) g.userData.born = now;
        const k = Math.min(1, (now - g.userData.born - (i % 12) * 25) / 520);
        const kk = k < 0 ? 0 : 1 - Math.pow(1 - k, 3);
        g.position.y = g.userData.y + (1 - kk) * 3.2;
      });
    }
    camera.position.lerp(camTo, .06); look.lerp(lookTo, .06);
    camera.lookAt(look);
    R.render(scene, camera);
  }
  requestAnimationFrame(loop);
})();
