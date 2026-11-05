(() => {
  const Q = new URLSearchParams(location.search);
  const CAPTURE = Q.has('capture');
  const root = document.documentElement;
  const now = () => performance.now();
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  function bezier(x1, y1, x2, y2) {
    const ax = 3 * x1 - 3 * x2 + 1, bx = 3 * x2 - 6 * x1, cx = 3 * x1;
    const ay = 3 * y1 - 3 * y2 + 1, by = 3 * y2 - 6 * y1, cy = 3 * y1;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 28; i++) { const v = X(t); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return Y(t);
    };
  }
  const E = { linear: (t) => t, enter: bezier(0.2, 0, 0, 1), exit: bezier(0.3, 0, 0.8, 0.15), inOut: bezier(0.45, 0, 0.55, 1) };
  const T = { micro: 160, appear: 320, page: 600, morph: 900 };
  const SKINS = {
    precise:   { name: '精密', speed: 1.0,  theme: 'light', bgL: [246, 245, 241], bgD: [12, 13, 15],  accents: [['柿橙', '#DF5E2E'], ['钴蓝', '#1D4ED8'], ['松绿', '#15803D'], ['深绯', '#B91C1C']] },
    theater:   { name: '剧院', speed: 1.35, theme: 'dark',  bgL: [242, 239, 233], bgD: [10, 10, 11],  accents: [['琥珀', '#E9A93C'], ['青', '#3FC1C9'], ['珊瑚', '#F0705A']] },
    editorial: { name: '社论', speed: 1.0,  theme: 'light', bgL: [243, 239, 230], bgD: [22, 21, 19],  accents: [['砖红', '#C8402B'], ['墨绿', '#1E6B52'], ['藏青', '#23407A']] },
    gallery:   { name: '画廊', speed: 1.7,  theme: 'light', bgL: [250, 250, 249], bgD: [17, 18, 20],  accents: [['克莱因蓝', '#1D4ED8'], ['赤陶', '#C2410C'], ['墨', '#111111']] },
  };
  const SKIN_ORDER = ['precise', 'theater', 'editorial', 'gallery'];

  const live = new Set();
  let job = null;
  function tween(dur, update, opt = {}) {
    const ease = opt.ease || E.enter, delay = opt.delay || 0;
    return new Promise((res) => {
      if ((job && job.ff) || Deck.reduced || Deck.capture) { update(1, 1); res(); return; }
      live.add({ t0: now() + delay, dur: Math.max(1, dur), update, ease, res });
    });
  }
  const wait = (ms) => tween(ms, () => {}, { ease: E.linear });
  function flush() { for (const t of live) { t.update(1, 1); t.res(); } live.clear(); }

  const D0 = { o: 1, x: 0, y: 0, s: 1 };
  function set(el, st) {
    const c = Object.assign({}, D0, el._st || {}, st);
    el._st = c;
    el.style.opacity = c.o;
    el.style.transform = c.x || c.y || c.s !== 1 ? `translate(${c.x}px,${c.y}px) scale(${c.s})` : '';
  }
  function to(el, target, dur = T.appear, opt = {}) {
    const from = Object.assign({}, D0, el._st || {});
    return tween(dur, (v) => { const st = {}; for (const k in target) st[k] = lerp(from[k], target[k], v); set(el, st); }, opt);
  }
  function count(el, a, b, dur = 800, opt = {}) {
    const fmt = opt.fmt || ((v) => Math.round(v).toLocaleString('en-US'));
    return tween(dur, (v) => { el.textContent = fmt(lerp(a, b, v)); }, opt);
  }

  const C = {};
  function parse(s) {
    s = (s || '').trim();
    if (s[0] === '#') { let h = s.slice(1); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
    const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  }
  function readColors() { const cs = getComputedStyle(root); for (const k of ['bg', 'ink', 'ink2', 'ink3', 'line', 'edge', 'ac', 'raise', 'zone']) C[k] = parse(cs.getPropertyValue('--' + k)); }
  const rgba = (k, a = 1) => { const c = C[k]; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const tone = (a, k = 'ink') => { const c = C[k], b = C.bg; return `rgb(${c.map((v, i) => Math.round(b[i] + (v - b[i]) * a)).join(',')})`; };
  function pal(el) {
    const cs = getComputedStyle(el), P = {};
    for (const k of ['bg', 'ink', 'ink2', 'ink3', 'line', 'ac', 'raise', 'zone']) P[k] = parse(cs.getPropertyValue('--' + k));
    P.rgba = (k, a = 1) => { const c = P[k]; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
    P.tone = (a, k = 'ink') => { const c = P[k], b = P.bg; return `rgb(${c.map((v, i) => Math.round(b[i] + (v - b[i]) * a)).join(',')})`; };
    return P;
  }

  const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const toSrgb = (c) => Math.round(clamp(c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255);
  function oklch([r, g, b]) {
    r = toLin(r); g = toLin(g); b = toLin(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.hypot(A, B), Math.atan2(B, A)];
  }
  function fromOklch(L, ch, h) {
    for (let k = 0; k < 60; k++, ch *= 0.95) {
      const A = ch * Math.cos(h), B = ch * Math.sin(h);
      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
      const v = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
      if (v.every((x) => x > -1e-4 && x < 1 + 1e-4)) return v.map(toSrgb);
    }
    return [0, 0, 0];
  }
  const lum = (c) => 0.2126 * toLin(c[0]) + 0.7152 * toLin(c[1]) + 0.0722 * toLin(c[2]);
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const BG = { get light() { return SKINS[Deck.skin].bgL; }, get dark() { return SKINS[Deck.skin].bgD; } };
  function accentPair(input) {
    const src = parse(input), [L, ch, h] = oklch(src);
    let l1 = L, a1 = src; while (contrast(a1, BG.light) < 3 && l1 > 0.2) { l1 -= 0.01; a1 = fromOklch(l1, ch, h); }
    let l2 = L, a2 = src; while (contrast(a2, BG.dark) < 3 && l2 < 0.96) { l2 += 0.01; a2 = fromOklch(l2, ch, h); }
    return { input: hex(src), light: hex(a1), dark: hex(a2), cl: contrast(a1, BG.light), cd: contrast(a2, BG.dark), darker: l1 < L - 0.005, lighter: l2 > L + 0.005 };
  }

  function canvas(cv, w, h) {
    const o = { cv, ctx: cv.getContext('2d'), w, h, k: 1 };
    o.fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      o.k = Math.min(2.5, Math.max(1, Deck.s * dpr)); cv.style.width = o.w + 'px'; cv.style.height = o.h + 'px';
      cv.width = Math.round(o.w * o.k); cv.height = Math.round(o.h * o.k);
      o.ctx.setTransform(o.k, 0, 0, o.k, 0, 0);
    };
    o.fit();
    return o;
  }

  const Deck = (window.Deck = {
    E, T, tween, wait, set, to, count, canvas, clamp, lerp, now, C, rgba, tone, pal, accentPair, contrast, parse, hex,
    pages: [], p: 0, b: 0, s: 1, ox: 0, oy: 0, sw: 1920, sh: 1080, capture: CAPTURE, totalPages: 0, endMsg: '',
    motion: 'full', printing: false, get reduced() { return this.motion === 'reduced'; }, get alive() { return this.motion === 'full' && !this.printing; },
    theme: 'light', skin: 'precise', SKINS, get sk() { return SKINS[this.skin]; },
    d(ms) { return Math.round(ms * SKINS[this.skin].speed); },   // 按风格的动态快慢换算时长
   
    page(def) { def.el = document.querySelector(def.el); def.beats = def.beats || 0; this.pages.push(def); return def; },
    rect(el) { const r = el.getBoundingClientRect(); return { x: (r.left - Deck.ox) / Deck.s, y: (r.top - Deck.oy) / Deck.s, w: r.width / Deck.s, h: r.height / Deck.s }; },
  });

  let running = null;
  function run(fn, ff = false) {
    const j = { ff }; job = j;
    const p = (async () => { try { await fn(); } finally { if (job === j) job = null; } })();
    running = p;
    p.catch((e) => console.error(e)).finally(() => { if (running === p) running = null; });
    return p;
  }
  function hurry() {
    if (!running) return false;
    if (job) job.ff = true;
    flush();
    return true;
  }
  async function settle() { while (running) { const r = running; hurry(); await r.catch(() => {}); } }
  const cur = () => Deck.pages[Deck.p];
  const paint = (pg) => { if (pg.tick && !document.hidden) pg.tick(now() / 1000, Deck); };
  function show(pg, on) { pg.el.classList.toggle('on', on); if (on) pg.el.style.opacity = ''; }
  Deck.show = show;
  let darkNow = false;
  Deck.setDark = (d, instant) => {
    d = !!d; if (d === darkNow) return; darkNow = d;
    const b = document.body, from = parse(getComputedStyle(b).backgroundColor);
    b.style.backgroundColor = ''; b.classList.toggle('darkpage', d);
    if (instant || Deck.reduced || Deck.capture) return;
    const goal = parse(getComputedStyle(b).backgroundColor);
    tween(320, (v) => { b.style.backgroundColor = `rgb(${from.map((c, i) => Math.round(lerp(c, goal[i], v))).join(',')})`; }, { ease: E.linear }).then(() => { if (darkNow === d) b.style.backgroundColor = ''; });
  };

  Deck.fly = (src, dst, dur = T.morph, opt = {}) => {
    const st = document.querySelector('.stage');
    const a = Deck.rect(src), b = Deck.rect(dst), ca = getComputedStyle(src), cb = getComputedStyle(dst);
    const fa = parseFloat(ca.fontSize), fb = parseFloat(cb.fontSize);
    const g = document.createElement('div'); g.className = 'ghost';
    const sp = document.createElement('span'); sp.textContent = opt.text || src.textContent; g.append(sp);
    Object.assign(g.style, { fontFamily: ca.fontFamily, fontWeight: ca.fontWeight, letterSpacing: (parseFloat(ca.letterSpacing) || 0) / fa + 'em', fontSize: fa + 'px', left: '0px', top: '0px' });
    st.append(g);
    const r0 = Deck.rect(sp), gx = r0.x / fa, gy = r0.y / fa;   // 字框相对 ghost 左上角的偏移，跟字号成正比
    const c0 = parse(ca.color), c1 = parse(cb.color);
    const lsA = (parseFloat(ca.letterSpacing) || 0) / fa, lsB = (parseFloat(cb.letterSpacing) || 0) / fb;
    src.style.visibility = 'hidden'; dst.style.visibility = 'hidden';
    const put = (v) => {
      const f = lerp(fa, fb, v), x = lerp(a.x, b.x, v), y = lerp(a.y, b.y, v);
      g.style.fontSize = f + 'px'; g.style.letterSpacing = lerp(lsA, lsB, v) + 'em';
      g.style.left = x - gx * f + 'px'; g.style.top = y - gy * f + 'px';
      g.style.color = `rgb(${c0.map((c, i) => Math.round(lerp(c, c1[i], v))).join(',')})`;
    };
    put(0);
    return tween(dur, put, { ease: E.inOut, delay: opt.delay || 0 }).then(() => { dst.style.visibility = ''; src.style.visibility = ''; g.remove(); });
  };

  Deck.next = () => {
    if (hurry()) return;
    flush();   // v2.3 节奏标准：上一步不挡键的余韵（数还在数、线还在画）直接走完，这一下照常走下一步
    hideSrc();
    const pg = cur();
    if (Deck.b < pg.beats) { Deck.b++; const n = Deck.b; mark(); run(() => pg.beat(n, Deck)); }
    else if (Deck.p < Deck.pages.length - 1) {
      const nx = Deck.pages[Deck.p + 1];
      run(async () => {
        nx.reset(Deck);
        const fa = pg.el.querySelector('.foot'), fb = nx.el.querySelector('.foot');
        if (Deck.reduced || Deck.capture) { show(pg, false); show(nx, true); Deck.setDark(nx.dark, true); await nx.enter(Deck); paint(nx); }
        else if (pg.leave) { // 形态延续：两页同时在，由这一页的 leave 把东西交过去；页脚跟着淡切
          show(nx, true);
          if (fa && fb) { fb.style.opacity = 0; tween(240, (v) => { fa.style.opacity = 1 - v; fb.style.opacity = v; }, { ease: E.linear }); }
          await pg.leave(nx, Deck);
          if (fa) fa.style.opacity = ''; if (fb) fb.style.opacity = '';
          Deck.setDark(nx.dark); paint(nx); show(pg, false);
        }
        else { // 两页没有直接关系：先淡出 140ms 并卸下这一页，再淡入下一页 180ms，任何一帧画面上只有一页
          await tween(140, (v) => { pg.el.style.opacity = 1 - v; }, { ease: E.linear });
          show(pg, false); pg.el.style.opacity = '';
          show(nx, true); nx.el.style.opacity = 0; Deck.setDark(nx.dark);
          tween(180, (v) => { nx.el.style.opacity = v; }, { ease: E.linear }).then(() => { nx.el.style.opacity = ''; });
          await nx.enter(Deck);
        }
        Deck.p++; Deck.b = 0; mark();
      });
    } else if (Deck.endMsg) toast(Deck.endMsg, 4200);
  };
  Deck.prev = async () => {
    await settle();
    hideSrc();
    if (Deck.b > 0) Deck.goTo(Deck.p, Deck.b - 1);
    else if (Deck.p > 0) Deck.goTo(Deck.p - 1, Deck.pages[Deck.p - 1].beats);
  };
  Deck.settle = settle;
  Deck.busy = () => !!running;
  Deck.goTo = async (p, b) => { await settle(); return run(async () => {   // 跳页：整段直接到位
    flush();
    Deck.pages.forEach((x, i) => show(x, i === p));
    const pg = Deck.pages[p]; pg.reset(Deck); Deck.setDark(pg.dark, true);
    await pg.enter(Deck);
    for (let i = 1; i <= b; i++) await pg.beat(i, Deck);
    paint(pg); Deck.p = p; Deck.b = b; mark();
  }, true); };
  Deck.replay = async () => { await settle(); const p = Deck.p; run(async () => { flush(); Deck.pages.forEach((x, i) => show(x, i === p)); cur().reset(Deck); paint(cur()); Deck.b = 0; mark(); await cur().enter(Deck); }); };
  function mark() { document.body.dataset.page = Deck.p + 1; document.body.dataset.beat = Deck.b; }

  const stage = document.querySelector('.stage');
  function fit() {
    const W = innerWidth, H = innerHeight;
    Deck.s = Math.min(W / Deck.sw, H / Deck.sh);
    Deck.ox = (W - Deck.sw * Deck.s) / 2; Deck.oy = (H - Deck.sh * Deck.s) / 2;
    stage.style.transform = `translate(${Deck.ox}px,${Deck.oy}px) scale(${Deck.s})`;
    for (const pg of Deck.pages) pg.resize && pg.resize(Deck);
    if (popFor) place();
  }
  Deck.fit = () => fit();

  const PERF = Q.has('perf') ? { gaps: [], cost: [], last: 0, el: null } : null;
  Deck.perf = PERF;
  function perfShow() {
    const g = PERF.gaps.slice(-120), c = PERF.cost.slice(-120); if (!g.length) return;
    const avg = g.reduce((a, b) => a + b, 0) / g.length, worst = Math.max(...g), slow = g.filter((x) => x > 25).length;
    const ca = c.reduce((a, b) => a + b, 0) / c.length, cw = Math.max(...c);
    PERF.el.textContent = `帧率 ${(1000 / avg).toFixed(1)}　最慢一帧 ${worst.toFixed(1)} ms　超过 25 ms 的帧 ${slow}／${g.length}　画图 平均 ${ca.toFixed(2)} ms · 最慢 ${cw.toFixed(2)} ms`;
  }
  function frame() {
    const n = now();
    if (PERF) { if (PERF.last) PERF.gaps.push(n - PERF.last); PERF.last = n; if (PERF.gaps.length > 600) PERF.gaps.splice(0, 300); }
    for (const t of [...live]) {
      if (n < t.t0) continue;
      const k = clamp((n - t.t0) / t.dur);
      t.update(t.ease(k), k);
      if (k >= 1) { live.delete(t); t.res(); }
    }
    if (!document.hidden && Deck.mode !== 'article') for (const pg of Deck.pages) if (pg.el.classList.contains('on') && pg.tick) pg.tick(n / 1000, Deck);
    if (PERF) { PERF.cost.push(now() - n); if (PERF.cost.length > 600) PERF.cost.splice(0, 300); }
    requestAnimationFrame(frame);
  }

  const pop = document.createElement('div'); pop.className = 'srcpop';
  let popFor = null, popTw = 0;
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let popAt = null;   // 鼠标位置（舞台坐标）；没有鼠标时按元素位置摆
  function place() {
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x, y;
    if (popAt) { x = popAt.x + 18; y = popAt.y + 26; if (x + pw > Deck.sw - 24) x = popAt.x - 18 - pw; if (y + ph > Deck.sh - 24) y = popAt.y - 18 - ph; }
    else { // 默认放在数字上方；上方会压到标题（240 以上）就放下方
      const r = Deck.rect(popFor);
      x = clamp(r.x + r.w / 2 - pw / 2, 40, Deck.sw - 40 - pw); y = r.y - ph - 16;
      if (y < 240 && r.y + r.h + 16 + ph < Deck.sh - 40) y = r.y + r.h + 16;
    }
    pop.style.left = clamp(x, 24, Deck.sw - 24 - pw) + 'px'; pop.style.top = clamp(y, 24, Deck.sh - 24 - ph) + 'px';
  }
  function showSrc(el, ev) {
    if (!el || !el.dataset.src) return;
    popFor = el; popAt = ev ? { x: (ev.clientX - Deck.ox) / Deck.s, y: (ev.clientY - Deck.oy) / Deck.s } : null; pop.innerHTML = `<b>出处</b>${esc(el.dataset.src)}${el.dataset.how ? `<i>口径：${esc(el.dataset.how)}</i>` : ''}`; place();
    const id = ++popTw, o0 = +pop.style.opacity || 0;
    if (Deck.reduced) pop.style.opacity = 1;
    else { live.add({ t0: now(), dur: T.micro, ease: E.enter, res() {}, update: (v) => { if (id === popTw) pop.style.opacity = lerp(o0, 1, v); } }); }
  }
  function hideSrc() { if (!popFor) return; popFor = null; ++popTw; pop.style.opacity = 0; }
  Deck.showSrc = showSrc; Deck.hideSrc = hideSrc;
  function wireSources() {
    for (const el of document.querySelectorAll('[data-src]')) {
      if (el.closest('.article')) continue;   // 手机文章里的数字点开的是底部出处，不走这里
      el.addEventListener('mouseenter', (e) => showSrc(el, e));
      el.addEventListener('mousemove', (e) => { if (popFor === el) { popAt = { x: (e.clientX - Deck.ox) / Deck.s, y: (e.clientY - Deck.oy) / Deck.s }; place(); } });
      el.addEventListener('mouseleave', () => { if (popFor === el) hideSrc(); });
      el.addEventListener('click', (e) => { e.stopPropagation(); popFor === el ? hideSrc() : showSrc(el, e); });
    }
  }
  Deck.toggleCheck = () => {
    const on = document.body.classList.toggle('check');
    if (!on) return toast('已退出检查模式。', 2000);
    const pg = cur().el, a = pg.querySelectorAll('[data-src]').length, b = pg.querySelectorAll('[data-nosrc]').length;
    toast(`检查模式：这一页 ${a + b} 个关键数字，${a} 个有出处${b ? `，${b} 个没注明出处，讲之前补上或删掉` : ''}。再按 S 退出。`, 4200);
  };

  function restyle() { readColors(); for (const pg of Deck.pages) pg.restyle && pg.restyle(Deck); Deck.onRestyle && Deck.onRestyle(); paintUI(); }
  Deck.restyle = restyle;
  Deck.setTheme = (t) => { Deck.theme = t; root.dataset.theme = t; restyle(); };
  Deck.setAccent = (input, quiet) => {
    const p = accentPair(input);
    root.style.setProperty('--ac-light', p.light); root.style.setProperty('--ac-dark', p.dark);
    Deck.accent = p; acin.value = p.input.toLowerCase(); restyle();
    if (!quiet) {
      const notes = [];
      if (p.darker) notes.push(`亮底上太浅，自动加深到 ${p.light}`);
      if (p.lighter) notes.push(`暗底上太深，自动提亮到 ${p.dark}`);
      toast(`强调色换成 ${p.input}。${notes.length ? notes.join('；') + '。' : ''}对比度：亮底 ${p.cl.toFixed(1)} : 1，暗底 ${p.cd.toFixed(1)} : 1（不低于 3 : 1）。`, 4200);
    }
    return p;
  };
  let acI = 0;
  Deck.cycleAccent = () => {
    if (Deck.onC && Deck.onC()) return;
    const list = SKINS[Deck.skin].accents; acI = (acI + 1) % list.length;
    const p = Deck.setAccent(list[acI][1], true);
    toast(`强调色：${list[acI][0]} ${p.input}。再按 C 换下一个；右上角"强调色"可以挑任何颜色。`, 3000);
  };
  Deck.setSkin = async (name, quiet) => {
    if (!SKINS[name]) return;
    await settle();
    Deck.skin = name; root.dataset.skin = name; acI = 0;
    Deck.theme = SKINS[name].theme; root.dataset.theme = Deck.theme;
    Deck.setAccent(SKINS[name].accents[0][1], true);
    for (const pg of Deck.pages) pg.reskin && pg.reskin(Deck);
    restyle();
    try { await document.fonts.ready; } catch (e) {}
    fit();
    if (Deck.pages.length && Deck.mode !== 'article') await Deck.goTo(Deck.p, Deck.b);
    if (Deck.mode === 'article' && Deck.article) Deck.article(Deck);
    if (!quiet) toast(`风格：${SKINS[name].name}。再按 K 换下一种（精密 → 剧院 → 社论 → 画廊）。`, 2600);
  };
  Deck.nextSkin = () => (root.dataset.lock ? toast('这一套只有一种风格。按 C 可以换强调色。', 2600) : Deck.setSkin(SKIN_ORDER[(SKIN_ORDER.indexOf(Deck.skin) + 1) % SKIN_ORDER.length]));

  const ui = document.createElement('div'); ui.className = 'ui'; ui.dataset.ui = '1';
  const hint = document.createElement('div'); hint.className = 'hint';
  const skb = document.createElement('button'); skb.type = 'button';
  const thb = document.createElement('button'); thb.type = 'button';
  const acl = document.createElement('label'); acl.innerHTML = '<i></i>强调色<input type="color" value="#df5e2e">';
  const acin = acl.querySelector('input');
  const mo = document.createElement('button'); mo.type = 'button';
  const phb = document.createElement('button'); phb.type = 'button'; phb.textContent = '手机版';
  const pdb = document.createElement('button'); pdb.type = 'button'; pdb.textContent = '导出 PDF';
  const fsb = document.createElement('button'); fsb.type = 'button'; fsb.textContent = '全屏演示';
  ui.append(hint, skb, thb, acl, mo, phb, pdb, fsb);
  const phone = document.createElement('div'); phone.className = 'phone'; phone.dataset.ui = '1';
  phone.innerHTML = '<div class="frame"><iframe title="手机上的样子"></iframe></div><div class="side"><b>手机上的样子</b>窗口窄于 700 像素或竖着拿手机时，这份文件自动排成一篇单栏文章：每页一节，图按手机宽度重画，点数字从底部弹出出处。<br>390×844，相当于常见的 6.1 英寸手机。<br><button type="button">回到幻灯片（P 或 Esc）</button></div>';
  const phf = phone.querySelector('iframe');
  Deck.togglePhone = (on = !phone.classList.contains('on')) => {
    if (on) { const u = new URL(location.href); u.search = `?article&skin=${Deck.skin}&theme=${Deck.theme}`; u.hash = ''; if (phf.src !== u.href) phf.src = u.href; }
    phone.classList.toggle('on', on);
  };
  phone.querySelector('button').addEventListener('click', () => Deck.togglePhone(false));
  phone.addEventListener('click', (e) => { if (e.target === phone) Deck.togglePhone(false); });
  const toastEl = document.createElement('div'); toastEl.className = 'toast';
  const black = document.createElement('div'); black.className = 'blackout';
  let toastT = 0;
  function toast(msg, ms = 5200) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms); }
  Deck.toast = toast;
  function paintUI() {
    hint.innerHTML = `<b>→</b>下一步 <b>S</b>出处 <b>P</b>手机 <b>E</b>PDF <b>C</b>换色 ${root.dataset.lock ? '' : '<b>K</b>风格 '}<b>T</b>亮暗 <b>F</b>全屏`;
    skb.textContent = `风格：${SKINS[Deck.skin].name}`; skb.style.display = root.dataset.lock ? 'none' : '';
    thb.textContent = Deck.theme === 'dark' ? '换亮色' : '换暗色';
    mo.textContent = Deck.reduced ? '动态：减少' : '动态：完整';
  }
  async function toggleFS() {
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const el = root, req = el.requestFullscreen || el.webkitRequestFullscreen;
    const fail = '这里打不开一键全屏。可以用浏览器自己的全屏：Windows 按 F11，Mac 按 Control＋Command＋F。不全屏也能照常往下讲。';
    if (!req) { toast(fail); return; }
    let done = false;
    setTimeout(() => { if (!done && !(document.fullscreenElement || document.webkitFullscreenElement)) toast(fail); }, 900);   // 有的环境既不报错也不全屏，也要告诉讲的人
    try { await req.call(el, { navigationUI: 'hide' }); done = true; } catch (e) { done = true; toast(fail); }
  }
  function onFS() { document.body.classList.toggle('fs', !!(document.fullscreenElement || document.webkitFullscreenElement)); setTimeout(fit, 60); }
  document.addEventListener('fullscreenchange', onFS); document.addEventListener('webkitfullscreenchange', onFS);
  Deck.toggleMotion = () => {
    Deck.motion = Deck.reduced ? 'full' : 'reduced'; paintUI();
    toast(Deck.reduced ? '已减少动态：不再有入场动画和停留动态，按一下直接到位。再按 M 恢复。' : '已恢复完整动态。', 3000);
    if (Deck.reduced) { hurry(); for (const pg of Deck.pages) pg.calm && pg.calm(Deck); }
  };
  let quietT = 0;
  function wake() { if (CAPTURE) return; document.body.classList.remove('quiet'); clearTimeout(quietT); quietT = setTimeout(() => document.body.classList.add('quiet'), 2600); }

  addEventListener('keydown', (e) => {
    const k = e.key;
    if ((e.metaKey || e.ctrlKey) && (k === 'p' || k === 'P')) { e.preventDefault(); Deck.exportPDF(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (Deck.mode === 'article') return;
    if (phone.classList.contains('on')) { if (k === 'p' || k === 'P' || k === 'Escape') { e.preventDefault(); Deck.togglePhone(false); } return; }
    const rng = e.target.closest && e.target.closest('input[type=range]');
    if (rng && ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Enter', 'Backspace', 'Escape'].includes(k)) { e.preventDefault(); rng.blur(); if (k === 'Escape') return; }
    else if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) { if (k === 'Enter' || k === 'Escape') e.target.blur(); return; }
    if (Deck.onKey && Deck.onKey(k, e)) return;
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(k)) { e.preventDefault(); if (black.classList.contains('on')) return black.classList.remove('on'); Deck.next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); Deck.prev(); }
    else if (k === 'f' || k === 'F') toggleFS();
    else if (k === 't' || k === 'T') Deck.setTheme(Deck.theme === 'dark' ? 'light' : 'dark');
    else if (k === 's' || k === 'S') Deck.toggleCheck();
    else if (k === 'p' || k === 'P') Deck.togglePhone();
    else if (k === 'e' || k === 'E') Deck.exportPDF();
    else if (k === 'c' || k === 'C') Deck.cycleAccent();
    else if (k === 'v' || k === 'V') { if (!(Deck.onV && Deck.onV())) toast('这一套没有可切换的方案。按 V 切方案只在有 A/B 方案的页面上有用。', 2600); }
    else if (k === 'k' || k === 'K') Deck.nextSkin();
    else if (k === 'r' || k === 'R') Deck.replay();
    else if (k === 'm' || k === 'M') Deck.toggleMotion();
    else if (k === 'b' || k === 'B' || k === '.') black.classList.toggle('on');
    else if (k === 'h' || k === 'H') document.body.classList.toggle('quiet');
    else if (k === 'Escape') { hideSrc(); }
    else if (k === 'Home') Deck.goTo(0, 0);
    else if (k === 'End') Deck.goTo(Deck.pages.length - 1, Deck.pages[Deck.pages.length - 1].beats);
    else if (cur() && cur().key) cur().key(k, Deck);
  });
  addEventListener('click', (e) => {
    if (Deck.mode === 'article' || e.target.closest('[data-ui],button,a,input,label,select,[data-src],[data-live]')) return;
    if (black.classList.contains('on')) return black.classList.remove('on');
    if (popFor) return hideSrc();
    Deck.next();
  });
  addEventListener('mousemove', wake);
  addEventListener('resize', fit);
  skb.addEventListener('click', () => Deck.nextSkin());
  thb.addEventListener('click', () => Deck.setTheme(Deck.theme === 'dark' ? 'light' : 'dark'));
  acin.addEventListener('input', () => Deck.setAccent(acin.value));
  mo.addEventListener('click', () => Deck.toggleMotion());
  fsb.addEventListener('click', toggleFS);
  phb.addEventListener('click', () => Deck.togglePhone(true));
  pdb.addEventListener('click', () => Deck.exportPDF());
  Deck.preparePrint = async () => {
    const keep = [Deck.p, Deck.b]; hideSrc();
    let box = document.querySelector('.printdeck'); if (box) box.remove();
    box = document.createElement('div'); box.className = 'printdeck';
    Deck.printing = true;
    try {
      for (let i = 0; i < Deck.pages.length; i++) {
        const pg = Deck.pages[i];
        await Deck.goTo(i, pg.beats); pg.calm && pg.calm(Deck); paint(pg);
        if (pg.printPages) {   // 页面自己分张（比如附录长表）
          for (const cl of pg.printPages(Deck)) { const sh = document.createElement('div'); sh.className = 'psheet' + (pg.dark ? ' scheme-dark' : ''); cl.classList.add('on'); cl.style.opacity = ''; for (const c of cl.querySelectorAll('canvas')) c.remove(); sh.append(cl); box.append(sh); }
          continue;
        }
        const sh = document.createElement('div'); sh.className = 'psheet' + (pg.dark ? ' scheme-dark' : '') + (pg.tall ? ' tall' : '');
        const cl = pg.el.cloneNode(true); cl.classList.add('on'); cl.style.opacity = ''; cl.removeAttribute('id');
        const cvs = pg.el.querySelectorAll('canvas'), ccl = cl.querySelectorAll('canvas');
        cvs.forEach((c, k) => { const im = document.createElement('img'); im.className = 'cv'; im.src = c.toDataURL('image/png'); const z = getComputedStyle(c).zIndex; if (z !== 'auto') im.style.zIndex = z; ccl[k].replaceWith(im); });   // 画布在屏幕上压在卡片上面（z-index），换成图片也要压在上面，不然被白卡片盖住
        cl.querySelectorAll('input[type=range]').forEach((r, k) => { r.value = pg.el.querySelectorAll('input[type=range]')[k].value; });
        sh.append(cl); box.append(sh);
      }
    } finally { Deck.printing = false; }
    document.body.append(box); document.body.classList.add('pdeck');
    await Deck.goTo(keep[0], keep[1]);
    return box.children.length;
  };
  addEventListener('afterprint', () => { document.body.classList.remove('pdeck'); const b = document.querySelector('.printdeck'); if (b) b.remove(); });
  Deck.exportPDF = async () => {
    if (Deck.mode === 'article') { window.print(); return; }
    toast('正在准备 PDF：每页停在最后一拍。打印窗口里选"存储为 PDF"。PDF 是静态的，没有动态和交互。', 4200);
    await Deck.preparePrint();
    setTimeout(() => window.print(), 80);
  };

  Deck.mode = 'slides';
  function pickMode() {
    if (Q.has('slides')) return 'slides';
    if (Q.has('article')) return 'article';
    const w = Math.min(innerWidth, document.documentElement.clientWidth || innerWidth), h = Math.min(innerHeight, document.documentElement.clientHeight || innerHeight);   // 手机浏览器缩放时 innerWidth 会变大，取布局宽度
    return w < 700 || (w < 900 && h > w) ? 'article' : 'slides';
  }
  function applyMode() {
    const m = pickMode(); if (m === Deck.mode && Deck._modeSet) return; Deck._modeSet = true;
    Deck.mode = m; document.body.classList.toggle('art', m === 'article'); root.classList.toggle('art', m === 'article');
    if (m === 'article' && Deck.article) Deck.article(Deck);
  }
  Deck.applyMode = applyMode;
  addEventListener('resize', applyMode);

  Deck.start = async () => {
    if (CAPTURE) document.body.classList.add('capture');
    document.body.append(ui, toastEl, black, phone);
    if (PERF) { PERF.el = document.createElement('div'); PERF.el.className = 'perf'; document.body.append(PERF.el); setInterval(perfShow, 500); }
    Deck.skin = root.dataset.lock ? 'precise' : SKINS[Q.get('skin')] ? Q.get('skin') : (SKINS[root.dataset.skin] ? root.dataset.skin : 'precise'); root.dataset.skin = Deck.skin;   // 锁住时不认 ?skin=（这一份只带精密风格的样式）
    Deck.theme = Q.get('theme') || SKINS[Deck.skin].theme; root.dataset.theme = Deck.theme;
    Deck.setAccent(Q.get('accent') || SKINS[Deck.skin].accents[0][1], true);
    applyMode();
    stage.append(pop);
    if (Q.get('motion') === 'reduced' || (!CAPTURE && matchMedia('(prefers-reduced-motion: reduce)').matches)) Deck.motion = 'reduced';
    readColors(); paintUI();
    try { await document.fonts.ready; } catch (e) {}
    fit();
    const total = Deck.totalPages || Deck.pages.length;
    Deck.pages.forEach((pg, i) => pg.el.querySelectorAll('[data-pn]').forEach((n) => { n.textContent = `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`; }));
    wireSources();
    for (const pg of Deck.pages) { if (pg.prepare) await pg.prepare(Deck); pg.reset(Deck); }
    requestAnimationFrame(frame);
    const p = +(Q.get('page') || 1) - 1, b = +(Q.get('beat') || 0);
    if (p > 0 || b > 0) await Deck.goTo(p, b);
    else { show(Deck.pages[0], true); mark(); run(() => Deck.pages[0].enter(Deck)); }
    wake();
    window.__ready = true;
  };
})();
