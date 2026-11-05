(() => {
  const D = Deck, { E, T, tween, wait, set, to, count, clamp, lerp } = D;
  const C = window.DECK_CONTENT, M = C.meta;
  const stage = document.querySelector('.stage');
  const sk = () => D.skin;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sgn = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), d);
  const srcA = (s, how) => (s ? ` data-src="${esc(s)}"${how ? ` data-how="${esc(how)}"` : ''}` : ' data-nosrc');
  const $ = (root, sel) => root.querySelector(sel), $$ = (root, sel) => [...root.querySelectorAll(sel)];

  const NUMF = () => (sk() === 'editorial' ? '"Noto Serif SC", serif' : 'Inter, "Noto Sans SC", sans-serif');
  const SANS = '"Noto Sans SC", Inter, sans-serif';
  const cf = (px, w = 400, fam = 'num') => `${sk() === 'gallery' && w > 400 ? 400 : w} ${px}px ${fam === 'num' ? NUMF() : fam === 'serif' ? '"Noto Serif SC", serif' : SANS}`;
  function txt(ctx, s, x, y, font, color, align = 'left', base = 'alphabetic') { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); }
  function hatch(ctx, x, y, w, h, color, gap = 8) {   // 负向用斜纹，不用红色
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    for (let k = -h; k < w + h; k += gap) { ctx.beginPath(); ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
  }
  const ink = (a = 1) => D.rgba('ink', a), tone = (a) => D.tone(a), acc = (a = 1) => D.rgba('ac', a);

  const MO = { precise: { y: 14, dur: 320, stag: 60 }, theater: { y: 0, dur: 620, stag: 140 }, editorial: { y: -12, dur: 380, stag: 90 }, gallery: { y: 6, dur: 980, stag: 170 } };
  function appear(el, delay = 0) { const m = MO[sk()]; set(el, { o: 0, y: m.y }); return to(el, { o: 1, y: 0 }, m.dur, { delay }); }
  const hide = (el) => set(el, { o: 0, y: 0 }), showNow = (el) => set(el, { o: 1, y: 0 });
  function spot(pg, n) {
    if (sk() !== 'theater' || D.printing) return;
    pg.groups.forEach((g, i) => { if (i < n) g.forEach((e) => { if (!('keep' in e.dataset)) to(e, { o: 0.3 }, D.d(420)); }); });
  }
  function unspot(pg) { pg.groups.forEach((g, i) => { if (i <= D.b) g.forEach((e) => set(e, { o: 1 })); }); }
  function phase(S, t, period, pause = 2) { if (S.t0 == null) S.t0 = t; const c = (t - S.t0) % (period + pause); return Math.min(1, c / period); }

  const CALC = {};
  const calcPage = C.pages.find((p) => p.type === 'calc');
  if (calcPage) for (const p of calcPage.params) CALC[p.key] = p.def;
  const calcKeys = calcPage ? calcPage.params.map((p) => p.key) : [];
  const calcFn = calcPage ? new Function(...calcKeys, `return (${calcPage.formula || 'classes*kids*save*rounds/60'});`) : () => 0;
  const hours = () => (calcPage ? calcFn(...calcKeys.map((k) => CALC[k])) : 0);
  const calcDig = calcPage && calcPage.result && calcPage.result.digits ? calcPage.result.digits : 0;
  const calcVals = () => { const hh = hours(), r = Math.round(hh * 10 ** calcDig) / 10 ** calcDig, r10 = fmt(Math.round(hh / 10) * 10); return { hours: fmt(Math.round(hh)), hours10: r10, calc: fmt(r, calcDig), calc10: r10 }; };
  function tpl(s) { return esc(s).replace(/\{(hours10|hours|calc10|calc)\}/g, (_, k) => `<span data-calc="${k}">${calcVals()[k]}</span>`); }
  function paintCalc() { const v = calcVals(); for (const e of document.querySelectorAll('[data-calc]')) e.textContent = v[e.dataset.calc]; }
  D.paintCalc = paintCalc;

  const clauses = (h) => h.replace(/([，：；])/g, '$1\u0001').split('\u0001').filter(Boolean).map((x) => `<span class="tl">${x}</span>`).join('');
  let pageNo = 0;
  function frame(d, type, inner) {
    const i = ++pageNo;
    const sec = document.createElement('section'); sec.className = `page t-${type}`; sec.id = 'p' + i;
    sec.innerHTML = `<canvas class="cv"></canvas>
  <div class="cols" aria-hidden="true">${'<i></i>'.repeat(7)}</div>
  <div class="rtop" aria-hidden="true">${'<i></i>'.repeat(13)}</div>
  <div class="mast"><i></i><span>${esc(M.section)}</span><b>No.${String(i).padStart(2, '0')}</b></div>
  <div class="head"><div class="kicker"><span class="kno">${String(i).padStart(2, '0')}</span>${esc(d.kicker)}</div><h2 class="title">${clauses(tpl(d.title))}</h2><p class="stand">${esc(d.stand || '')}</p></div>
  ${inner}
  <div class="rfoot"></div><div class="foot"><span>${esc(M.foot)}</span><span class="pn" data-pn></span></div>`;
    stage.append(sec);
    return sec;
  }
  function base(sec, d, beats) {
    const cv = D.canvas($(sec, 'canvas'), 1920, 1080);
    const head = [$(sec, '.head'), $(sec, '.mast'), $(sec, '.rtop'), $(sec, '.cols')];
    const groups = [[]]; for (let i = 1; i <= beats; i++) groups.push($$(sec, `[data-b="${i}"]`));
    return { el: sec, d, cv, beats, groups, head, S: { a: 0, b: [0, 0, 0, 0], t0: null } };
  }
  function resetGroups(pg) { for (const g of pg.groups.slice(1)) g.forEach(hide); pg.S.a = 0; pg.S.b = [0, 0, 0, 0]; pg.S.t0 = null; }
  async function enterHead(pg) { pg.head.forEach((e) => e && showNow(e)); const t = $(pg.el, '.head'); appear(t, 0); }
  async function beatIn(pg, n, dur = 600) {
    spot(pg, n);
    const m = MO[sk()];
    pg.groups[n].forEach((e, k) => appear(e, k * m.stag));
    await tween(D.d(dur), (v) => { pg.S.b[n] = v; }, { ease: E.enter });
    if (n === pg.beats && sk() === 'theater' && !D.printing) pg.groups.forEach((g, i) => { if (i < n) g.forEach((e) => { if (!('keep' in e.dataset)) to(e, { o: 1 }, D.d(700)); }); });
  }
  function calmGroups(pg) { if (sk() === 'theater') pg.groups.forEach((g, i) => { if (i <= D.b) g.forEach((e) => set(e, { o: 1 })); }); }

  const TYPES = {};

  const STRIP = {   // 每种风格的小图位置和画法
    precise: { x: 120, y: 830, w: 1680, h: 100, kind: 'line' },
    theater: { x: 560, y: 514, w: 800, h: 30, kind: 'line' },
    editorial: { x: 120, y: 470, w: 1080, h: 300, kind: 'line' },
    gallery: { x: 160, y: 404, w: 860, h: 28, kind: 'dots' },
  };
  const WMIN = 68, WMAX = 85;
  function drawWeeks(ctx, w, g, opt = {}) {   // 18 周的数按风格画：精密是刻度柱、剧院和社论是折线、画廊是点
    const n = w.length, sx = (i) => g.x + (g.w * (i + 0.5)) / n, sy = (v) => g.y + g.h - ((v - WMIN) / (WMAX - WMIN)) * g.h;
    const upto = opt.upto ?? n, ev = opt.ev ?? 6, hi = opt.hi;
    if (g.kind === 'bars') {
      const bw = Math.max(2, (g.w / n) * (g.h > 200 ? 0.36 : 0.16));
      for (let i = 0; i < Math.min(n, Math.ceil(upto)); i++) {
        const f = clamp(upto - i), y = sy(w[i]), hh = (g.y + g.h - y) * f;
        ctx.fillStyle = i === n - 1 && opt.endAc ? acc() : i + 1 < ev ? tone(0.35) : ink(0.92);
        ctx.fillRect(sx(i) - bw / 2, g.y + g.h - hh, bw, hh);
      }
      ctx.fillStyle = ink(0.9); ctx.fillRect(g.x, g.y + g.h, g.w, 1.5);
      for (let i = 0; i <= n; i++) ctx.fillRect(g.x + (g.w * i) / n, g.y + g.h, 1, i % 6 === 0 ? 8 : 4);
    } else if (g.kind === 'line') {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const lw = opt.lw ?? (sk() === 'theater' ? 4 : sk() === 'precise' ? 1.5 : 2.5);
      for (let i = 0; i < n - 1 && i < upto - 1; i++) {
        const f = clamp(upto - 1 - i);
        ctx.strokeStyle = i + 2 <= ev - 1 ? tone(sk() === 'theater' ? 0.28 : 0.4) : sk() === 'editorial' ? acc() : ink();
        ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(sx(i), sy(w[i])); ctx.lineTo(lerp(sx(i), sx(i + 1), f), lerp(sy(w[i]), sy(w[i + 1]), f)); ctx.stroke();
      }
      if (sk() === 'precise') {   // 精密：每周一个小方块，像仪表上的读数点
        const q = g.h > 200 ? 9 : 6;
        for (let i = 0; i < Math.min(n, Math.ceil(upto)); i++) { ctx.fillStyle = i === n - 1 && opt.endAc ? acc() : i + 1 < ev ? tone(0.4) : ink(); ctx.fillRect(sx(i) - q / 2, sy(w[i]) - q / 2, q, q); }
        if (g.h > 200) { ctx.fillStyle = ink(0.9); ctx.fillRect(g.x, g.y + g.h, g.w, 1.5); for (let i = 0; i <= n; i++) ctx.fillRect(g.x + (g.w * i) / n, g.y + g.h, 1, i % 6 === 0 ? 10 : 5); }
      } else if (upto >= n && opt.endDot !== false) { ctx.fillStyle = sk() === 'editorial' ? acc() : opt.endAc ? acc() : ink(); ctx.beginPath(); ctx.arc(sx(n - 1), sy(w[n - 1]), lw * 1.6, 0, 7); ctx.fill(); }
    } else {   // dots
      const base = g.y + g.h;
      for (let i = 0; i < Math.min(n, Math.ceil(upto)); i++) {
        const f = clamp(upto - i), y = lerp(base, sy(w[i]), f);
        if (g.h > 100 && i > 0 && f >= 1) { ctx.strokeStyle = tone(0.3); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx(i - 1), sy(w[i - 1])); ctx.lineTo(sx(i), y); ctx.stroke(); }
        ctx.fillStyle = i === n - 1 && opt.endAc ? acc() : i + 1 < ev ? tone(0.3) : ink(0.85);
        ctx.beginPath(); ctx.arc(sx(i), g.h > 100 ? y : g.y + g.h / 2, g.h > 100 ? 5 : 3.2, 0, 7); ctx.fill();
      }
    }
    if (hi != null && hi >= 0) {   // 停留游标
      const i = Math.min(n - 1, Math.floor(hi)), x = sx(i), y = g.kind === 'dots' && g.h <= 100 ? g.y + g.h / 2 : sy(w[i]);
      ctx.fillStyle = sk() === 'gallery' ? acc() : ink();
      if (g.kind === 'bars') { ctx.fillRect(x - 0.75, g.y - 14, 1.5, g.h + 14); }
      else { ctx.strokeStyle = sk() === 'gallery' ? acc() : ink(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, g.kind === 'dots' ? 8 : 9, 0, 7); ctx.stroke(); }
      return { x, y, i };
    }
    return null;
  }
  D.drawWeeks = drawWeeks; D.WEEKS_GEO = STRIP;

  TYPES.cover = (d) => {
    const sec = frame(d, 'cover', `
  <div class="hero"><span class="sign">${esc(d.big.sign)}</span><span class="num"${srcA(d.big.src, d.big.how)}>${esc(d.big.v)}</span><span class="unit">${esc(d.big.unit)}</span></div>
  <div class="ft" data-b="1"><div><em>${esc(d.from.label)}</em><b${srcA(d.from.src)}>${esc(d.from.v)}</b></div><span class="arr" aria-hidden="true"></span><div><em>${esc(d.to.label)}</em><b class="ac"${srcA(d.to.src)}>${esc(d.to.v)}</b></div></div>
  <div class="kpis" data-b="2">${d.kpis.map((k) => `<div class="kpi"><em>${esc(k.label)}</em><div class="kv"><s>${esc(k.a)}</s><i aria-hidden="true">→</i><b${srcA(k.src)}>${esc(k.b)}</b><u>${esc(k.unit)}</u></div></div>`).join('')}</div>
  <p class="bridge" data-b="3">${esc(d.bridge)}</p>
  <div class="wkr" aria-hidden="true"></div>`);
    const pg = base(sec, d, 3), S = pg.S, w = d.weeks, numEl = $(sec, '.num'), heroEl = $(sec, '.hero'), wkr = $(sec, '.wkr');
    $(sec, '.num').dataset.keep = '';
    Object.assign(pg, {
      type: 'cover',
      reset() { resetGroups(pg); hide(heroEl); numEl.textContent = d.big.v; set(wkr, { o: 0 }); },
      async enter() {
        enterHead(pg); appear(heroEl, D.d(80));
        if (sk() === 'precise' || sk() === 'editorial') count(numEl, 0, +d.big.v, D.d(900), { fmt: (v) => v.toFixed(1), delay: D.d(80) });
        await tween(D.d(1100), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(120) });
      },
      beat(n) { return beatIn(pg, n); },
      calm() { calmGroups(pg); },
      resize() { pg.cv.fit(); },
      stripGeo() { return STRIP[sk()]; },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        if (S.morphOut) return;
        const g = STRIP[sk()];
        let hi = -1;
        if (S.a >= 1 && D.alive) hi = phase(S, t, 30, 2) * 18 - 0.0001;
        const r = drawWeeks(ctx, w, g, { upto: S.a * 18, hi: hi >= 0 ? hi : null, endAc: true });
        if (sk() === 'editorial') {   // 社论：图上直接写标注和刻度
          ctx.fillStyle = D.rgba('line'); for (const v of [70, 75, 80, 85]) { const y = g.y + g.h - ((v - WMIN) / (WMAX - WMIN)) * g.h; ctx.fillRect(g.x, y, g.w, 1); txt(ctx, String(v), g.x + g.w + 10, y + 5, cf(15), ink(0.55)); }
          txt(ctx, '每周小测平均分', g.x, g.y - 18, cf(16, 500, 'sans'), ink());
          const x6 = g.x + (g.w * 5.5) / 18; ctx.fillStyle = ink(0.6); ctx.fillRect(x6, g.y, 1, g.h); txt(ctx, '第 6 周起换办法', x6 + 8, g.y + 18, cf(15, 400, 'sans'), ink(0.75));
          for (const i of [0, 5, 11, 17]) txt(ctx, `${i + 1}`, g.x + (g.w * (i + 0.5)) / 18, g.y + g.h + 24, cf(14), ink(0.55), 'center');
        }
        if (sk() === 'precise') for (const i of [0, 5, 11, 17]) txt(ctx, `第 ${i + 1} 周`, g.x + (g.w * (i + 0.5)) / 18, g.y + g.h + 30, cf(14, 400, 'sans'), ink(0.55), 'center');
        if (r) {
          wkr.textContent = `第 ${r.i + 1} 周 · ${w[r.i].toFixed(1)} 分`;
          const wr = wkr.offsetWidth;
          const L = sk() === 'precise' ? clamp(r.x - wr / 2, 120, 1800 - wr) : clamp(r.x - wr / 2, Math.max(120, g.x - 40), Math.min(1800, g.x + g.w + 40) - wr);
          const Tp = sk() === 'precise' ? g.y - 46 : sk() === 'gallery' ? g.y - 40 : sk() === 'theater' ? g.y + g.h + 18 : r.y - 44;
          wkr.style.left = L + 'px'; wkr.style.top = Tp + 'px'; set(wkr, { o: 1 });
        } else set(wkr, { o: 0 });
      },
      article: () => `<p class="a-big"><b${srcA(d.big.src)}>${esc(d.big.sign + d.big.v)}</b><u>${esc(d.big.unit)}</u></p>
        <p class="a-ft">${esc(d.from.label)} ${esc(d.from.v)} → ${esc(d.to.label)} <b class="ac">${esc(d.to.v)}</b></p>
        ${svgWeeks(w)}
        <div class="a-kpis">${d.kpis.map((k) => `<div><em>${esc(k.label)}</em><span><s>${esc(k.a)}</s> → <b${srcA(k.src)}>${esc(k.b)}</b> ${esc(k.unit)}</span></div>`).join('')}</div>
        <p>${esc(d.bridge)}</p>`,
    });
    return pg;
  };

  function svgWeeks(w, ev = 6) {
    const W = 340, H = 120, n = w.length, x = (i) => 10 + ((W - 20) * (i + 0.5)) / n, y = (v) => H - 18 - ((v - WMIN) / (WMAX - WMIN)) * (H - 30);
    const pts = w.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    return `<svg class="a-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="18 周周测平均分"><line x1="10" x2="${W - 10}" y1="${H - 18}" y2="${H - 18}" class="ax"/>
      <polyline points="${pts.slice(0, ev).join(' ')}" class="l0"/><polyline points="${pts.slice(ev - 1).join(' ')}" class="l1"/>
      <circle cx="${x(n - 1)}" cy="${y(w[n - 1])}" r="4" class="ac"/><text x="10" y="${H - 3}" class="t">第 1 周</text><text x="${W - 10}" y="${H - 3}" class="t" text-anchor="end">第 ${n} 周</text></svg>`;
  }

  const TG = {
    precise: { x: 160, y: 330, w: 1600, h: 470, kind: 'line' },
    theater: { x: 220, y: 300, w: 1300, h: 470, kind: 'line' },
    editorial: { x: 120, y: 420, w: 1100, h: 430, kind: 'line' },
    gallery: { x: 220, y: 380, w: 1240, h: 430, kind: 'dots' },
  };
  TYPES.trend = (d, all) => {
    const w = all.find((p) => p.type === 'cover')?.weeks || d.weeks;
    const avg = d.avg.map((a) => { const s = w.slice(a.from - 1, a.to); return { ...a, v: s.reduce((x, y) => x + y, 0) / s.length }; });
    const diff = avg[1].v - avg[0].v;
    const sec = frame(d, 'trend', `
  <div class="tv"><em>第 ${w.length} 周</em><b class="ac"${srcA(d.src)}>${w[w.length - 1].toFixed(1)}</b><u>${esc(d.unit)}</u></div>
  <div class="tev" data-b="1"><b>${esc(d.event.text.split(' · ')[0])}</b><span>${esc(d.event.text.split(' · ')[1] || '')}</span></div>
  <div class="tavg" data-b="2">${avg.map((a, i) => `<div><em>${esc(a.label)}</em><b class="${i ? 'ac' : ''}"${srcA(d.src, `第 ${a.from}–${a.to} 周 5 次周测的平均`)}>${a.v.toFixed(1)}</b></div>`).join('')}<div><em>差</em><b class="ac">${sgn(diff)}</b></div></div>
  <div class="tdip" data-b="3"><b>${esc(d.dip.text.split(' · ')[0])}</b><span>${esc(d.dip.text.split(' · ')[1] || '')}</span></div>
  <div class="wkr" aria-hidden="true"></div>`);
    const pg = base(sec, d, 3), S = pg.S, tv = $(sec, '.tv'), wkr = $(sec, '.wkr'), tev = $(sec, '.tev'), tdip = $(sec, '.tdip');
    tv.dataset.keep = '';
    const gx = (g, i) => g.x + (g.w * (i + 0.5)) / w.length, gy = (g, v) => g.y + g.h - ((v - WMIN) / (WMAX - WMIN)) * g.h;
    function place() {   // 标注跟着图摆：终点数在最后一点旁边，拍 1、拍 3 的说明在那一周上方
      const g = TG[sk()], n = w.length;
      const ex = gx(g, n - 1), ey = gy(g, w[n - 1]);
      if (sk() === 'precise') { tv.style.left = ex - 260 + 'px'; tv.style.top = ey - 150 + 'px'; }
      else if (sk() === 'theater') { tv.style.left = ex + 40 + 'px'; tv.style.top = ey - 90 + 'px'; }
      else if (sk() === 'editorial') { tv.style.left = '1360px'; tv.style.top = '420px'; }
      else { tv.style.left = ex + 56 + 'px'; tv.style.top = ey - 96 + 'px'; }   // 画廊：大数放在最后一点的右上方，不压点（独立评审）
      const x6 = (gx(g, d.event.at - 1) + gx(g, d.event.at - 2)) / 2;
      tev.style.left = x6 + 14 + 'px'; tev.style.top = (sk() === 'editorial' ? g.y + 12 : g.y - 10) + 'px';
      const xd = gx(g, d.dip.at - 1);
      tdip.style.left = clamp(xd - 150, g.x, 1800 - 330) + 'px'; tdip.style.top = gy(g, w[d.dip.at - 1]) + 46 + 'px';
    }
    Object.assign(pg, {
      type: 'trend',
      reset() { resetGroups(pg); hide(tv); set(wkr, { o: 0 }); S.morph = null; place(); },
      reskin() { place(); },
      async enter() {
        enterHead(pg); place();
        if (S.morph) { S.a = 1; appear(tv, D.d(200)); return; }
        appear(tv, D.d(700));
        await tween(D.d(1200), (v) => { S.a = v; }, { ease: E.enter });
      },
      async morphIn(from) {
        S.morph = { from, u: 0 }; S.a = 1; place(); hide(tv);
        pg.head.forEach((e) => e && showNow(e)); const hd = $(pg.el, '.head'); hide(hd); appear(hd, D.d(280));   // 新标题等旧页淡出后再出来，不叠字
        await tween(D.d(T.morph), (v) => { S.morph.u = v; }, { ease: E.inOut });
        S.morph = null; appear(tv);
      },
      beat(n) { return beatIn(pg, n, 700); },
      calm() { calmGroups(pg); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        let g = TG[sk()];
        if (S.morph) { const f = S.morph.from, u = S.morph.u; g = { x: lerp(f.x, g.x, u), y: lerp(f.y, g.y, u), w: lerp(f.w, g.w, u), h: lerp(f.h, g.h, u), kind: g.kind }; }
        const full = TG[sk()];
        if (sk() === 'editorial' || sk() === 'precise') {
          for (const v of [70, 75, 80, 85]) {
            const y = gy(g, v);
            if (sk() === 'editorial') { ctx.fillStyle = D.rgba('line'); ctx.fillRect(g.x, y, g.w, 1); txt(ctx, String(v), g.x + g.w + 12, y + 5, cf(16), ink(0.55)); }
            else txt(ctx, String(v), g.x - 16, y + 5, cf(15), ink(0.5), 'right');
          }
        }
        const b1 = S.b[1], b2 = S.b[2], b3 = S.b[3];
        if (b1 > 0) {
          const x6 = (gx(g, d.event.at - 1) + gx(g, d.event.at - 2)) / 2;
          ctx.fillStyle = sk() === 'gallery' ? acc(0.8) : ink(0.75); ctx.fillRect(x6 - 0.5, lerp(g.y + g.h, g.y - 16, b1), sk() === 'precise' ? 2 : 1, (g.h + 16) * b1);
          if (sk() === 'precise') { ctx.fillStyle = D.rgba('zone', 0.9 * b1); ctx.fillRect(x6, g.y - 16, g.x + g.w - x6, g.h + 16); }
        }
        if (b2 > 0) {
          avg.forEach((a, k) => {
            const x0 = gx(g, a.from - 1) - 20, x1 = gx(g, a.to - 1) + 20, y = gy(g, a.v);
            ctx.fillStyle = k ? acc() : ink(0.6); ctx.fillRect(x0, y - 1, (x1 - x0) * b2, 2);
            txt(ctx, a.v.toFixed(1), x0 + (x1 - x0) * b2 + 10, y + 6, cf(18, 500), k ? acc() : ink(0.7));
          });
        }
        drawWeeks(ctx, w, g, { upto: S.a * w.length, hi: null, endAc: sk() !== 'editorial', ev: b1 > 0 || sk() !== 'precise' ? d.event.at : 99 });
        if (sk() === 'precise' || sk() === 'gallery' || sk() === 'theater') {
          for (let i = 0; i < w.length; i++) if (i === 0 || (i + 1) % (sk() === 'precise' ? 1 : 6) === 0 || i === w.length - 1) txt(ctx, String(i + 1), gx(g, i), g.y + g.h + 30, cf(15), ink(sk() === 'theater' ? 0.45 : 0.55), 'center');
          txt(ctx, '周', g.x + g.w + 8, g.y + g.h + 30, cf(15, 400, 'sans'), ink(0.5));
        } else for (const i of [0, 5, 11, 17]) txt(ctx, `第 ${i + 1} 周`, gx(g, i), g.y + g.h + 28, cf(15, 400, 'sans'), ink(0.55), 'center');
        if (b3 > 0) { const x = gx(g, d.dip.at - 1), y = gy(g, w[d.dip.at - 1]); ctx.strokeStyle = ink(0.85); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(x, y, 22 * b3, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.fillRect(x - 0.5, y + 22, 1, 20 * b3); }
        if (S.a >= 1 && !S.morph && D.alive) {
          const hi = phase(S, t, 36, 2) * w.length - 0.0001;
          const r = drawWeeks(ctx, w, full, { upto: 0, hi });
          if (r) { wkr.textContent = `第 ${r.i + 1} 周 · ${w[r.i].toFixed(1)} 分`; const wr = wkr.offsetWidth; wkr.style.left = clamp(r.x - wr / 2, Math.max(120, full.x - 30), Math.min(1800, full.x + full.w + 30) - wr) + 'px'; wkr.style.top = (full.kind === 'bars' ? full.y - 64 : r.y - 52) + 'px'; set(wkr, { o: 1 }); }
        } else set(wkr, { o: 0 });
      },
      article: () => `${svgWeeks(w, d.event.at)}<p class="a-note"><b>${esc(d.event.text)}</b></p>
        <div class="a-kpis">${avg.map((a, i) => `<div><em>${esc(a.label)}</em><span><b class="${i ? 'ac' : ''}">${a.v.toFixed(1)}</b> ${esc(d.unit)}</span></div>`).join('')}<div><em>差</em><span><b class="ac">${sgn(diff)}</b> ${esc(d.unit)}</span></div></div>
        <p class="a-note">${esc(d.dip.text)}</p>`,
    });
    return pg;
  };

  TYPES.bridge = (d) => {
    const steps = d.steps, n = steps.length, big = steps.reduce((m, s, i) => (s.v > steps[m].v ? i : m), 0), neg = steps.findIndex((s) => s.v < 0);
    const cum = [d.start.v]; steps.forEach((s) => cum.push(cum[cum.length - 1] + s.v));
    const lo = Math.floor(Math.min(...cum) - 1.5), hi = Math.ceil(Math.max(...cum) + 1.5);
    const sec = frame(d, 'bridge', `
  <div class="bl">${[{ label: d.start.label, v: d.start.v.toFixed(1), src: d.start.src, k: 's' }, ...steps.map((s, i) => ({ label: s.label, v: sgn(s.v), src: s.src, k: i })), { label: d.end.label, v: d.end.v.toFixed(1), src: d.end.src, k: 'e' }]
    .map((c) => `<div class="bc bc-${c.k}"><em>${esc(c.label)}</em><b class="${c.k === 'e' || c.k === big ? 'acx' : ''}"${srcA(c.src)}>${esc(c.v)}</b></div>`).join('')}</div>
  <div class="bnotes" data-b="3">${steps.map((s, i) => `<p class="bn bn-${i}">${esc(s.note)}</p>`).join('')}</div>
  <div class="bbig" data-b="1"><b>${esc(steps[big].label)} ${sgn(steps[big].v)}</b><span>${esc(steps[big].note)}</span></div>
  <div class="bneg" data-b="2"><b>${esc(steps[neg]?.label || '')} ${neg >= 0 ? sgn(steps[neg].v) : ''}</b><span>${esc(steps[neg]?.note || '')}</span></div>
  <div class="brun" aria-hidden="true"><em>累计</em><b></b></div>`);
    const pg = base(sec, d, 3), S = pg.S, bl = $(sec, '.bl'), run = $(sec, '.brun');
    const G = () => ({
      precise: { dir: 'v', x: 160, w: 1600, y: 300, h: 520, bw: 128 },
      theater: { dir: 'v', x: 200, w: 1520, y: 330, h: 470, bw: 190 },
      editorial: { dir: 'h', x: 460, w: 780, y: 420, rh: 84, bh: 30 },
      gallery: { dir: 'v', x: 240, w: 1440, y: 360, h: 440, bw: 30 },
    })[sk()];
    const cols = n + 2;
    function geo() {
      const g = G();
      if (g.dir === 'v') { const cw = g.w / cols, y = (v) => g.y + g.h - ((v - lo) / (hi - lo)) * g.h; return { g, cx: (k) => g.x + cw * (k + 0.5), cw, y }; }
      const x = (v) => g.x + ((v - lo) / (hi - lo)) * g.w; return { g, ry: (k) => g.y + g.rh * k, x };
    }
    function place() {   // 每一列的名字和数摆到对应的块下面（竖向）或左边（横向）
      const q = geo(), cells = $$(bl, '.bc');
      cells.forEach((c, k) => {
        if (q.g.dir === 'v') { c.style.left = q.cx(k) - q.cw / 2 + 'px'; c.style.width = q.cw + 'px'; c.style.top = q.g.y + q.g.h + 26 + 'px'; }
        else { c.style.left = '120px'; c.style.width = '320px'; c.style.top = q.ry(k) + 'px'; }
      });
      $$(sec, '.bn').forEach((p, i) => {
        if (q.g.dir === 'v') { p.style.left = q.cx(i + 1) - q.cw / 2 + 'px'; p.style.width = q.cw - 16 + 'px'; p.style.top = q.g.y + q.g.h + 130 + 'px'; }
        else { p.style.left = '1360px'; p.style.width = '440px'; p.style.top = q.ry(i + 1) + 2 + 'px'; }
      });
    }
    Object.assign(pg, {
      type: 'bridge',
      reset() { resetGroups(pg); hide(bl); set(run, { o: 0 }); place(); },
      reskin() { place(); },
      async enter() { enterHead(pg); place(); appear(bl, D.d(300)); await tween(D.d(1300), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(100) }); },
      beat(n2) { return beatIn(pg, n2, 600); },
      calm() { calmGroups(pg); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        const q = geo(), g = q.g, a = S.a, b1 = S.b[1], b2 = S.b[2];
        const rowY = (k) => (q.ry ? q.ry(k) + 6 : 0);
        const stepColor = (i) => (i === big && b1 > 0 ? acc() : sk() === 'theater' ? tone(0.55) : sk() === 'gallery' ? tone(0.7) : ink(0.88));
        const reveal = (k) => clamp(a * (n + 2) - k);   // 一块一块升起
        if (g.dir === 'v') {
          const lev = (k, v, ac) => { const f = reveal(k); if (!f) return; const x = q.cx(k), y = q.y(v), half = Math.max(g.bw, 60) / 2 + 24; ctx.fillStyle = ac ? acc() : ink(); ctx.fillRect(x - half, y - 1.5, half * 2 * f, sk() === 'gallery' ? 1.5 : 3); };   // 期初、期末只是一条水平线（一个刻度），底下不涂
          lev(0, d.start.v, false);
          steps.forEach((s, i) => {
            const f = reveal(i + 1); if (!f) return;
            const x = q.cx(i + 1), y0 = q.y(cum[i]), y1 = q.y(cum[i + 1]), top = Math.min(y0, y1), hh = Math.abs(y1 - y0) * f;
            const yy = s.v >= 0 ? y0 - hh : y0;
            if (s.v < 0) hatch(ctx, x - g.bw / 2, yy, g.bw, Math.max(hh, 2), b2 > 0 && sk() !== 'gallery' ? ink() : ink(0.7), sk() === 'gallery' ? 6 : 9);
            else { ctx.fillStyle = stepColor(i); ctx.fillRect(x - g.bw / 2, yy, g.bw, hh); }
            ctx.fillStyle = tone(0.45); const xp = q.cx(i) + (i === 0 ? Math.max(g.bw, 60) / 2 + 24 : g.bw / 2);
            for (let xx = xp; xx < x - g.bw / 2; xx += 6) ctx.fillRect(xx, y0 - 0.5, 3, 1);
          });
          lev(n + 1, d.end.v, true);
          txt(ctx, `纵轴从 ${lo} 分起；期初、期末画成一条线，不画从 0 起的柱子`, g.x + g.w, g.y + g.h - 12, cf(14, 400, 'sans'), ink(0.5), 'right');
          if (sk() === 'precise') { ctx.fillStyle = ink(); ctx.fillRect(g.x, g.y + g.h, g.w, 1.5); }
        } else {   // 社论：横向
          const bar = (k, x0, x1, kind) => { const f = reveal(k); if (!f) return; const y = rowY(k), xa = Math.min(x0, x1), wv = Math.abs(x1 - x0) * f; if (kind === 'neg') hatch(ctx, Math.max(x0, x1) - wv, y, wv, g.bh, ink(b2 > 0 ? 1 : 0.7), 8); else { ctx.fillStyle = kind; ctx.fillRect(kind === 'lev' ? xa : xa, y, wv, g.bh); } };
          ctx.fillStyle = D.rgba('line'); for (let v = lo; v <= hi; v += 2) { const x = q.x(v); ctx.fillRect(x, g.y - 10, 1, g.rh * (n + 2)); txt(ctx, String(v), x, g.y - 20, cf(15), ink(0.5), 'center'); }
          const markLev = (k, v, c) => { const f = reveal(k); if (!f) return; const x = q.x(v), y = rowY(k); ctx.fillStyle = c; ctx.fillRect(x - 2, y - 8, 4, g.bh + 16); txt(ctx, v.toFixed(1), x + 14, y + g.bh - 6, cf(22, 600), c); };
          markLev(0, d.start.v, ink());
          steps.forEach((s, i) => { bar(i + 1, q.x(cum[i]), q.x(cum[i + 1]), s.v < 0 ? 'neg' : stepColor(i)); ctx.fillStyle = tone(0.4); ctx.fillRect(q.x(cum[i + 1]) - 0.5, rowY(i + 1) + g.bh, 1, g.rh - g.bh); });
          markLev(n + 1, d.end.v, acc());
        }
        if (a >= 1 && D.alive) {
          const p = phase(S, t, 16, 2.5) * (n + 0.999), k = Math.floor(p), f = p - k;
          const v = k >= n ? d.end.v : cum[k] + steps[k].v * clamp(f * 1.6);
          set(run, { o: 0 });
          const lab = (x, y, left) => k < n && txt(ctx, `走到这里 ${v.toFixed(1)}`, left ? x - 14 : x + 14, y - (left ? 16 : Math.max(16, g.bh / 2 + 12)), cf(16, 400, 'sans'), ink(0.62), left ? 'right' : 'left');
          if (g.dir === 'v') { const x = lerp(q.cx(k), q.cx(Math.min(k + 1, n + 1)), f), y = q.y(v); ctx.strokeStyle = sk() === 'gallery' ? acc() : ink(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); lab(x, y, true); }
          else { const x = q.x(v), y = rowY(Math.min(k + 1, n + 1)) + g.bh / 2; ctx.strokeStyle = ink(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.stroke(); lab(x, y); }
        } else set(run, { o: 0 });
      },
      article: () => {
        const W = 340, x = (v) => 70 + ((v - lo) / (hi - lo)) * (W - 120);
        const rows = [{ l: d.start.label, a: d.start.v, b: d.start.v, lev: 1 }, ...steps.map((s, i) => ({ l: s.label, a: cum[i], b: cum[i + 1], v: s.v })), { l: d.end.label, a: d.end.v, b: d.end.v, lev: 2 }];
        return `<svg class="a-svg" viewBox="0 0 ${W} ${rows.length * 34 + 10}" role="img" aria-label="拆解桥">${rows.map((r, k) => { const y = 8 + k * 34, x0 = Math.min(x(r.a), x(r.b)), w = Math.max(3, Math.abs(x(r.b) - x(r.a)));
          return `<text x="0" y="${y + 15}" class="t">${esc(r.l)}</text>${r.lev ? `<rect x="${x(r.a) - 2}" y="${y}" width="4" height="20" class="${r.lev === 2 ? 'ac' : 'ink'}"/>` : `<rect x="${x0}" y="${y + 2}" width="${w}" height="16" class="${r.v < 0 ? 'neg' : k - 1 === big ? 'ac' : 'ink'}"/>`}<text x="${W}" y="${y + 15}" class="t" text-anchor="end">${r.lev ? r.a.toFixed(1) : sgn(r.v)}</text>`; }).join('')}</svg>
          ${steps.map((s) => `<p class="a-note"><b>${esc(s.label)} ${sgn(s.v)}</b>　${esc(s.note)}</p>`).join('')}`;
      },
    });
    return pg;
  };

  TYPES.compare = (d) => {
    const n = d.n, A = d.a, B = d.b, totA = (A.perSec * n) / 60, totB = (B.perSec * n) / 60;
    const hm = (v) => { const m = /^(\d+):(\d\d)$/.exec(v); return m ? `${m[1]}<u>小时</u>${m[2]}<u>分</u>` : esc(v); };
    const mmss = (s) => `${Math.floor(s / 60)} 分 ${String(Math.round(s % 60)).padStart(2, '0')} 秒`;
    const sec = frame(d, 'compare', `
  <div class="cp cp-a"><em>${esc(A.label)}</em><b${srcA(A.src)}>${hm(A.total)}</b><span class="cper" data-b="1">每篇 ${mmss(A.perSec)}</span><span class="cret" data-b="2">${esc(A.ret)}</span></div>
  <div class="cp cp-b"><em>${esc(B.label)}</em><b class="ac"${srcA(B.src)}>${hm(B.total)}</b><span class="cper" data-b="1">每篇 ${mmss(B.perSec)}</span><span class="cret" data-b="2">${esc(B.ret)}</span></div>
  <div class="csplit" data-b="3">${d.split.map((s) => `<div><em>${esc(s.who)}</em><p>${esc(s.text)}</p></div>`).join('')}</div>
  <div class="cclock" aria-hidden="true"></div>`);
    const pg = base(sec, d, 3), S = pg.S, pa = $(sec, '.cp-a'), pb = $(sec, '.cp-b'), clock = $(sec, '.cclock');
    pa.dataset.keep = ''; pb.dataset.keep = '';
    const G = () => ({
      precise: { mode: 'rows', x: 120, w: 1680, ya: 430, yb: 610, h: 36 },
      theater: { mode: 'split', xa: 200, xb: 1080, w: 640, y: 640, h: 18 },
      editorial: { mode: 'tally', x: 120, w: 1180, ya: 466, yb: 726, h: 44 },
      gallery: { mode: 'rows', x: 300, w: 1320, ya: 640, yb: 680, h: 14 },
    })[sk()];
    const scale = Math.max(totA, totB);
    Object.assign(pg, {
      type: 'compare',
      reset() { resetGroups(pg); hide(pa); hide(pb); set(clock, { o: 0 }); },
      async enter() { enterHead(pg); appear(pa, D.d(150)); appear(pb, D.d(350)); await tween(D.d(1400), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(100) }); },
      beat(k) { return beatIn(pg, k, 500); },
      calm() { calmGroups(pg); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        const g = G(), a = S.a;
        let cur = null;   // 停留游标：分钟
        if (a >= 1 && D.alive) cur = phase(S, t, 30, 2.5) * scale;
        const row = (x, y, w, h, tot, per, ac) => {   // 一条：n 格，按入场进度从左往右长
          const len = (tot / scale) * w * a, cell = (per / 60 / scale) * w;
          ctx.fillStyle = ac ? acc() : sk() === 'theater' ? tone(0.45) : sk() === 'precise' ? ink(0.6) : ink(0.88); ctx.fillRect(x, y, len, h);
          ctx.fillStyle = D.rgba('bg'); if (h > 6) for (let k = 1; k < n; k++) { const xx = x + cell * k; if (xx > x + len) break; ctx.fillRect(xx - 0.5, y, 1, h); }
          if (cur != null) { const done = Math.min(n, Math.floor(cur / (per / 60))); return done; }
          return null;
        };
        let doneA = null, doneB = null;
        if (g.mode === 'rows') {
          doneA = row(g.x, g.ya, g.w, g.h, totA, A.perSec, false); doneB = row(g.x, g.yb, g.w, g.h, totB, B.perSec, true);
          ctx.fillStyle = ink(); ctx.fillRect(g.x, g.yb + g.h + 40, g.w, 1.5);
          for (let m = 0; m <= scale; m += 30) { const x = g.x + (m / scale) * g.w; ctx.fillRect(x, g.yb + g.h + 40, 1, m % 60 === 0 ? 9 : 5); if (m % 60 === 0) txt(ctx, `${m / 60} 小时`, x, g.yb + g.h + 72, cf(15, 400, 'sans'), ink(0.55), m === 0 ? 'left' : 'center'); }
          if (cur != null) { const x = g.x + (cur / scale) * g.w; ctx.fillStyle = ink(); ctx.fillRect(x - 0.75, g.ya - 8, 1.5, g.h + 16); ctx.fillRect(x - 0.75, g.yb - 8, 1.5, g.h + 48); clock.style.left = clamp(x - 230, g.x, g.x + g.w - 460) + 'px'; clock.style.top = g.yb + g.h + 92 + 'px'; }
        } else if (g.mode === 'split') {
          doneA = row(g.xa, g.y, g.w, g.h, totA, A.perSec, false); doneB = row(g.xb, g.y, g.w, g.h, totB, B.perSec, true);
          if (cur != null) { for (const [x0] of [[g.xa], [g.xb]]) { const x = x0 + (cur / scale) * g.w; ctx.fillStyle = sk() === 'gallery' ? acc() : ink(); ctx.fillRect(x - 0.75, g.y - 16, 1.5, g.h + 32); } clock.style.left = g.xa + 'px'; clock.style.top = g.y + 52 + 'px'; }
          if (sk() === 'theater') { ctx.fillStyle = tone(0.18); ctx.fillRect(959, 260, 2, 560); }
        } else {   // 社论：一篇一道刻痕，间距＝每篇用时（同一把时间尺）；停留时按时间一道道描深
          const dy = 0;
          const tally = (y, per, ac) => { const step = (per / 60 / scale) * g.w; let done = n; if (cur != null) done = Math.min(n, Math.floor(cur / (per / 60))); for (let k = 0; k < n; k++) { const x = g.x + k * step; if (x > g.x + g.w * a + 0.5) break; ctx.fillStyle = cur == null || k < done ? (ac ? acc() : ink(0.85)) : ink(0.22); ctx.fillRect(x, y + dy, 3, g.h); } return cur == null ? null : done; };
          doneA = tally(g.ya, A.perSec, false); doneB = tally(g.yb, B.perSec, true);
          const ax = g.yb + g.h + 26 + dy; ctx.fillStyle = ink(); ctx.fillRect(g.x, ax, g.w, 1);
          for (let m = 0; m <= scale; m += 30) { const x = g.x + (m / scale) * g.w; ctx.fillRect(x, ax, 1, m % 60 === 0 ? 9 : 5); if (m % 60 === 0) txt(ctx, `${m / 60} 小时`, x, ax + 30, cf(15, 400, 'serif'), ink(0.6), m === 0 ? 'left' : 'center'); }
          if (cur != null) { const x = g.x + (cur / scale) * g.w; ctx.fillStyle = ink(); ctx.fillRect(x - 0.75, g.ya + dy - 10, 1.5, g.yb - g.ya + g.h + 20); clock.style.left = '120px'; clock.style.top = ax + 54 + 'px'; }
        }
        if (cur != null) {
          const m = Math.floor(cur), s = Math.round((cur - m) * 60) % 60;
          clock.innerHTML = `第 <b>${m}</b> 分钟：${esc(B.label)}已改 <b class="ac">${doneB}</b> 篇${doneB >= n ? '（改完了）' : ''}，${esc(A.label)}改了 <b>${doneA}</b> 篇`;
          set(clock, { o: 1 });
        } else set(clock, { o: 0 });
      },
      article: () => `<div class="a-cmp"><div><em>${esc(A.label)}</em><b${srcA(A.src)}>${hm(A.total)}</b><span>每篇 ${mmss(A.perSec)} · ${esc(A.ret)}</span><i style="width:100%"></i></div>
        <div><em>${esc(B.label)}</em><b class="ac"${srcA(B.src)}>${hm(B.total)}</b><span>每篇 ${mmss(B.perSec)} · ${esc(B.ret)}</span><i class="ac" style="width:${((totB / totA) * 100).toFixed(1)}%"></i></div></div>
        ${d.split.map((s) => `<p class="a-note"><b>${esc(s.who)}</b>　${esc(s.text)}</p>`).join('')}`,
    });
    return pg;
  };

  window.__TYPES = { TYPES, frame, base, resetGroups, enterHead, beatIn, calmGroups, appear, hide, showNow, spot, phase, esc, fmt, sgn, srcA, txt, cf, hatch, ink, tone, acc, MO, tpl, CALC, hours, calcVals, paintCalc, $, $$ };
})();
