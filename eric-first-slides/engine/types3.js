(() => {
  const D = Deck, { E, tween, wait, set, to, count, clamp, lerp } = D;
  const X = window.__TYPES, { TYPES, frame, base, beatIn, calmGroups, appear, hide, showNow, phase, esc, fmt, sgn, srcA, txt, cf, hatch, ink, tone, acc, MO, $, $$ } = X;
  const C = window.DECK_CONTENT;
  const sk = () => D.skin;
  const px = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (h != null) el.style.height = h + 'px'; };
  function off(el, root) { const w = el.offsetWidth, h = el.offsetHeight; let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y, w, h }; }
  function circ(ctx, x, y, r, fill, stroke, lw = 1.5) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
  function line(ctx, pts, color, lw = 1.5, dash) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); }
  const minutes = (s) => { const h = /(\d+)\s*小时/.exec(s), m = /(\d+)\s*分/.exec(s); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
  const dg = (v) => (String(v).includes('.') ? 1 : 0);
  const YK = ['y', 'y0', 'ya', 'yb', 'gy', 'ly', 'my', 'base', 'by', 'hy', 'cy', 'ny'];
  function adj(sec, g) {
    if (sk() !== 'editorial') return g;
    if (sec._adjK !== g) {
      const hd = sec.querySelector('.head'), hb = hd.offsetTop + hd.offsetHeight, dy = Math.max(-170, Math.min(0, hb + 64 - 440));
      const o = {}; for (const k in g) { const v = g[k]; o[k] = typeof v === 'number' && YK.includes(k) && v >= 380 ? v + dy : Array.isArray(v) && typeof v[0] === 'number' && v[1] >= 380 ? [v[0], v[1] + dy, ...v.slice(2)] : v; }
      sec._adjK = g; sec._adjV = o;
    }
    return sec._adjV;
  }
  function mk(d, type, beats, inner) {
    const sec = frame(d, type, inner); sec.classList.add('x3');
    const pg = base(sec, d, beats); pg.type = type; pg.e0 = $$(sec, '.e0');
    return [sec, pg, pg.S];
  }
  function std(pg, o) {
    return Object.assign(pg, {
      beat: (n) => beatIn(pg, n, 600), calm() { calmGroups(pg); }, resize() { pg.cv.fit(); },
    }, o);
  }
  const reset0 = (pg) => { pg.el._adjK = null; for (const g of pg.groups.slice(1)) g.forEach(hide); pg.e0.forEach(hide); pg.S.a = 0; pg.S.b = [0, 0, 0, 0, 0, 0]; pg.S.t0 = null; };
  async function enter0(pg, dur = 1100, delay = 120) {
    X.enterHead(pg);
    const st = MO[sk()].stag;
    pg.e0.forEach((e, k) => appear(e, D.d(delay + k * st * 0.6)));
    await tween(D.d(dur), (v) => { pg.S.a = v; }, { ease: E.enter, delay: D.d(delay) });
  }
  const aBars = (rows, max) => `<div class="a-bars">${rows.map((r) => `<div class="${r.cls || ''}"><span>${esc(r.label)}</span><i style="width:${Math.max(1, (Math.abs(r.v) / max) * 100).toFixed(1)}%"></i><b>${esc(r.text)}</b></div>`).join('')}</div>`;

  TYPES.target = (d) => {
    const G = d.goals, n = G.length;
    const dev = G.map((g) => (g.target ? (g.actual - g.target) / g.target : null));   // 相对目标偏差
    const ach = dev.map((v) => 1 + (v ?? 0));
    const met = G.map((g) => (g.lower ? g.actual <= g.target : g.actual >= g.target)), miss = met.indexOf(false), nMet = met.filter(Boolean).length;
    const marg = (g) => {
      const dd = Math.max(dg(g.actual), dg(g.target)), df = g.actual - g.target, u = g.unit === '%' ? ' 个百分点' : ` ${g.unit}`;
      const abs = `${df < 0 ? '少' : '多'} ${fmt(Math.abs(df), dd)}${u}`;
      if (!g.target) return abs;   // 目标为 0：只写差额
      const pc = (df / g.target) * 100, pd = Math.abs(pc) < 10 ? 1 : 0;
      return `${sgn(pc, pd)}%（${abs}）`;
    };
    const [sec, pg, S] = mk(d, 'target', 2, `
  <div class="tg-sum e0 blk"><div><b class="nm ac">${nMet}</b><span class="nm">／${n}</span></div><em class="lb">个目标做到了</em></div>
  ${G.map((g, i) => `<div class="tg-r e0${met[i] ? '' : ' miss'}"><em class="tg-lab">${esc(g.label)}</em><span class="tg-v"><b class="nm"${srcA(g.src)}>${fmt(g.actual, dg(g.actual))}</b><u>${esc(g.unit)}</u></span><i class="tg-sp"></i><div class="tg-c"><span class="tg-t lb">目标 ${fmt(g.target, dg(g.target))}${g.lower ? ' 以内 · 越少越好' : ''}</span><span class="tg-m" data-b="1">${met[i] ? '' : '没做到 '}${marg(g)}</span></div></div>`).join('')}
  <div class="tg-miss blk" data-b="2"><b>没做到：${esc(G[miss]?.label || '')}</b><p class="nt">${esc(d.miss)}</p></div>`);
    const GEO = {
      precise: { y0: 300, rh: 100, xl: 120, xv: 430, t0: 690, t1: 1360, xt: 1420, sum: [120, 836, 480], miss: [700, 836, 1100] },
      theater: { y0: 300, rh: 104, xl: 700, xv: 980, t0: 1150, t1: 1540, xt: 1590, sum: [160, 360, 480], miss: [700, 846, 1060] },
      editorial: { y0: 480, rh: 86, xl: 120, xv: 400, t0: 580, t1: 1030, xt: 1070, sum: [1360, 120, 440], miss: [1360, 420, 440] },
      gallery: { y0: 400, rh: 90, xl: 220, xv: 470, t0: 640, t1: 1090, xt: 1130, sum: [1400, 400, 360], miss: [1400, 590, 360] },
    };
    const rows = $$(sec, '.tg-r'), sum = $(sec, '.tg-sum'), mi = $(sec, '.tg-miss');
    function place() {
      const g = adj(sec, GEO[sk()]);
      rows.forEach((r, i) => {
        px(r, g.xl, g.y0 + i * g.rh, 1800 - g.xl, g.rh);
        const [lab, v, sp, c] = r.children; lab.style.width = g.xv - g.xl + 'px'; v.style.width = g.t0 - g.xv + 'px'; sp.style.width = g.xt - g.t0 + 'px'; c.style.width = (sk() === 'theater' ? 1800 : sk() === 'editorial' ? 1290 : 1800) - g.xt + 'px';
      });
      px(sum, g.sum[0], g.sum[1], g.sum[2]); px(mi, g.miss[0], g.miss[1], g.miss[2]);
    }
    const Xa = (g, a) => g.t0 + clamp((a - 0.85) / 0.35) * (g.t1 - g.t0);
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1300); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(), x100 = Xa(g, 1), yT = g.y0 + 4, yB = g.y0 + n * g.rh - 4;
        if (!S.a) return;
        for (const a of [0.9, 1.1, 1.2]) { ctx.fillStyle = tone(s === 'theater' ? 0.16 : 0.13); ctx.fillRect(Math.round(Xa(g, a)), yT, 1, yB - yT); txt(ctx, (a > 1 ? '+' : '−') + Math.round(Math.abs(a - 1) * 100) + '%', Xa(g, a), yT - 12, cf(14), ink(0.45), 'center'); }
        ctx.fillStyle = s === 'editorial' ? acc() : ink(0.9); ctx.fillRect(Math.round(x100) - (s === 'gallery' ? 0.5 : 1), yT - 6, s === 'gallery' ? 1 : 2, yB - yT + 6); txt(ctx, '目标', x100, yT - 12, cf(15, 500, 'sans'), ink(0.85), 'center'); txt(ctx, '相对目标偏差', g.t0, yT - 42, cf(15, 500, 'sans'), ink(0.62));
        const th = { precise: 14, theater: 5, editorial: 3, gallery: 1.5 }[s];
        G.forEach((gg, i) => {
          const f = clamp(S.a * (n + 1) - i); if (!f) return;
          const y = g.y0 + i * g.rh + g.rh / 2, xe = Xa(g, lerp(1, ach[i], E.enter(f)));
          if (met[i]) { ctx.fillStyle = s === 'theater' ? ink(0.85) : ink(); ctx.fillRect(Math.min(x100, xe), y - th / 2, Math.abs(xe - x100), th); }
          else if (s === 'precise') hatch(ctx, xe, y - th / 2, x100 - xe, th, ink(0.85), 6);
          else line(ctx, [[xe, y], [x100, y]], ink(0.8), Math.max(1.5, th), [5, 4]);
          if (s === 'precise') { ctx.fillStyle = met[i] ? ink() : D.rgba('bg'); ctx.fillRect(xe - 7, y - 11, 14, 22); if (!met[i]) { ctx.strokeStyle = ink(); ctx.lineWidth = 2; ctx.strokeRect(xe - 6, y - 10, 12, 20); } }
          else if (s === 'theater') circ(ctx, xe, y, 12, met[i] ? ink() : D.rgba('bg'), met[i] ? null : ink(), 2.5);
          else if (s === 'editorial') circ(ctx, xe, y, 8, met[i] ? acc() : D.rgba('bg'), met[i] ? null : ink(), 2);
          else circ(ctx, xe, y, 5, met[i] ? ink() : D.rgba('bg'), met[i] ? null : ink(), 1.2);
          if (i === miss && S.b[2] > 0) circ(ctx, xe, y, 26 * E.enter(S.b[2]), null, acc(), 2);
        });
        if (S.a >= 1 && D.alive) {
          const p = phase(S, t, n * 2, 1.5) * n, k = Math.min(n - 1, Math.floor(p)), u = E.inOut(clamp((p - k) * 1.5));
          const y = g.y0 + k * g.rh + g.rh / 2, x = lerp(x100, Xa(g, ach[k]), u);
          ctx.fillStyle = acc(); ctx.fillRect(x - 1, y - th / 2 - 12, 2, th + 24);
        }
      },
      article: () => `<div class="a-rows">${G.map((g, i) => `<div class="${met[i] ? '' : 'miss'}"><span>${esc(g.label)}</span><b${srcA(g.src)}>${fmt(g.actual, dg(g.actual))} ${esc(g.unit)}</b><em>目标 ${fmt(g.target, dg(g.target))}${g.lower ? ' 以内' : ''} · ${met[i] ? '' : '没做到 '}${marg(g)}</em></div>`).join('')}</div>
        <p class="a-note"><b>没做到：${esc(G[miss]?.label || '')}</b>　${esc(d.miss)}</p>`,
    });
  };

  TYPES.kpis = (d) => {
    const T6 = d.tiles, bad = T6.findIndex((t) => t.bad), DIM = () => (sk() === 'gallery' ? 0.66 : 0.62);
    const [sec, pg, S] = mk(d, 'kpis', 1, `
  <i class="kp-mat e0" aria-hidden="true"></i>
  <div class="kp-g">${T6.map((t) => `<div class="kp e0${t.bad ? ' bad' : ''}"><em class="lb">${esc(t.label)}</em><div class="kv"><b class="nm"${srcA(t.src)}>${esc(t.v)}</b><u>${esc(t.unit)}</u></div><span class="kd">${esc(t.d)}${t.good === 'down' ? '<i>越少越好</i>' : ''}</span></div>`).join('')}</div>
  <p class="kp-nt nt blk" data-b="1">${esc(d.note)}</p>
  <div class="kp-wk rd" aria-hidden="true"></div>`);
    const GEO = {
      precise: { x: 120, y: 262, bot: 880, w: 1680, gx: 24, gy: 24, sy: 172, sh: 84, pad: 28, nt: [120, 908, 1300], rd: [1440, 908, 360] },
      theater: { x: 160, y: 262, bot: 870, w: 1600, gx: 24, gy: 24, sy: 176, sh: 76, pad: 28, nt: [160, 900, 1200], rd: [1460, 900, 300] },
      editorial: { x: 120, y: 452, bot: 930, w: 1180, gx: 20, gy: 20, sy: 168, sh: 70, pad: 24, nt: [1360, 452, 440], rd: [1360, 620, 440] },
      gallery: { x: 220, y: 340, bot: 900, w: 1100, gx: 24, gy: 24, sy: 168, sh: 64, pad: 28, nt: [1400, 340, 300], rd: [1400, 500, 300], mat: [160, 300, 1600, 640] },
    };
    const tiles = $$(sec, '.kp'), nt = $(sec, '.kp-nt'), wk = $(sec, '.kp-wk'), mat = $(sec, '.kp-mat');
    const tw = (g) => (g.w - 2 * g.gx) / 3, thh = (g) => (g.bot - g.y - g.gy) / 2;
    function place() {
      const g = adj(sec, GEO[sk()]);
      tiles.forEach((e, i) => px(e, g.x + (i % 3) * (tw(g) + g.gx), g.y + Math.floor(i / 3) * (thh(g) + g.gy), tw(g), thh(g)));
      px(nt, g.nt[0], g.nt[1], g.nt[2]); px(wk, g.rd[0], g.rd[1], g.rd[2]);
      if (g.mat) px(mat, ...g.mat);
    }
    const spark = (ctx, g, i, upto, hi) => {
      const e = tiles[i], tx = parseFloat(e.style.left), ty = parseFloat(e.style.top), w = tw(g) - 2 * g.pad, x0 = tx + g.pad;
      const v = T6[i].spark, lo = Math.min(...v), hi2 = Math.max(...v), m = v.length;
      const X1 = (k) => x0 + (w * k) / (m - 1), Y1 = (val) => ty + g.sy + g.sh - ((val - lo) / (hi2 - lo || 1)) * g.sh;
      const s = sk(), isBad = i === bad, lit = isBad && S.b[1] > 0;
      ctx.globalAlpha = i !== bad ? lerp(1, DIM(), S.dim || 0) : 1;
      const col = lit ? acc() : s === 'theater' ? ink(0.8) : ink(0.9);
      const pts = []; for (let k = 0; k < m && k < upto; k++) pts.push([X1(k), Y1(v[k])]);
      if (pts.length > 1) line(ctx, pts, col, { precise: 1.5, theater: 2.5, editorial: 1.5, gallery: 1 }[s], isBad && s !== 'theater' ? [5, 3] : null);
      if (upto >= m) circ(ctx, X1(m - 1), Y1(v[m - 1]), s === 'gallery' ? 3 : 4, isBad ? D.rgba('bg') : col, isBad ? col : null, 1.5);
      ctx.fillStyle = tone(s === 'theater' ? 0.25 : 0.2); ctx.fillRect(x0, ty + g.sy + g.sh + 8, w, 1);
      if (hi != null) { const k = Math.min(m - 1, Math.floor(hi)); circ(ctx, X1(k), Y1(v[k]), 6, null, s === 'gallery' ? acc() : ink(), 1.5); }
      ctx.globalAlpha = 1;
    };
    return std(pg, {
      reset() { reset0(pg); S.dim = 0; tiles.forEach((e) => { set(e, { o: 0 }); e.classList.remove('on'); }); set(wk, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1400); },
      async beat(n) { tiles.forEach((e, i) => { if (i !== bad) to(e, { o: DIM() }, D.d(420)); else e.classList.add('on'); }); tween(D.d(420), (v) => { S.dim = v; }); return beatIn(pg, n, 500); },
      calm() { calmGroups(pg); S.dim = D.b >= 1 ? 1 : 0; tiles.forEach((e, i) => { set(e, { o: i !== bad && D.b >= 1 ? DIM() : 1 }); e.classList.toggle('on', i === bad && D.b >= 1); }); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]); let hi = null;
        if (S.a >= 1 && D.alive) { hi = phase(S, t, 24, 2) * 18 - 0.0001; wk.innerHTML = `六条线都走到 <b>第 ${Math.floor(hi) + 1} 周</b>（共 18 周）`; set(wk, { o: 1 }); } else set(wk, { o: 0 });
        T6.forEach((_, i) => spark(ctx, g, i, S.a * 18 * 1.05, hi));
      },
      article: () => `<div class="a-kpis">${T6.map((t) => `<div class="${t.bad ? 'miss' : ''}"><em>${esc(t.label)}</em><span><b${srcA(t.src)}>${esc(t.v)}</b> ${esc(t.unit)}　${esc(t.d)}</span></div>`).join('')}</div><p class="a-note">${esc(d.note)}</p>`,
    });
  };

  TYPES.argue = (d) => {
    const EV = d.evidence, n = EV.length;
    const [sec, pg, S] = mk(d, 'argue', n + 1, `
  <i class="ar-mat e0"></i>
  <div class="ar-c e0 blk"><em class="lb">结论</em><p class="ar-ct">${esc(d.claim)}</p></div>
  ${EV.map((e, i) => `<div class="ar-e blk e0"><span class="ar-n nm">${esc(e.n)}</span><p class="ar-t"${srcA(e.src)}>${esc(e.text)}</p></div>`).join('')}
  <div class="ar-k blk" data-b="${n + 1}"><div class="ar-kq"><em class="lb">反方会问</em><p class="ar-q">${esc(d.counter.q)}</p></div><div class="ar-ka"><em class="lb">回应</em><p class="ar-a"${srcA(d.counter.src)}>${esc(d.counter.a)}</p></div></div>`);
    const GEO = {
      precise: { c: [120, 252, 1680], e: [[120, 420, 544, 300], [688, 420, 544, 300], [1256, 420, 544, 300]], k: [120, 760, 1680, 180] },
      theater: { c: [160, 268, 940], e: [[1180, 252, 580, 212], [1180, 488, 580, 212], [1180, 724, 580, 212]], k: [160, 724, 940, 212] },
      editorial: { c: [120, 440, 1180], e: [[120, 600, 376, 340], [522, 600, 376, 340], [924, 600, 376, 340]], k: [1360, 440, 440] },
      gallery: { c: [220, 290, 1060], e: [[220, 600, 460, 300], [730, 600, 460, 300], [1240, 600, 460, 300]], k: [1400, 290, 300], m: [160, 560, 1600, 380] },
    };
    const cEl = $(sec, '.ar-c'), eEls = $$(sec, '.ar-e'), kEl = $(sec, '.ar-k'), mat = $(sec, '.ar-mat');
    function place() { const g = adj(sec, GEO[sk()]); px(cEl, ...g.c); eEls.forEach((e, i) => px(e, ...g.e[i])); px(kEl, ...g.k); if (g.m) px(mat, ...g.m); }
    function paths() { return eEls.map((e) => { const o = off(e, sec); return [[o.x, o.y + o.h], [o.x, o.y]]; }); }
    const plen = (p) => p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
    function at(p, u) { let L = plen(p) * u; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (L <= l) return [lerp(p[i - 1][0], p[i][0], L / l), lerp(p[i - 1][1], p[i][1], L / l)]; L -= l; } return p[p.length - 1]; }
    function sub(p, u) { let L = plen(p) * u; const q = [p[0]]; for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (L >= l) { q.push(p[i]); L -= l; } else { q.push([lerp(p[i - 1][0], p[i][0], L / l), lerp(p[i - 1][1], p[i][1], L / l)]); break; } } return q; }
    return std(pg, {
      reset() { reset0(pg); place(); eEls.forEach((e) => e.classList.remove('on')); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 900); },
      beat(k) { if (k <= n) eEls[k - 1].classList.add('on'); return beatIn(pg, k, 600); },
      calm() { calmGroups(pg); eEls.forEach((e, i) => e.classList.toggle('on', i < D.b)); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        if (!S.a) return;
        const s = sk(), P = paths(), lw = { precise: 6, theater: 4, editorial: 5, gallery: 3 }[s];
        ctx.globalAlpha = S.a;
        P.forEach((p, i) => { const on = S.b[i + 1] || 0; if (on) line(ctx, sub(p, on).map(([x, y]) => [x + lw / 2, y]), acc(), lw); });
        ctx.globalAlpha = 1;
        const said = P.filter((_, i) => S.b[i + 1] >= 1);
        if (said.length && D.alive) {
          const per = 2.4, p = phase(S, t, per * said.length, 0.6) * said.length, k = Math.min(said.length - 1, Math.floor(p)), [x, y] = at(said[k], E.inOut(clamp((p - k) * 1.15)));
          circ(ctx, x + lw / 2, y, lw + 3, s === 'theater' ? '#fff' : ink(1), acc(), 2);
        }
      },
      article: () => `<p class="a-claim"><b>${esc(d.claim)}</b></p><ol class="a-ol">${EV.map((e) => `<li${srcA(e.src)}>${esc(e.text)}</li>`).join('')}</ol>
        <p class="a-note"><b>反方会问：</b>${esc(d.counter.q)}<br><b>回应：</b><span${srcA(d.counter.src)}>${esc(d.counter.a)}</span></p>`,
    });
  };

  TYPES.dist = (d) => {
    const A = d.a.scores, B = d.b.scores, cuts = d.cuts, LO = 40, HI = 100;
    const bands = [[LO, cuts[0]], [cuts[0], cuts[1]], [cuts[1], HI + 1]];
    const cnt = (arr, a, b) => arr.filter((v) => v >= a && v < b).length;
    const mean = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
    const low = B.map((v, i) => (v < cuts[0] ? i : -1)).filter((i) => i >= 0);
    const [sec, pg, S] = mk(d, 'dist', 2, `
  ${[d.a, d.b].map((r, k) => `<div class="ds-l e0 blk"><em class="lb">${esc(r.label)}</em><span><u>平均</u><b class="nm${k ? ' ac' : ''}"${srcA(r.src, '46 人的平均')}>${mean(r.scores).toFixed(1)}</b></span></div>`).join('')}
  ${[A, B].map((arr) => bands.map(([a, b]) => `<span class="ds-c" data-b="1"><b>${cnt(arr, a, b)}</b> 人</span>`).join('')).join('')}
  <p class="ds-nt nt blk" data-b="2">期末还有 ${low.length} 个人低于 ${cuts[0]} 分，下学期先跟他们一对一过错题</p>
  <div class="ds-rd rd" aria-hidden="true"></div>`);
    const GEO = {
      precise: { x0: 340, x1: 1760, ya: 420, yb: 680, r: 9, lab: 'left', lx: 120, nt: [340, 862, 900], rd: [1180, 862, 600] },
      theater: { x0: 240, x1: 1680, ya: 450, yb: 700, r: 10, lab: 'above', nt: [240, 920, 1440], rd: [240, 878, 1440] },
      editorial: { x0: 330, x1: 1236, ya: 570, yb: 790, r: 7, lab: 'left', lx: 120, nt: [1360, 470, 440], rd: [1360, 620, 440] },
      gallery: { x0: 260, x1: 1260, ya: 480, yb: 700, r: 5, lab: 'above', nt: [1400, 480, 360], rd: [1400, 640, 360] },
    };
    const labs = $$(sec, '.ds-l'), cs = $$(sec, '.ds-c'), nt = $(sec, '.ds-nt'), rd = $(sec, '.ds-rd');
    const Xs = (g, v) => g.x0 + ((v - LO) / (HI - LO)) * (g.x1 - g.x0);
    function swarm(arr, g) {
      const placed = [], out = [], step = g.r * 2 * 0.9, min2 = (g.r * 2 + 1.5) ** 2;
      arr.map((v, i) => [Xs(g, v), i]).sort((a, b) => a[0] - b[0]).forEach(([x, i]) => {
        let y = 0; for (let k = 0; k < 40; k++) { y = (k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.ceil(k / 2)) * step; if (placed.every((p) => Math.abs(p.x - x) > g.r * 2 + 2 || (p.x - x) ** 2 + (p.y - y) ** 2 >= min2)) break; }
        placed.push({ x, y }); out[i] = { x, y };
      });
      return out;
    }
    let SW = null;
    function place() {
      const g = adj(sec, GEO[sk()]); SW = [swarm(A, g), swarm(B, g)];
      labs.forEach((e, k) => { const y = k ? g.yb : g.ya; if (g.lab === 'left') px(e, g.lx, y - 34, g.x0 - g.lx - 40); else px(e, g.x0, y - 150, 600); });
      cs.forEach((e, j) => { const k = Math.floor(j / 3), [a, b] = bands[j % 3], y = k ? g.yb : g.ya; px(e, (Xs(g, a) + Xs(g, Math.min(b, HI))) / 2 - 60, y - 100, 120); });
      px(nt, ...g.nt); px(rd, ...g.rd);
    }
    return std(pg, {
      reset() { reset0(pg); set(rd, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1500); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!SW || !S.a) return;
        const ay = g.yb + 84; ctx.fillStyle = ink(s === 'gallery' ? 0.5 : 0.85); ctx.fillRect(g.x0, ay, g.x1 - g.x0, s === 'gallery' ? 1 : 1.5);
        for (let v = LO; v <= HI; v += 10) { const x = Xs(g, v); ctx.fillRect(x, ay, 1, 7); txt(ctx, String(v), x, ay + 28, cf(15), ink(0.55), 'center'); }
        txt(ctx, '分', g.x1 + 30, ay + 28, cf(15, 400, 'sans'), ink(0.5));
        const b1 = S.b[1];
        if (b1 > 0) for (const c of cuts) { const x = Xs(g, c); line(ctx, [[x, ay], [x, lerp(ay, g.ya - 60, E.enter(b1))]], s === 'editorial' ? acc() : ink(0.6), 1, [4, 4]); }
        let thr = null;
        if (S.a >= 1 && D.alive) {
          thr = 60 + phase(S, t, 18, 2.5) * 35; const x = Xs(g, thr);
          const T = Math.floor(thr), xT = Xs(g, T), lc = s === 'gallery' ? acc() : ink();
          ctx.fillStyle = tone(s === 'theater' ? 0.07 : 0.05); ctx.fillRect(xT, g.ya - 64, Xs(g, HI) - xT, ay - g.ya + 64);   // 线右边＝读数说的那些人
          ctx.fillStyle = lc; ctx.fillRect(xT - 0.75, g.ya - 64, 1.5, ay - g.ya + 72);
          txt(ctx, `${T} 分`, xT, ay + 52, cf(16, 600), lc, 'center');
          const a = A.filter((v) => v >= T).length, b = B.filter((v) => v >= T).length;
          rd.innerHTML = `线的右边，<b>${T}</b> 分以上：<span class="nw">${esc(d.a.label)} <b>${a}</b> 人 → ${esc(d.b.label)} <b class="ac">${b}</b> 人</span>`; set(rd, { o: 1 });
        } else set(rd, { o: 0 });
        [A, B].forEach((arr, k) => {
          const y0 = k ? g.yb : g.ya, sw = SW[k];
          const mx = Xs(g, mean(arr)); ctx.fillStyle = k ? acc() : ink(0.7); ctx.fillRect(mx - 1, y0 - 44, 2, 88);
          arr.forEach((v, i) => {
            const f = clamp(S.a * 1.6 * arr.length / 46 * 2 - i / 23); if (!f) return;
            const p = sw[i], y = y0 + p.y * E.enter(f), dim = thr != null && v < Math.floor(thr);
            const fill = s === 'theater' && !k ? tone(0.45) : k && s !== 'precise' ? (s === 'gallery' ? null : ink(0.92)) : ink(k ? 0.92 : 0.55);
            ctx.globalAlpha = (dim ? 0.25 : 1) * f;
            if (s === 'precise') { ctx.fillStyle = k ? ink() : tone(0.45); ctx.fillRect(p.x - g.r * 0.85, y - g.r * 0.85, g.r * 1.7, g.r * 1.7); }
            else if (s === 'gallery') circ(ctx, p.x, y, g.r, k ? ink(0.85) : null, k ? null : ink(0.6), 1);
            else circ(ctx, p.x, y, g.r, fill);
            ctx.globalAlpha = 1;
            if (k && S.b[2] > 0 && v < cuts[0]) circ(ctx, p.x, y, (g.r + 9) * E.enter(S.b[2]), null, acc(), 2);
          });
        });
      },
      article: () => {
        const W = 340, x = (v) => 20 + ((v - LO) / (HI - LO)) * (W - 40);
        const row = (arr, y, cls) => arr.map((v, i) => `<circle cx="${x(v).toFixed(1)}" cy="${y + ((i % 3) - 1) * 7}" r="3" class="${cls}"/>`).join('');
        return `<svg class="a-svg" viewBox="0 0 ${W} 130" role="img" aria-label="46 人分数分布">${cuts.map((c) => `<line x1="${x(c)}" x2="${x(c)}" y1="6" y2="104" class="cut"/>`).join('')}${row(A, 30, 'l0d')}${row(B, 76, 'l1d')}
          <text x="0" y="12" class="t">${esc(d.a.label)}</text><text x="0" y="58" class="t">${esc(d.b.label)}</text>${[40, 60, 80, 100].map((v) => `<text x="${x(v)}" y="124" class="t" text-anchor="middle">${v}</text>`).join('')}</svg>
          <div class="a-kpis"><div><em>低于 ${cuts[0]} 分</em><span>${cnt(A, LO, cuts[0])} → <b>${cnt(B, LO, cuts[0])}</b> 人</span></div><div><em>${cuts[1]} 分以上</em><span>${cnt(A, cuts[1], 999)} → <b class="ac">${cnt(B, cuts[1], 999)}</b> 人</span></div></div>`;
      },
    });
  };

  TYPES.heat = (d) => {
    const R = d.grid.split('|'), nr = R.length, nc = R[0].length;
    const on = [], late = [], miss = [];
    for (let c = 0; c < nc; c++) { let a = 0, b = 0, z = 0; R.forEach((r) => (r[c] === '1' ? a++ : r[c] === '2' ? b++ : z++)); on.push(a); late.push(b); miss.push(z); }
    const never = R.map((r, i) => (r.includes('1') ? -1 : i)).filter((i) => i >= 0);
    const [sec, pg, S] = mk(d, 'heat', 2, `
  <div class="ht-sd blk">
    <div class="ht-sum e0"><em class="lb">每周按时交</em><div><b class="nm"${srcA(d.src, '第 1 周、第 18 周按时交的人数')}>${on[0]}</b><i>→</i><b class="nm ac">${on[nc - 1]}</b><u>人</u></div></div>
    <div class="ht-lg e0"><span><i class="k1"></i>按时</span><span><i class="k2"></i>迟交</span><span><i class="k0"></i>没交</span></div>
    <p class="ht-ev nt" data-b="1">第 ${d.ev} 周起换了办法，之后每周按时交的人数一路往上</p>
    <p class="ht-who nt" data-b="2">一次都没按时交的 ${never.length} 个人：${never.map((i) => `第 ${i + 1} 行`).join('、')}。下学期单独谈</p>
    <div class="ht-rd rd" aria-hidden="true"></div>
  </div>`);
    const GEO = {
      precise: { gx: 300, gy: 300, cw: 64, ch: 10, g: 2, ly: 872, lh: 64, sd: [1540, 300, 260] },
      theater: { gx: 330, gy: 290, cw: 56, ch: 10, g: 2, ly: 862, lh: 60, sd: [1430, 290, 330] },
      editorial: { gx: 200, gy: 470, cw: 54, ch: 7, g: 1, ly: 860, lh: 56, sd: [1360, 470, 440] },
      gallery: { gx: 260, gy: 380, cw: 50, ch: 8, g: 3, ly: 900, lh: 44, sd: [1400, 380, 360] },
    };
    const sd = $(sec, '.ht-sd'), rd = $(sec, '.ht-rd');
    const place = () => px(sd, ...adj(sec, GEO[sk()]).sd);
    return std(pg, {
      reset() { reset0(pg); set(rd, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1800); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const G = adj(sec, GEO[sk()]), s = sk(), cx = (c) => G.gx + c * (G.cw + G.g), cy = (r) => G.gy + r * (G.ch + G.g);
        if (!S.a) return;
        const b2 = S.b[2] || 0, dark = D.theme === 'dark';
        const col1 = s === 'theater' ? tone(0.58) : s === 'editorial' ? tone(0.62) : tone(s === 'gallery' ? 0.42 : 0.3);
        const col2 = tone(s === 'theater' ? 0.2 : s === 'gallery' ? 0.13 : s === 'precise' ? 0.14 : 0.18), col0 = tone(dark ? 0.08 : 0.05);
        for (let c = 0; c < nc; c++) {
          const f = clamp(S.a * (nc + 2) - c); if (!f) continue;
          for (let r = 0; r < nr; r++) {
            const v = R[r][c], hot = never.includes(r);
            ctx.globalAlpha = f;
            ctx.fillStyle = v === '1' ? col1 : v === '2' ? col2 : col0; ctx.fillRect(cx(c), cy(r), G.cw, G.ch);
            if (hot && b2 > 0 && v !== '1') { ctx.globalAlpha = f * b2; ctx.fillStyle = acc(v === '2' ? 0.75 : 0.3); ctx.fillRect(cx(c), cy(r), G.cw, G.ch); }
          }
        }
        ctx.globalAlpha = 1;
        for (const c of [0, d.ev - 1, 11, nc - 1]) txt(ctx, `${c + 1}`, cx(c) + G.cw / 2, G.gy - 14, cf(14), ink(0.55), 'center');
        txt(ctx, '周', cx(nc - 1) + G.cw + 10, G.gy - 14, cf(14, 400, 'sans'), ink(0.5));
        const b1 = S.b[1] || 0;
        if (b1 > 0) {
          const x = cx(d.ev - 1) - G.g / 2 - 1; ctx.fillStyle = acc(); ctx.fillRect(x, G.gy - 6, 2, (cy(nr) - G.gy + 6) * E.enter(b1));
          const y = (v) => G.ly + G.lh - ((v - 30) / 16) * G.lh, pts = on.map((v, c) => [cx(c) + G.cw / 2, y(v)]);
          const k = Math.max(1, Math.ceil(b1 * nc)); line(ctx, pts.slice(0, k), s === 'editorial' ? acc() : ink(), s === 'gallery' ? 1 : 2);
          pts.slice(0, k).forEach(([px2, py], c) => { if (s === 'precise') { ctx.fillStyle = ink(); ctx.fillRect(px2 - 3, py - 3, 6, 6); } else if (c === 0 || c === nc - 1) circ(ctx, px2, py, 3.5, ink()); });
          if (k >= nc) { txt(ctx, `${on[0]}`, pts[0][0] - 12, pts[0][1] + 5, cf(16, 600), ink(0.8), 'right'); txt(ctx, `${on[nc - 1]} 人按时`, pts[nc - 1][0] + 12, pts[nc - 1][1] + 5, cf(16, 600), acc()); }
        }
        if (b2 > 0) never.forEach((r) => { ctx.strokeStyle = acc(); ctx.lineWidth = 1.5; ctx.globalAlpha = b2; ctx.strokeRect(G.gx - 4, cy(r) - 3, (cx(nc) - G.gx) + 6 - G.g, G.ch + 6); txt(ctx, `第 ${r + 1} 行`, G.gx - 12, cy(r) + G.ch / 2 + 5, cf(14, 500, 'sans'), acc(), 'right'); ctx.globalAlpha = 1; });
        if (S.a >= 1 && D.alive) {
          const c = Math.min(nc - 1, Math.floor(phase(S, t, 27, 2) * nc));
          ctx.strokeStyle = s === 'gallery' ? acc() : ink(); ctx.lineWidth = 1.5; ctx.strokeRect(cx(c) - 3, G.gy - 4, G.cw + 6, cy(nr) - G.gy + 6);
          rd.innerHTML = `第 ${c + 1} 周：按时 <b>${on[c]}</b>，迟交 <b>${late[c]}</b>，没交 <b>${miss[c]}</b>`; set(rd, { o: 1 });
        } else set(rd, { o: 0 });
      },
      article: () => {
        const W = 340, cw = (W - 20) / nc, ch = 4;
        return `<svg class="a-svg" viewBox="0 0 ${W} ${nr * ch + 26}" role="img" aria-label="46 人 18 周作业">${R.map((r, i) => [...r].map((v, c) => `<rect x="${10 + c * cw}" y="${i * ch}" width="${cw - 1}" height="${ch - 0.6}" class="${v === '1' ? 'ink' : v === '2' ? 'mid' : 'none'}${never.includes(i) ? ' hot' : ''}"/>`).join('')).join('')}
          <text x="10" y="${nr * ch + 18}" class="t">第 1 周</text><text x="${W - 10}" y="${nr * ch + 18}" class="t" text-anchor="end">第 ${nc} 周</text></svg>
          <p class="a-note">每周按时交 <b>${on[0]} → ${on[nc - 1]}</b> 人。一次都没按时交的 ${never.length} 个人：${never.map((i) => `第 ${i + 1} 行`).join('、')}。</p>`;
      },
    });
  };

  TYPES.compose = (d) => {
    const P = d.parts, A = d.a.v, B = d.b.v, n = P.length;
    const sum = (v) => v.reduce((x, y) => x + y, 0), tA = sum(A), tB = sum(B);
    const df = A.map((v, i) => B[i] - v), big = df.reduce((m, v, i) => (v < df[m] ? i : m), 0), same = df.findIndex((v) => Math.abs(v) < 0.05);
    const [sec, pg, S] = mk(d, 'compose', 2, `
  ${[d.a, d.b].map((r, k) => `<div class="cm-t e0 blk"><em class="lb">${esc(r.label)}</em><span><b class="nm${k ? ' ac' : ''}"${srcA(r.src, P.join(' + '))}>${fmt(k ? tB : tA, 1)}</b><u>${esc(d.unit)}／周</u></span></div>`).join('')}
  ${[A, B].map((arr, k) => arr.map((v, i) => `<span class="cm-s e0"><em>${k ? '' : esc(P[i])}</em><b>${fmt(v, 1)}</b></span>`).join('')).join('')}
  ${df.map((v, i) => `<span class="cm-d${i === big ? ' big' : ''}" data-b="1">${Math.abs(v) < 0.05 ? '没变' : sgn(v)}</span>`).join('')}
  <p class="cm-nt nt blk" data-b="2">${same >= 0 ? `${esc(P[same])}一分钟没省：要我当面听写，这一项没交给 AI` : ''}</p>
  <div class="cm-rd rd" aria-hidden="true"></div>`);
    const GEO = {
      precise: { dir: 'h', lx: 120, x0: 360, sc: 1380 / 9.5, ya: 316, yb: 590, bh: 76, nt: [360, 820, 1100], rd: [360, 752, 1400] },
      theater: { dir: 'h', lx: 200, x0: 440, sc: 1160 / 9.5, ya: 316, yb: 600, bh: 88, nt: [440, 850, 1200], rd: [440, 776, 1200] },
      editorial: { dir: 'v', xa: 380, xb: 760, cw: 200, base: 940, sc: 44, nt: [1360, 470, 440], rd: [1360, 600, 440] },
      gallery: { dir: 'h', lx: 220, x0: 420, sc: 860 / 9.5, ya: 430, yb: 640, bh: 14, nt: [1400, 430, 360], rd: [1400, 580, 360] },
    };
    const tEls = $$(sec, '.cm-t'), sEls = $$(sec, '.cm-s'), dEls = $$(sec, '.cm-d'), nt = $(sec, '.cm-nt'), rd = $(sec, '.cm-rd');
    const cum = (arr, i) => arr.slice(0, i).reduce((x, y) => x + y, 0);
    const seg = (g, k, i) => { const arr = k ? B : A, a = cum(arr, i), b = a + arr[i]; return g.dir === 'h' ? { x: g.x0 + a * g.sc, y: k ? g.yb : g.ya, w: arr[i] * g.sc, h: g.bh } : { x: k ? g.xb : g.xa, y: g.base - b * g.sc, w: g.cw, h: arr[i] * g.sc }; };
    const tones = { precise: [0.92, 0.62, 0.4, 0.22], theater: [0.72, 0.5, 0.34, 0.22], editorial: [0.9, 0.6, 0.38, 0.2], gallery: [0.85, 0.55, 0.35, 0.2] };
    function place() {
      const g = adj(sec, GEO[sk()]), s = sk();
      tEls.forEach((e, k) => { if (g.dir === 'h') px(e, g.lx, (k ? g.yb : g.ya) + (g.bh > 40 ? g.bh / 2 - 34 : -18), g.x0 - g.lx - 30); else px(e, k ? g.xb : g.xa, g.base - (k ? tB : tA) * g.sc - 92, 260); });
      sEls.forEach((e, j) => {
        const k = Math.floor(j / n), i = j % n, r = seg(g, k, i), inside = g.dir === 'v' || g.bh > 40;
        e.classList.toggle('in', inside); e.classList.toggle('lt', tones[s][i] < 0.56);
        if (g.dir === 'h') { if (inside) px(e, r.x + 12, r.y + g.bh / 2 - (k ? 14 : 24), Math.max(40, r.w - 16)); else px(e, r.x, k ? r.y + g.bh + 8 : r.y - (k ? 0 : 48), Math.max(60, r.w)); }
        else px(e, r.x + 14, r.y + r.h / 2 - (k ? 14 : 24), g.cw - 20);
      });
      dEls.forEach((e, i) => {
        const a = seg(g, 0, i), b = seg(g, 1, i);
        if (g.dir === 'h') px(e, (a.x + a.w / 2 + b.x + b.w / 2) / 2 - 50, (g.ya + g.bh + g.yb) / 2 - 16, 100); else px(e, g.xa + g.cw + 20, (a.y + a.h / 2 + b.y + b.h / 2) / 2 - 14, g.xb - g.xa - g.cw - 40);
      });
      px(nt, ...g.nt); px(rd, ...g.rd);
    }
    return std(pg, {
      reset() { reset0(pg); set(rd, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1300); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        const b1 = S.b[1] || 0, b2 = S.b[2] || 0;
        if (b1 > 0) for (let i = 0; i < n; i++) {
          const a = seg(g, 0, i), b = seg(g, 1, i);
          ctx.fillStyle = i === big ? acc(0.22 * b1) : ink(0.07 * b1); ctx.beginPath();
          if (g.dir === 'h') { ctx.moveTo(a.x, a.y + a.h); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y); }
          else { ctx.moveTo(a.x + a.w, a.y); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.lineTo(b.x, b.y + b.h); ctx.lineTo(b.x, b.y); }
          ctx.fill();
        }
        for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
          const r = seg(g, k, i), f = clamp(S.a * (n + 1) - i - k * 0.5); if (!f) continue;
          ctx.fillStyle = tone(tones[s][i]);
          if (g.dir === 'h') ctx.fillRect(r.x + 1, r.y, r.w * E.enter(f) - 2, r.h); else ctx.fillRect(r.x, r.y + r.h * (1 - E.enter(f)) + 1, r.w, r.h * E.enter(f) - 2);
          if (b2 > 0 && i === same) { ctx.strokeStyle = acc(); ctx.lineWidth = 2; ctx.globalAlpha = b2; ctx.strokeRect(r.x - 3, r.y - 3, r.w + 4, r.h + 6); ctx.globalAlpha = 1; }
        }
        if (g.dir === 'h') { const y = g.yb + g.bh + (g.bh > 40 ? 18 : 44); ctx.fillStyle = ink(0.5); for (let h = 0; h <= 10; h++) { const x = g.x0 + h * g.sc; ctx.fillRect(x, y, 1, h % 5 ? 4 : 8); if (h % 5 === 0 || h === 10) txt(ctx, `${h}`, x, y + 24, cf(14), ink(0.5), 'center'); } txt(ctx, '小时', g.x0 + 10 * g.sc + 18, y + 24, cf(14, 400, 'sans'), ink(0.5)); }
        else { ctx.fillStyle = ink(0.85); ctx.fillRect(g.xa - 30, g.base, g.xb + g.cw - g.xa + 60, 1.5); for (let h = 0; h <= 10; h += 2) txt(ctx, `${h}`, g.xa - 40, g.base - h * g.sc + 5, cf(14), ink(0.5), 'right'); }
        if (S.a >= 1 && D.alive) {
          const hh = phase(S, t, 20, 2.5) * tA;
          const where = (arr) => { let c = 0; for (let i = 0; i < n; i++) { c += arr[i]; if (hh < c) return i; } return -1; };
          const ia = where(A), ib = where(B);
          ctx.fillStyle = s === 'gallery' ? acc() : ink();
          if (g.dir === 'h') { const x = g.x0 + hh * g.sc; ctx.fillRect(x - 0.75, g.ya - 14, 1.5, g.yb + g.bh - g.ya + 28); } else { const y = g.base - hh * g.sc; ctx.fillRect(g.xa - 14, y - 0.75, g.xb + g.cw - g.xa + 28, 1.5); }
          rd.innerHTML = ib >= 0 && ia === ib ? `第 <b>${fmt(hh, 1)}</b> 小时：两种做法都还在改${esc(P[ia])}` : `第 <b>${fmt(hh, 1)}</b> 小时：${esc(d.a.label)}在改${esc(P[ia] || '')}；${esc(d.b.label)}${ib < 0 ? '<b class="ac">已经改完了</b>' : `在改${esc(P[ib])}`}`; set(rd, { o: 1 });
        } else set(rd, { o: 0 });
      },
      article: () => aBars(P.map((p, i) => ({ label: p, v: A[i], text: `${fmt(A[i], 1)} → ${fmt(B[i], 1)}` })), Math.max(...A)) + `<p class="a-note">每周合计 <b>${fmt(tA, 1)} → <span class="ac">${fmt(tB, 1)}</span></b> ${esc(d.unit)}</p>`,
    });
  };

  TYPES.process = (d) => {
    const ST = d.steps, n = ST.length, key = ST.findIndex((s) => s.key), mins = ST.map((s) => minutes(s.time));
    const mine = ST.reduce((a, s, i) => a + (s.who === '学生' ? 0 : mins[i]), 0);
    const [sec, pg, S] = mk(d, 'process', 2, `
  ${ST.map((s, i) => `<div class="pr-s e0${s.key ? ' key' : ''}"><div class="pr-h"><span class="lb">${esc(s.day)}</span><em>${esc(s.who)}</em></div><p class="pr-t">${esc(s.text)}</p><span class="pr-tm nm">${esc(s.time)}</span><p class="pr-n" data-b="1">${esc(s.note)}</p></div>`).join('')}
  <p class="pr-sum nt blk" data-b="2">我每周花在这几步上的时间：约 <b>${Math.floor(mine / 60)} 小时 ${String(mine % 60).padStart(2, '0')} 分</b>（不算学生课上的时间）</p>`);
    const GEO = {
      precise: { m: 'cols', x: 120, y: 300, w: 1680, gap: 24, h: 520, sum: [120, 856, 1680] },
      theater: { m: 'cols', x: 160, y: 300, w: 1600, gap: 24, h: 520, sum: [160, 864, 1600] },
      editorial: { m: 'rows', x: 120, y: 420, w: 1180, rh: 124, rg: 10, sum: [1360, 420, 440] },
      gallery: { m: 'cols', x: 220, y: 330, w: 1480, gap: 40, h: 480, sum: [220, 872, 1480], mat: [160, 290, 1600, 560] },
    };
    sec.insertAdjacentHTML('afterbegin', '<i class="pr-mat e0"></i>'); pg.e0 = $$(sec, '.e0');
    const els = $$(sec, '.pr-s'), sumEl = $(sec, '.pr-sum'), mat = $(sec, '.pr-mat');
    const cw = (g) => (g.w - (n - 1) * g.gap) / n;
    function place() {
      const g = adj(sec, GEO[sk()]); sec.dataset.m = g.m;
      els.forEach((e, i) => { if (g.m === 'cols') px(e, g.x + i * (cw(g) + g.gap), g.y, cw(g), g.h); else px(e, g.x, g.y + i * (g.rh + g.rg), g.w, g.rh); });
      px(sumEl, ...g.sum); if (g.mat) px(mat, ...g.mat);
    }
    const anchors = () => { const g = adj(sec, GEO[sk()]); return els.map((e) => { const o = off(e, sec); return g.m === 'cols' ? [o.x, o.y - 22] : [o.x + 22, o.y + 30]; }); };
    const barBox = (g, o) => (g.m === 'cols' ? { x: o.x + 32, y: o.y + o.h - 48, w: o.w - 64 } : { x: o.x + 880, y: o.y + o.h / 2 - 6, w: 260 });
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1000); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        const A = anchors(), cols = g.m === 'cols';
        const pts = cols ? [[A[0][0], A[0][1]], [A[n - 1][0] + cw(g), A[n - 1][1]]] : [[A[0][0], A[0][1]], [A[n - 1][0], A[n - 1][1]]];
        const L = lerp(pts[0][0], pts[1][0], E.enter(S.a)), Ly = lerp(pts[0][1], pts[1][1], E.enter(S.a));
        line(ctx, [pts[0], [cols ? L : pts[0][0], cols ? pts[0][1] : Ly]], s === 'theater' ? tone(0.35) : ink(s === 'gallery' ? 0.5 : 0.85), s === 'gallery' ? 1 : s === 'precise' ? 2 : 1.5);
        A.forEach(([x, y], i) => {
          const cx2 = x, k = i === key;
          if (s === 'precise') { ctx.fillStyle = k ? acc() : ink(); ctx.fillRect(cx2 - (k ? 7 : 5), y - (k ? 7 : 5), k ? 14 : 10, k ? 14 : 10); }
          else circ(ctx, cx2, y, k ? (s === 'gallery' ? 6 : 9) : s === 'gallery' ? 3.5 : 6, k ? acc() : s === 'gallery' ? D.rgba('bg') : ink(), s === 'gallery' && !k ? ink() : null, 1);
        });
        const b2 = S.b[2] || 0;
        if (b2 > 0) {
          const mx = Math.max(...mins), h = { precise: 12, theater: 8, editorial: 10, gallery: 4 }[s];
          els.forEach((e, i) => {
            const o = off(e, sec), B = barBox(g, o), w = (mins[i] / mx) * B.w * E.enter(b2);
            ctx.globalAlpha = Math.min(1, b2 * 2); ctx.fillStyle = ink(0.1); ctx.fillRect(B.x, B.y, B.w, h); ctx.globalAlpha = 1;
            if (ST[i].who === '学生') { ctx.strokeStyle = ink(0.7); ctx.lineWidth = 1; ctx.strokeRect(B.x + 0.5, B.y + 0.5, Math.max(1, w - 1), h - 1); } else { ctx.fillStyle = i === key ? acc() : ink(0.85); ctx.fillRect(B.x, B.y, w, h); }
          });
        }
        if (S.a >= 1 && D.alive) {
          const dw = ST.map((_, i) => (i === key ? 2.6 : 1)), tot = dw.reduce((a, b) => a + b, 0) + (n - 1) * 0.8;
          let p = phase(S, t, tot * 1.1, 1.2) * tot, pos = A[n - 1];
          for (let i = 0; i < n; i++) { if (p < dw[i]) { pos = A[i]; break; } p -= dw[i]; if (i < n - 1) { if (p < 0.8) { const u = E.inOut(p / 0.8); pos = [lerp(A[i][0], A[i + 1][0], u), lerp(A[i][1], A[i + 1][1], u)]; break; } p -= 0.8; } }
          circ(ctx, pos[0], pos[1], s === 'gallery' ? 10 : 15, null, acc(), 2);
        }
      },
      article: () => `<ol class="a-ol">${ST.map((s) => `<li class="${s.key ? 'key' : ''}"><b>${esc(s.day)} · ${esc(s.who)}：${esc(s.text)}</b>（${esc(s.time)}）<br><span class="a-who">${esc(s.note)}</span></li>`).join('')}</ol>`,
    });
  };

  TYPES.versions = (d) => {
    const V = d.vers, n = V.length, mx = Math.max(...V.map((v) => v.n));
    const [sec, pg, S] = mk(d, 'versions', n, `
  <i class="vr-mat e0"></i>${V.map((v, i) => `<i class="vr-k e0${i === n - 1 ? ' fin' : ''}"></i>`).join('')}
  ${V.map((v, i) => `<div class="vr-c e0${i === n - 1 ? ' fin' : ''}"><em class="lb">${esc(v.v)}</em><div><b class="nm"${srcA(d.src)}>${v.n}</b><u>处毛病</u></div></div>`).join('')}
  ${V.map((v, i) => `<p class="vr-n nt blk${v.said ? ' said' : ''}" data-b="${i + 1}">${esc(v.note)}</p>`).join('')}`);
    const GEO = {
      precise: { x0: 120, cw: 406, cg: 18, pd: 28, y: 288, h: 400, cy: 712, ny: 796, bot: 940 },
      theater: { x0: 160, cw: 382, cg: 24, pd: 28, y: 290, h: 380, cy: 694, ny: 780, bot: 940 },
      editorial: { x0: 120, cw: 380, cg: 20, pd: 26, y: 470, h: 360, cy: 850, ny: 932, bot: 940, side: { x: 1360, w: 440 } },
      gallery: { x0: 220, cw: 340, cg: 40, pd: 28, y: 330, h: 340, cy: 700, ny: 784, bot: 900, mat: [160, 290, 1600, 650] },
    };
    const ks = $$(sec, '.vr-k'), cs = $$(sec, '.vr-c'), ns = $$(sec, '.vr-n'), mat = $(sec, '.vr-mat');
    function box(g, i) { const [cx, cw] = g.side && i === n - 1 ? [g.side.x, g.side.w] : [g.x0 + i * (g.cw + g.cg), g.cw]; return { cx, cw, x: cx + g.pd, y: g.y, w: cw - 2 * g.pd, h: g.h }; }
    const rnd = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const LINES = Array.from({ length: 15 }, (_, k) => ({ w: 0.55 + rnd(k) * 0.4, q: k >= 6 && k % 2 === 0 }));
    const SPOTS = [[2, 0.3], [4, 0.62], [6, 0.2], [7, 0.7], [8, 0.4], [10, 0.25], [11, 0.66], [12, 0.45], [14, 0.3]];
    S.focus = -1;
    function place() {
      const g = adj(sec, GEO[sk()]);
      for (let i = 0; i < n; i++) { const B = box(g, i); px(ks[i], B.cx, g.y - g.pd, B.cw, g.bot - g.y + g.pd); px(cs[i], B.x, g.cy, B.w); px(ns[i], B.x, g.ny, B.w); }   // 卡底按绝对坐标落到 bot（社论标题高矮不同，不跟着上移）
      if (g.mat) px(mat, ...g.mat);
    }
    function paper(ctx, g, i, alpha, lit) {
      const { x, y, w, h } = box(g, i), pad = w * 0.09, lh = (h - h * 0.2) / 16;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sk() === 'editorial' ? ink() : tone(0.3); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.fillStyle = '#2B2B2B'; ctx.fillRect(x + pad, y + pad * 0.9, w * 0.42, lh * 0.5); ctx.fillStyle = '#E4E4E4'; ctx.fillRect(x + w - pad - w * 0.2, y + pad * 0.9, w * 0.2, lh * 0.5);
      ctx.fillStyle = '#1A1A1A'; ctx.fillRect(x + pad, y + pad * 0.9 + lh * 0.9, w - pad * 2, 1.5);
      LINES.forEach((L, k) => { const ly = y + h * 0.17 + k * lh; ctx.fillStyle = L.q ? '#9A9A9A' : '#CFCFCF'; ctx.fillRect(x + pad + (L.q ? 0 : w * 0.03), ly, (w - pad * 2) * L.w, Math.max(2, lh * 0.28)); });
      ctx.globalAlpha = 1;
      const nn = V[i].n;
      for (let k = 0; k < nn; k++) {
        const [row, fx] = SPOTS[k], cx = x + pad + (w - pad * 2) * fx * LINES[row].w + 6, cy = y + h * 0.17 + row * lh + lh * 0.14;
        const on = lit == null || k < lit;
        ctx.globalAlpha = alpha * (on ? 1 : 0.18) * clamp(S.a * 2 - k / nn); circ(ctx, cx, cy, Math.max(9, w * 0.05), null, acc(), sk() === 'gallery' ? 1.5 : 2.5); ctx.globalAlpha = 1;
      }
    }
    const DIM = 0.62;
    function focus(k, dur) { S.focus = k; cs.forEach((e, i) => { const o = k < 0 || i === k ? 1 : DIM; dur ? to(e, { o }, dur) : set(e, { o }); }); ks.forEach((e, i) => e.classList.toggle('on', i === k)); }
    return std(pg, {
      reset() { reset0(pg); S.fa = 0; focus(-1); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1100); },
      async beat(k) { S.t0 = null; focus(k - 1, D.d(MO[sk()].dur)); tween(D.d(400), (v) => { S.fa = v; }); return beatIn(pg, k, 500); },
      calm() { calmGroups(pg); S.fa = D.b > 0 ? 1 : 0; focus(D.b > 0 ? D.b - 1 : -1); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]); if (!S.a) return;
        for (let i = 0; i < n; i++) {
          const f = clamp(S.a * (n + 1) - i); if (!f) continue;
          const dim = S.focus >= 0 && i !== S.focus ? lerp(1, DIM, S.fa || 0) : 1;
          let lit = null;
          if (i === S.focus && D.alive && V[i].n) lit = Math.floor(phase(S, t, V[i].n * 0.7, 2) * V[i].n + 0.999);
          paper(ctx, g, i, dim * E.enter(f), lit);
        }
      },
      article: () => aBars(V.map((v) => ({ label: v.v, v: v.n || 0.05, text: `${v.n} 处` })), mx) + V.map((v) => `<p class="a-note"><b>${esc(v.v)}</b>　${esc(v.note)}</p>`).join(''),
    });
  };

  TYPES.funnel = (d) => {
    const ST = d.stages, n = ST.length, N = ST[0].v;
    const drop = ST.slice(1).map((s, i) => ST[i].v - s.v), big = drop.reduce((m, v, i) => (v > drop[m] ? i : m), 0);
    const [sec, pg, S] = mk(d, 'funnel', 2, `
  ${ST.map((s, i) => `<div class="fn-l e0"><em class="lb">${esc(s.label)}</em><b class="nm${i === n - 1 ? ' ac' : ''}"${srcA(d.src)}>${s.v}</b></div>`).join('')}
  ${drop.map((v, i) => `<span class="fn-d${i === big ? ' big' : ''}" data-b="1"><b>−${v}</b> 人</span>`).join('')}
  <p class="fn-fix nt blk" data-b="2">${esc(d.fix)}</p>`);
    const GEO = {
      precise: { cx: [330, 730, 1130, 1530], base: 770, cols: 5, sp: 36, r: 13, fix: [120, 900, 1680] },
      theater: { cx: [360, 760, 1160, 1560], base: 760, cols: 5, sp: 36, r: 13, fix: [200, 900, 1520] },
      editorial: { cx: [250, 545, 840, 1135], base: 850, cols: 5, sp: 30, r: 11, fix: [1360, 470, 440] },
      gallery: { cx: [380, 760, 1140, 1520], base: 790, cols: 5, sp: 30, r: 8, fix: [260, 920, 1400] },
    };
    const ls = $$(sec, '.fn-l'), ds = $$(sec, '.fn-d'), fix = $(sec, '.fn-fix');
    const slot = (g, j, s) => [g.cx[j] - ((g.cols - 1) * g.sp) / 2 + (s % g.cols) * g.sp, g.base - Math.floor(s / g.cols) * g.sp];
    function place() {
      const g = adj(sec, GEO[sk()]);
      ls.forEach((e, i) => px(e, g.cx[i] - 120, g.base + 26, 240));
      ds.forEach((e, i) => px(e, (g.cx[i] + g.cx[i + 1]) / 2 - 70, (slot(g, i, ST[i].v - 1)[1] + slot(g, i + 1, ST[i + 1].v - 1)[1]) / 2 - 52, 140));   // 贴着那一步的落差线（独立评审）
      px(fix, ...g.fix);
    }
    function dotAt(ctx, g, x, y, a, hot) {
      ctx.globalAlpha = a; const s = sk();
      if (s === 'precise') { ctx.fillStyle = hot ? acc() : ink(); ctx.fillRect(x - g.r * 0.8, y - g.r * 0.8, g.r * 1.6, g.r * 1.6); }
      else if (s === 'gallery') circ(ctx, x, y, g.r, hot ? acc() : ink(0.85));
      else circ(ctx, x, y, g.r, hot ? acc() : s === 'theater' ? ink(0.85) : ink());
      ctx.globalAlpha = 1;
    }
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1400); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        ctx.fillStyle = ink(s === 'gallery' ? 0.4 : 0.85); ctx.fillRect(g.cx[0] - 120, g.base + g.r + 6, g.cx[n - 1] - g.cx[0] + 240, s === 'gallery' ? 1 : 1.5);
        const flow = S.a >= 1 && D.alive;
        const u = flow ? phase(S, t, (n - 1) * 3, 1.5) * (n - 1) : -1, cj = Math.floor(u), w = cj < 0 ? 0 : Math.sin(Math.PI * clamp((u - cj) * 1.25));
        for (let j = 0; j < n; j++) for (let k = 0; k < ST[j].v; k++) {
          const f = clamp(S.a * 3 - j * 0.5 - k / N); if (!f) continue;
          const [x, y] = slot(g, j, k), lost = j + 1 < n && k >= ST[j + 1].v, hot = lost && j === big && S.b[1] > 0;
          if (flow && j === cj && lost) dotAt(ctx, g, x, y + 36 * w, 1 - 0.75 * w, true);
          else dotAt(ctx, g, x, y, f, hot);
        }
        const b1 = S.b[1] || 0;
        if (b1 > 0) drop.forEach((v, i) => { const ya = slot(g, i, ST[i].v - 1)[1], yb = slot(g, i + 1, ST[i + 1].v - 1)[1], xa = g.cx[i] + ((g.cols - 1) * g.sp) / 2 + g.r + 8, xb = g.cx[i + 1] - ((g.cols - 1) * g.sp) / 2 - g.r - 8; line(ctx, [[xa, ya], [lerp(xa, xb, E.enter(b1)), lerp(ya, yb, E.enter(b1))]], i === big ? acc() : ink(0.45), i === big ? 2 : 1, i === big ? null : [3, 3]); });
      },
      article: () => aBars(ST.map((s, i) => ({ label: s.label, v: s.v, text: `${s.v} 人`, cls: i === n - 1 ? 'ac' : '' })), N) + `<p class="a-note">掉得最多：${esc(ST[big].label)} → ${esc(ST[big + 1].label)}，<b>−${drop[big]}</b> 人。${esc(d.fix)}</p>`,
    });
  };

  TYPES.rank = (d) => {
    const I = [...d.items].sort((a, b) => b.v - a.v), n = I.length, mx = I[0].v, ratio = I[0].v / I[n - 1].v;
    const [sec, pg, S] = mk(d, 'rank', 2, `
  ${I.map((it, i) => `<div class="rk-l e0"><span class="rk-no">${i + 1}</span><em>${esc(it.label)}</em></div><b class="rk-v nm e0${i === 0 ? ' ac' : ''}"${srcA(d.src)}>${it.v}<u>${esc(d.unit)}</u></b>`).join('')}
  <span class="rk-x" data-b="1"><b class="nm">${fmt(ratio, 1)}</b> 倍</span>
  <p class="rk-nt nt blk" data-b="2">前两名下学期先复习：${esc(I[0].label.split(' · ')[0])}、${esc(I[1].label.split(' · ')[0])}</p>
  <div class="rk-rd rd" aria-hidden="true"></div>`);
    const GEO = {
      precise: { lx: 120, lw: 400, x0: 540, sc: 1000 / 35, y0: 300, rh: 92, bh: 30, nt: [540, 860, 900], rd: [1300, 860, 500] },
      theater: { lx: 200, lw: 420, x0: 640, sc: 880 / 35, y0: 300, rh: 92, bh: 54, nt: [640, 872, 900], rd: [1220, 872, 500] },
      editorial: { lx: 120, lw: 300, x0: 440, sc: 680 / 35, y0: 480, rh: 72, bh: 30, nt: [1360, 480, 440], rd: [1360, 600, 440] },
      gallery: { lx: 220, lw: 320, x0: 560, sc: 600 / 35, y0: 400, rh: 80, bh: 2, nt: [1400, 400, 360], rd: [1400, 520, 360] },
    };
    const ls = $$(sec, '.rk-l'), vs = $$(sec, '.rk-v'), x = $(sec, '.rk-x'), nt = $(sec, '.rk-nt'), rd = $(sec, '.rk-rd');
    const bx = (g) => g.x0 + mx * g.sc + 150;
    function place() {
      const g = adj(sec, GEO[sk()]);
      I.forEach((it, i) => { const cy = g.y0 + i * g.rh + g.rh / 2; px(ls[i], g.lx, cy - 16, g.lw); px(vs[i], g.x0 + it.v * g.sc + 14, cy - 18); });
      px(x, bx(g) + 18, g.y0 + ((n - 1) * g.rh) / 2 + g.rh / 2 - 22); px(nt, ...g.nt); px(rd, ...g.rd);
    }
    return std(pg, {
      reset() { reset0(pg); set(rd, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1200); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        const b1 = S.b[1] || 0, b2 = S.b[2] || 0;
        let thr = null; if (S.a >= 1 && D.alive) thr = phase(S, t, 16, 2.5) * (mx + 4);
        ctx.fillStyle = ink(s === 'gallery' ? 0.4 : 0.85); ctx.fillRect(g.x0 - 1, g.y0 + 8, s === 'gallery' ? 1 : 1.5, n * g.rh - 16);
        I.forEach((it, i) => {
          const f = clamp(S.a * (n + 1) - i); if (!f) return;
          const cy = g.y0 + i * g.rh + g.rh / 2, w = it.v * g.sc * E.enter(f), top2 = i < 2 && b2 > 0;
          ctx.globalAlpha = thr != null && it.v < thr ? 0.3 : 1;
          ctx.fillStyle = i === 0 ? acc() : top2 ? ink() : s === 'theater' ? tone(0.45) : tone(s === 'gallery' ? 0.8 : 0.55);
          ctx.fillRect(g.x0, cy - g.bh / 2, w, g.bh);
          if (s === 'gallery') circ(ctx, g.x0 + w, cy, 4, i === 0 ? acc() : ink());
          if (top2) { ctx.globalAlpha = b2; ctx.fillStyle = acc(); ctx.fillRect(g.lx - 24, cy - 18, 5, 36); }
          ctx.globalAlpha = 1;
        });
        if (b1 > 0) {   // 最高和最低：两根虚线引到右边一根竖线上
          const ya = g.y0 + g.rh / 2, yb = g.y0 + (n - 1) * g.rh + g.rh / 2, X0 = bx(g);
          ctx.globalAlpha = b1;
          line(ctx, [[g.x0 + mx * g.sc + 100, ya], [X0, ya], [X0, yb], [g.x0 + I[n - 1].v * g.sc + 100, yb]], s === 'editorial' ? acc() : ink(0.6), 1, [3, 3]);
          ctx.globalAlpha = 1;
        }
        if (thr != null) {
          const xx = g.x0 + thr * g.sc; ctx.fillStyle = s === 'gallery' ? acc() : ink(); ctx.fillRect(xx - 0.75, g.y0 - 6, 1.5, n * g.rh + 12);
          rd.innerHTML = `错题率 ${Math.floor(thr)}% 以上：<b>${I.filter((it) => it.v >= thr).length}</b> 个单元`; set(rd, { o: 1 });
        } else set(rd, { o: 0 });
      },
      article: () => aBars(I.map((it, i) => ({ label: it.label, v: it.v, text: `${it.v}${d.unit}`, cls: i === 0 ? 'ac' : '' })), mx) + `<p class="a-note">最高是最低的 <b>${fmt(ratio, 1)}</b> 倍。</p>`,
    });
  };

  TYPES.voices = (d) => {
    const V = d.items, n = V.length;
    const pos = V.map((v, i) => (v.tone === 'pos' ? i : -1)).filter((i) => i >= 0), neg = V.map((v, i) => (v.tone === 'neg' ? i : -1)).filter((i) => i >= 0);
    const [sec, pg, S] = mk(d, 'voices', 2, `
  <i class="vc-mat e0" aria-hidden="true"></i>
  ${V.map((v) => `<div class="vc e0 ${v.tone}"><p>${esc(v.text)}</p><em class="lb">${v.tone === 'neg' ? '<i class="vng">不好</i>' : ''}${esc(v.tag)}</em></div>`).join('')}
  <p class="vc-cnt e0 lb blk"${srcA(d.src)}>好的 ${pos.length} 条 · 不好的 ${neg.length} 条（顶上斜纹）</p>
  <p class="vc-nt nt blk" data-b="2">不好的 ${neg.length} 条里，2 条嫌 C 档题多：下学期 C 档从 9 题减到 7 题</p>`);
    const GEO = {
      precise: { x: 120, y: 262, w: 1680, cols: 4, gx: 24, gy: 24, ch: 250, cnt: [120, 822, 520], nt: [680, 806, 1120] },
      theater: { x: 160, y: 262, w: 1600, cols: 4, gx: 24, gy: 24, ch: 250, cnt: [160, 822, 520], nt: [720, 806, 1040] },
      editorial: { x: 120, y: 440, w: 1180, cols: 2, gx: 20, gy: 12, ch: 108, cnt: [1360, 440, 440], nt: [1360, 520, 440] },
      gallery: { x: 220, y: 340, w: 1480, cols: 4, gx: 32, gy: 24, ch: 236, cnt: [220, 872, 560], nt: [860, 852, 840], mat: [160, 300, 1600, 640] },
    };
    const cards = $$(sec, '.vc'), cnt = $(sec, '.vc-cnt'), nt = $(sec, '.vc-nt'), mat = $(sec, '.vc-mat');
    const cw = (g) => (g.w - (g.cols - 1) * g.gx) / g.cols;
    function place() { const g = adj(sec, GEO[sk()]); cards.forEach((e, i) => px(e, g.x + (i % g.cols) * (cw(g) + g.gx), g.y + Math.floor(i / g.cols) * (g.ch + g.gy), cw(g), g.ch)); px(cnt, ...g.cnt); px(nt, ...g.nt); if (g.mat) px(mat, ...g.mat); }
    const lit = (b) => (b === 1 ? pos : b === 2 ? neg : V.map((_, i) => i));
    function show(b, dur) { const L = lit(b); cards.forEach((e, i) => { const on = L.includes(i), o = on ? 1 : sk() === 'gallery' ? 0.66 : 0.62; e.classList.toggle('on', on && b > 0); dur ? to(e, { o }, dur) : set(e, { o }); }); }
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 900); },
      async beat(k) { S.t0 = null; show(k, D.d(MO[sk()].dur)); return beatIn(pg, k, 500); },
      calm() { calmGroups(pg); show(D.b); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        neg.forEach((i) => { const e = cards[i]; const x = parseFloat(e.style.left), y = parseFloat(e.style.top); ctx.globalAlpha = +e.style.opacity || 0; hatch(ctx, x, y, cw(g), 7, ink(s === 'gallery' ? 0.55 : 0.75), 5); ctx.globalAlpha = 1; });
        if (S.a >= 1 && D.alive) {
          const L = lit(D.b), p = phase(S, t, L.length * 3.2, 1) * L.length, k = Math.min(L.length - 1, Math.floor(p)), u = E.inOut(clamp((p - k) * 1.1));
          const e = cards[L[k]], x = parseFloat(e.style.left), y = parseFloat(e.style.top);
          ctx.fillStyle = acc(); ctx.fillRect(x, y, cw(g) * u, s === 'gallery' ? 3 : 4);
        }
      },
      article: () => `<p class="a-who"${srcA(d.src)}>好的 ${pos.length} 条 · 不好的 ${neg.length} 条</p>${V.map((v) => `<blockquote class="a-v ${v.tone}">“${esc(v.text)}”<em>${esc(v.tag)}</em></blockquote>`).join('')}`,
    });
  };

  TYPES.chapter = (d, all) => {
    const [sec, pg, S] = mk(d, 'chapter', 0, `
  <div class="ch-no nm e0">${esc(d.no)}</div>
  <ol class="ch-ps e0">${d.parts.map((p, i) => `<li class="${i + 1 < +d.no ? 'done' : i + 1 === +d.no ? 'cur' : ''}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(p)}</li>`).join('')}</ol>`);
    const me = +sec.id.slice(1), N = all.length, chs = [1, ...all.map((p, i) => (p.type === 'chapter' ? i + 1 : 0)).filter(Boolean)];
    const GEO = { precise: { x: 120, y: 900, w: 1680 }, theater: { x: 560, y: 930, w: 800 }, editorial: { x: 120, y: 920, w: 1180 }, gallery: { x: 160, y: 930, w: 1600 } };
    return std(pg, {
      reset() { reset0(pg); },
      enter() { return enter0(pg, 1200); },
      tick() {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = GEO[sk()], s = sk(); if (!S.a) return;
        const X1 = (p) => g.x + (g.w * (p - 1)) / (N - 1), upto = lerp(1, me, E.enter(S.a));
        ctx.fillStyle = tone(0.25); ctx.fillRect(g.x, g.y, g.w, 1);
        ctx.fillStyle = s === 'editorial' ? acc() : ink(); ctx.fillRect(g.x, g.y - (s === 'gallery' ? 0 : 1), X1(upto) - g.x, s === 'gallery' ? 1 : 3);
        for (let p = 1; p <= N; p++) {
          const x = X1(p), here = p === me, ch = chs.includes(p);
          if (s === 'precise') { ctx.fillStyle = here ? acc() : p <= upto ? ink() : tone(0.3); ctx.fillRect(x - (ch ? 1 : 0.5), g.y - (ch ? 14 : 6), ch ? 2 : 1, ch ? 28 : 12); }
          else circ(ctx, x, g.y, here ? 6 : ch ? 4 : 2, here ? acc() : p <= upto ? ink(0.85) : tone(0.3));
          if (ch) txt(ctx, `${String(chs.indexOf(p) + 1).padStart(2, '0')}`, x, g.y - 22, cf(14, 500), here ? acc() : ink(0.55), 'center');
        }
        txt(ctx, `第 ${me} 页，共 ${N} 页`, g.x + g.w, g.y + 30, cf(14, 400, 'sans'), ink(0.5), 'right');
      },
      article: () => `<p class="a-big"><b>${esc(d.no)}</b></p><ol class="a-ol">${d.parts.map((p, i) => `<li class="${i + 1 === +d.no ? 'key' : ''}">${esc(p)}</li>`).join('')}</ol>`,
    });
  };

  TYPES.options = (d) => {
    const PL = d.plans, RW = d.rows, pick = Math.max(0, PL.findIndex((p) => p.key === d.pick));
    const [sec, pg, S] = mk(d, 'options', 1, `
  <i class="op-mat e0" aria-hidden="true"></i>${PL.map((p, j) => `<i class="op-pan e0 op-${j}" aria-hidden="true"></i>`).join('')}
  ${PL.map((p, j) => `<div class="op-h e0 op-${j}"><b class="op-k nm">${esc(p.key)}</b><span>${esc(p.name)}</span>${j === pick ? '<em>推荐</em>' : ''}</div>`).join('')}
  ${RW.map((r) => `<em class="op-rl e0">${esc(r.label)}</em>`).join('')}<em class="op-rl e0">风险</em><em class="op-rl" data-b="1">要注意</em>
  ${PL.map((p, j) => RW.map((r) => `<span class="op-v e0 op-${j}"><b class="nm"${r.k === 'hours' ? srcA(d.src) : ''}>${fmt(p.vals[r.k], 0)}</b><u>${esc(r.unit)}</u></span>`).join('') + `<span class="op-v op-r e0 op-${j}"><b>${esc(p.risk)}</b></span><p class="op-n op-${j}" data-b="1"><b class="op-nk">${esc(p.key)} · 要注意</b>${esc(p.note)}</p>`).join('')}`);
    const GEO = {
      precise: { lx: 120, lw: 380, xs: [560, 1180], cw: 620, hy: 290, y0: 414, rh: 84, pb: 940, pd: 28 },
      theater: { lx: 160, lw: 400, xs: [600, 1200], cw: 560, hy: 290, y0: 414, rh: 84, pb: 940, pd: 28 },
      editorial: { lx: 120, lw: 300, xs: { 0: 440, 1: 880 }, cw: 420, hy: 440, y0: 560, rh: 100, pb: 940, pd: 24, side: { x: 1360, w: 440 } }, // xs 用对象：数组第二个数 ≥380 会被 adj 当成纵坐标挪走
      gallery: { lx: 220, lw: 360, xs: [640, 1180], cw: 520, hy: 340, y0: 460, rh: 72, pb: 916, pd: 28, mat: [160, 290, 1600, 650] },
    };
    const pans = $$(sec, '.op-pan'), mat = $(sec, '.op-mat');
    const hs = $$(sec, '.op-h'), rls = $$(sec, '.op-rl'), cells = (j) => $$(sec, `.op-v.op-${j}, .op-n.op-${j}, .op-h.op-${j}`);
    S.f = pick;
    function place() {
      const g = adj(sec, GEO[sk()]);
      hs.forEach((e, j) => px(e, g.xs[j], g.hy, g.cw - 60));
      rls.forEach((e, i) => px(e, g.lx, g.y0 + i * g.rh, g.lw));
      PL.forEach((_, j) => { $$(sec, `.op-v.op-${j}`).forEach((e, i) => px(e, g.xs[j], g.y0 + i * g.rh - 10, g.cw)); const n = $(sec, `.op-n.op-${j}`); if (g.side) px(n, g.side.x, g.hy + j * 190, g.side.w); else px(n, g.xs[j], g.y0 + (RW.length + 1) * g.rh, g.cw - 60); });
      const pt = g.hy - g.pd; // 底板从表头上方一点开始，落到 pb（pb 不在 adj 的键里，不跟着移）
      pans.forEach((e, j) => px(e, g.xs[j] - g.pd, pt, g.cw - 60 + 2 * g.pd, g.pb - pt));
      if (g.mat) px(mat, ...g.mat);
    }
    function focus(j, dur) {
      S.fj = j; hs.forEach((e, k) => e.classList.toggle('on', k === j)); pans.forEach((e, k) => e.classList.toggle('on', k === j));
      PL.forEach((_, k) => cells(k).forEach((e) => { if (e.dataset.b && (S.bn || 0) < +e.dataset.b) return; const o = k === j || e.classList.contains('op-n') || e.classList.contains('op-r') ? 1 : 0.62; dur ? to(e, { o }, dur) : set(e, { o }); }));
      if (dur) { const f0 = S.f; tween(dur, (v) => { S.f = lerp(f0, j, v); }); } else S.f = j;
    }
    D.onV = () => {
      if (D.pages[D.p] !== pg) return false;
      const j = (S.fj + 1) % PL.length; focus(j, D.d(420));
      D.toast(`正在看方案 ${PL[j].key}：${PL[j].name}${j === pick ? '（推荐）' : ''}。再按 V 切回。`, 2600); return true;
    };
    return std(pg, {
      reset() { reset0(pg); place(); S.bn = 0; S.fj = pick; S.f = pick; hs.forEach((e, k) => e.classList.toggle('on', k === pick)); }, reskin() { place(); },
      async enter() { place(); await enter0(pg, 1000); focus(S.fj); },
      async beat(k) { S.bn = k; await beatIn(pg, k, 500); focus(S.fj); },
      calm() { calmGroups(pg); S.bn = D.b; focus(S.fj); },
      tick() {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        RW.forEach((r, i) => {
          const m = Math.max(...PL.map((p) => p.vals[r.k])), y = g.y0 + i * g.rh + (s === 'editorial' ? 36 : 44);
          PL.forEach((p, j) => {
            const w = (p.vals[r.k] / m) * (g.cw - 60) * E.enter(clamp(S.a * 1.4 - i * 0.1)), on = 1 - Math.abs(S.f - j);
            ctx.fillStyle = on > 0.5 ? (s === 'editorial' ? acc() : ink(s === 'theater' ? 0.85 : 0.9)) : tone(0.3);
            ctx.globalAlpha = lerp(0.5, 1, on);
            ctx.fillRect(g.xs[j], y, w, { precise: 8, theater: 6, editorial: 4, gallery: 3 }[s]);
            ctx.globalAlpha = 1;
          });
          ctx.fillStyle = tone(0.15); ctx.fillRect(g.lx, g.y0 + i * g.rh + g.rh - 14, g.xs[1] + g.cw - 60 + g.pd - g.lx, 1);
        });
      },
      article: () => `<table class="a-tb"><tr><th></th>${PL.map((p, j) => `<th class="${j === pick ? 'ac' : ''}">${esc(p.key)} · ${esc(p.name)}${j === pick ? '（推荐）' : ''}</th>`).join('')}</tr>
        ${RW.map((r) => `<tr><td>${esc(r.label)}</td>${PL.map((p) => `<td><b>${fmt(p.vals[r.k], 0)}</b> ${esc(r.unit)}</td>`).join('')}</tr>`).join('')}<tr><td>风险</td>${PL.map((p) => `<td>${esc(p.risk)}</td>`).join('')}</tr><tr><td>要注意</td>${PL.map((p) => `<td>${esc(p.note)}</td>`).join('')}</tr></table>`,
    });
  };

  TYPES.gantt = (d) => {
    const day = (s) => Math.round((Date.parse(s + 'T00:00:00') - Date.parse(d.start + 'T00:00:00')) / 864e5), ND = day(d.end) + 1;
    const RW = d.rows.map((r) => ({ ...r, a: day(r.from), b: day(r.to) + 1 })), n = RW.length;
    const md = (k) => { const t = new Date(Date.parse(d.start + 'T00:00:00') + k * 864e5); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const wk = (k) => '日一二三四五六'[new Date(Date.parse(d.start + 'T00:00:00') + k * 864e5).getDay()];
    const M = d.miles.map((m, i) => ({ ...m, k: day(m.at) + (i === 0 ? 1 : 0) }));
    const [sec, pg, S] = mk(d, 'gantt', 2, `
  ${RW.map((r) => `<div class="gt-l e0${r.key ? ' key' : ''}"><b>${esc(r.label)}</b><em class="lb">${md(r.a)}–${md(r.b - 1)} · ${esc(r.who)}</em></div>`).join('')}
  ${M.map((m, i) => `<span class="gt-m" data-b="${i + 1}"${srcA(d.src)}>${esc(m.label)} ${md(day(m.at))}</span>`).join('')}
  <p class="gt-nt nt blk" data-b="2">试做和开学第一周重叠一周：另外 3 位老师边试边用，有问题当天找我</p>
  <div class="gt-rd rd" aria-hidden="true"></div>`);
    const GEO = {
      precise: { lx: 120, lw: 380, x0: 540, x1: 1800, y0: 330, rh: 92, bh: 34, nt: [540, 862, 1260], rd: [1100, 236, 700] },
      theater: { lx: 200, lw: 400, x0: 640, x1: 1720, y0: 330, rh: 94, bh: 26, nt: [640, 900, 1080], rd: [1020, 236, 700] },
      editorial: { lx: 120, lw: 320, x0: 460, x1: 1280, y0: 500, rh: 76, bh: 22, nt: [1360, 470, 440], rd: [1360, 600, 440] },
      gallery: { lx: 220, lw: 320, x0: 580, x1: 1280, y0: 420, rh: 84, bh: 2, nt: [1400, 420, 360], rd: [1400, 560, 360] },
    };
    const ls = $$(sec, '.gt-l'), ms = $$(sec, '.gt-m'), nt = $(sec, '.gt-nt'), rd = $(sec, '.gt-rd');
    const Xd = (g, k) => g.x0 + (k / ND) * (g.x1 - g.x0);
    function place() {
      const g = adj(sec, GEO[sk()]);
      ls.forEach((e, i) => px(e, g.lx, g.y0 + i * g.rh + g.rh / 2 - 26, g.lw));
      ms.forEach((e, i) => px(e, Xd(g, M[i].k) + 8, g.y0 + n * g.rh + 6));
      px(nt, ...g.nt); px(rd, ...g.rd);
    }
    return std(pg, {
      reset() { reset0(pg); set(rd, { o: 0 }); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1500); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(); if (!S.a) return;
        const yT = g.y0 - 8, yB = g.y0 + n * g.rh;
        for (let k = 0; k <= ND; k += 7) { const x = Xd(g, k); ctx.fillStyle = tone(k % 14 ? 0.1 : 0.16); ctx.fillRect(x, yT, 1, yB - yT); if (k < ND) txt(ctx, md(k), x + 6, yT - 12, cf(14), ink(0.55)); }
        const b1 = S.b[1] || 0, b2 = S.b[2] || 0;
        RW.forEach((r, i) => {
          const f = clamp(S.a * (n + 1) - i); if (!f) return;
          const y = g.y0 + i * g.rh + g.rh / 2, x0 = Xd(g, r.a), w = (Xd(g, r.b) - x0) * E.enter(f);
          const col = r.key && b1 > 0 ? acc() : b1 > 0 ? (s === 'theater' ? tone(0.45) : tone(0.5)) : s === 'theater' ? tone(0.7) : ink(0.88);
          ctx.fillStyle = col; ctx.fillRect(x0, y - g.bh / 2, w, g.bh);
          if (s === 'gallery') { circ(ctx, x0, y, 3.5, col); circ(ctx, x0 + w, y, 3.5, col); }
        });
        M.forEach((m, i) => { const b = i === 0 ? b1 : b2; if (!b) return; const x = Xd(g, m.k); ctx.globalAlpha = b; ctx.fillStyle = i === 0 ? acc() : ink(); ctx.fillRect(x - 1, yT - 4, 2, (yB - yT + 30) * E.enter(b)); ctx.globalAlpha = 1; });
        if (S.a >= 1 && D.alive) {
          const k = Math.min(ND - 1, Math.floor(phase(S, t, 24, 2) * ND)), x = Xd(g, k + 0.5);
          line(ctx, [[x, yT - 4], [x, yB + 4]], ink(s === 'theater' ? 0.5 : 0.42), 1.5, [5, 6]);
          const doing = RW.filter((r) => k >= r.a && k < r.b).map((r) => r.label);
          rd.innerHTML = `走到 ${md(k)}（周${wk(k)}）：${doing.length ? `在做 <b>${doing.map(esc).join('、')}</b>` : '这一天没有排事'}`; if (s === 'precise' || s === 'theater') { rd.style.width = 'auto'; rd.style.textAlign = 'left'; rd.style.left = clamp(x - 10, g.x0, g.x1 - rd.offsetWidth) + 'px'; }
          set(rd, { o: 1 });
        } else set(rd, { o: 0 });
      },
      article: () => `<div class="a-rows">${RW.map((r) => `<div class="${r.key ? 'miss' : ''}"><span>${esc(r.label)}</span><b>${md(r.a)}–${md(r.b - 1)}</b><em>${esc(r.who)}</em></div>`).join('')}</div><p class="a-note">${M.map((m) => `${esc(m.label)} ${md(day(m.at))}`).join('　')}</p>`,
    });
  };

  TYPES.risk = (d) => {
    const R = d.items, n = R.length;
    const [sec, pg, S] = mk(d, 'risk', n, `
  ${R.map((r, i) => `<div class="rs-i e0 blk${i === 0 ? ' key' : ''}"><span class="rs-n nm">${esc(r.n)}</span><p class="rs-t">${esc(r.text)}</p><p class="rs-p" data-b="${i + 1}"><em>退路</em>${esc(r.plan)}</p></div>`).join('')}`);
    const GEO = {
      precise: { mx: 200, my: 300, ms: 540, lx: 872, lw: 928, ly: 260, lh: 216, lg: 16, pan: [120, 260, 728, 680] },
      theater: { mx: 250, my: 300, ms: 560, lx: 940, lw: 820, ly: 280, lh: 200, lg: 20 },
      editorial: { mx: 1424, my: 480, ms: 370, lx: 120, lw: 1180, ly: 480, lh: 150, lg: 14 },
      gallery: { mx: 270, my: 350, ms: 450, lx: 820, lw: 880, ly: 340, lh: 168, lg: 20, pan: [160, 300, 1600, 620] },
    };
    sec.insertAdjacentHTML('afterbegin', '<i class="rs-pan e0"></i>'); pg.e0 = $$(sec, '.e0');
    const it = $$(sec, '.rs-i'), pan = $(sec, '.rs-pan');
    function place() { const g = adj(sec, GEO[sk()]); it.forEach((e, i) => px(e, g.lx, g.ly + i * (g.lh + g.lg), g.lw, g.lh)); if (g.pan) px(pan, ...g.pan); pan.style.display = g.pan ? '' : 'none'; }
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 1000); },
      tick() {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(), c = g.ms / 3; if (!S.a) return;
        ctx.globalAlpha = S.a;
        for (let p = 1; p <= 3; p++) for (let q = 1; q <= 3; q++) {
          const x = g.mx + (p - 1) * c, y = g.my + (3 - q) * c, sc = p * q;
          ctx.fillStyle = sc >= 6 ? tone(s === 'theater' ? 0.16 : 0.12) : sc >= 3 ? tone(s === 'theater' ? 0.08 : 0.06) : D.rgba('bg', 0);
          ctx.fillRect(x + 1, y + 1, c - 2, c - 2);
        }
        ctx.strokeStyle = s === 'gallery' ? tone(0.35) : ink(s === 'theater' ? 0.35 : 0.8); ctx.lineWidth = s === 'precise' ? 1.5 : 1;
        for (let k = 0; k <= 3; k++) { line(ctx, [[g.mx + k * c, g.my], [g.mx + k * c, g.my + g.ms]], ctx.strokeStyle, ctx.lineWidth); line(ctx, [[g.mx, g.my + k * c], [g.mx + g.ms, g.my + k * c]], ctx.strokeStyle, ctx.lineWidth); }
        ['低', '中', '高'].forEach((l, k) => { txt(ctx, l, g.mx + (k + 0.5) * c, g.my + g.ms + 28, cf(16, 400, 'sans'), ink(0.6), 'center'); txt(ctx, l, g.mx - 12, g.my + g.ms - (k + 0.5) * c + 6, cf(16, 400, 'sans'), ink(0.6), 'right'); });
        txt(ctx, '会不会发生 →', g.mx + g.ms, g.my + g.ms + 58, cf(16, 500, 'sans'), ink(0.75), 'right');
        ctx.save(); ctx.translate(g.mx - 44, g.my); ctx.rotate(-Math.PI / 2); txt(ctx, '影响多大 →', 0, 0, cf(16, 500, 'sans'), ink(0.75), 'right'); ctx.restore();
        ctx.globalAlpha = 1;
        R.forEach((r, i) => {
          const f = clamp(S.a * (n + 1) - i - 0.5); if (!f) return;
          const x = g.mx + (r.p - 0.5) * c, y = g.my + (3 - r.i + 0.5) * c, key = i === 0, cur = D.b === i + 1, rr = (s === 'gallery' ? 18 : s === 'theater' ? 30 : 26) * E.enter(f);
          if (s === 'precise') { ctx.fillStyle = key ? acc() : ink(); ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
          else circ(ctx, x, y, rr, s === 'gallery' ? D.rgba('bg') : key ? acc() : ink(), s === 'gallery' ? (key ? acc() : ink()) : null, s === 'gallery' ? 2 : 1.2);
          if (cur && f >= 1) { ctx.strokeStyle = acc(); ctx.lineWidth = 2; if (s === 'precise') ctx.strokeRect(x - rr - 8, y - rr - 8, rr * 2 + 16, rr * 2 + 16); else { ctx.beginPath(); ctx.arc(x, y, rr + 8, 0, 7); ctx.stroke(); } }
          txt(ctx, r.n, x, y + 6, cf(s === 'gallery' ? 15 : 17, 600), s === 'gallery' ? (key ? acc() : ink()) : D.rgba('bg'), 'center');
        });
      },
      article: () => R.map((r) => `<p class="a-note"><b>${esc(r.n)} ${esc(r.text)}</b><br>会不会发生 ${'低中高'[r.p - 1]} · 影响 ${'低中高'[r.i - 1]}<br>退路：${esc(r.plan)}</p>`).join(''),
    });
  };

  TYPES.people = (d) => {
    const P = d.people, n = P.length, mins = P.map((p) => minutes(p.time)), cap = Math.max(...mins), tot = mins.reduce((a, b) => a + b, 0);
    const [sec, pg, S] = mk(d, 'people', 1, `
  <i class="pp-mat e0"></i>
  ${P.map((p) => `<div class="pp e0"><b class="pp-nm">${esc(p.name)}</b><em class="lb">${esc(p.role)}</em><p>${esc(p.does)}</p></div>`).join('')}
  ${P.map((p) => `<span class="pp-t" data-b="1">${esc(p.time)}</span>`).join('')}
  <p class="pp-sum blk" data-b="1">${n} 个人每周一共多花 <b>${Math.floor(tot / 60)} 小时${tot % 60 ? ` ${tot % 60} 分` : ''}</b><span class="pp-cm">，</span>每人都不超过 ${cap} 分钟</p>`);
    const GEO = {
      precise: { m: 'cols', x: 120, y: 260, w: 1680, gap: 24, h: 520, sum: [120, 820, 1680] },
      theater: { m: 'rows', x: 160, y: 270, w: 1600, rh: 132, rg: 14, sum: [160, 870, 1600] },
      editorial: { m: 'cols', x: 120, y: 480, w: 1180, gap: 20, bot: 940, sum: [1360, 480, 440] },
      gallery: { m: 'cols', x: 220, y: 330, w: 1480, gap: 40, h: 460, sum: [220, 858, 1480], mat: [160, 290, 1600, 540] },
    };
    const cards = $$(sec, '.pp'), ts = $$(sec, '.pp-t'), sum = $(sec, '.pp-sum'), mat = $(sec, '.pp-mat');
    const cw = (g) => (g.w - (n - 1) * g.gap) / n;
    const card = (g, i) => (g.m === 'rows' ? { x: g.x, y: g.y + i * (g.rh + g.rg), w: g.w, h: g.rh } : { x: g.x + i * (cw(g) + g.gap), y: g.y, w: cw(g), h: g.bot ? g.bot - g.y : g.h });
    const bar = (g, c) => (g.m === 'rows' ? { x: c.x + 1120, y: c.y + c.h / 2 + 4, w: 440 } : { x: c.x + 32, y: c.y + c.h - 56, w: c.w - 64 });
    function place() {
      const g = adj(sec, GEO[sk()]); sec.dataset.m = g.m;
      cards.forEach((e, i) => { const c = card(g, i); px(e, c.x, c.y, c.w, c.h); const B = bar(g, c); px(ts[i], B.x, B.y - 34, B.w); });
      px(sum, ...g.sum); if (g.mat) px(mat, ...g.mat); mat.style.display = g.mat ? '' : 'none';
    }
    return std(pg, {
      reset() { reset0(pg); place(); }, reskin() { place(); },
      enter() { place(); return enter0(pg, 900); },
      tick() {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        const g = adj(sec, GEO[sk()]), s = sk(), b1 = S.b[1] || 0; if (!b1) return;
        const h = { precise: 12, theater: 8, editorial: 8, gallery: 4 }[s];
        P.forEach((p, i) => {
          const c = card(g, i), B = bar(g, c), W = B.w, x = B.x, by = B.y, w = (mins[i] / 60) * W * E.enter(b1);
          ctx.fillStyle = tone(0.12); ctx.fillRect(x, by, W, h);
          ctx.fillStyle = i === 0 ? acc() : ink(s === 'theater' ? 0.8 : 0.9); ctx.fillRect(x, by, w, h);
          const xc = x + (cap / 60) * W; line(ctx, [[xc, by - 8], [xc, by + h + 8]], ink(0.6), 1, [2, 2]);
          if (i === 0) txt(ctx, `${cap} 分钟`, xc, by + h + 24, cf(13, 400, 'sans'), ink(0.6), 'center');
          txt(ctx, '60', x + W, by + h + 24, cf(13), ink(0.5), 'right');
        });
      },
      article: () => P.map((p) => `<p class="a-note"><b>${esc(p.name)}</b> · ${esc(p.role)}<br>${esc(p.does)}<br><span class="a-who">${esc(p.time)}</span></p>`).join(''),
    });
  };
})();
