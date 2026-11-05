(() => {
  const D = Deck, { E, T, tween, set, clamp, lerp } = D;
  const X = window.__TYPES, { TYPES, beatIn, calmGroups, appear, hide, showNow, phase, esc, fmt, sgn, srcA, cf, hatch, ink, tone, acc, $, $$ } = X;
  const { mk, enterCards, reset1, box, off, line, sharp, bigNum, bigTime, std, bar, setVar, num, dig } = window.__S1;
  const pad = (i) => String(i).padStart(2, '0');
  const zone = (a = 1) => D.rgba('zone', a), paper = (a = 1) => D.rgba('raise', a);

  function tn(ctx, s, x, y, font, color, align = 'left', base = 'alphabetic') {
    s = String(s); ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = base; ctx.textAlign = 'left';
    const w0 = ctx.measureText('0').width, cs = [...s], ws = cs.map((c) => (/\d/.test(c) ? w0 : ctx.measureText(c).width)), W = ws.reduce((a, b) => a + b, 0);
    let cx = align === 'right' ? x - W : align === 'center' ? x - W / 2 : x;
    cs.forEach((c, i) => { if (/\d/.test(c)) { ctx.textAlign = 'center'; ctx.fillText(c, cx + w0 / 2, y); ctx.textAlign = 'left'; } else ctx.fillText(c, cx, y); cx += ws[i]; });
    return W;
  }
  function gridY(ctx, P, lo, hi, minor, major, o = {}) {
    const Y = (v) => P.y + P.h - ((v - lo) / (hi - lo)) * P.h, g = o.grow ?? 1, R = P.x + P.w * g;
    for (let k = Math.ceil(lo / minor - 1e-9); k * minor <= hi + 1e-9; k++) {
      const v = k * minor || 0, M = Math.abs(v / major - Math.round(v / major)) < 1e-6, y = sharp(Y(v));
      if (v > lo + 1e-9) line(ctx, [[P.x, y], [R, y]], M ? tone(0.17) : tone(0.07), 1);
      if (M) { line(ctx, [[P.x - 6, y], [P.x, y]], ink(0.55), 1); tn(ctx, fmt(v, o.dg || 0), P.x - 12, y, cf(14), ink(0.5), 'right', 'middle'); }
    }
    line(ctx, [[P.x, sharp(P.y + P.h)], [R, sharp(P.y + P.h)]], ink(0.75), 1);
    return Y;
  }
  const Xw = (P, n, i) => P.x + (P.w * (i + 0.5)) / n;
  function weekAxis(ctx, P, n, o = {}) {
    const by = sharp(P.y + P.h), L = o.labels || [];
    for (let i = 0; i < n; i++) {
      const x = sharp(Xw(P, n, i)), on = o.all || L.includes(i + 1);
      line(ctx, [[x, by], [x, by + (on ? 6 : 3)]], ink(on ? 0.55 : 0.3), 1);
      if (on) tn(ctx, o.fmt ? o.fmt(i + 1) : String(axN(i + 1)), x, by + 20, cf(14, o.all ? 400 : 500, o.fmt ? 'sans' : 'num'), ink(0.55), 'center', 'middle');
    }
    if (o.unit) txt2(ctx, o.unit, P.x + P.w + 12, by + 20, cf(14, 400, 'sans'), ink(0.45), 'left', 'middle');
  }
  function txt2(ctx, s, x, y, font, color, align, base) { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y); }
  function series(ctx, P, w, Y, o = {}) {
    const n = w.length, upto = o.upto ?? n, ev = o.ev || 0, q = o.q || 8;
    ctx.lineJoin = 'round'; ctx.lineCap = 'butt';
    for (let i = 0; i < n - 1 && i < upto - 1; i++) {
      const f = clamp(upto - 1 - i);
      ctx.strokeStyle = i + 2 <= ev - 1 ? tone(0.42) : ink(0.88); ctx.lineWidth = o.lw || 1.5;
      ctx.beginPath(); ctx.moveTo(Xw(P, n, i), Y(w[i])); ctx.lineTo(lerp(Xw(P, n, i), Xw(P, n, i + 1), f), lerp(Y(w[i]), Y(w[i + 1]), f)); ctx.stroke();
    }
    for (let i = 0; i < Math.min(n, Math.ceil(upto)); i++) {
      const x = Xw(P, n, i), y = Y(w[i]), last = i === n - 1, pre = i + 1 < ev;
      if (pre) { ctx.fillStyle = paper(); ctx.fillRect(x - q / 2, y - q / 2, q, q); ctx.strokeStyle = tone(0.55); ctx.lineWidth = 1.2; ctx.strokeRect(x - q / 2 + 0.6, y - q / 2 + 0.6, q - 1.2, q - 1.2); }
      else { const s = last && o.endAc ? q + 4 : q; ctx.fillStyle = last && o.endAc ? acc() : ink(0.92); ctx.fillRect(x - s / 2, y - s / 2, s, s); }
    }
  }
  function cursor(ctx, x, y0, y1, py, s = 13) {
    line(ctx, [[sharp(x), y0], [sharp(x), y1]], ink(0.62), 1);
    if (py != null) { ctx.fillStyle = paper(); ctx.fillRect(x - s / 2 - 2, py - s / 2 - 2, s + 4, s + 4); ctx.strokeStyle = ink(0.95); ctx.lineWidth = 1.5; ctx.strokeRect(x - s / 2, py - s / 2, s, s); }
  }
  function badge(ctx, x, y, k, a = 1) { ctx.globalAlpha *= a; ctx.fillStyle = ink(0.92); ctx.fillRect(x - 11, y - 11, 22, 22); txt2(ctx, String(k), x, y + 1, cf(13, 600), D.rgba('bg'), 'center', 'middle'); ctx.globalAlpha /= a || 1; }
  function rdSet(el, html) { if (!el) return; if (el._h !== html) { el.innerHTML = html; el._h = html; } el.classList.add('on'); }
  function rdOff(el) { if (el) el.classList.remove('on'); }
  const SEP = '<i aria-hidden="true"></i>';
  function ticks(span, want = 4) {
    const raw = Math.max(span, 1e-9) / want, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p;
    const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10, major = m * p;
    return { major, minor: major / (m === 2 ? 4 : 5) };
  }
  const dgt = (x) => dig(+x.toFixed(6));   // 刻度值要几位小数
  function niceDom(vals, pad = 2, want = 4) {
    const a = Math.min(...vals), b = Math.max(...vals), { minor, major } = ticks(b - a, want);
    return [+(Math.floor(a / minor - pad) * minor).toFixed(6), +(Math.ceil(b / minor + pad) * minor).toFixed(6), minor, major];
  }
  const dom = (w) => niceDom(w);
  const wdOf = (arr) => Math.max(0, ...arr.map((v) => dig(v)));   // 这组数原来写到几位小数，读数就写几位
  const M0 = (window.DECK_CONTENT || {}).meta || {}, PD = M0.period || '周';
  const PS = (() => { const s = M0.periodStart; if (PD === '天') { const [y, m, dd] = String(s || '2026-01-01').split('-').map(Number); return Date.UTC(y, m - 1, dd); } return +s || 1; })();
  const mon = (k) => ((PS - 1 + k - 1) % 12) + 1, day = (k) => new Date(PS + (k - 1) * 864e5);
  const tk = (k, b) => { const B = (x) => (b ? `<b>${x}</b>` : x); if (PD === '月') return `${B(mon(k))} 月`; if (PD === '天') { const t = day(k); return B(`${t.getUTCMonth() + 1} 月 ${t.getUTCDate()} 日`); } return `第 ${B(k)} 周`; };
  const axN = (k) => (PD === '月' ? mon(k) : PD === '天' ? day(k).getUTCDate() : k);   // 横轴上只写数
  const axU = PD === '月' ? '月' : PD === '天' ? '日' : '周';
  const spanW = (n) => (PD === '月' ? `${n} 个月` : PD === '天' ? `${n} 天` : `${n} 周`);
  const vs = (k) => (PD === '周' ? '比' : '比 ') + tk(k);
  const sp = (x) => String(x).replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, '$1 $2').replace(/([A-Za-z0-9%])([\u4e00-\u9fff])/g, '$1 $2');
  const prevW = PD === '月' ? '比上个月' : PD === '天' ? '比前一天' : '比上一周';
  const perW = PD === '月' ? '每月' : PD === '天' ? '每天' : '每周';
  const rngW = (a, b) => { if (PD === '月') return `${mon(a)}–${mon(b)} 月`; if (PD === '天') { const x = day(a), y = day(b); return x.getUTCMonth() === y.getUTCMonth() ? `${x.getUTCMonth() + 1} 月 ${x.getUTCDate()}–${y.getUTCDate()} 日` : `${tk(a)}–${tk(b)}`; } return `第 ${a}–${b} 周`; };
  const cntW = (a, b) => (PD === '周' ? `${b - a + 1} 次` : spanW(b - a + 1));
  const head = (s) => { const [a, ...b] = String(s).split(' · '); return [a, b.join(' · ')]; };
  function heroFs(v) { const e = [...String(v)].reduce((a, c) => a + (/\d/.test(c) ? 1 : /[+\-−]/.test(c) ? 0.5 : 0.3), 0); return `font-size:${Math.round(236 * Math.min(1, 4.3 / e))}px${/,/.test(v) ? ';padding-bottom:.1em' : ''}`; }
  function axLabs(n, ev) { const g = Math.max(2, n / 7), c = [1, n, ev, Math.ceil(n / 3), Math.round((n * 2) / 3)].filter((v) => v >= 1 && v <= n), o = []; c.forEach((v) => { if (o.every((x) => Math.abs(x - v) >= g)) o.push(v); }); return o.sort((a, b) => a - b); }
  const chartHead = (title, sub, src) => `<div class="c1-h"><span class="c1-t"${src ? srcA(src) : ''}>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><span class="rd1" aria-hidden="true"></span></div>`;

  TYPES.cover = (d, all) => {
    const w = d.weeks, n = w.length, [lo, hi, mi, ma] = dom(w), wd = wdOf(w), ev = (all.find((p) => p.type === 'trend') || {}).event?.at || 0;
    const a0 = num(d.from.v), a1 = num(d.to.v);
    const [rlo, rhi, rmi, rma] = Math.min(a0, a1) >= lo && Math.max(a0, a1) <= hi ? [lo, hi, mi, ma] : niceDom([a0, a1], 2, 2);
    const fc = d.ftCard || {}, kc = d.kpisCard || {};
    const [sec, pg, S] = mk(d, 'cover', 3, `
  <div class="cv1-top">
    <div class="cv1-hero e0"><em class="cv1-cap">${esc(d.big.how || '')}</em><b class="cv1-big" style="${heroFs((d.big.sign || '') + d.big.v)}"${srcA(d.big.src, d.big.how)}><span class="sg">${esc(d.big.sign || '')}</span><span data-cnt="${num(d.big.v)}" data-dg="${dig(d.big.v)}">${esc(d.big.v)}</span><u>${esc(d.big.unit)}</u></b></div>
    <div class="c1 cv1-ft" data-b="1"><div class="c1-h"><span class="c1-no"><b>01</b>　${esc(fc.label || '期初 → 期末')}</span>${fc.tag ? `<em class="pill">${esc(fc.tag)}</em>` : ''}</div>
      <div class="c1-b cv1-fb"><div class="cv1-fn"><div><em>${esc(d.from.label)}</em><b${srcA(d.from.src)}>${esc(d.from.v)}</b></div><i>→</i><div><em>${esc(d.to.label)}</em><b class="ac"${srcA(d.to.src)}>${esc(d.to.v)}</b></div></div>${fc.say ? `<p class="cv1-s">${esc(fc.say)}</p>` : ''}</div>
      <div class="c1-f"><i class="cv1-sc"></i></div></div>
    <div class="c1 cv1-k" data-b="2"><div class="c1-h"><span class="c1-no"><b>02</b>　${esc(kc.label || '另外几个数')}</span><em class="pill">${esc(d.from.label)} → ${esc(d.to.label)}</em></div>
      <div class="c1-b cv1-kb">${d.kpis.map((k) => `<div class="cv1-r"><em>${esc(k.label)}</em><span><s>${esc(k.a)}</s><i>→</i><b${srcA(k.src)}>${esc(k.b)}</b><u>${esc(k.unit)}</u></span></div>`).join('')}${kc.say ? `<p class="cv1-s">${esc(kc.say)}</p>` : ''}</div>
      ${kc.note ? `<div class="c1-f"><p class="cv1-nt">${esc(kc.note)}</p></div>` : ''}</div>
  </div>
  <div class="c1 cht cv1-ch grow e0">${chartHead(d.weeksLabel || `${perW}走势`, d.weeksSrc)}<i class="cht-g"></i></div>
  ${d.bridge ? `<div class="prio tint cv1-br" data-b="3"><span class="prio-l">原因</span><p>${esc(d.bridge)}</p></div>` : ''}`);
    const gEl = $(sec, '.cht-g'), sc = $(sec, '.cv1-sc'), rd = $(sec, '.rd1'), br = $(sec, '.cv1-br');
    const P0 = (G) => ({ x: G.x, y: G.y + 6, w: G.w - 58, h: G.h - 6 - 36 });
    let lastI = -1;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastI = -1; if (br) setVar(br, '--on', 0); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) { if (k === 3 && br) tween(D.d(600), (v) => setVar(br, '--on', v), { delay: D.d(120) }); return beatIn(pg, k, k === 2 ? 900 : 800); },
      calm() { calmGroups(pg); if (br) setVar(br, '--on', D.b >= 3 ? 1 : 0); },
      stripGeo() { const o = off(gEl, sec); return { ...P0(o), card: off($(sec, '.cv1-ch'), sec), kind: 'line' }; },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080);
        if (S.morphOut || !S.a) return;
        const G = box(gEl, sec), P = P0(G); ctx.globalAlpha = G.a;
        const Y = gridY(ctx, P, lo, hi, mi, ma, { grow: E.enter(clamp(S.a * 1.6)), dg: dgt(ma) });
        weekAxis(ctx, P, n, { all: n <= 12, labels: axLabs(n, ev), fmt: (k) => tk(k) });
        if (ev) { const x6 = sharp((Xw(P, n, ev - 1) + Xw(P, n, ev - 2)) / 2); line(ctx, [[x6, P.y], [x6, P.y + P.h]], ink(0.4), 1, [2, 3]); }
        series(ctx, P, w, Y, { upto: S.a * n, ev, endAc: true });
        if (S.a >= 1) tn(ctx, fmt(w[n - 1], wd), Xw(P, n, n - 1) + 14, Y(w[n - 1]), cf(16, 600), acc(), 'left', 'middle');
        if (S.b[1] > 0) {
          const B = box(sc, sec), u = E.enter(S.b[1]), L = B.x + 26, R = B.x + B.w - 26, Xs = (v) => L + ((v - rlo) / (rhi - rlo)) * (R - L), y = B.y + 12;
          ctx.globalAlpha = B.a;
          for (let k = 0; rlo + k * rmi <= rhi + 1e-9; k++) { const v = rlo + k * rmi, x = sharp(Xs(v)), M = Math.abs(v / rma - Math.round(v / rma)) < 1e-6; line(ctx, [[x, y], [x, y + (M ? 8 : 4)]], ink(M ? 0.55 : 0.28), 1); if (M) tn(ctx, fmt(v, dgt(rma)), x, y + 22, cf(12), ink(0.45), 'center', 'middle'); }
          line(ctx, [[L, sharp(y)], [R, sharp(y)]], ink(0.55), 1);
          const xa = Xs(a0), xb = lerp(xa, Xs(a1), u);
          ctx.fillStyle = acc(0.22); ctx.fillRect(xa, y - 7, xb - xa, 6);
          ctx.fillStyle = paper(); ctx.fillRect(xa - 5, y - 9, 10, 10); ctx.strokeStyle = ink(0.7); ctx.lineWidth = 1.2; ctx.strokeRect(xa - 4.4, y - 8.4, 8.8, 8.8);
          ctx.fillStyle = acc(); ctx.fillRect(xb - 6, y - 10, 12, 12);
        }
        ctx.globalAlpha = G.a;
        if (S.a >= 1 && D.alive) {
          const i = Math.min(n - 1, Math.floor(phase(S, t, 24, 2) * n)), x = Xw(P, n, i);
          cursor(ctx, x, P.y, P.y + P.h, Y(w[i]));
          if (i !== lastI) { lastI = i; rdSet(rd, `${tk(i + 1, true)}${SEP}<b>${fmt(w[i], wd)}</b> ${esc(d.big.unit)}${i ? `${SEP}${vs(1)} <b class="${w[i] > w[0] ? 'ac' : ''}">${sgn(w[i] - w[0], wd)}</b>` : ''}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<p class="a-big"><b${srcA(d.big.src)}>${esc((d.big.sign || '') + d.big.v)}</b><u>${esc(d.big.unit)}</u></p>
        <p class="a-ft">${esc(d.from.label)} ${esc(d.from.v)} → ${esc(d.to.label)} <b class="ac">${esc(d.to.v)}</b></p>
        ${svgSeries(w, ev)}
        ${fc.say ? `<p class="a-note">${esc(fc.say)}</p>` : ''}
        <div class="a-kpis">${d.kpis.map((k) => `<div><em>${esc(k.label)}</em><span><s>${esc(k.a)}</s> → <b${srcA(k.src)}>${esc(k.b)}</b> ${esc(k.unit)}</span></div>`).join('')}</div>
        ${kc.say ? `<p>${esc(kc.say)}</p>` : ''}${kc.note ? `<p class="a-note">${esc(kc.note)}</p>` : ''}
        ${d.bridge ? `<p>${esc(d.bridge)}</p>` : ''}`,
    });
  };
  function svgSeries(w, ev = 0) {
    const W = 340, H = 120, n = w.length, [lo, hi] = dom(w), x = (i) => 30 + ((W - 40) * (i + 0.5)) / n, y = (v) => H - 20 - ((v - lo) / (hi - lo)) * (H - 30);
    const pts = w.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`), k = Math.min(n, Math.max(1, ev - 1));
    const grid = [];
    const [, , , ma] = dom(w);
    for (let v = Math.ceil(lo / ma - 1e-9) * ma; v <= hi + 1e-9; v += ma) grid.push(`<line x1="30" x2="${W - 10}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="gd"/><text x="24" y="${(y(v) + 4).toFixed(1)}" class="t" text-anchor="end">${fmt(v, dgt(ma))}</text>`);
    return `<svg class="a-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${perW}走势">${grid.join('')}<line x1="30" x2="${W - 10}" y1="${H - 20}" y2="${H - 20}" class="ax"/>
      <polyline points="${pts.slice(0, k).join(' ')}" class="l0"/><polyline points="${pts.slice(k - 1).join(' ')}" class="l1"/>
      <rect x="${x(n - 1) - 4}" y="${y(w[n - 1]) - 4}" width="8" height="8" class="ac"/><text x="${x(0)}" y="${H - 4}" class="t" text-anchor="middle">${tk(1)}</text><text x="${x(n - 1)}" y="${H - 4}" class="t" text-anchor="end">${tk(n)}</text></svg>`;
  }

  TYPES.trend = (d, all) => {
    const cov = all.find((p) => p.type === 'cover'), w = cov?.weeks || d.weeks, n = w.length, [lo, hi, mi, ma] = dom(w), wd = wdOf(w), last = w[n - 1];
    const avg = (d.avg || []).map((a) => { const s = w.slice(a.from - 1, a.to); return { ...a, v: s.reduce((x, y) => x + y, 0) / s.length }; });
    const rnd = (v) => Number(fmt(v, wd).replace(/,/g, '')), diff = avg.length > 1 ? rnd(avg[1].v) - rnd(avg[0].v) : null;   // 差用显示出来的两个数相减，读者自己减也对得上
    const notes = [d.event && { k: 1, ...d.event, b: 1 }, d.dip && { k: d.event ? 2 : 1, ...d.dip, b: 3 }].filter(Boolean);
    const [sec, pg, S] = mk(d, 'trend', 3, `<div class="tr1">
  <div class="c1 cht tr1-ch e0">${chartHead(d.chart || cov?.weeksLabel || `${perW}走势`, d.src, d.src)}<i class="cht-g"></i></div>
  <div class="tr1-r">
    <div class="c1 tr1-now e0"><div class="c1-h"><span class="c1-no">最新 · ${tk(n, true)}</span>${last === Math.max(...w) ? `<em class="pill ac">${spanW(n)}里最高</em>` : ''}</div><div class="c1-b">${bigNum(fmt(last, wd), d.unit, srcA(d.src))}</div><div class="c1-f"><p class="c1-d">${vs(1)} <b class="c1-num">${sgn(last - w[0], wd)}</b> ${esc(d.unit)}</p></div></div>
    ${avg.length > 1 ? `<div class="c1 tr1-avg" data-b="2"><div class="c1-h"><span class="c1-no">前后两段平均</span></div>${avg.map((a, i) => `<div class="av"><em>${esc(a.label)}</em><b${srcA(d.src, `${rngW(a.from, a.to)} ${cntW(a.from, a.to)}的平均`)}>${fmt(a.v, wd)}</b></div>`).join('')}<div class="av df"><em>差</em><b>${sgn(diff, wd)}</b></div></div>` : ''}
    <div class="c1 tr1-nt" data-b="1"><div class="c1-h"><span class="c1-no">图上的编号</span></div>${notes.map((m) => { const [a, b] = head(m.text); return `<div class="tr1-n" data-b="${m.b}"><span class="bdg">${m.k}</span><p><b>${esc(a)}</b>${esc(b)}</p></div>`; }).join('')}</div>
  </div></div>`);
    const gEl = $(sec, '.cht-g'), rd = $(sec, '.rd1'), ch = $(sec, '.tr1-ch'), side = $$(sec, '.tr1-r > .e0');
    const P0 = (G) => ({ x: G.x, y: G.y + 18, w: G.w - 92, h: G.h - 18 - 36 });
    let lastI = -1;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastI = -1; S.morph = null; },
      enter() { return enterCards(pg, 1300); },
      async morphIn(from) {
        S.morph = { from, u: 0 }; S.a = 1;
        pg.head.forEach((e) => e && showNow(e)); const h0 = $(sec, '.head'); hide(h0); appear(h0, D.d(280)); hide(ch);   // 等封面的标题淡掉再出新标题，两行字不叠在一起
        side.forEach((e, k) => appear(e, D.d(560 + k * 90)));
        await tween(D.d(T.morph), (v) => { S.morph.u = v; }, { ease: E.inOut });
        const hd = $(ch, '.c1-h'); showNow(ch); hide(hd); S.morph = null; appear(hd, 0);
      },
      beat(k) { S.t0 = null; return beatIn(pg, k, 800); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const G = box(gEl, sec); let P = P0(G);
        if (S.morph) {
          const f = S.morph.from, u = S.morph.u, L = (a, b) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
          P = L(f, P);
          if (f.card) { const C = L(f.card, off(ch, sec)); ctx.globalAlpha = 1; ctx.fillStyle = paper(); ctx.fillRect(C.x, C.y, C.w, C.h); ctx.strokeStyle = D.rgba('edge'); ctx.lineWidth = 1; ctx.strokeRect(sharp(C.x), sharp(C.y), C.w - 1, C.h - 1); }
        }
        ctx.globalAlpha = S.morph ? 1 : G.a;
        const b1 = S.b[1], b2 = S.b[2], b3 = S.b[3], ev = d.event?.at;
        const x6 = ev ? (Xw(P, n, ev - 1) + Xw(P, n, ev - 2)) / 2 : 0;
        if (b1 > 0 && ev) { ctx.fillStyle = zone(0.75 * b1); ctx.fillRect(x6, P.y, P.x + P.w - x6, P.h); }
        const Y = gridY(ctx, P, lo, hi, mi, ma, { grow: S.morph ? 1 : E.enter(clamp(S.a * 1.6)), dg: dgt(ma) });
        weekAxis(ctx, P, n, { all: true, unit: axU });
        if (b1 > 0 && ev) { line(ctx, [[sharp(x6), lerp(P.y + P.h, P.y, E.enter(b1))], [sharp(x6), P.y + P.h]], ink(0.85), 1.5); badge(ctx, x6, P.y + 2, 1, b1); }
        if (b2 > 0 && avg.length > 1) {
          const u = E.enter(b2);
          avg.forEach((a, i) => { const xa = Xw(P, n, a.from - 1) - 14, xb = Xw(P, n, a.to - 1) + 14, y = sharp(Y(a.v)); line(ctx, [[xa, y], [lerp(xa, xb, u), y]], i ? acc() : ink(0.55), i ? 2 : 1.5, i ? null : [6, 4]); if (u >= 1) i ? tn(ctx, fmt(a.v, wd), xb + 8, y, cf(14, 600), acc(), 'left', 'middle') : tn(ctx, fmt(a.v, wd), xa + 2, y - 14, cf(14, 600), ink(0.6), 'left', 'middle'); });
          const xr = P.x + P.w + 58, y0 = Y(avg[0].v), y1 = lerp(y0, Y(avg[1].v), u);
          line(ctx, [[xr - 6, sharp(y0)], [xr, sharp(y0)], [xr, y1], [xr - 6, y1]], acc(), 1.5);
          if (u >= 1) tn(ctx, sgn(diff, wd), xr + 8, (y0 + y1) / 2, cf(15, 600), acc(), 'left', 'middle');
        }
        series(ctx, P, w, Y, { upto: S.morph ? n : S.a * n, ev, endAc: true, q: 9 });
        if (S.a >= 1 && !S.morph) tn(ctx, fmt(last, wd), Xw(P, n, n - 1), Y(last) + (n > 1 && w[n - 2] > last ? 22 : -20), cf(16, 600), acc(), 'center', 'middle');   // 线从上面落下来时，数写在点下面，免得被线划过
        if (b3 > 0 && d.dip) { const i = d.dip.at - 1, x = Xw(P, n, i), y = Y(w[i]); ctx.strokeStyle = ink(0.85); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(x, y, 18 * E.enter(b3), 0, 7); ctx.stroke(); ctx.setLineDash([]); badge(ctx, x, y + 38, notes.find((m) => m.b === 3).k, b3); }
        if (S.a >= 1 && !S.morph && D.alive) {
          const i = Math.min(n - 1, Math.floor(phase(S, t, 30, 2) * n)), x = Xw(P, n, i);
          cursor(ctx, x, P.y, P.y + P.h, Y(w[i]));
          if (i !== lastI) { lastI = i; rdSet(rd, `${tk(i + 1, true)}${SEP}<b>${fmt(w[i], wd)}</b> ${esc(d.unit)}${i ? `${SEP}${prevW} <b>${sgn(w[i] - w[i - 1], wd)}</b>` : ''}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `${svgSeries(w, d.event?.at)}${notes.map((m) => `<p class="a-note"><b>${esc(m.text)}</b></p>`).join('')}
        <div class="a-kpis">${avg.map((a, i) => `<div><em>${esc(a.label)}</em><span><b class="${i ? 'ac' : ''}">${fmt(a.v, wd)}</b> ${esc(d.unit)}</span></div>`).join('')}${diff != null ? `<div><em>差</em><span><b class="ac">${sgn(diff, wd)}</b> ${esc(d.unit)}</span></div>` : ''}</div>`,
    });
  };

  TYPES.target = (d) => {
    const G = d.goals, n = G.length, dg1 = (v) => (String(v).includes('.') ? 1 : 0), gA = (g) => g.dg ?? dg1(g.actual), gT = (g) => g.dg ?? dg1(g.target);   // dg：这一行显示几位小数（47.0、3.10 这种写法 YAML 会吃掉末尾的 0）
    const dev = G.map((g) => (g.target ? (g.actual - g.target) / g.target : 0));
    const met = G.map((g) => (g.lower ? g.actual <= g.target : g.actual >= g.target)), miss = d.missOn ? G.findIndex((g, i) => !met[i] && g.label === d.missOn) : met.indexOf(false), nMet = met.filter(Boolean).length;
    const top = Math.max(...dev.map(Math.abs)), DM = top <= 0.1 ? 0.1 : top <= 0.2 ? 0.2 : top <= 0.3 ? 0.3 : Math.ceil(top * 2) / 2;
    const abs = (g) => { const df = g.actual - g.target, u = g.unit === '%' ? ' 个百分点' : ` ${g.unit}`; return `${df < 0 ? '少' : '多'} ${fmt(Math.abs(df), g.dg ?? Math.max(dg1(g.actual), dg1(g.target)))}${u}`; };
    const pd = dev.some((v) => v && Math.abs(v) < 0.1) ? 1 : 0, pct = (v) => sgn(v * 100, pd) + '%';   // 一页里的偏差统一小数位
    const [sec, pg, S] = mk(d, 'target', 2, `
  <div class="tg1-sum e0"><b class="tg1-n"><span data-cnt="${nMet}">${nMet}</span><span class="of">／${n}</span></b><p>个目标做到了<small>${esc(d.sumNote || '偏差 =（实际 − 目标）÷ 目标')}</small></p>
    <div class="tg1-lg"><span><i class="sw"></i>做到</span><span><i class="sw h"></i>没做到</span><span><i class="sw l"></i>目标</span></div></div>
  <div class="c1 tg1 e0">
    <div class="tg1-r tg1-hd"><span class="c1-no">目标</span><span class="c1-no r">实际</span><span class="c1-no">目标值</span><i class="tg1-ax"></i><span class="c1-no">结果</span></div>
    ${G.map((g, i) => `<div class="tg1-r${met[i] ? '' : ' miss'}"><em>${esc(g.label)}${g.lower ? '<small class="pill">越少越好</small>' : ''}</em><b class="r"${srcA(g.src)}>${fmt(g.actual, gA(g))}<u>${esc(g.unit)}</u></b><span class="tg1-t">${fmt(g.target, gT(g))} ${esc(g.unit)}${g.lower ? ' 以内' : ''}</span><i class="tg1-g"></i><span class="tg1-m"><em class="pill${met[i] ? '' : ' ink'}">${met[i] ? '做到' : '没做到'}</em><span data-b="1">${abs(g)}</span></span></div>`).join('')}
  </div>
  ${miss >= 0 ? `<div class="prio tint tg1-ms" data-b="2"><span class="prio-l">没做到</span><p><b>${esc(G[miss].label)}</b>　${esc(d.miss || '')}</p><span class="rd1" aria-hidden="true"></span></div>` : ''}`);
    const rows = $$(sec, '.tg1-r:not(.tg1-hd)'), gs = rows.map((r) => $(r, '.tg1-g')), ax = $(sec, '.tg1-ax'), ms = $(sec, '.tg1-ms');
    let lastK = -1;
    const geo = (B) => { const cx = B.x + B.w / 2, half = B.w / 2 - 54; return { cx, X: (v) => cx + (v / DM) * half }; };
    return std(pg, {
      reset() { reset1(pg); lastK = -1; rows.forEach((r) => r.classList.remove('hl', 'on')); if (ms) setVar(ms, '--on', 0); },
      enter() { return enterCards(pg, 1400); },
      async beat(k) { if (k === 2 && miss >= 0) { rows[miss].classList.add('on'); tween(D.d(600), (v) => setVar(ms, '--on', v), { delay: D.d(120) }); } return beatIn(pg, k, 700); },
      calm() { calmGroups(pg); if (miss >= 0) { rows[miss].classList.toggle('on', D.b >= 2); setVar(ms, '--on', D.b >= 2 ? 1 : 0); } },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const A = box(ax, sec), g0 = box(gs[0], sec), gl = box(gs[n - 1], sec), q = geo(A), top0 = g0.y - 10, bot = gl.y + gl.h + 10;
        ctx.globalAlpha = A.a;
        const st = DM <= 0.1 ? 0.05 : 0.1;
        for (let v = -DM; v <= DM + 1e-9; v += st) {
          const x = sharp(q.X(v)), z = Math.abs(v) < 1e-9;
          if (!z) { line(ctx, [[x, top0], [x, bot]], tone(0.12), 1); line(ctx, [[x, A.y + A.h - 6], [x, A.y + A.h]], ink(0.5), 1); tn(ctx, sgn(v * 100, 0) + '%', x, A.y + A.h - 16, cf(13), ink(0.5), 'center', 'middle'); }
        }
        line(ctx, [[sharp(q.cx), A.y + A.h - 26], [sharp(q.cx), bot]], ink(0.9), 1.5);
        txt2(ctx, '目标', q.cx, A.y + A.h - 34, cf(13, 600, 'sans'), ink(0.85), 'center', 'middle');
        let K = -1, ku = 1;
        if (S.a >= 1 && D.alive) { const p = phase(S, t, n * 2.4, 1.5) * n; K = Math.min(n - 1, Math.floor(p)); ku = E.inOut(clamp((p - K) * 1.6)); }
        G.forEach((g, i) => {
          const B = box(gs[i], sec), f = i === K ? ku : E.enter(clamp(S.a * (n + 1) - i)); if (!f) return;
          const y = B.y + B.h / 2, xe = q.X(dev[i] * f), x0 = Math.min(q.cx, xe), wv = Math.abs(xe - q.cx), bh = 14;
          ctx.globalAlpha = B.a;
          const on = !met[i] && S.b[2] > 0;
          if (met[i]) { ctx.fillStyle = g.lower ? tone(0.62) : tone(0.5); ctx.fillRect(x0, y - bh / 2, wv, bh); }
          else hatch(ctx, x0, y - bh / 2, Math.max(2, wv), bh, on ? ink(0.95) : ink(0.8), 5);   // 没做到：墨色斜纹，和图例一致；强调色只给好消息
          line(ctx, [[sharp(xe), y - bh / 2 - 6], [sharp(xe), y + bh / 2 + 6]], ink(0.9), 2);
          if (f >= 1 && g.target) tn(ctx, pct(dev[i]), dev[i] >= 0 ? xe + 10 : xe - 10, y, cf(14, 600), on ? ink(0.95) : ink(0.72), dev[i] >= 0 ? 'left' : 'right', 'middle');
        });
        ctx.globalAlpha = 1;
        if (K !== lastK) { rows.forEach((r, i) => r.classList.toggle('hl', i === K)); lastK = K; }
      },
      article: () => `<div class="a-rows">${G.map((g, i) => `<div class="${met[i] ? '' : 'miss'}"><span>${esc(g.label)}</span><b${srcA(g.src)}>${fmt(g.actual, gA(g))} ${esc(g.unit)}</b><em>目标 ${fmt(g.target, gT(g))}${g.lower ? ' 以内' : ''} · ${met[i] ? '' : '没做到 '}${g.target ? pct(dev[i]) + '（' + abs(g) + '）' : abs(g)}</em></div>`).join('')}</div>
        ${miss >= 0 ? `<p class="a-note"><b>没做到：${esc(G[miss].label)}</b>　${esc(d.miss || '')}</p>` : ''}`,
    });
  };

  TYPES.kpis = (d, all) => {
    const T6 = d.tiles, bads = T6.map((t, i) => (t.bad ? i : -1)).filter((i) => i >= 0), ev = (all.find((p) => p.type === 'trend') || {}).event?.at || 0;
    const [sec, pg, S] = mk(d, 'kpis', 1, `
  <div class="row kp1 grow" style="grid-template-columns:repeat(3,1fr)">${T6.map((t, i) => `<div class="c1 kp1-c e0${t.bad ? ' bad' : ''}"><div class="c1-h"><span class="c1-no"><b>${pad(i + 1)}</b>　${esc(t.label)}</span>${t.bad ? '<em class="pill ink">在变差</em>' : t.good === 'down' ? '<em class="pill">越少越好</em>' : ''}</div>
    <div class="c1-b kp1-b"><div class="kp1-n">${bigNum(t.v, t.unit, srcA(t.src))}<span class="kp1-d"><b>${esc(t.d)}</b>${esc(d.vs || '和期初比')}</span></div>${t.say ? `<p class="kp1-s">${esc(t.say)}</p>` : ''}</div>
    <div class="c1-f"><i class="kp1-g"></i><span class="kp1-rd" aria-hidden="true"></span></div></div>`).join('')}</div>
  ${d.note ? `<div class="prio tint kp1-nt" data-b="1"><span class="prio-l">注意</span><p>${esc(d.note)}</p></div>` : ''}`);
    const cards = $$(sec, '.kp1-c'), gs = cards.map((c) => $(c, '.kp1-g')), rds = cards.map((c) => $(c, '.kp1-rd')), nt = $(sec, '.kp1-nt');
    let lastI = -1;
    const dgs = (t) => Math.max(...t.spark.map((v) => dig(v)));
    return std(pg, {
      reset() { reset1(pg); lastI = -1; rds.forEach(rdOff); bads.forEach((j) => bar(cards[j], 0)); if (nt) setVar(nt, '--on', 0); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) { bads.forEach((j) => bar(cards[j], 1, D.d(420))); if (nt) tween(D.d(600), (v) => setVar(nt, '--on', v), { delay: D.d(160) }); return beatIn(pg, k, 700); },
      calm() { calmGroups(pg); bads.forEach((j) => bar(cards[j], D.b >= 1 ? 1 : 0)); if (nt) setVar(nt, '--on', D.b >= 1 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const m0 = Math.min(...T6.map((x) => x.spark.length)); let hi = -1; if (S.a >= 1 && D.alive) hi = Math.min(m0 - 1, Math.floor(phase(S, t, 24, 2) * m0));
        T6.forEach((tl, i) => {
          const B = box(gs[i], sec), v = tl.spark, m = v.length, lo = Math.min(...v), hi2 = Math.max(...v), pd = (hi2 - lo || 1) * 0.12;
          const P = { x: B.x + 46, y: B.y + 30, w: B.w - 46 - 50, h: B.h - 30 - 14 };
          const Xs = (k) => P.x + (P.w * k) / (m - 1), Ys = (val) => P.y + P.h - ((val - lo + pd) / (hi2 - lo + 2 * pd)) * P.h;
          const isBad = !!tl.bad, b1 = bads.length ? E.enter(clamp(S.b[1])) : 0, lit = isBad && b1 > 0, f = E.enter(clamp(S.a * 1.4 - (i % 3) * 0.08)), upto = f * (m - 1);
          ctx.globalAlpha = B.a;
          const by = sharp(P.y + P.h + 8);
          line(ctx, [[P.x, by], [P.x + P.w, by]], ink(0.35), 1);
          for (let k = 0; k < m; k++) { const x = sharp(Xs(k)), L = ev && k === ev - 1; line(ctx, [[x, by], [x, by + (L ? 6 : 3)]], ink(L ? 0.55 : 0.25), 1); }
          line(ctx, [[P.x, sharp(Ys(hi2))], [P.x + P.w, sharp(Ys(hi2))]], tone(0.1), 1, [2, 3]); line(ctx, [[P.x, sharp(Ys(lo))], [P.x + P.w, sharp(Ys(lo))]], tone(0.1), 1, [2, 3]);
          const col = isBad ? ink(0.86 + 0.12 * b1) : ink(0.86 - 0.5 * b1);   // 拍 1：变差的线描深，其余退成浅灰
          ctx.strokeStyle = col; ctx.lineWidth = lit ? 1.5 + 0.7 * b1 : 1.5; ctx.lineJoin = 'round'; ctx.beginPath();
          for (let k = 0; k <= Math.ceil(upto) && k < m; k++) { const fk = clamp(upto - k + 1), x = k ? lerp(Xs(k - 1), Xs(k), fk) : Xs(0), y = k ? lerp(Ys(v[k - 1]), Ys(v[k]), fk) : Ys(v[0]); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
          ctx.stroke();
          ctx.fillStyle = paper(); ctx.fillRect(Xs(0) - 4, Ys(v[0]) - 4, 8, 8); ctx.strokeStyle = tone(0.6); ctx.lineWidth = 1.2; ctx.strokeRect(Xs(0) - 3.4, Ys(v[0]) - 3.4, 6.8, 6.8);
          tn(ctx, fmt(v[0], dgs(tl)), P.x - 10, Ys(v[0]), cf(13), ink(0.5), 'right', 'middle');
          if (f >= 1) { ctx.fillStyle = col; ctx.fillRect(Xs(m - 1) - 4.5, Ys(v[m - 1]) - 4.5, 9, 9); tn(ctx, fmt(v[m - 1], dgs(tl)), P.x + P.w + 10, Ys(v[m - 1]), cf(13, 600), isBad ? ink(0.95) : ink(0.85 - 0.35 * b1), 'left', 'middle'); }
          if (hi >= 0) cursor(ctx, Xs(hi), P.y, by, Ys(v[hi]), 9);
        });
        ctx.globalAlpha = 1;
        if (hi !== lastI) { lastI = hi; if (hi < 0) rds.forEach(rdOff); else T6.forEach((tl, i) => rdSet(rds[i], `${tk(hi + 1, true)}　<b>${fmt(tl.spark[hi], dgs(tl))}</b>`)); }
      },
      article: () => `<div class="a-kpis">${T6.map((t) => `<div class="${t.bad ? 'miss' : ''}"><em>${esc(t.label)}</em><span><b${srcA(t.src)}>${esc(t.v)}</b> ${esc(t.unit)}　${esc(t.d)}</span>${t.say ? `<small>${esc(t.say)}</small>` : ''}</div>`).join('')}</div>${d.note ? `<p class="a-note">${esc(d.note)}</p>` : ''}`,
    });
  };

  TYPES.bridge = (d) => {
    const steps = d.steps, n = steps.length, big = steps.reduce((m, s, i) => (s.v > steps[m].v ? i : m), 0), neg = d.negOn ? steps.findIndex((s) => s.label === d.negOn && s.v < 0) : steps.reduce((m, s, i) => (s.v < 0 && (m < 0 || s.v < steps[m].v) ? i : m), -1);   // 标出哪一步往下走：negOn 指定，默认最多的那一步
    const cum = [d.start.v]; steps.forEach((s) => cum.push(cum[cum.length - 1] + s.v));
    const [lo, hi, mi, ma] = niceDom(cum, 1.5), u = d.unit || '', wd = wdOf([d.start.v, d.end.v, ...steps.map((s) => s.v)]);
    const cells = [{ label: d.start.label, v: fmt(d.start.v, wd), src: d.start.src, c: 'lv' }, ...steps.map((s, i) => ({ label: s.label, v: sgn(s.v, wd), src: s.src, note: s.note, c: i === big ? 'big' : i === neg ? 'neg' : '' })), { label: d.end.label, v: fmt(d.end.v, wd), src: d.end.src, c: 'lv end' }];
    const [sec, pg, S] = mk(d, 'bridge', 3, `
  <div class="c1 cht br1 grow e0">${chartHead(d.chart || sp(`从${d.start.label}到${d.end.label}，一项一项加`), sp(`纵轴从 ${fmt(lo, dgt(mi))} ${u}起；${d.start.label}、${d.end.label}只画一条线，不画从 0 起的柱子`))}
    <i class="cht-g br1-g"></i>
    <div class="br1-cols" style="--n:${n + 2}">${cells.map((c) => `<div class="br1-c ${c.c}"><em>${esc(c.label)}</em><b${srcA(c.src)}>${esc(c.v)}</b>${c.note ? `<p data-b="3">${esc(c.note)}</p>` : ''}</div>`).join('')}</div>
  </div>`);
    const gEl = $(sec, '.br1-g'), rd = $(sec, '.rd1'), cs = $$(sec, '.br1-c');
    let lastK = -2;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastK = -2; cs.forEach((c) => c.classList.remove('on')); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) { if (k === 1) cs[big + 1].classList.add('on'); if (k === 2 && neg >= 0) cs[neg + 1].classList.add('on'); return beatIn(pg, k, 700); },
      calm() { calmGroups(pg); cs[big + 1].classList.toggle('on', D.b >= 1); if (neg >= 0) cs[neg + 1].classList.toggle('on', D.b >= 2); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const G = box(gEl, sec), P = { x: G.x, y: G.y + 8, w: G.w, h: G.h - 8 }, cols = n + 2, cw = P.w / cols, cx = (k) => P.x + cw * (k + 0.5), bw = Math.min(cw * 0.44, 112);
        ctx.globalAlpha = G.a;
        const Y = gridY(ctx, P, lo, hi, mi, ma, { grow: E.enter(clamp(S.a * 1.6)), dg: dgt(ma) });
        const rv = (k) => clamp(S.a * (cols + 0.5) - k), b1 = S.b[1], b2 = S.b[2];
        for (let k = 0; k < cols; k++) line(ctx, [[sharp(cx(k)), P.y + P.h], [sharp(cx(k)), P.y + P.h + 6]], ink(0.5), 1);
        const lev = (k, v, ac) => { const f = E.enter(rv(k)); if (!f) return; const half = bw / 2 + 18, y = Y(v); ctx.fillStyle = ac ? acc() : ink(0.92); ctx.fillRect(cx(k) - half, y - 1.5, half * 2 * f, 3); };
        lev(0, d.start.v, false);
        steps.forEach((s, i) => {
          const f = E.enter(rv(i + 1)); if (!f) return;
          const x = cx(i + 1), y0 = Y(cum[i]), y1 = Y(cum[i + 1]), hh = Math.abs(y1 - y0) * f, yy = s.v >= 0 ? y0 - hh : y0;
          const xp = cx(i) + (i === 0 ? bw / 2 + 18 : bw / 2); line(ctx, [[xp, sharp(y0)], [x - bw / 2, sharp(y0)]], ink(0.45), 1, [3, 3]);
          if (s.v < 0) hatch(ctx, x - bw / 2, yy, bw, Math.max(hh, 2), b2 > 0 && i === neg ? ink(0.95) : ink(0.6), 6);   // 拍 2 只描深标出来的那一步
          else if (i === big && b1 > 0) { ctx.fillStyle = tone(0.5); ctx.fillRect(x - bw / 2, yy, bw, hh); ctx.fillStyle = acc(E.enter(b1)); ctx.fillRect(x - bw / 2, yy, bw, hh); }
          else { ctx.fillStyle = tone(0.5 - 0.06 * (i % 3)); ctx.fillRect(x - bw / 2, yy, bw, hh); }
        });
        const xl = cx(n) + (neg === n - 1 || true ? bw / 2 : 0); if (rv(n + 1) > 0) line(ctx, [[xl, sharp(Y(cum[n]))], [cx(n + 1) - bw / 2 - 18, sharp(Y(cum[n]))]], ink(0.45), 1, [3, 3]);
        lev(n + 1, d.end.v, true);
        if (S.a >= 1 && D.alive) {
          const p = phase(S, t, 3 * (n + 1), 2) * (n + 0.999), k = Math.floor(p), f = p - k, ff = E.inOut(clamp(f * 1.5));
          const v = k >= n ? d.end.v : cum[k] + steps[k].v * ff, x = lerp(cx(k), cx(Math.min(k + 1, n + 1)), ff);
          cursor(ctx, x, P.y, P.y + P.h, Y(v), 11);
          const K = ff >= 1 ? k : k - 1;
          if (K !== lastK) { lastK = K; rdSet(rd, K < 0 ? `从<b>${esc(d.start.label)}</b>出发${SEP}<b>${fmt(d.start.v, wd)}</b> ${esc(u)}` : `走到<b>${esc(steps[Math.min(K, n - 1)].label)}</b>之后${SEP}累计 <b>${fmt(cum[Math.min(K, n - 1) + 1], wd)}</b> ${esc(u)}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-rows">${cells.map((c) => `<div><span>${esc(c.label)}</span><b${srcA(c.src)}>${esc(c.v)}</b>${c.note ? `<em>${esc(c.note)}</em>` : ''}</div>`).join('')}</div>`,
    });
  };

  TYPES.dist = (d) => {
    const A = d.a.scores, B = d.b.scores, cuts = d.cuts, LO = 40, HI = 100, u = d.unit || '分';
    const bands = [[LO, cuts[0]], [cuts[0], cuts[1]], [cuts[1], HI + 1]], bl = [`${cuts[0]} ${u}以下`, `${cuts[0]}–${cuts[1] - 1} ${u}`, `${cuts[1]} ${u}以上`];
    const cnt = (arr, a, b) => arr.filter((v) => v >= a && v < b).length, mean = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
    const low = B.filter((v) => v < cuts[0]).length;
    const [sec, pg, S] = mk(d, 'dist', 2, `
  <div class="c1 cht ds1 grow e0">${chartHead(d.chart || `一格一个人 · ${A.length} 人`, `${d.a.src} ／ ${d.b.src}`)}
    <div class="ds1-in"><div class="ds1-l">${[d.a, d.b].map((r, k) => `<div><em>${esc(r.label)}</em><span>平均 <b class="${k ? 'ac' : ''}"${srcA(r.src, `${r.scores.length} 人的平均`)}>${fmt(mean(r.scores), 1)}</b></span></div>`).join('')}</div><i class="cht-g ds1-g"></i></div>
  </div>
  <div class="ds1-t" data-b="1"><span></span>${bl.map((b) => `<span class="c1-no">${esc(b)}</span>`).join('')}
    ${[A, B].map((arr, k) => `<em>${esc(k ? d.b.label : d.a.label)}</em>${bands.map(([a, b], j) => { const v = cnt(arr, a, b), dv = v - cnt(A, a, b); return `<b class="${k && j === 2 ? 'ac' : ''}">${v}<u>人</u>${k ? `<small>${dv ? sgn(dv, 0) : '没变'}</small>` : ''}</b>`; }).join('')}`).join('')}</div>
  <div class="prio tint ds1-nt" data-b="2"><span class="prio-l">下一步</span><p>${esc(d.next || `${d.b.label}还有 ${low} 个人低于 ${cuts[0]} ${u}${d.follow ? '，' + d.follow : ''}`)}</p></div>`);
    const gEl = $(sec, '.ds1-g'), rd = $(sec, '.rd1'), nt = $(sec, '.ds1-nt');
    let SW = null, swW = 0, lastT = -1;
    const R = 6.5;
    function swarm(arr, P) {
      const Xs = (v) => P.x + ((v - LO) / (HI - LO)) * P.w, placed = [], out = [], step = R * 2 + 2;
      arr.map((v, i) => [Xs(v), i]).sort((a, b) => a[0] - b[0]).forEach(([x, i]) => {
        let y = 0; for (let k = 0; k < 40; k++) { y = (k === 0 ? 0 : (k % 2 ? -1 : 1) * Math.ceil(k / 2)) * step; if (placed.every((p) => Math.abs(p.x - x) >= step || Math.abs(p.y - y) >= step)) break; }
        placed.push({ x, y }); out[i] = { x, y };
      });
      return out;
    }
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastT = -1; if (nt) setVar(nt, '--on', 0); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) { if (k === 2) tween(D.d(600), (v) => setVar(nt, '--on', v), { delay: D.d(120) }); return beatIn(pg, k, 800); },
      calm() { calmGroups(pg); setVar(nt, '--on', D.b >= 2 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const G = box(gEl, sec), P = { x: G.x, y: G.y, w: G.w, h: G.h - 46 }, Xs = (v) => P.x + ((v - LO) / (HI - LO)) * P.w, ry = [P.y + P.h * 0.25, P.y + P.h * 0.75];
        if (!SW || swW !== P.w) { SW = [swarm(A, P), swarm(B, P)]; swW = P.w; }
        const oy = (k) => ry[k] - SW[k][0].y + SW[k][0].y;   // 行中心
        ctx.globalAlpha = G.a;
        const ay = sharp(P.y + P.h + 6), b1 = S.b[1], b2 = S.b[2];
        let thr = null;
        if (S.a >= 1 && D.alive) { thr = Math.floor(58 + phase(S, t, 18, 2.5) * 37); const xT = Xs(thr); ctx.fillStyle = zone(0.85); ctx.fillRect(xT, P.y, P.x + P.w - xT, P.h + 6); }
        line(ctx, [[P.x, sharp(P.y + P.h / 2)], [P.x + P.w, sharp(P.y + P.h / 2)]], tone(0.12), 1);
        line(ctx, [[P.x, ay], [P.x + P.w, ay]], ink(0.75), 1);
        for (let v = LO; v <= HI; v += 5) { const x = sharp(Xs(v)), M = v % 10 === 0; line(ctx, [[x, ay], [x, ay + (M ? 7 : 4)]], ink(M ? 0.55 : 0.3), 1); if (M) tn(ctx, String(v), x, ay + 22, cf(14), ink(0.55), 'center', 'middle'); }
        txt2(ctx, u, P.x + P.w + 12, ay + 22, cf(14, 400, 'sans'), ink(0.45), 'left', 'middle');
        if (b1 > 0) for (const c of cuts) { const x = sharp(Xs(c)); line(ctx, [[x, ay], [x, lerp(ay, P.y, E.enter(b1))]], ink(0.7), 1, [4, 4]); }
        [A, B].forEach((arr, k) => { const x = sharp(Xs(mean(arr))); line(ctx, [[x, ry[k] - P.h * 0.22], [x, ry[k] + P.h * 0.22]], k ? acc() : ink(0.55), 2); });
        [A, B].forEach((arr, k) => {
          arr.forEach((v, i) => {
            const f = E.enter(clamp(S.a * 2.2 - (SW[k][i].x - P.x) / P.w)); if (!f) return;
            const p = SW[k][i], x = p.x, y = ry[k] + p.y * f, dim = thr != null && v < thr;
            ctx.globalAlpha = G.a * (dim ? 0.3 : 1) * f;
            const hiA = k && b1 > 0 && v >= cuts[1], lowB = k && v < cuts[0];
            if (!k) { ctx.fillStyle = tone(0.42); ctx.fillRect(x - R, y - R, R * 2, R * 2); }
            else if (lowB) { ctx.fillStyle = paper(); ctx.fillRect(x - R, y - R, R * 2, R * 2); hatch(ctx, x - R, y - R, R * 2, R * 2, b2 > 0 ? acc() : ink(0.85), 4); }
            else { ctx.fillStyle = hiA ? D.rgba('ac', 0.35 + 0.65 * E.enter(b1)) : ink(0.9); ctx.fillRect(x - R, y - R, R * 2, R * 2); }
            ctx.globalAlpha = G.a;
            if (lowB && b2 > 0) { ctx.strokeStyle = acc(); ctx.lineWidth = 1.5; const r = (R + 8) * E.enter(b2); ctx.strokeRect(x - r, y - r, r * 2, r * 2); }
          });
        });
        if (thr != null) {
          const xT = sharp(Xs(thr)); line(ctx, [[xT, P.y], [xT, ay + 6]], ink(0.9), 1.5);
          if (thr !== lastT) { lastT = thr; rdSet(rd, `<b>${thr}</b> ${esc(u)}以上${SEP}${esc(d.a.label)} <b>${A.filter((v) => v >= thr).length}</b> 人 → ${esc(d.b.label)} <b class="ac">${B.filter((v) => v >= thr).length}</b> 人`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-kpis">${bands.map(([a, b], j) => `<div><em>${esc(bl[j])}</em><span>${cnt(A, a, b)} → <b class="${j === 2 ? 'ac' : ''}">${cnt(B, a, b)}</b> 人</span></div>`).join('')}</div>
        <p class="a-note">平均 ${fmt(mean(A), 1)} → <b>${fmt(mean(B), 1)}</b> ${esc(u)}</p>`,
    });
  };

  TYPES.compare = (d) => {
    const n = d.n, A = d.a, B = d.b, mA = (A.perSec * n) / 60, mB = (B.perSec * n) / 60, scale = Math.ceil(mA / 60) * 60;
    const mmss = (s) => `${Math.floor(s / 60)} 分 ${String(Math.round(s % 60)).padStart(2, '0')} 秒`;
    const hm = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return `${h ? h + ' 小时 ' : ''}${r} 分`; };
    const [sec, pg, S] = mk(d, 'compare', 3, `
  <div class="c1 cht cp1 grow e0">${chartHead(d.chart || `改完 ${n} 篇用的时间`, `一格一篇，格子的宽就是改这一篇用的时间`)}
    ${[A, B].map((r, k) => `<div class="cp1-r${k ? ' b' : ''}"><div class="cp1-l"><em>${esc(r.label)}</em>${bigTime(Math.round(k ? mB : mA), srcA(r.src))}<p><span data-b="1">每篇 <b>${mmss(r.perSec)}</b></span><span data-b="2">${esc(r.ret)}</span></p></div><i class="cp1-g"></i></div>`).join('')}
    <div class="cp1-r cp1-ax"><span></span><i class="cp1-axg"></i></div>
  </div>
  ${d.split ? `<div class="row cp1-sp" style="grid-template-columns:repeat(${d.split.length},1fr)">${d.split.map((s, i) => `<div class="c1" data-b="3"><div class="c1-h"><span class="c1-no"><b>${pad(i + 1)}</b>　${esc(s.who)}</span><em class="pill${i ? ' ac' : ''}">${i ? '人工把关' : '先过一遍'}</em></div><div class="c1-b"><p class="c1-act">${esc(s.text)}</p></div></div>`).join('')}</div>` : ''}`);
    const gs = $$(sec, '.cp1-g'), axg = $(sec, '.cp1-axg'), rd = $(sec, '.rd1'), sp = $$(sec, '.cp1-sp .c1');
    let lastM = -1;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastM = -1; sp.forEach((c) => bar(c, 0)); },
      enter() { return enterCards(pg, 1600); },
      async beat(k) { if (k === 3) sp.forEach((c, i) => i && bar(c, 1, D.d(500))); return beatIn(pg, k, 700); },
      calm() { calmGroups(pg); sp.forEach((c, i) => bar(c, i && D.b >= 3 ? 1 : 0)); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const Ax = box(axg, sec), L = Ax.x, W = Ax.w, Xm = (m) => L + (m / scale) * W;
        ctx.globalAlpha = Ax.a;
        let cur = null; if (S.a >= 1 && D.alive) cur = phase(S, t, 28, 2.5) * mA;
        const g0 = box(gs[0], sec), g1 = box(gs[1], sec);
        const ay = sharp(Ax.y + 4);
        line(ctx, [[L, ay], [L + W, ay]], ink(0.75), 1);
        for (let m = 0; m <= scale; m += 10) { const x = sharp(Xm(m)), H = m % 60 === 0, M = m % 30 === 0; line(ctx, [[x, ay], [x, ay + (H ? 8 : M ? 5 : 3)]], ink(H ? 0.6 : 0.3), 1); if (H) { tn(ctx, `${m / 60} 小时`, x, ay + 24, cf(14, 400, 'sans'), ink(0.55), m ? 'center' : 'left', 'middle'); line(ctx, [[x, g0.y - 10], [x, ay]], tone(0.1), 1); } }
        let done = [0, 0];
        [[A, g0, mA], [B, g1, mB]].forEach(([r, G, tot], k) => {
          const per = r.perSec / 60, len = (tot / scale) * W * E.enter(clamp(S.a * 1.2 - k * 0.15)), y = G.y + 4, h = G.h - 8;
          const dn = cur == null ? n : Math.min(n, Math.floor(cur / per)); done[k] = dn;
          for (let i = 0; i < n; i++) {
            const x0 = L + (i * per / scale) * W, x1 = L + ((i + 1) * per / scale) * W; if (x0 >= L + len) break;
            const lit = i < dn; ctx.fillStyle = k ? (lit ? acc() : D.rgba('ac', 0.22)) : (lit ? tone(0.5) : tone(0.14));
            ctx.fillRect(x0 + 0.5, y, Math.min(x1, L + len) - x0 - 1, h);
          }
        });
        const df = mA - mB, fx = E.enter(clamp((S.a - 0.35) / 0.65));
        if (fx > 0) {
          const y = g1.y + g1.h / 2, xb = Xm(mB) + 6, xa = Xm(mA);
          line(ctx, [[xb, sharp(y)], [lerp(xb, xa, fx), sharp(y)]], ink(0.55), 1, [4, 4]);
          if (fx >= 1) { line(ctx, [[sharp(xa), y - 10], [sharp(xa), y + 10]], ink(0.75), 1); tn(ctx, `少 ${hm(df)}　${sgn(-df / mA * 100, 0)}%`, (xb + xa) / 2, y - 18, cf(15, 600), ink(0.82), 'center', 'middle'); }
        }
        if (cur != null) {
          const x = Xm(cur); line(ctx, [[sharp(x), g0.y - 6], [sharp(x), ay + 4]], ink(0.9), 1.5);
          const m = Math.floor(cur);
          if (m !== lastM) { lastM = m; rdSet(rd, `第 <b>${m}</b> 分钟${SEP}${esc(B.label)}改了 <b class="ac">${done[1]}</b> 篇${done[1] >= n ? '（改完了）' : ''}${SEP}${esc(A.label)}改了 <b>${done[0]}</b> 篇`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-cmp"><div><em>${esc(A.label)}</em><b${srcA(A.src)}>${hm(mA)}</b><span>每篇 ${mmss(A.perSec)} · ${esc(A.ret)}</span><i style="width:100%"></i></div>
        <div><em>${esc(B.label)}</em><b class="ac"${srcA(B.src)}>${hm(mB)}</b><span>每篇 ${mmss(B.perSec)} · ${esc(B.ret)}</span><i class="ac" style="width:${((mB / mA) * 100).toFixed(1)}%"></i></div></div>
        ${(d.split || []).map((s) => `<p class="a-note"><b>${esc(s.who)}</b>　${esc(s.text)}</p>`).join('')}`,
    });
  };

  TYPES.compose = (d) => {
    const P_ = d.parts, A = d.a.v, B = d.b.v, n = P_.length, u = d.unit || '';
    const sum = (v) => v.reduce((x, y) => x + y, 0), tA = sum(A), tB = sum(B), wd = wdOf([...A, ...B]);
    const { major: ma } = ticks(Math.max(tA, tB), 10), mi = ma / 2, top = Math.ceil(Math.max(tA, tB) / ma - 1e-9) * ma;
    const up = d.pick === 'up', df = A.map((v, i) => B[i] - v), big = df.reduce((m, v, i) => ((up ? v > df[m] : v < df[m]) ? i : m), 0), same = df.findIndex((v) => Math.abs(v) < 0.05);
    const TONES = [0.6, 0.44, 0.3, 0.2, 0.12], doing = d.doing ?? '是';
    const [sec, pg, S] = mk(d, 'compose', 2, `
  <div class="c1 cht cm1 grow e0">${chartHead(d.chart || `${d.a.label}和${d.b.label} · ${u}`, `${d.a.src} ／ ${d.b.src}`)}
    ${[d.a, d.b].map((r, k) => `<div class="cm1-r"><div class="cm1-l"><em>${esc(r.label)}</em><b class="${k ? 'ac' : ''}"${srcA(r.src, P_.join(' + '))}>${fmt(k ? tB : tA, wd)}<u>${esc(u)}${esc(d.per || '')}</u></b></div><i class="cm1-g"></i></div>`).join('')}
    <div class="cm1-r cm1-ax"><span></span><i class="cm1-axg"></i></div>
  </div>
  <div class="row cm1-d" style="grid-template-columns:repeat(${n},1fr)">${P_.map((p, i) => `<div class="c1" data-b="1"><div class="c1-h"><span class="c1-no"><b>${pad(i + 1)}</b>　${esc(p)}</span>${i === big ? `<em class="pill ac">${esc(d.bigLabel || (up ? '加得最多' : '省得最多'))}</em>` : i === same ? '<em class="pill">没变</em>' : ''}</div>
    <div class="c1-b"><b class="c1-big${i === big ? ' ac' : ''}">${Math.abs(df[i]) < 0.05 ? '没变' : `${sgn(df[i], wd)}<u>${esc(u)}</u>`}</b></div><div class="c1-f"><p class="c1-d"><span class="c1-num">${fmt(A[i], wd)}</span> → <span class="c1-num">${fmt(B[i], wd)}</span> ${esc(u)}</p></div></div>`).join('')}</div>
  ${d.note ? `<div class="prio tint cm1-nt" data-b="2"><span class="prio-l">${esc(d.noteLabel || '注意')}</span><p>${esc(d.note)}</p></div>` : ''}`);
    const gs = $$(sec, '.cm1-g'), axg = $(sec, '.cm1-axg'), rd = $(sec, '.rd1'), cards = $$(sec, '.cm1-d .c1'), nt = $(sec, '.cm1-nt');
    let lastK = '';
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastK = ''; cards.forEach((c) => bar(c, 0)); if (nt) setVar(nt, '--on', 0); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) {
        if (k === 1) bar(cards[big], 1, D.d(500));
        if (k === 2) { if (same >= 0) cards[same].classList.add('cur'); if (nt) tween(D.d(600), (v) => setVar(nt, '--on', v), { delay: D.d(120) }); }
        return beatIn(pg, k, 800);
      },
      calm() { calmGroups(pg); bar(cards[big], D.b >= 1 ? 1 : 0); if (same >= 0) cards[same].classList.toggle('cur', D.b >= 2); if (nt) setVar(nt, '--on', D.b >= 2 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const Ax = box(axg, sec), L = Ax.x, W = Ax.w, Xh = (h) => L + (h / top) * W, R = [box(gs[0], sec), box(gs[1], sec)];
        ctx.globalAlpha = Ax.a;
        const seg = (k, i) => { const arr = k ? B : A, a = sum(arr.slice(0, i)); return { x: Xh(a), w: Xh(a + arr[i]) - Xh(a), y: R[k].y, h: R[k].h }; };
        const ay = sharp(Ax.y + 4);
        line(ctx, [[L, ay], [L + W, ay]], ink(0.75), 1);
        for (let k = 0; k * mi <= top + 1e-9; k++) { const h = k * mi, x = sharp(Xh(h)), M = k % 2 === 0; line(ctx, [[x, ay], [x, ay + (M ? 7 : 3)]], ink(M ? 0.55 : 0.3), 1); if (M) { tn(ctx, fmt(h, dgt(ma)), x, ay + 22, cf(14), ink(0.55), 'center', 'middle'); line(ctx, [[x, R[0].y - 8], [x, ay]], tone(0.08), 1); } }
        if (!(d.chart || '').includes(u)) txt2(ctx, u, L + W + 14, ay + 22, cf(14, 400, 'sans'), ink(0.45), 'left', 'middle');   // 标题里写了单位就不再写
        const b1 = S.b[1];
        if (b1 > 0) for (let i = 0; i < n; i++) {
          if (!A[i] || !B[i]) continue;   // 有一边是 0（新开的、砍掉的）就不连，否则像是旁边那块钱整块挪了过来
          const a = seg(0, i), b = seg(1, i), f = E.enter(b1);
          ctx.fillStyle = i === big ? D.rgba('ac', 0.2 * f) : tone(0.07 * f); ctx.beginPath();
          ctx.moveTo(a.x, a.y + a.h); ctx.lineTo(a.x + a.w, a.y + a.h); ctx.lineTo(b.x + b.w, b.y); ctx.lineTo(b.x, b.y); ctx.closePath(); ctx.fill();
        }
        let hh = null; if (S.a >= 1 && D.alive) hh = phase(S, t, 20, 2.5) * tA;
        for (let k = 0; k < 2; k++) for (let i = 0; i < n; i++) {
          const r = seg(k, i), f = E.enter(clamp(S.a * (n + 1.5) - i - k * 0.5)); if (!f) continue;
          const isBig = i === big && b1 > 0 && k === 1, light = TONES[i] < 0.5 && !isBig;
          ctx.fillStyle = isBig ? acc() : tone(TONES[i]); ctx.fillRect(r.x + 1, r.y, (r.w - 2) * f, r.h);
          if (i === same && S.b[2] > 0) { ctx.strokeStyle = acc(); ctx.lineWidth = 2; ctx.globalAlpha = Ax.a * S.b[2]; ctx.strokeRect(r.x - 2, r.y - 3, r.w + 2, r.h + 6); ctx.globalAlpha = Ax.a; }
          if (f >= 1 && r.w > 70) { const c = light ? ink(0.82) : '#FFFFFF'; txt2(ctx, P_[i], r.x + 12, r.y + r.h / 2 - 10, cf(14, 500, 'sans'), light ? ink(0.62) : 'rgba(255,255,255,.82)', 'left', 'middle'); tn(ctx, fmt((k ? B : A)[i], wd), r.x + 12, r.y + r.h / 2 + 12, cf(18, 600), c, 'left', 'middle'); }
        }
        if (hh != null) {
          const x = sharp(Xh(hh)); line(ctx, [[x, R[0].y - 8], [x, ay + 4]], ink(0.9), 1.5);
          const at = (arr) => { let c = 0; for (let i = 0; i < n; i++) { c += arr[i]; if (hh < c) return i; } return -1; };
          const ia = at(A), ib = at(B), key = ia + ':' + ib + ':' + Math.floor(hh * 10);
          if (key !== lastK) { lastK = key; rdSet(rd, `${esc(d.at || `第 {x} ${u}`).replace('{x}', `<b>${fmt(hh, wd)}</b>`)}${SEP}${esc(sp(d.a.label + doing))} <b>${esc(P_[ia] || '')}</b>${SEP}${esc(sp(d.b.label))}${ib < 0 ? ` <b class="ac">${esc(d.done || '已经结束')}</b>` : `${esc(sp(d.b.label + doing).slice(sp(d.b.label).length))} <b>${esc(P_[ib])}</b>`}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-rows">${P_.map((p, i) => `<div><span>${esc(p)}</span><b>${fmt(A[i], wd)} → ${fmt(B[i], wd)} ${esc(u)}</b><em>${Math.abs(df[i]) < 0.05 ? '没变' : sgn(df[i], wd)}</em></div>`).join('')}</div><p class="a-note">${esc(d.sumLabel || '合计')} <b>${fmt(tA, wd)} → <span class="ac">${fmt(tB, wd)}</span></b> ${esc(u)}</p>${d.note ? `<p class="a-note">${esc(d.note)}</p>` : ''}`,
    });
  };

  TYPES.funnel = (d) => {
    const ST = d.stages, n = ST.length, V = ST.map((s) => s.v), N = V[0], u = d.unit || '人', wd = wdOf(V);
    const drop = V.slice(1).map((v, i) => V[i] - v), key = d.by === '比例' ? drop.map((v, i) => v / V[i]) : drop, big = key.reduce((m, v, i) => (v > key[m] ? i : m), 0);   // by: 比例＝按掉的比例找最多的一步，默认按人数
    const { major: ma, minor: mi } = ticks(N, 4), top = Math.ceil(N / mi - 1e-9) * mi + mi;
    const pc = (a, b) => `${Math.round((a / b) * 100)}%`;
    const [sec, pg, S] = mk(d, 'funnel', 2, `
  <div class="c1 cht br1 fn1 grow e0">${chartHead(d.chart || `一步步还剩多少 · ${u}`, d.src)}
    <i class="cht-g br1-g"></i>
    <div class="br1-cols" style="--n:${n}">${ST.map((s, i) => `<div class="br1-c${i === big + 1 ? ' big' : ''}"><em>${esc(s.label)}</em><b${srcA(d.src)}>${fmt(s.v, wd)}</b><p>${i ? `是${esc(ST[0].label)}的 ${pc(s.v, N)}` : '起点'}</p></div>`).join('')}</div>
  </div>
  ${d.fix ? `<div class="prio tint fn1-fx" data-b="2"><span class="prio-l">${esc(d.fixLabel || '打算')}</span><p><b>${esc(ST[big].label)} → ${esc(ST[big + 1].label)}</b>${esc(d.fix)}</p></div>` : ''}`);
    const gEl = $(sec, '.br1-g'), rd = $(sec, '.rd1'), cs = $$(sec, '.br1-c'), fx = $(sec, '.fn1-fx');
    let lastK = -1;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastK = -1; cs.forEach((c) => c.classList.remove('on')); if (fx) setVar(fx, '--on', 0); },
      enter() { return enterCards(pg, 1500); },
      async beat(k) {
        if (k === 1) cs[big + 1].classList.add('on');
        if (k === 2 && fx) tween(D.d(600), (v) => setVar(fx, '--on', v), { delay: D.d(120) });
        return beatIn(pg, k, 700);
      },
      calm() { calmGroups(pg); cs[big + 1].classList.toggle('on', D.b >= 1); if (fx) setVar(fx, '--on', D.b >= 2 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const G = box(gEl, sec), P = { x: G.x, y: G.y + 30, w: G.w, h: G.h - 30 }, cw = P.w / n, cx = (k) => P.x + cw * (k + 0.5), bw = Math.min(cw * 0.42, 150);
        ctx.globalAlpha = G.a;
        const Y = gridY(ctx, P, 0, top, mi, ma, { grow: E.enter(clamp(S.a * 1.6)), dg: dgt(ma) });
        for (let k = 0; k < n; k++) line(ctx, [[sharp(cx(k)), P.y + P.h], [sharp(cx(k)), P.y + P.h + 6]], ink(0.5), 1);
        const b1 = S.b[1] || 0, rv = (k) => E.enter(clamp(S.a * (n + 0.6) - k));
        for (let k = 0; k < n; k++) {
          const f = rv(k); if (!f) continue;
          const x = cx(k) - bw / 2, y = Y(V[k] * f), last = k === n - 1;
          ctx.fillStyle = tone(0.44); ctx.fillRect(x, y, bw, P.y + P.h - y);   // 非焦点一律同一档灰（复审：渐变没规律）
          if (k > 0 && f >= 1) {
            const g = clamp(S.a * (n + 0.6) - k - 0.4), yt = lerp(Y(V[k]), Y(V[k - 1]), E.enter(g)), hot = k - 1 === big && b1 > 0;
            if (yt < Y(V[k]) - 1) hatch(ctx, x, yt, bw, Y(V[k]) - yt, hot ? acc() : ink(0.5), 6);
            if (hot) { ctx.strokeStyle = acc(); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, yt + 0.75, bw - 1.5, Y(V[k]) - yt - 1.5); }
            line(ctx, [[cx(k - 1) + bw / 2, sharp(Y(V[k - 1]))], [x, sharp(Y(V[k - 1]))]], ink(0.45), 1, [3, 3]);
            if (b1 > 0) { ctx.globalAlpha = G.a * b1; tn(ctx, `−${fmt(drop[k - 1], wd)}`, cx(k), Y(V[k - 1]) - 26, cf(hot ? 17 : 15, 600), hot ? acc() : ink(0.6), 'center', 'middle'); txt2(ctx, `掉了 ${pc(drop[k - 1], V[k - 1])}`, cx(k), Y(V[k - 1]) - 8, cf(13, 400, 'sans'), hot ? acc() : ink(0.5), 'center', 'middle'); ctx.globalAlpha = G.a; }
          }
        }
        if (S.a >= 1 && D.alive) {
          const k = Math.min(n - 1, Math.floor(phase(S, t, 3 * n, 2) * n));
          cursor(ctx, cx(k) + bw / 2 + 16, P.y, P.y + P.h, Y(V[k]), 11);
          if (k !== lastK) { lastK = k; rdSet(rd, `<b>${esc(ST[k].label)}</b>${SEP}<b>${fmt(V[k], wd)}</b> ${esc(u)}${k ? `${SEP}是${esc(ST[0].label)}的 <b>${pc(V[k], N)}</b>${SEP}比上一步少 <b class="${k - 1 === big ? 'ac' : ''}">${fmt(drop[k - 1], wd)}</b>` : ''}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-rows">${ST.map((s, i) => `<div><span>${esc(s.label)}</span><b${srcA(d.src)}>${fmt(s.v, wd)} ${esc(u)}</b><em>${i ? `−${fmt(drop[i - 1], wd)}` : ''}</em></div>`).join('')}</div><p class="a-note">掉得最多：${esc(ST[big].label)} → ${esc(ST[big + 1].label)}，<b>−${fmt(drop[big], wd)}</b> ${esc(u)}。${esc(d.fix || '')}</p>`,
    });
  };

  TYPES.rank = (d) => {
    const I = [...d.items].sort((a, b) => b.v - a.v), n = I.length, V = I.map((x) => x.v), mx = V[0], mn = V[n - 1], u = d.unit || '', wd = wdOf(V);
    const avg = V.reduce((a, b) => a + b, 0) / n, ratio = mn ? mx / mn : 0, hot = Math.min(n, d.hot ?? 2);
    const { major: ma, minor: mi } = ticks(mx, 5), top = Math.ceil(mx / ma - 1e-9) * ma;
    const [sec, pg, S] = mk(d, 'rank', 2, `
  <div class="c1 cht rk1 grow e0">${chartHead(d.chart || `${d.metric || ''}从高到低 · ${n} 个${d.itemLabel || '项目'}`, d.src)}
    <div class="rk1-r rk1-hd"><span class="c1-no">名次</span><span class="c1-no">${esc(d.itemLabel || '项目')}</span><i class="rk1-ax"></i><span class="c1-no r">${esc(d.metric || '')}${u ? ` · ${esc(u)}` : ''}</span></div>
    ${I.map((it, i) => `<div class="rk1-r"><span class="rk1-no">${pad(i + 1)}</span><em>${esc(it.label)}</em><i class="rk1-g"></i><b class="r${i === 0 ? ' ac' : ''}"${srcA(it.src || d.src)}>${fmt(it.v, wd)}<u>${esc(u)}</u></b></div>`).join('')}
  </div>
  ${d.note ? `<div class="prio tint rk1-nt" data-b="2"><span class="prio-l">${esc(d.noteLabel || '先处理')}</span><p>${esc(d.note)}</p></div>` : ''}`);
    const rows = $$(sec, '.rk1-r:not(.rk1-hd)'), gs = rows.map((r) => $(r, '.rk1-g')), ax = $(sec, '.rk1-ax'), rd = $(sec, '.rd1'), nt = $(sec, '.rk1-nt');
    let lastK = -1;
    return std(pg, {
      reset() { reset1(pg); rdOff(rd); lastK = -1; rows.forEach((r) => r.classList.remove('on')); if (nt) setVar(nt, '--on', 0); },
      enter() { return enterCards(pg, 1400); },
      async beat(k) { if (k === 2) { rows.slice(0, hot).forEach((r) => r.classList.add('on')); if (nt) tween(D.d(600), (v) => setVar(nt, '--on', v), { delay: D.d(120) }); } return beatIn(pg, k, 700); },
      calm() { calmGroups(pg); rows.slice(0, hot).forEach((r) => r.classList.toggle('on', D.b >= 2)); if (nt) setVar(nt, '--on', D.b >= 2 ? 1 : 0); },
      tick(t) {
        const ctx = pg.cv.ctx; ctx.clearRect(0, 0, 1920, 1080); if (!S.a) return;
        const A = box(ax, sec), R = gs.map((g) => box(g, sec)), L = A.x, W = A.w - 70, X = (v) => L + (v / top) * W, top0 = R[0].y - 10, bot = R[n - 1].y + R[n - 1].h;
        ctx.globalAlpha = A.a;
        const ay = sharp(A.y + A.h - 4);
        line(ctx, [[L, ay], [L + W, ay]], ink(0.6), 1);
        for (let k = 0; k * mi <= top + 1e-9; k++) { const v = k * mi, x = sharp(X(v)), M = Math.abs(v / ma - Math.round(v / ma)) < 1e-6; line(ctx, [[x, ay - (M ? 6 : 3)], [x, ay]], ink(M ? 0.55 : 0.3), 1); if (M) { tn(ctx, fmt(v, dgt(ma)), x, ay - 16, cf(13), ink(0.5), 'center', 'middle'); if (v > 0) line(ctx, [[x, top0], [x, bot]], tone(0.08), 1); } }
        line(ctx, [[sharp(L), top0], [sharp(L), bot]], ink(0.75), 1);
        let thr = null; if (S.a >= 1 && D.alive) { const t0 = Math.floor(mn / mi) * mi, k = Math.round((mx - t0) / mi); thr = t0 + Math.min(k, Math.floor(phase(S, t, 18, 2.5) * (k + 1))) * mi; }
        R.forEach((B, i) => {
          const f = E.enter(clamp(S.a * (n + 1) - i)); if (!f) return;
          const h = Math.min(30, B.h - 8), y = B.y + (B.h - h) / 2, w = (X(V[i]) - L) * f;
          ctx.globalAlpha = A.a * (thr != null && V[i] < thr ? 0.28 : 1);
          ctx.fillStyle = i === 0 ? acc() : i < hot && S.b[2] > 0 ? tone(0.62) : tone(0.34); ctx.fillRect(L + 1, y, w, h);
          ctx.globalAlpha = A.a;
        });
        if (S.a >= 1) { const xa = sharp(X(avg)); line(ctx, [[xa, top0], [xa, bot]], ink(0.62), 1, [5, 4]); txt2(ctx, `平均 ${fmt(avg, wd)}`, xa + 6, bot + 14, cf(13, 500, 'sans'), ink(0.6), 'left', 'middle'); }
        const b1 = S.b[1] || 0;
        if (b1 > 0 && ratio) {
          const ya = R[0].y + R[0].h / 2, yb = R[n - 1].y + R[n - 1].h / 2, xr = L + W + 28, yy = lerp(ya, yb, E.enter(b1));
          line(ctx, [[X(mx) + 8, sharp(ya)], [xr, sharp(ya)], [xr, yy]], acc(), 1.5); if (b1 >= 1) line(ctx, [[xr, sharp(yb)], [X(mn) + 8, sharp(yb)]], acc(), 1.5, [3, 3]);
          if (b1 >= 1) { const w = tn(ctx, `${fmt(ratio, 1)}`, xr + 10, (ya + yb) / 2, cf(24, 600), acc(), 'left', 'middle'); txt2(ctx, '倍', xr + 14 + w, (ya + yb) / 2 + 1, cf(16, 500, 'sans'), acc(), 'left', 'middle'); }
        }
        if (thr != null) {
          const x = sharp(X(thr)); line(ctx, [[x, top0 - 6], [x, bot + 4]], ink(0.9), 1.5);
          const k = V.filter((v) => v >= thr).length;
          if (k !== lastK) { lastK = k; rdSet(rd, `${esc(d.metric || '')}在 <b>${fmt(thr, wd)}</b> ${esc(u)} 以上${SEP}<b>${k}</b> 个${esc(d.itemLabel || '')}`); }
        } else rdOff(rd);
        ctx.globalAlpha = 1;
      },
      article: () => `<div class="a-rows">${I.map((it, i) => `<div><span>${pad(i + 1)}　${esc(it.label)}</span><b${srcA(it.src || d.src)}>${fmt(it.v, wd)} ${esc(u)}</b></div>`).join('')}</div><p class="a-note">平均 ${fmt(avg, wd)} ${esc(u)}${ratio ? `；最高是最低的 <b>${fmt(ratio, 1)}</b> 倍` : ''}。${esc(d.note || '')}</p>`,
    });
  };

  const insp = document.createElement('aside'); insp.className = 'insp'; insp.setAttribute('aria-label', '出处核查');
  const marks = document.createElement('div'); marks.className = 'insp-marks';
  document.querySelector('.stage').append(marks, insp);
  let inspP = -1, inspT = 0;
  function inspBuild() {
    const pg = D.pages[D.p]; if (!pg) return; inspP = D.p;
    const els = [...pg.el.querySelectorAll('[data-src],[data-nosrc]')].filter((e) => e.offsetParent !== null || e.getClientRects().length);
    const no = els.filter((e) => 'nosrc' in e.dataset), ok = els.filter((e) => !('nosrc' in e.dataset)), list = [...no, ...ok];
    const label = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28) || '（图）';
    insp.innerHTML = `<header><em>出处核查</em><b>第 ${pad(D.p + 1)} 页</b><span><b>${ok.length}</b> 个有出处${no.length ? ` · <b class="ac">${no.length}</b> 个缺出处` : ''}</span></header>
      <ol>${list.map((e, i) => `<li data-i="${i}" class="${'nosrc' in e.dataset ? 'no' : ''}"><span class="n">${pad(i + 1)}</span><div><b>${esc(label(e))}</b><p>${'nosrc' in e.dataset ? '缺出处：讲之前补上，或者删掉这个数' : esc(e.dataset.src)}</p>${e.dataset.how ? `<p class="how"><i>口径</i>${esc(e.dataset.how)}</p>` : ''}</div></li>`).join('')}</ol>
      <footer>再按 S 退出 · 鼠标停在一行上，页面上对应的数会描出来</footer>`;
    marks.innerHTML = list.map((e, i) => { const r = D.rect(e); return `<span class="insp-m${'nosrc' in e.dataset ? ' no' : ''}" data-i="${i}" style="left:${Math.round(r.x - 14)}px;top:${Math.round(r.y - 14)}px">${pad(i + 1)}</span>`; }).join('');
    const ms = $$(marks, '.insp-m');
    $$(insp, 'li').forEach((li) => {
      const i = +li.dataset.i, e = list[i];
      li.addEventListener('mouseenter', () => { e.classList.add('insp-on'); ms[i].classList.add('on'); });
      li.addEventListener('mouseleave', () => { e.classList.remove('insp-on'); ms[i].classList.remove('on'); });
    });
  }
  D.toggleCheck = () => {
    document.body.classList.toggle('check');   // 核查栏自己写清楚多少个有出处，不再弹底部提示
    const on = document.body.classList.contains('check');
    if (on) { inspBuild(); clearInterval(inspT); inspT = setInterval(() => { if (D.p !== inspP || D.b !== insp._b) { insp._b = D.b; inspBuild(); } }, 300); }
    else { clearInterval(inspT); insp.innerHTML = ''; marks.innerHTML = ''; inspP = -1; document.querySelectorAll('.insp-on').forEach((e) => e.classList.remove('insp-on')); }
  };
})();
