(() => {
  const D = Deck, { E, tween, wait, set, to, count, clamp, lerp } = D;
  const X = window.__TYPES, { TYPES, frame, base, beatIn, calmGroups, appear, hide, showNow, phase, esc, fmt, sgn, srcA, txt, cf, hatch, ink, tone, acc, MO, tpl, CALC, hours, calcVals, paintCalc, $, $$ } = X;
  const C = window.DECK_CONTENT;
  const edge = () => D.rgba('edge');
  const minutes = (s) => { if (typeof s === 'number') return s; const h = /(\d+)\s*小时/.exec(s), m = /(\d+)\s*分/.exec(s); return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0); };
  const num = (v) => (typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-−+]/g, '').replace('−', '-')));
  const dig = (v) => { const s = String(v); return s.includes('.') ? s.split('.')[1].replace(/\D.*$/, '').length : 0; };

  function off(el, root) { const w = el.offsetWidth, h = el.offsetHeight; let x = 0, y = 0; while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return { x, y, w, h }; }
  function box(el, root) {
    const o = off(el, root), c = el.closest('.c1,.band,.prio,.ca1-c,.ca1-l') || el, st = c._st || { o: 1, y: 0 };
    return { ...o, y: o.y + (st.y || 0), a: st.o == null ? 1 : st.o };
  }
  function line(ctx, pts, color, lw = 1, dash) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]); }
  const sharp = (v) => Math.round(v) + 0.5;
  function ruler(ctx, B, val, max, o = {}) {
    const { x, y, w, h } = B, by = y + h - 14, bh = o.bh || 10, step = o.step || max / 10, major = o.major || max / 2, fill = o.fill == null ? 1 : o.fill;
    const X0 = (v) => x + (v / max) * w;
    ctx.fillStyle = tone(0.08); ctx.fillRect(x, by - bh - 2, w, bh);
    for (let v = 0; v <= max + 1e-6; v += step) {
      const M = Math.abs(v / major - Math.round(v / major)) < 1e-6, xx = sharp(X0(v));
      line(ctx, [[xx, by], [xx, by + (M ? 7 : 4)]], M ? ink(0.55) : ink(0.28), 1);
      if (M) txt(ctx, fmt(v, dig(step)), xx, by + 13, cf(12), ink(0.45), v === 0 ? 'left' : v >= max - 1e-6 ? 'right' : 'center', 'top');
    }
    line(ctx, [[x, sharp(by)], [x + w, sharp(by)]], ink(0.55), 1);
    if (o.ghost) { ctx.fillStyle = tone(0.18); ctx.fillRect(x, by - bh - 2, X0(val) - x, bh); }
    if (fill > 0) { ctx.fillStyle = o.color || tone(0.62); ctx.fillRect(x, by - bh - 2, (X0(val) - x) * fill, bh); }
    if (o.cap != null) { const xc = sharp(X0(o.cap)); line(ctx, [[xc, by - bh - 8], [xc, by + 2]], ink(0.75), 1, [3, 3]); }
  }
  function bars(ctx, B, rows, max, o = {}) {
    const rh = o.rh || 30, lw = o.lw == null ? 132 : o.lw, vw = o.vw || 64, bh = o.bh || 10, hi = Math.max(0, rows.findIndex((r) => r[3]));
    rows.forEach((r, i) => {
      const y = B.y + i * rh, w0 = B.w - lw - vw - 12, v = Math.abs(r[1]), w = (v / max) * w0, x0 = B.x + lw;
      if (lw) txt(ctx, r[0], B.x, y + rh / 2 + 1, cf(15, 400, 'sans'), ink(0.62), 'left', 'middle');
      ctx.fillStyle = tone(0.08); ctx.fillRect(x0, y + rh / 2 - bh / 2, w0, bh);
      const f = o.fill == null ? 1 : o.fill, col = i === hi ? o.c0 || acc() : o.c1 || tone(0.5);
      if (o.ghost) { ctx.fillStyle = tone(0.2); ctx.fillRect(x0, y + rh / 2 - bh / 2, w, bh); }
      if (r[1] < 0) hatch(ctx, x0, y + rh / 2 - bh / 2, Math.max(2, w * f), bh, ink(0.6), 5);
      else if (f > 0) { ctx.fillStyle = col; ctx.fillRect(x0, y + rh / 2 - bh / 2, w * f, bh); }
      txt(ctx, r[2] != null ? r[2] : fmt(r[1], dig(r[1])), B.x + B.w, y + rh / 2 + 1, cf(16, 600), i === hi ? ink(0.95) : ink(0.6), 'right', 'middle');
    });
  }
  function mk(d, type, beats, inner) {
    const sec = frame(d, 's1-' + type, `<div class="s1w">${inner}</div>`); sec.classList.add('x3', 's1');
    const pg = base(sec, d, beats); pg.type = type; pg.e0 = $$(sec, '.e0');
    pg.S.b = Array(12).fill(0);
    return [sec, pg, pg.S];
  }
  const setVar = (el, k, v) => el.style.setProperty(k, v);
  async function enterCards(pg, dur = 1000) {
    X.enterHead(pg);
    const st = 70;
    pg.e0.forEach((e, k) => {
      appear(e, D.d(120 + k * st));
      $$(e, '.c1-h,.c1-f').forEach((h) => { setVar(h, '--rl', 0); tween(D.d(520), (v) => setVar(h, '--rl', v), { delay: D.d(220 + k * st) }); });
      $$(e, '[data-cnt]').forEach((n) => { const v = +n.dataset.cnt, dg = +(n.dataset.dg || 0); count(n, 0, v, D.d(760), { delay: D.d(200 + k * st), fmt: (x) => fmt(x, dg) }); });
    });
    await tween(D.d(dur), (v) => { pg.S.a = v; }, { ease: E.enter, delay: D.d(120) });
  }
  function reset1(pg) { pg.el._adjK = null; for (const g of pg.groups.slice(1)) g.forEach(hide); pg.e0.forEach(hide); pg.S.a = 0; pg.S.b.fill(0); pg.S.t0 = null; $$(pg.el, '.c1-h,.c1-f').forEach((h) => setVar(h, '--rl', 1)); }
  function bar(el, on, dur) { const v0 = parseFloat(el.style.getPropertyValue('--on')) || 0, v1 = on ? 1 : 0; if (!dur || v0 === v1) return setVar(el, '--on', v1); tween(dur, (v) => setVar(el, '--on', lerp(v0, v1, v)), { ease: E.enter }); }
  function std(pg, o) { return Object.assign(pg, { beat: (n) => beatIn(pg, n, 700), calm() { calmGroups(pg); }, resize() { pg.cv.fit(); } }, o); }
  function bigNum(v, unit, extra = '') {
    const n = num(v), sign = /^[+−-]/.test(String(v)) ? String(v)[0].replace('-', '−') : '';
    const body = Number.isFinite(n) && /^[+−-]?[\d.,]+$/.test(String(v).trim()) ? `${sign}<span data-cnt="${Math.abs(n)}" data-dg="${dig(v)}">${fmt(Math.abs(n), dig(v))}</span>` : esc(v);
    return `<b class="c1-big"${extra}>${body}${unit ? `<u>${esc(unit)}</u>` : ''}</b>`;
  }
  function bigTime(m, extra = '', unit2 = '分钟') {
    const h = Math.floor(m / 60), r = m % 60;
    const inner = h ? `<span data-cnt="${h}">${h}</span><u>小时</u>${r ? `<span data-cnt="${r}">${r}</span><u>分</u>` : ''}` : `<span data-cnt="${r}">${r}</span><u>${unit2}</u>`;
    return `<b class="c1-big"${extra}>${inner}</b>`;
  }
  const hm = (m) => `${Math.floor(m / 60) ? Math.floor(m / 60) + ' 小时' : ''}${m % 60 ? ` ${m % 60} 分` : ''}`.trim() || '0 分';

  TYPES.argue = (d) => {
    const EV = d.evidence, n = EV.length;
    const [sec, pg, S] = mk(d, 'argue', n + 1, `
  <div class="prio ar1-c e0"><span class="prio-l">结论</span><p class="ar1-ct">${esc(d.claim)}</p></div>
  <div class="row" style="grid-template-columns:repeat(${n},1fr)">${EV.map((e, i) => `<div class="c1 e0"><div class="c1-h"><span class="c1-no">依据 <b>${esc(e.n || String(i + 1).padStart(2, '0'))}</b></span>${e.tag ? `<em class="pill">${esc(e.tag)}</em>` : ''}</div>
    <div class="c1-b">${e.big != null ? bigNum(e.big, e.unit, srcA(e.src)) : ''}<p class="c1-act"${e.big == null ? srcA(e.src) : ''}>${esc(e.text)}</p></div>
    <div class="c1-f">${e.detail ? `<p class="c1-d">${esc(e.detail)}</p>` : ''}${e.bars ? `<i class="c1-g" style="height:${e.bars.length * 36}px"></i>` : ''}</div></div>`).join('')}</div>
  <div class="ar1-k e0"><div class="ar1-q"><em>反方会问</em><p>${esc(d.counter.q)}</p></div><div class="ar1-a" data-b="${n + 1}"><em>回应</em><p${srcA(d.counter.src)}>${esc(d.counter.a)}</p></div></div>`);
    const cards = $$(sec, '.c1'), gs = cards.map((c) => $(c, '.c1-g')), claim = $(sec, '.ar1-c'), ans = $(sec, '.ar1-a');
    S.f = EV.map(() => 0);
    const mx = (e) => Math.max(...e.bars.map((r) => Math.abs(r[1])));
    return std(pg, {
      reset() { reset1(pg); S.f = EV.map(() => 0); cards.forEach((c) => bar(c, 0)); setVar(claim, '--on', 1); setVar(ans, '--on', 0); },
      enter() { setVar(claim, '--on', 0); tween(D.d(700), (v) => setVar(claim, '--on', v), { delay: D.d(160) }); return enterCards(pg, 900); },
      async beat(k) {
        if (k <= n) { bar(cards[k - 1], 1, D.d(420)); cards.forEach((c, i) => c.classList.toggle('cur', i === k - 1)); tween(D.d(900), (v) => { S.f[k - 1] = v; }, { ease: E.enter, delay: D.d(120) }); }
        else { cards.forEach((c) => c.classList.remove('cur')); tween(D.d(600), (v) => setVar(ans, '--on', v), { delay: D.d(200) }); }
        S.t0 = null; return beatIn(pg, k, 700);
      },
      calm() { calmGroups(pg); cards.forEach((c, i) => { bar(c, i < D.b ? 1 : 0); c.classList.toggle('cur', D.b <= n && i === D.b - 1); S.f[i] = i < D.b ? 1 : 0; }); setVar(ans, '--on', D.b > n ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const said = EV.map((_, i) => i).filter((i) => S.f[i] >= 1);
        let replay = -1, rf = 1;
        if (said.length && D.alive && D.b >= 1) { const per = 2.2, p = phase(S, t, per * said.length, 1.6) * said.length, k = Math.min(said.length - 1, Math.floor(p)); replay = said[k]; rf = E.enter(clamp((p - k) * 1.4)); }
        EV.forEach((e, i) => {
          if (!gs[i]) return; const B = box(gs[i], sec); ctx.globalAlpha = B.a * S.a;
          const f = i === replay ? rf : S.f[i];
          bars(ctx, B, e.bars.map((r) => [r[0], num(r[1]), r[2], r[3]]), mx(e), { rh: 36, bh: 12, fill: f, ghost: true, c0: S.f[i] > 0 ? acc() : tone(0.62), c1: tone(0.42) });
        });
        ctx.globalAlpha = 1;
      },
      article: () => `<p class="a-claim"><b>${esc(d.claim)}</b></p><ol class="a-ol">${EV.map((e) => `<li${srcA(e.src)}>${e.big != null ? `<b>${esc(e.big)}${esc(e.unit || '')}</b> ` : ''}${esc(e.text)}${e.detail ? `<br><span class="a-who">${esc(e.detail)}</span>` : ''}</li>`).join('')}</ol>
        <p class="a-note"><b>反方会问：</b>${esc(d.counter.q)}<br><b>回应：</b><span${srcA(d.counter.src)}>${esc(d.counter.a)}</span></p>`,
    });
  };

  TYPES.process = (d) => {
    const ST = d.steps, n = ST.length, key = ST.findIndex((s) => s.key), mins = ST.map((s) => minutes(s.time)), notMine = ST.map((s) => !!s.notMine || s.who === '学生');
    const mine = mins.reduce((a, m, i) => a + (notMine[i] ? 0 : m), 0), all = mins.reduce((a, b) => a + b, 0), other = all - mine;
    const [sec, pg, S] = mk(d, 'process', 2, `
  <div class="band pr1-t e0"><div class="band-h"><span class="band-l">${esc(d.bandLabel || '一周 · 我花的时间')}</span><span class="band-t">共 <b${srcA(d.src)}>${hm(mine)}</b></span><span class="band-n">${other ? `斜纹是${esc(d.otherLabel || '不算我的时间')}（${hm(other)}）` : ''}</span></div><i class="band-g"></i></div>
  <div class="row" style="grid-template-columns:repeat(${n},1fr)">${ST.map((s, i) => `<div class="c1 e0"><div class="c1-h"><span class="c1-no">STEP <b>${String(i + 1).padStart(2, '0')}</b>${s.day ? ` · ${esc(s.day)}` : ''}</span><em class="pill${i === key ? ' ac' : ''}">${esc(s.who)}${i === key ? ' · 关键' : ''}</em></div>
    <div class="c1-b">${bigTime(mins[i], '', notMine[i] ? '分钟' : '分钟')}${notMine[i] && s.where ? `<span class="c1-lab">${esc(s.where)}</span>` : ''}<p class="c1-act">${esc(s.text)}</p></div>
    <div class="c1-f"><p class="c1-d">${esc(s.note)}</p><i class="c1-g" style="height:40px"></i></div></div>`).join('')}</div>
  ${d.why ? `<div class="prio tint" data-b="2" style="display:flex;gap:28px;align-items:center;min-height:84px"><span class="prio-l" style="flex:none">为什么省不得</span><p style="font-size:22px;line-height:1.45;font-weight:600">${esc(d.why)}</p></div>` : ''}`);
    const cards = $$(sec, '.c1'), gs = cards.map((c) => $(c, '.c1-g')), band = $(sec, '.pr1-t .band-g');
    const mx = Math.max(...mins), stepU = mx > 90 ? 15 : mx > 30 ? 5 : 1, majU = mx > 90 ? 60 : mx > 30 ? 15 : 5, rmax = Math.ceil(mx / majU) * majU;
    return std(pg, {
      reset() { reset1(pg); cards.forEach((c) => { bar(c, 0); c.classList.remove('cur'); }); },
      enter() { return enterCards(pg, 1100); },
      async beat(k) { if (k === 2 && key >= 0) bar(cards[key], 1, D.d(420)); return beatIn(pg, k, 900); },
      calm() { calmGroups(pg); cards.forEach((c, i) => bar(c, D.b >= 2 && i === key ? 1 : 0)); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const B = box(band, sec), gap = 3, W = B.w - gap * (n - 1), segX = []; let x = B.x;
        ctx.globalAlpha = B.a;
        ST.forEach((s, i) => {
          const w = (mins[i] / all) * W, f = clamp(S.a * (n + 1) - i), ww = w * E.enter(f), y = B.y, h = 30;
          segX.push([x, w]);
          if (notMine[i]) hatch(ctx, x, y, Math.max(1, ww), h, ink(0.5), 6);
          else { ctx.fillStyle = i === key ? acc() : tone(i % 2 ? 0.42 : 0.58); ctx.fillRect(x, y, ww, h); }
          if (f >= 1) {
            txt(ctx, `${String(i + 1).padStart(2, '0')}${s.day ? ' · ' + s.day : ''}`, x, y + h + 17, cf(14, 600), ink(0.8), 'left', 'middle');
            txt(ctx, hm(mins[i]), x, y + h + 37, cf(14, 400, 'sans'), ink(0.55), 'left', 'middle');
          }
          x += w + gap;
        });
        segX.forEach(([sx]) => line(ctx, [[sharp(sx), B.y - 6], [sharp(sx), B.y]], ink(0.5), 1));
        line(ctx, [[sharp(B.x + B.w), B.y - 6], [sharp(B.x + B.w), B.y]], ink(0.5), 1);
        let cur = -1;
        if (S.a >= 1 && D.alive) {
          const dw = mins.map((m, i) => 1.1 + (i === key ? 2.2 : 0)), tot = dw.reduce((a, b) => a + b, 0);
          let p = phase(S, t, tot, 1.4) * tot, i = 0; for (; i < n - 1 && p > dw[i]; i++) p -= dw[i];
          cur = i; const u = clamp(p / dw[i]), cx = segX[i][0] + segX[i][1] * u;
          line(ctx, [[sharp(cx), B.y - 10], [sharp(cx), B.y + 30 + 4]], ink(0.9), 1.5);
          ctx.fillStyle = ink(0.9); ctx.beginPath(); ctx.moveTo(cx - 5, B.y - 12); ctx.lineTo(cx + 5, B.y - 12); ctx.lineTo(cx, B.y - 5); ctx.fill();
        }
        cards.forEach((c, i) => c.classList.toggle('cur', i === cur));
        const b1 = S.b[1] || 0;
        ST.forEach((s, i) => {
          const G = box(gs[i], sec); ctx.globalAlpha = G.a * S.a;
          ruler(ctx, G, mins[i], rmax, { step: stepU, major: majU, fill: E.enter(b1), ghost: true, color: notMine[i] ? tone(0.45) : i === key ? acc() : tone(0.62) });
        });
        ctx.globalAlpha = 1;
      },
      article: () => `<p class="a-note">${esc(d.bandLabel || '一周 · 我花的时间')}：<b>${hm(mine)}</b></p><ol class="a-ol">${ST.map((s, i) => `<li class="${s.key ? 'key' : ''}"><b>${esc(s.day || '')} · ${esc(s.who)}：${esc(s.text)}</b>（${hm(mins[i])}）<br><span class="a-who">${esc(s.note)}</span></li>`).join('')}</ol>${d.why ? `<p class="a-note"><b>为什么省不得：</b>${esc(d.why)}</p>` : ''}`,
    });
  };

  TYPES.versions = (d) => {
    const V = d.vers, n = V.length, mx = Math.max(...V.map((v) => v.n));
    const pillOf = (v, i) => v.who || (i === n - 1 ? '定稿' : i === 0 ? 'AI 初稿' : v.said ? '我说一句' : '我改');
    const saidN = V.filter((v) => v.said).length;
    const [sec, pg, S] = mk(d, 'versions', n, `
  <div class="row" style="grid-template-columns:repeat(${n},1fr)">${V.map((v, i) => `<div class="c1 vr1 e0"><div class="c1-h"><span class="c1-no">V<b>${i + 1}</b> · ${esc(v.v)}</span><em class="pill${i === n - 1 && v.n === 0 ? ' ac' : ''}">${esc(pillOf(v, i))}</em></div>
    <i class="vr1-p"></i>
    <div class="c1-b"><b class="c1-big${i === n - 1 && v.n === 0 ? ' ac' : ''}"${srcA(d.src)}><span data-cnt="${v.n}">${v.n}</span><u>处毛病</u></b><p class="c1-act">${esc(v.note)}</p></div>
    <div class="c1-f"><i class="c1-g" style="height:24px;margin-top:0"></i><p class="c1-src">${i === 0 ? `第一版 ${v.n} 处` : V[i - 1].n - v.n > 0 ? `比上一版少 ${V[i - 1].n - v.n} 处` : '和上一版一样'}</p></div></div>`).join('')}</div>
  <div class="prio vr1-sum e0"><span class="prio-l">一共</span><p><b>${n}</b> 版，毛病从 <b>${V[0].n}</b> 处到 <b>${V[n - 1].n}</b> 处${saidN ? `；其中 ${saidN} 版靠我说一句话改好` : ''}</p><i></i></div>`);
    const cards = $$(sec, '.c1'), papers = cards.map((c) => $(c, '.vr1-p')), tal = cards.map((c) => $(c, '.c1-g')), spark = $(sec, '.vr1-sum i');
    const rnd = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const LINES = Array.from({ length: 11 }, (_, k) => ({ w: 0.5 + rnd(k) * 0.45, q: k >= 3 && k % 3 === 0 }));
    const SPOTS = Array.from({ length: Math.max(9, mx) }, (_, k) => [1 + (k * 4) % 10, 0.15 + rnd(k + 40) * 0.7]);
    const DIM = 0.66; S.focus = -1;
    function focus(k, dur) { S.focus = k; cards.forEach((c, i) => { const o = k < 0 || i === k ? 1 : DIM; dur ? to(c, { o }, dur) : set(c, { o }); bar(c, i === k ? 1 : 0, dur); }); }
    function paper(ctx, B, i, lit) {
      const { x, y, w, h } = B;
      const pw = w, px0 = x, pad = 18, lh = (h - 44) / LINES.length;
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(px0, y, pw, h); ctx.strokeStyle = edge(); ctx.lineWidth = 1; ctx.strokeRect(px0 + 0.5, y + 0.5, pw - 1, h - 1);
      ctx.fillStyle = tone(0.55); ctx.fillRect(px0 + pad, y + 14, pw * 0.36, 7); ctx.fillStyle = '#DCDCDC'; ctx.fillRect(px0 + pw - pad - pw * 0.18, y + 14, pw * 0.18, 7);
      ctx.fillStyle = tone(0.35); ctx.fillRect(px0 + pad, y + 28, pw - pad * 2, 1);
      LINES.forEach((L, k) => { const ly = y + 38 + k * lh; ctx.fillStyle = L.q ? '#9A9C9F' : '#D4D4D2'; ctx.fillRect(px0 + pad + (L.q ? 0 : 10), ly, (pw - pad * 2 - 10) * L.w, Math.max(2, lh * 0.32)); });
      for (let k = 0; k < V[i].n; k++) {
        const [row, fx] = SPOTS[k], cx = px0 + pad + 10 + (pw - pad * 2 - 10) * LINES[row].w * fx, cy = y + 38 + row * lh + lh * 0.16;
        ctx.globalAlpha *= lit == null || k < lit ? 1 : 0.2; const a0 = ctx.globalAlpha;
        ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.strokeStyle = acc(); ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = a0 / (lit == null || k < lit ? 1 : 0.2);
      }
    }
    return std(pg, {
      reset() { reset1(pg); focus(-1); },
      enter() { return enterCards(pg, 1200); },
      async beat(k) { S.t0 = null; focus(k - 1, D.d(MO.precise.dur)); return beatIn(pg, k, 500); },
      calm() { calmGroups(pg); focus(D.b > 0 ? D.b - 1 : -1); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        V.forEach((v, i) => {
          const B = box(papers[i], sec); ctx.globalAlpha = B.a;
          let lit = null; if (i === S.focus && D.alive && v.n) lit = Math.floor(phase(S, t, v.n * 0.6, 1.8) * v.n + 0.999);
          paper(ctx, B, i, lit);
          const T = box(tal[i], sec), cs = Math.min(22, (T.w - (mx - 1) * 5) / mx), prev = i ? V[i - 1].n : v.n;
          for (let k = 0; k < mx; k++) {
            const cx = T.x + k * (cs + 5), cy = T.y + (T.h - cs) / 2;
            if (k < v.n) { ctx.fillStyle = i === S.focus || (i === n - 1) ? acc() : tone(0.6); ctx.fillRect(cx, cy, cs, cs); }
            else if (k < prev) hatch(ctx, cx, cy, cs, cs, ink(0.55), 5);
            else { ctx.strokeStyle = tone(0.25); ctx.lineWidth = 1; ctx.strokeRect(cx + 0.5, cy + 0.5, cs - 1, cs - 1); }
          }
        });
        ctx.globalAlpha = 1;
        const P = box(spark, sec); ctx.globalAlpha = P.a;
        const sx = (i) => P.x + 30 + (i / (n - 1)) * (P.w - 60), sy = (v) => P.y + 22 + (1 - v / mx) * (P.h - 30), f = S.a;
        line(ctx, [[P.x, sharp(sy(0))], [P.x + P.w, sharp(sy(0))]], ink(0.4), 1);
        ctx.save(); ctx.beginPath(); ctx.rect(P.x - 2, P.y - 10, (P.w + 4) * E.enter(f), P.h + 20); ctx.clip();
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 2; ctx.beginPath();
        V.forEach((v, i) => { const xx = sx(i), yy = sy(v.n); if (!i) ctx.moveTo(xx, yy); else { ctx.lineTo(xx, sy(V[i - 1].n)); ctx.lineTo(xx, yy); } });
        ctx.stroke(); ctx.restore();
        V.forEach((v, i) => { const xx = sx(i), yy = sy(v.n), on = i === S.focus; ctx.fillStyle = on ? acc() : D.rgba('raise'); ctx.fillRect(xx - 5, yy - 5, 10, 10); ctx.strokeStyle = on ? acc() : ink(0.9); ctx.lineWidth = 1.5; ctx.strokeRect(xx - 5, yy - 5, 10, 10); txt(ctx, String(v.n), i ? xx - 10 : xx, i ? yy + 8 : yy - 12, cf(14, 600), on || (i === n - 1 && !v.n) ? acc() : ink(0.75), i ? 'right' : 'center', i ? 'top' : 'alphabetic'); });
        ctx.globalAlpha = 1;
      },
      article: () => V.map((v) => `<p class="a-note"><b>${esc(v.v)} · ${v.n} 处</b>　${esc(v.note)}</p>`).join(''),
    });
  };

  TYPES.options = (d) => {
    const PL = d.plans, RW = d.rows, pick = Math.max(0, PL.findIndex((p) => p.key === d.pick)), alt = pick === 0 ? 1 : 0, r0 = RW[0], rest = RW.slice(1);
    const diff = RW.map((r) => PL[pick].vals[r.k] - PL[alt].vals[r.k]);
    const pp = (r) => r.unit === '%', w_ = (r, v) => (pp(r) ? (v > 0 ? '高' : '低') : v > 0 ? '多' : '少'), u_ = (r) => (pp(r) ? '个百分点' : r.unit);
    const say = (r, v) => (v === 0 ? '一样' : `${w_(r, v)} <b>${fmt(Math.abs(v), dig(v))}</b> ${esc(u_(r))}`);
    const sayBig = (r, v) => (v === 0 ? '<b>一样</b>' : `<b><small>${w_(r, v)}</small>${fmt(Math.abs(v), dig(v))}<u>${esc(u_(r))}</u></b>`);
    const [sec, pg, S] = mk(d, 'options', 1, `
  <div class="row" style="grid-template-columns:repeat(${PL.length},1fr)">${PL.map((p, j) => `<div class="c1 op1 e0"><div class="c1-h"><span class="c1-no">方案 <b>${esc(p.key)}</b></span><em class="pill${j === pick ? ' ac' : ''}">${j === pick ? '推荐' : '备选'}</em></div>
    <div class="c1-b"><p class="c1-name">${esc(p.name)}</p><div class="op1-m">${bigNum(String(p.vals[r0.k]), r0.unit, r0.k === d.srcKey || !d.srcKey ? srcA(d.src) : '')}<span class="c1-lab" style="margin:0">${esc(r0.label)}</span></div><i class="op1-g"></i></div>
    <div class="op1-rows">${rest.map((r) => `<div class="op1-r"><em>${esc(r.label)}</em><b>${fmt(p.vals[r.k], dig(p.vals[r.k]))}<u>${esc(r.unit)}</u></b><i></i></div>`).join('')}</div>
    <div class="c1-f"><em class="pill${p.risk === '高' ? ' ink' : ''}">风险 ${esc(p.risk)}</em><p class="c1-d">${esc(p.note)}</p></div></div>`).join('')}</div>
  <div class="prio op1-dl" data-b="1" style="--n:${RW.length}"><span class="prio-l">选 ${esc(PL[pick].key)} 比 ${esc(PL[alt].key)}</span>${RW.map((r, i) => `<span data-i="${i}" class="${i === 0 ? 'up' : ''}"><em>${esc(r.short || r.label)}</em>${sayBig(r, diff[i])}</span>`).join('')}</div>`);
    const cards = $$(sec, '.op1'), rowsOf = (j) => $$(cards[j], '.op1-r i'), items = $$(sec, '.op1-dl span[data-i]'), g0 = cards.map((c) => $(c, '.op1-g')), m0 = Math.max(...PL.map((q) => q.vals[r0.k]));
    S.fj = pick; S.f = pick;
    function focus(j, dur) { S.fj = j; cards.forEach((c, k) => { bar(c, k === j ? 1 : 0, dur); const o = k === j ? 1 : 0.68; dur ? to(c, { o }, dur) : set(c, { o }); }); if (dur) { const f0 = S.f; tween(dur, (v) => { S.f = lerp(f0, j, v); }); } else S.f = j; }
    D.onV = () => { if (D.pages[D.p] !== pg) return false; const j = (S.fj + 1) % PL.length; focus(j, D.d(420)); D.toast(`正在看方案 ${PL[j].key}：${PL[j].name}${j === pick ? '（推荐）' : ''}。再按 V 切回。`, 2600); return true; };
    return std(pg, {
      reset() { reset1(pg); S.fj = pick; S.f = pick; cards.forEach((c, k) => bar(c, k === pick ? 1 : 0)); },
      async enter() { cards.forEach((c) => bar(c, 0)); await enterCards(pg, 1000); focus(S.fj, D.d(300)); },
      calm() { calmGroups(pg); focus(S.fj); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        let hl = -1;
        if (S.a >= 1 && D.alive && D.b >= 1) hl = Math.floor(phase(S, t, 2.4 * rest.length, 0) * rest.length);
        items.forEach((e, i) => e.classList.toggle('on', i === hl + 1));
        PL.forEach((p, j) => { const B = box(g0[j], sec), on = 1 - Math.abs(S.f - j), w = (p.vals[r0.k] / m0) * B.w * E.enter(clamp(S.a * 1.2)); ctx.globalAlpha = B.a;
          ctx.fillStyle = tone(0.08); ctx.fillRect(B.x, B.y, B.w, 18); ctx.fillStyle = on > 0.5 ? (j === pick ? acc() : tone(0.62)) : tone(0.42); ctx.fillRect(B.x, B.y, w, 18);
          for (let k = 0; k <= 4; k++) { const x = sharp(B.x + (B.w * k) / 4); line(ctx, [[x, B.y + 18], [x, B.y + (k % 4 ? 23 : 27)]], ink(0.45), 1); }
          txt(ctx, '0', B.x, B.y + 38, cf(12), ink(0.45), 'left', 'middle'); txt(ctx, fmt(m0, dig(m0)) + ' ' + r0.unit, B.x + B.w, B.y + 38, cf(12), ink(0.45), 'right', 'middle'); });
        PL.forEach((p, j) => rowsOf(j).forEach((el, i) => {
          const r = rest[i], m = Math.max(...PL.map((q) => q.vals[r.k])), B = box(el, sec), on = 1 - Math.abs(S.f - j);
          ctx.globalAlpha = B.a; const w = (p.vals[r.k] / m) * B.w * E.enter(clamp(S.a * 1.3 - i * 0.1)), bh = 12, y = B.y + B.h / 2 - bh / 2;
          if (i === hl) { ctx.fillStyle = D.rgba('ac', 0.1); ctx.fillRect(B.x - 10, y - 9, B.w + 20, bh + 18); ctx.fillStyle = acc(); ctx.fillRect(B.x - 10, y - 9, 3, bh + 18); }   // 正在对照的这一行：淡底＋左边一道强调色
          ctx.fillStyle = tone(0.08); ctx.fillRect(B.x, y, B.w, bh);
          ctx.fillStyle = on > 0.5 ? (j === pick ? acc() : tone(0.62)) : tone(0.42); ctx.fillRect(B.x, y, w, bh);
          line(ctx, [[sharp(B.x + B.w), y - 5], [sharp(B.x + B.w), y + bh + 5]], ink(0.35), 1);
        }));
        ctx.globalAlpha = 1;
      },
      article: () => `<table class="a-tb"><tr><th></th>${PL.map((p, j) => `<th class="${j === pick ? 'ac' : ''}">${esc(p.key)} · ${esc(p.name)}${j === pick ? '（推荐）' : ''}</th>`).join('')}</tr>
        ${RW.map((r) => `<tr><td>${esc(r.label)}</td>${PL.map((p) => `<td><b>${fmt(p.vals[r.k], dig(p.vals[r.k]))}</b> ${esc(r.unit)}</td>`).join('')}</tr>`).join('')}<tr><td>风险</td>${PL.map((p) => `<td>${esc(p.risk)}</td>`).join('')}</tr><tr><td>要注意</td>${PL.map((p) => `<td>${esc(p.note)}</td>`).join('')}</tr></table>
        <p class="a-note"><b>选 ${esc(PL[pick].key)} 比 ${esc(PL[alt].key)}：</b>${RW.map((r, i) => `${esc(r.short || r.label)}${say(r, diff[i]).replace(/<\/?b>/g, '')}`).join('；')}</p>`,
    });
  };

  TYPES.people = (d) => {
    const P = d.people, n = P.length, mins = P.map((p) => minutes(p.time)), cap = d.cap || Math.max(...mins), tot = mins.reduce((a, b) => a + b, 0), scale = d.scale || 60;
    const [sec, pg, S] = mk(d, 'people', 1, `
  <div class="band pp1-t e0"><div class="band-h"><span class="band-l">${esc(d.bandLabel || '每周一共多花')}</span><span class="band-t"><b>${hm(tot)}</b></span><span class="band-n">${n} 个人 · 每人不超过 ${cap} 分钟</span></div><i class="band-g" style="height:84px"></i></div>
  <div class="row" style="grid-template-columns:repeat(${n},1fr)">${P.map((p, i) => `<div class="c1 pp1 e0"><div class="c1-h"><span class="c1-no"><b>${String(i + 1).padStart(2, '0')}</b> · ${esc(p.name)}</span><em class="pill${i === 0 ? ' ac' : ''}">${esc(p.tag || p.role)}</em></div>
    <div class="c1-b"><b class="c1-big"><span>+</span><span data-cnt="${mins[i]}">${mins[i]}</span><u>分钟 / 周</u></b><p class="c1-act">${esc(p.does)}</p></div>
    <div class="c1-f"><p class="c1-d">${cap - mins[i] > 0 ? `离 ${cap} 分钟上限还有 <b class="c1-num">${cap - mins[i]}</b> 分钟` : `正好到 ${cap} 分钟上限`}</p><i class="c1-g" style="height:40px"></i></div></div>`).join('')}</div>
  ${d.bottom ? `<div class="prio tint pp1-f" data-b="1"><span class="prio-l">${esc(d.bottom.label)}</span><p>${esc(d.bottom.text)}</p></div>` : ''}`);
    const cards = $$(sec, '.pp1'), gs = cards.map((c) => $(c, '.c1-g')), band = $(sec, '.pp1-t .band-g');
    return std(pg, {
      reset() { reset1(pg); cards.forEach((c) => { bar(c, 0); c.classList.remove('cur'); }); },
      enter() { return enterCards(pg, 1000); },
      async beat(k) { bar(cards[0], 1, D.d(420)); return beatIn(pg, k, 900); },
      calm() { calmGroups(pg); bar(cards[0], D.b >= 1 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        let cur = -1; if (S.a >= 1 && D.alive) cur = Math.floor(phase(S, t, 2.2 * n, 1.2) * n - 1e-6);
        cards.forEach((c, i) => c.classList.toggle('cur', i === cur));
        const B = box(band, sec), gap = 3, W = B.w - gap * (n - 1); let x = B.x; ctx.globalAlpha = B.a;
        P.forEach((p, i) => {
          const w = (mins[i] / tot) * W, f = E.enter(clamp(S.a * (n + 1) - i)), h = 34;
          ctx.fillStyle = i === 0 ? acc() : tone(i % 2 ? 0.42 : 0.58); ctx.fillRect(x, B.y, w * f, h);
          if (i === cur) { ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.5; ctx.strokeRect(x - 3.5, B.y - 3.5, w + 7, h + 7); }
          if (f >= 1) { txt(ctx, `${String(i + 1).padStart(2, '0')} · ${p.name}`, x, B.y + h + 18, cf(14, 600), ink(i === cur ? 0.95 : 0.75), 'left', 'middle'); txt(ctx, `${mins[i]} 分钟`, x, B.y + h + 38, cf(14, 400, 'sans'), ink(0.55), 'left', 'middle'); }
          x += w + gap;
        });
        const b1 = E.enter(S.b[1] || 0);
        P.forEach((p, i) => { const G = box(gs[i], sec); ctx.globalAlpha = G.a * S.a; ruler(ctx, G, mins[i], scale, { step: 5, major: scale / 2, fill: b1, ghost: true, cap: b1 > 0 ? cap : null, color: i === 0 ? acc() : tone(0.62) }); });
        ctx.globalAlpha = 1;
      },
      article: () => `<p class="a-note">${esc(d.bandLabel || '每周一共多花')}：<b>${hm(tot)}</b>，每人不超过 ${cap} 分钟</p>` + P.map((p, i) => `<p class="a-note"><b>${esc(p.name)}</b> · ${esc(p.role)} · 每周 +${mins[i]} 分钟<br>${esc(p.does)}</p>`).join(''),
    });
  };

  TYPES.ask = (d) => {
    const T0 = (s) => Date.parse(s + 'T00:00:00'), wk = (t) => '日一二三四五六'[new Date(t).getDay()], md = (t) => { const x = new Date(t); return `${x.getMonth() + 1} 月 ${x.getDate()} 日`; }, md2 = (t) => { const x = new Date(t); return `${x.getMonth() + 1}/${x.getDate()}`; };
    const NX = d.next && d.next.length > 1 ? d.next.map((x) => ({ ...x, t: T0(x.at) })) : null, tNow = d.asof ? T0(d.asof) : null;
    const cal = d.asof && d.due ? (() => { const a = Date.parse(d.asof + 'T00:00:00'), b = Date.parse(d.due + 'T00:00:00'), k = Math.round((b - a) / 864e5); return k >= 0 && k <= 21 ? { a, k } : null; })() : null;
    const sec = frame(d, 's1-ask', `<div class="s1w">
  <div class="ak1-top">
    <div class="ak1-n e0"><div class="c1-h"><span class="c1-no">需要 · <b>${d.needs.length}</b> 件</span></div>${d.needs.map((x, i) => `<div class="ak1-i"><span>${String(i + 1).padStart(2, '0')}</span><b>${esc(x.text)}</b><p>${esc(x.sub)}</p></div>`).join('')}</div>
    <div class="c1 ag ak1-g e0"><div class="c1-h"><span class="c1-no">换来</span><em class="pill ac">${esc(d.getsTag || '批下来以后')}</em></div>${d.gets.map((x) => `<div class="ak1-gi"><b class="agv"${srcA(x.src)}>${tpl(x.v)}<u>${esc(x.unit)}</u></b><p>${esc(x.text)}</p></div>`).join('')}</div>
  </div>
  ${NX ? `<div class="band ak1-tl grow"><div class="band-h"><span class="band-l">批下来以后</span><span class="band-t">${esc(md(NX[0].t))} 到 ${esc(md(NX[NX.length - 1].t))}，一共 <b>${Math.round((NX[NX.length - 1].t - NX[0].t) / 864e5)}</b> 天</span>${d.nextSrc ? `<span class="band-n"${srcA(d.nextSrc)}>${esc(d.nextSrc)}</span>` : ''}</div><i class="band-g"></i></div>` : ''}
  <div class="prio tint ak1-dl" data-b="1"><span class="prio-l">截止</span><b>${esc(d.deadline)}<i class="caret" aria-hidden="true"></i></b>${cal ? '<i class="ak1-cal"></i>' : ''}</div></div>`);
    sec.classList.add('x3', 's1');
    const pg = base(sec, d, 1), S = pg.S, caret = $(sec, '.caret'), ag = $(sec, '.ag'), nd = $(sec, '.ak1-n'), dl = $(sec, '.ak1-dl'), calEl = $(sec, '.ak1-cal'), tl = $(sec, '.ak1-tl'), tlg = tl && $(tl, '.band-g');
    ag.dataset.keep = ''; if (tl) tl.dataset.keep = '';
    function timeline(ctx, B, t, a) {
      const t0 = Math.min(tNow ?? NX[0].t, NX[0].t), t1 = NX[NX.length - 1].t, L = B.x + 6, R = B.x + B.w - 6, ax = Math.min(B.y + B.h - 26, B.y + B.h / 2 + 52);
      const Xt = (tt) => L + ((tt - t0) / (t1 - t0)) * (R - L), grow = E.enter(clamp(a));
      line(ctx, [[L, sharp(ax)], [L + (R - L) * grow, sharp(ax)]], ink(0.7), 1);
      for (let tt = t0; tt <= t1 + 1; tt += 864e5) {
        const x = sharp(Xt(tt)), dt = new Date(tt), mo = dt.getDate() === 1, mon = dt.getDay() === 1;
        if (x > L + (R - L) * grow + 1) break;
        if (mo || mon) line(ctx, [[x, ax], [x, ax + (mo ? 9 : 5)]], ink(mo ? 0.7 : 0.35), 1);
        if (mo) txt(ctx, `${dt.getMonth() + 1} 月`, x + 4, ax + 16, cf(13, 600), ink(0.6), 'left', 'middle');
      }
      if (tNow != null && cal) { ctx.fillStyle = D.rgba('ac', 0.18); ctx.fillRect(Xt(tNow), ax - 6, Xt(cal.a + cal.k * 864e5) - Xt(tNow), 6); }
      let hl = -1; if (a >= 1 && D.alive && D.b >= 0) hl = Math.floor(phase(S, t, 1.8 * NX.length, 1.2) * NX.length - 1e-6);
      ctx.font = cf(18, 600, 'sans'); const ends = [-1e9, -1e9];
      const place = NX.map((m, i) => { const x = Xt(m.t), last = i === NX.length - 1, w = Math.max(ctx.measureText(m.label).width, 120) + 8, x0 = last ? x + 6 - w : x, x1 = x0 + w; const tier = x0 > ends[0] + 18 ? 0 : 1; ends[tier] = x1; return { x, last, tier }; });
      NX.forEach((m, i) => {
        const { x, last, tier } = place[i], due = d.due && m.at === d.due, on = i === hl, f = clamp(a * (NX.length + 1) - i);
        if (f <= 0) return; const yy = ax, up = tier ? 58 : 0;
        line(ctx, [[sharp(x), yy - 40 - up], [sharp(x), yy]], on ? ink(0.9) : ink(0.3), 1);
        ctx.fillStyle = due ? acc() : on ? ink(0.92) : D.rgba('raise'); ctx.fillRect(x - 6, yy - 6, 12, 12);
        ctx.strokeStyle = due ? acc() : ink(0.9); ctx.lineWidth = 1.5; ctx.strokeRect(x - 6, yy - 6, 12, 12);
        const al = last ? 'right' : 'left', tx = last ? x - 8 : x + 8;
        txt(ctx, md(m.t) + ' 周' + wk(m.t), tx, yy - 52 - up, cf(14, 600), due ? acc() : ink(on ? 0.95 : 0.6), al, 'middle');
        txt(ctx, m.label, tx, yy - 30 - up, cf(18, on ? 600 : 500, 'sans'), ink(on ? 0.95 : 0.78), al, 'middle');
      });
      if (tNow != null) { const x = Xt(tNow); ctx.fillStyle = ink(0.9); ctx.beginPath(); ctx.moveTo(x - 5, ax + 12); ctx.lineTo(x + 5, ax + 12); ctx.lineTo(x, ax + 5); ctx.fill(); txt(ctx, '今天', x + 9, ax + 16, cf(13, 600, 'sans'), ink(0.75), 'left', 'middle'); }
    }
    Object.assign(pg, {
      type: 'ask',
      reset() { X.resetGroups(pg); hide(ag); hide(nd); if (tl) hide(tl); S.a = 0; setVar(ag, '--on', 1); setVar(dl, '--on', 0); caret.style.opacity = 0; S.c0 = null; },
      async enter() { X.enterHead(pg); appear(nd, D.d(160)); appear(ag, D.d(300)); if (tl) appear(tl, D.d(440)); setVar(ag, '--on', 0); tween(D.d(700), (v) => setVar(ag, '--on', v), { delay: D.d(420) }); await tween(D.d(1300), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(500) }); },
      async beat(k) { S.c0 = null; tween(D.d(600), (v) => setVar(dl, '--on', v), { delay: D.d(120) }); return beatIn(pg, k, 600); },
      calm() { calmGroups(pg); setVar(dl, '--on', D.b >= 1 ? 1 : 0); setVar(ag, '--on', 1); showNow(nd); if (tl) showNow(tl); S.a = 1; caret.style.opacity = 0; },
      resize() { pg.cv.fit(); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        if (D.b >= 1 && D.alive) { if (S.c0 == null) S.c0 = t; const e = t - S.c0; caret.style.opacity = e < 8 ? (Math.floor(e / 0.53) % 2 ? 0 : 1) : 0; }
        else caret.style.opacity = 0;   // 光标只在刚落到截止日时闪几下，静止、打印都不留
        if (NX && tlg) { const G = box(tlg, sec); ctx.globalAlpha = G.a; timeline(ctx, G, t, S.a || 0); ctx.globalAlpha = 1; }
        if (!cal || !calEl) return;
        const B = box(calEl, sec), o = +(dl.style.opacity || 1) * B.a; if (!o) return; ctx.globalAlpha = o;
        const n = cal.k + 1, gp = 6, cw = Math.min(56, (B.w - gp * (n - 1)) / n), x0 = B.x + B.w - (cw * n + gp * (n - 1)), y = B.y + 4, h = 40;
        for (let i = 0; i < n; i++) {
          const tt = cal.a + i * 864e5, x = x0 + i * (cw + gp), last = i === n - 1, first = i === 0, we = [0, 6].includes(new Date(tt).getDay());
          if (last) { ctx.fillStyle = acc(); ctx.fillRect(x, y, cw, h); }
          else { ctx.fillStyle = D.rgba('raise'); ctx.fillRect(x, y, cw, h); ctx.strokeStyle = we ? tone(0.25) : ink(0.45); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, h - 1); }
          if (first && D.alive) { const p = 0.5 + 0.5 * Math.sin(t * 2.4); ctx.strokeStyle = ink(0.35 + 0.5 * p); ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, cw + 6, h + 6); }
          txt(ctx, md2(tt), x + cw / 2, y + 17, cf(13, 600), last ? '#FFFFFF' : ink(we ? 0.4 : 0.8), 'center', 'middle');
          txt(ctx, (first ? '今天 ' : '') + '周' + wk(tt), x + cw / 2, y + 31, cf(11, 400, 'sans'), last ? 'rgba(255,255,255,.9)' : ink(0.5), 'center', 'middle');
        }
        ctx.globalAlpha = 1;
      },
      article: () => `<h3 class="a-h3">需要</h3>${d.needs.map((x) => `<p><b>${esc(x.text)}</b><br><span class="a-who">${esc(x.sub)}</span></p>`).join('')}
        <h3 class="a-h3">换来</h3>${d.gets.map((x) => `<p><b class="ac">${tpl(x.v)} ${esc(x.unit)}</b>　${esc(x.text)}</p>`).join('')}
        ${NX ? `<h3 class="a-h3">批下来以后</h3><ol class="a-ol">${NX.map((m) => `<li><b>${esc(md(m.t))}</b>　${esc(m.label)}</li>`).join('')}</ol>` : ''}
        <p class="a-dl">${esc(d.deadline)}</p>`,
    });
    return pg;
  };

  function niceStep(span, want) { const raw = Math.max(span, 1e-9) / want, e = 10 ** Math.floor(Math.log10(raw)), f = raw / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
  TYPES.calc = (d) => {
    const P = d.params, R = d.result || { label: '一学期省下', unit: '小时', digits: 0 }, dg = R.digits || 0, dec = (p) => (p.step < 1 ? 1 : 0);
    const keys = P.map((p) => p.key), f = new Function(...keys, `return (${d.formula || 'classes*kids*save*rounds/60'});`);
    const at = (over) => f(...keys.map((k) => (k in over ? over[k] : CALC[k])));
    const sec = frame(d, 's1-calc', `<div class="s1w"><div class="ca1">
  <div class="ca1-l csl">${P.map((p, i) => `<div class="ca1-s cs" data-k="${p.key}"><div class="c1-no"><em>${esc(p.label)}</em><b><span class="csv"></span><u>${esc(p.unit)}</u></b></div>
    <input class="rg" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.def}" aria-label="${esc(p.label)}"><i class="ca1-tk"></i><p>${esc(p.note || '')}</p></div>`).join('')}<div class="ca1-lf"><button type="button" class="creset">恢复默认</button><p>拖动滑块，结果、算式和曲线一起变</p></div></div>
  <div class="ca1-r">
    <div class="prio ca1-res cres"><em>${esc(R.label)}</em><b class="ac" data-calc="calc"${srcA(d.src, d.formulaText || '')}>${calcVals().calc}</b><u>${esc(R.unit)}</u></div>
    <div class="ca1-f cform" data-b="1"></div>
    <div class="ca1-c"><em>${esc(P[0].label)}从 ${fmt(P[0].min, dec(P[0]))} 到 ${fmt(P[0].max, dec(P[0]))}，${esc(R.label)}怎么变</em><span class="rd"></span></div>
    <div class="ca1-as cass" data-b="2"><em class="pill">估算</em><span>${esc(d.assume)}</span></div>
  </div></div></div>`);
    sec.classList.add('x3', 's1');
    const pg = base(sec, d, 3), S = pg.S, res = $(sec, '.cres'), form = $(sec, '.cform'), csl = $(sec, '.csl'), chart = $(sec, '.ca1-c'), rd = $(sec, '.ca1-c .rd');
    res.dataset.keep = ''; csl.dataset.keep = '';
    const inputs = $$(sec, 'input.rg'), tks = $$(sec, '.ca1-tk');
    function scale(ctx, B, p) {
      const L = B.x + 9, R = B.x + B.w - 9, X1 = (v) => L + ((v - p.min) / (p.max - p.min)) * (R - L), nStep = Math.round((p.max - p.min) / p.step), every = nStep > 40 ? Math.ceil(nStep / 10) : 1, y = B.y + 2, mj = Math.max(p.step, niceStep(p.max - p.min, 6)), gap = (p.max - p.min) * 0.06;
      for (let k = 0; k <= nStep; k += every) {
        const v = p.min + k * p.step, x = sharp(X1(v)), lab = k === 0 || k === nStep || (Math.abs(v / mj - Math.round(v / mj)) < 1e-6 && v - p.min > gap && p.max - v > gap);
        line(ctx, [[x, y], [x, y + (lab ? 7 : 4)]], ink(lab ? 0.5 : 0.25), 1);
        if (lab) txt(ctx, fmt(v, Math.abs(v - Math.round(v)) > 1e-6 ? 1 : 0), x, y + 18, cf(12), ink(0.45), 'center', 'middle');
      }
      const xd = X1(p.def); ctx.strokeStyle = ink(0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xd - 4.5, y - 3.5); ctx.lineTo(xd + 4.5, y - 3.5); ctx.lineTo(xd, y + 3); ctx.closePath(); ctx.stroke();
      const xc = sharp(X1(CALC[p.key])); line(ctx, [[xc, y], [xc, y + 9]], acc(), 2);
    }
    const toks = (d.formula || 'classes*kids*save*rounds/60').match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|[-+*/()]/g) || [];
    function paint() {
      P.forEach((p, i) => { const v = CALC[p.key]; inputs[i].value = v; inputs[i].style.setProperty('--f', ((v - p.min) / (p.max - p.min)) * 100 + '%'); $(sec, `.cs[data-k="${p.key}"] .csv`).textContent = fmt(v, dec(p)); });
      const hh = hours();
      let skip = 0; form.innerHTML = toks.map((t, j) => { if (skip) { skip--; return ''; } const p = P.find((q) => q.key === t); if (p && p.unit === '%' && toks[j + 1] === '/' && toks[j + 2] === '100') { skip = 2; return `<span><b>${fmt(CALC[t], dec(p))}</b>%</span>`; } if (p) return `<span><b>${fmt(CALC[t], dec(p))}</b>${esc(p.unit)}</span>`; if (/[-+*/]/.test(t)) return `<i>${{ '*': '×', '/': '÷', '+': '＋', '-': '−' }[t]}</i>`; if (/[()]/.test(t)) return `<i>${t}</i>`; return `<span><b>${fmt(+t, (t.split('.')[1] || '').length)}</b></span>`; }).join('') + `<i>＝</i><span class="eq"><b>${fmt(hh, Math.abs(hh - Math.round(hh)) < 1e-9 ? dg : Math.max(1, dg))}</b>${esc(R.unit)}</span>`;
      paintCalc();
    }
    inputs.forEach((inp, i) => inp.addEventListener('input', () => { CALC[P[i].key] = +inp.value; paint(); }));
    $(sec, '.creset').addEventListener('click', () => { P.forEach((p) => { CALC[p.key] = p.def; }); paint(); });
    D.onCalc = paint;
    const p0 = P[0], xs = []; for (let v = p0.min; v <= p0.max + 1e-9; v += p0.step) xs.push(+v.toFixed(4));
    Object.assign(pg, {
      type: 'calc',
      reset() { X.resetGroups(pg); hide(res); hide(csl); hide(chart); rd.textContent = ''; paint(); },
      async enter() { X.enterHead(pg); paint(); appear(res, D.d(150)); appear(csl, D.d(260)); appear(chart, D.d(380)); await tween(D.d(1100), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(300) }); },
      async beat(k) {
        if (k === 3) { await beatIn(pg, k, 200); const goal = CALC[p0.key]; for (const v of xs.filter((v) => v <= goal)) { CALC[p0.key] = v; paint(); await wait(D.d(xs.length > 12 ? 160 : 480)); } return; }
        return beatIn(pg, k, 500);
      },
      calm() { calmGroups(pg); showNow(chart); paint(); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        P.forEach((p, i) => { const G = box(tks[i], sec); ctx.globalAlpha = G.a; scale(ctx, G, p); });
        const B = box(chart, sec), L = B.x + 84, Rr = B.x + B.w - 40, T = B.y + 66, Bt = B.y + B.h - 52; ctx.globalAlpha = B.a;
        const ys = xs.map((v) => at({ [p0.key]: v })), top = Math.max(...ys.map(Math.abs), 1e-9), mjY = niceStep(top, 4), nY = Math.ceil(top / mjY - 1e-9), nice = nY * mjY;
        const X0 = (v) => L + ((v - p0.min) / (p0.max - p0.min)) * (Rr - L), Y0 = (v) => Bt - (v / nice) * (Bt - T);
        for (let k = 0; k <= nY; k++) { const v = mjY * k, y = sharp(Y0(v)); line(ctx, [[L, y], [Rr, y]], k ? tone(0.12) : ink(0.6), 1); txt(ctx, fmt(v, v % 1 ? 1 : 0), L - 12, y, cf(13), ink(0.5), 'right', 'middle'); }
        const every = Math.max(1, Math.ceil(xs.length / 8));
        xs.forEach((v, i) => { const x = sharp(X0(v)); line(ctx, [[x, Bt], [x, Bt + (i % every ? 4 : 7)]], ink(0.5), 1); if (!(i % every) || i === xs.length - 1) txt(ctx, fmt(v, dec(p0)), x, Bt + 12, cf(13), ink(0.55), 'center', 'top'); });
        txt(ctx, p0.unit, Rr, Bt + 32, cf(13, 400, 'sans'), ink(0.5), 'right', 'top');
        const upto = Math.max(1, Math.floor(E.enter(S.a) * xs.length));
        ctx.strokeStyle = ink(0.9); ctx.lineWidth = 2; ctx.beginPath(); xs.slice(0, upto).forEach((v, i) => { const x = X0(v), y = Y0(ys[i]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
        const xd = sharp(X0(p0.def)); line(ctx, [[xd, T - 6], [xd, Bt]], ink(0.45), 1, [3, 4]); txt(ctx, '默认', xd + 6, T - 2, cf(12, 400, 'sans'), ink(0.5), 'left', 'middle');
        const cv = CALC[p0.key], cy = Y0(hours()), cx = X0(cv);
        ctx.fillStyle = acc(); ctx.fillRect(cx - 6, cy - 6, 12, 12);
        if (S.a >= 1 && D.alive) {
          const i = Math.min(xs.length - 1, Math.floor(phase(S, t, Math.max(6, xs.length * 0.5), 2) * xs.length)), x = sharp(X0(xs[i])), y = Y0(ys[i]);
          line(ctx, [[x, T], [x, Bt]], ink(0.7), 1);
          ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.5; ctx.strokeRect(x - 5.5, y - 5.5, 11, 11);
          rd.innerHTML = `${esc(p0.label)} <b>${fmt(xs[i], dec(p0))}</b> ${esc(p0.unit)} → ${esc(R.label)} <b>${fmt(ys[i], dg)}</b> ${esc(R.unit)}`;
        } else rd.textContent = '';
        ctx.globalAlpha = 1;
      },
      article: () => `<p class="a-big"><b class="ac" data-calc="calc">${calcVals().calc}</b><u>${esc(R.unit)}</u></p>
        <div class="a-calc">${P.map((p) => `<label><span>${esc(p.label)} <b data-av="${p.key}">${fmt(CALC[p.key], dec(p))}</b> ${esc(p.unit)}</span><input class="rg" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${CALC[p.key]}" data-ak="${p.key}"></label>`).join('')}</div>
        <p class="a-note">${esc(d.formulaText || '')}</p><p class="a-who">${esc(d.assume)}</p>`,
    });
    return pg;
  };
  window.__S1 = { mk, enterCards, reset1, box, off, line, sharp, ruler, bars, bigNum, bigTime, std, bar, setVar, num, dig, hm, minutes, edge };
})();
