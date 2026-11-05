(() => {
  const D = Deck, { E, tween, count, clamp, lerp } = D;
  const X = window.__TYPES, { TYPES, frame, base, beatIn, calmGroups, appear, hide, showNow, enterHead, esc, fmt, srcA, tpl, $, $$ } = X;
  const C = window.DECK_CONTENT;
  const num = (v) => (typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-−+]/g, '').replace('−', '-')));
  const dig = (v) => { const s = String(v); return s.includes('.') ? s.split('.')[1].replace(/\D.*$/, '').length : 0; };
  const setVar = (el, k, v) => el && el.style.setProperty(k, v);
  const isNum = (v) => /^[+−-]?[\d.,]+$/.test(String(v).trim());

  function big(o, cls = 'cue-big') {
    let v = String(o.v), sign = o.sign || '';
    if (isNum(v) && /^[+−-]/.test(v.trim())) { v = v.trim(); if (!sign) sign = v[0] === '+' ? '+' : '−'; v = v.slice(1); }   // v 自己带正负号时挪到 sign：计数动画只数绝对值，负号不会丢
    const body = isNum(v) ? `<span data-cnt="${Math.abs(num(v))}" data-dg="${dig(v)}">${esc(v)}</span>`
      : v.includes('→') ? v.split('→').map((x) => esc(x.trim())).join('<i class="arr">→</i>') : esc(v);
    return `<b class="${cls} ${o.tone === 'bad' ? 'bad' : o.tone === 'plain' ? '' : 'good'}"${srcA(o.src, o.how)}>${o.pre ? `<i class="pre">${esc(o.pre)}</i>` : ''}${esc(sign)}${body}${o.unit ? `<u>${esc(o.unit)}</u>` : ''}</b>`;
  }
  function countIn(root, delay = 200, dur = 900) {
    $$(root, '[data-cnt]').forEach((n) => { const v = +n.dataset.cnt, dg = +(n.dataset.dg || 0); count(n, 0, v, D.d(dur), { delay: D.d(delay), fmt: (x) => fmt(x, dg) }); });
  }
  function finishCounts(root) { $$(root, '[data-cnt]').forEach((n) => { n.textContent = fmt(+n.dataset.cnt, +(n.dataset.dg || 0)); }); }
  const notesOf = (d) => (d.notes || []).map((s) => `<li>${esc(s)}</li>`).join('');
  const LINK = { now: null, subs: [] };
  const linkPub = (o) => { LINK.now = o; LINK.subs.forEach((f) => f(o)); };
  const linkSub = (f) => { LINK.subs.push(f); if (LINK.now) f(LINK.now); };

  const live = () => D.alive && !D.capture && D.mode !== 'article';
  const DW0 = 1.2;   // 入场动画走完再开始（秒）
  const cyc = (e, period, pause = 0) => Math.min(1, (e % (period + pause)) / period);   // 0→1 走一遍，停一下再来
  const sm = (k) => k * k * (3 - 2 * k), outC = (k) => 1 - (1 - k) ** 3;
  const tx = (el, x, y = 0) => { el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; };
  const op = (el, v) => { el.style.opacity = v; };
  function sweep(boxes, x, on) {
    for (const b of boxes) {
      const g = b._g || (b._g = b.querySelector(':scope > .dw-g')); if (!g) continue;
      if (!on) { op(g, 0); continue; }
      op(g, 1); tx(g, x - b.offsetLeft);
    }
  }
  function sheen(els, k, w = 150) {
    els = els.filter(Boolean); if (!els.length) return;
    if (!(k >= 0 && k <= 1)) { els.forEach((el) => { const s = el.style; if (!el._sh) return; s.backgroundImage = s.webkitBackgroundClip = s.backgroundClip = s.webkitTextFillColor = ''; el._sh = 0; }); return; }
    const x0 = Math.min(...els.map((e) => e.offsetLeft)) - w, x1 = Math.max(...els.map((e) => e.offsetLeft + e.offsetWidth)) + w, x = lerp(x0, x1, k);
    for (const el of els) {
      const s = el.style, c = getComputedStyle(el).color, X = x - el.offsetLeft;
      s.backgroundImage = `linear-gradient(90deg, ${c} ${(X - w).toFixed(1)}px, color-mix(in srgb, ${c} 45%, #fff) ${X.toFixed(1)}px, ${c} ${(X + w).toFixed(1)}px)`;
      s.webkitBackgroundClip = s.backgroundClip = 'text'; s.webkitTextFillColor = 'transparent'; el._sh = 1;
    }
  }
  const bigParts = (b) => (b ? [$(b, '[data-cnt]') || b, $(b, ':scope > u')] : []);

  function page(d, type, beats, inner, o = {}) {
    const sec = frame(d, type, inner); sec.classList.add('s1', 'cue-p', 'x3');
    const pg = base(sec, d, beats); pg.type = pg.tk = type; pg.e0 = $$(sec, '[data-e]'); pg.dw = { t0: null, rest: false };
    return Object.assign(pg, {
      reset() { for (const g of pg.groups.slice(1)) g.forEach(hide); pg.e0.forEach(hide); pg.dw.t0 = null; o.reset && o.reset(); },
      async enter() {
        enterHead(pg);
        pg.e0.forEach((e, k) => appear(e, D.d(40 + k * 60)));
        countIn(sec, 60, 380);
        o.enter && o.enter();
        await D.wait(D.d(460));
      },
      async beat(k) { o.beat && o.beat(k); return beatIn(pg, k, 600); },
      calm() { calmGroups(pg); pg.e0.forEach(showNow); finishCounts(sec); o.calm && o.calm(); },
      tick(t) {
        if (!o.tick) return;
        if (!live()) { pg.dw.t0 = null; if (!pg.dw.rest) { pg.dw.rest = true; o.tick(-1); } return; }
        pg.dw.rest = false;
        if (pg.dw.t0 == null) pg.dw.t0 = t;
        const e = t - pg.dw.t0 - DW0; o.tick(e < 0 ? -1 : e);
      },
      resize() { pg.cv.fit(); },
      leave: (nx) => turn(pg, nx),
      article: () => (o.article ? o.article() : ''),   // notes 只给讲的人看：手机版不放
    });
  }

  const COL = 140, GX = 120;
  const TURN = {
    'band>cueline': 'grow',        // 全年总数 → 按月展开：封面底下那块底色长高，变成折线图的底板
    'cueline>cuebridge': 'cols',   // 同一个 4,460，换一种切法：底板不动，里面按列擦掉、再按列出来
    'cuebridge>cue3': 'rise',      // 结论 → 依据：底板不动，旧内容沉下去，三张卡从底下升上来
    'dots>steps': 'hatch',         // 没做到的那一格 → 掉人最多的那一步：斜纹块飞过去，变成下一页左边的斜纹条
    'cueshift>cuepick': 'step',    // 今年的钱怎么花 → 明年怎么扩：整页往左挪一列，下一页从右边一列进来
    'cuepick>cuecalc': 'carry',    // 推荐 A 的 2.2 万 → 推演器里的 2.2 万：这个数留在画面上飞过去
    '*>cueask': 'close',           // 最后一页：旧页收进顶上的刻度线，请批从刻度线往下展开
  };
  const RECT = (el) => D.rect(el), mix = (a, b, v) => ({ x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v), w: lerp(a.w, b.w, v), h: lerp(a.h, b.h, v) });
  function put(g, r) { Object.assign(g.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); }
  function box(par, r, css) { const g = document.createElement('i'); g.className = 'tz-box'; Object.assign(g.style, css); put(g, r); par.append(g); return g; }
  const fillOf = (el) => { const cs = getComputedStyle(el); return el instanceof SVGElement ? cs.fill : cs.backgroundColor; };
  const edge = (k) => (k <= 0 ? 0 : k >= 13 ? 1920 : GX + k * COL);   // 第 k 条列线的 x（0 和 13 是舞台两边）
  function layers(pg, nx) {
    const st = pg.el.parentElement, mk = (z) => { const l = document.createElement('div'); l.className = 'tz'; l.setAttribute('aria-hidden', 'true'); l.style.zIndex = z; return l; };
    const top = mk(5), under = mk(0);
    const ru = $(pg.el, '.rtop').cloneNode(true), ft = $(pg.el, '.foot').cloneNode(true), cur = document.createElement('i');
    cur.className = 'tz-cur'; top.append(ru, ft, cur); st.append(top); st.insertBefore(under, st.firstChild);
    const hid = [pg, nx].flatMap((p) => [$(p.el, '.rtop'), $(p.el, '.foot')]).filter(Boolean);
    hid.forEach((e) => { e.style.visibility = 'hidden'; });
    return { top, under, cur, pn: $(ft, '.pn'), pnB: ($(nx.el, '.pn') || {}).textContent || '', hid, undo: [] };
  }
  function chrome(L, pg, nx, T, close) {
    const n = D.pages.length, at = (p) => GX + Math.round((D.pages.indexOf(p) * 11) / Math.max(1, n - 1)) * COL;
    const x0 = at(pg), x1 = at(nx), pnA = L.pn ? L.pn.textContent : '';
    return tween(T, (v) => {
      const k = E.inOut(clamp((v - 0.12) / 0.7)), c = L.cur.style;
      c.opacity = (v < 0.12 ? v / 0.12 : v > 0.82 ? Math.max(0, (1 - v) / 0.18) : 1).toFixed(3);
      if (close) { c.left = lerp(x0, GX, k) + 'px'; c.width = lerp(COL, 1680, k) + 'px'; } else { c.left = lerp(x0, x1, k) + 'px'; c.width = COL + 'px'; }
      if (L.pn) { L.pn.textContent = v < 0.5 ? pnA : L.pnB; L.pn.style.opacity = clamp(Math.abs(v - 0.5) * 4 - 0.2).toFixed(3); }
    }, { ease: E.linear });
  }
  const fade = (el, a, b, ms, ease = E.linear) => tween(ms, (v) => { el.style.opacity = lerp(a, b, v); }, { ease });
  const RUN = {
    async chapter(pg, nx, L) {
      D.lastTurn = 'chapter';
      D.set($(nx.el, '.head'), { o: 0 }); nx.el.style.clipPath = 'inset(0 100% 0 0)';
      chrome(L, pg, nx, 560);
      const en = (async () => { await D.wait(110); await nx.enter(D); })();
      await tween(420, (v) => {
        const x = lerp(GX - 40, 1800 + 40, v);
        pg.el.style.clipPath = `inset(0 0 0 ${x}px)`; nx.el.style.clipPath = `inset(0 ${1920 - x}px 0 0)`;
      }, { ease: E.inOut });
      pageOff(pg); nx.el.style.clipPath = '';
      await en;
    },
    async grow(pg, nx, L) {
      const za = $(pg.el, '.cue-band'), zb = zoneOf(nx); if (!za || !zb) return RUN.chapter(pg, nx, L);
      const a = RECT(za), b = RECT(zb);
      const g = box(L.under, a, { background: fillOf(za) });
      nx.el.style.opacity = 0; chrome(L, pg, nx, 560);
      const zh = !zb.children.length; if (zh) { zb.style.visibility = 'hidden'; L.undo.push(() => { zb.style.visibility = ''; }); }
      await fade(pg.el, 1, 0, 80);
      pageOff(pg);
      const mv = tween(260, (v) => put(g, mix(a, b, v)), { ease: E.inOut });
      await D.wait(100);
      nx.el.style.opacity = '';
      const en = nx.enter(D);
      await mv; if (zh) zb.style.visibility = '';
      await en;
    },
    async cols(pg, nx, L) {
      const za = zoneOf(pg), zb = zoneOf(nx); if (!za || !zb) return RUN.chapter(pg, nx, L);
      const a = RECT(za), b = RECT(zb);
      const g = box(L.under, a, { background: fillOf(za) });
      nx.el.style.clipPath = 'inset(0 100% 0 0)'; chrome(L, pg, nx, 520);
      await tween(200, (v) => { pg.el.style.clipPath = `inset(0 0 0 ${edge(Math.floor(v * 13.999))}px)`; }, { ease: E.linear });
      pageOff(pg);
      const en = nx.enter(D);
      await tween(260, (v) => { put(g, mix(a, b, E.inOut(clamp(v * 1.6)))); nx.el.style.clipPath = `inset(0 ${1920 - edge(Math.ceil(v * 13))}px 0 0)`; }, { ease: E.linear });
      nx.el.style.clipPath = '';
      await en;
    },
    async rise(pg, nx, L) {
      const za = zoneOf(pg), zb = $(nx.el, '.cue3-w') || zoneOf(nx); if (!za || !zb) return RUN.chapter(pg, nx, L);
      const a = RECT(za), b = RECT(zb);
      const g = box(L.under, a, { background: fillOf(za) });
      nx.el.style.opacity = 0; chrome(L, pg, nx, 560);
      await tween(140, (v) => { pg.el.style.transform = `translateY(${(32 * v).toFixed(1)}px)`; pg.el.style.opacity = 1 - v; }, { ease: E.exit });
      pageOff(pg);
      const mv = tween(160, (v) => put(g, mix(a, b, v)), { ease: E.inOut });
      await D.wait(40);
      const en = nx.enter(D);
      await tween(260, (v) => { nx.el.style.transform = `translateY(${(32 * (1 - v)).toFixed(1)}px)`; nx.el.style.opacity = v; }, { ease: E.enter });
      await mv; await en;
    },
    async hatch(pg, nx, L) {
      const src = $(pg.el, '.csd.miss .csd-m'), dst = $(nx.el, '.dw-hb');
      if (!src || !dst) return RUN.chapter(pg, nx, L);
      const a = RECT(src), b = RECT(dst), ca = getComputedStyle(src), cb = getComputedStyle(dst);
      const g = box(L.top, a, { overflow: 'hidden' });
      const layer = (cs, o) => { const e = document.createElement('i'); Object.assign(e.style, { position: 'absolute', inset: '0', display: 'block', backgroundColor: cs.backgroundColor, backgroundImage: cs.backgroundImage, boxShadow: cs.boxShadow, opacity: o }); g.append(e); return e; };
      layer(ca, 1); const g2 = layer(cb, 0);
      src.style.visibility = 'hidden'; dst.style.visibility = 'hidden'; L.undo.push(() => { src.style.visibility = ''; dst.style.visibility = ''; });
      nx.el.style.opacity = 0; chrome(L, pg, nx, 600);
      await fade(pg.el, 1, 0, 100);
      pageOff(pg);
      const fl = tween(360, (v) => { put(g, mix(a, b, v)); g2.style.opacity = clamp((v - 0.55) / 0.4); }, { ease: E.inOut });
      await D.wait(100);
      const en = nx.enter(D);
      await fade(nx.el, 0, 1, 180);
      await fl; dst.style.visibility = '';
      await en;
    },
    async step(pg, nx, L) {
      nx.el.style.opacity = 0; chrome(L, pg, nx, 520);
      await tween(160, (v) => { pg.el.style.transform = `translateX(${(-COL * v).toFixed(1)}px)`; pg.el.style.opacity = 1 - v; }, { ease: E.exit });
      pageOff(pg);
      const en = nx.enter(D);
      await tween(260, (v) => { nx.el.style.transform = `translateX(${(COL * (1 - v)).toFixed(1)}px)`; nx.el.style.opacity = v; }, { ease: E.enter });
      await en;
    },
    async carry(pg, nx, L) {
      const src = $(pg.el, '.cp-main .cue-big [data-cnt]') || carrySrc(pg, nx), dst = $(nx.el, '.cc-r .ccv');
      if (!src || !dst) return RUN.chapter(pg, nx, L);
      nx.el.style.opacity = 0; chrome(L, pg, nx, 620);
      const fl = D.fly(src, dst, 520, { delay: 20, text: src.matches('[data-cnt]') ? undefined : dst.textContent });
      await fade(pg.el, 1, 0, 140);
      pageOff(pg);
      await D.wait(40);
      const en = nx.enter(D);
      await fade(nx.el, 0, 1, 180);
      await fl; await en;
    },
    async close(pg, nx, L) {
      const ln = document.createElement('i'); ln.className = 'tz-rule'; L.top.append(ln);
      const Y0 = 72, H = 1080 - Y0;
      nx.el.style.clipPath = `inset(0 0 ${H}px 0)`; chrome(L, pg, nx, 620, true);
      await tween(200, (v) => { const y = lerp(1080, Y0, v); pg.el.style.clipPath = `inset(0 0 ${1080 - y}px 0)`; ln.style.top = y + 'px'; ln.style.opacity = clamp(Math.min(v, 1 - v) * 10).toFixed(3); }, { ease: E.exit });
      pageOff(pg);
      const en = nx.enter(D);
      await tween(340, (v) => { const y = lerp(Y0, 1080, v); nx.el.style.clipPath = `inset(0 0 ${1080 - y}px 0)`; ln.style.top = y + 'px'; ln.style.opacity = clamp(Math.min(v, 1 - v) * 10).toFixed(3); }, { ease: E.enter });
      nx.el.style.clipPath = '';
      await en;
    },
  };
  const dgOf = (vs, o) => (isFinite(+o) && o !== null && o !== '' ? +o : Math.min(2, Math.max(0, ...vs.map((x) => (String(x).split('.')[1] || '').length))));
  const nf = (x, dg) => { const r = +(+x).toFixed(dg); return fmt(r, Number.isInteger(r) ? 0 : dg); };
  const ROLE = { band: 'cue', pair: 'cue', bars: 'cue', dots: 'cue', steps: 'cue', none: 'cue', cuepick: 'cue', cueline: 'data', cuebridge: 'data', cueshift: 'data', cue3: 'argue', cuecalc: 'calc', cueask: 'ask' };
  const zoneOf = (pg) => $(pg.el, '.cue-band, .cl-zn, .cb-zn, .cue3-w, .cc-l');
  const numOf = (el) => { const t = String(el.textContent || '').replace(/[^\d.,−\-]/g, '').replace(/,/g, ''); return t ? parseFloat(t.replace('−', '-')) : NaN; };
  function carrySrc(pg, nx) {
    const dst = $(nx.el, '.cc-r .ccv'); if (!dst) return null; const want = numOf(dst); if (!isFinite(want)) return null;
    return $$(pg.el, '.cue-big [data-cnt], .c3-big [data-cnt], .cs2-tot b, .cb-t b').find((e) => numOf(e) === want) || null;
  }
  function pickTurn(pg, nx) {
    const hit = TURN[`${pg.tk}>${nx.tk}`] || TURN[`*>${nx.tk}`]; if (hit) return hit;
    const want = (C.pages[D.pages.indexOf(nx)] || {}).turn; if (want && RUN[want]) return want;
    const a = ROLE[pg.tk], b = ROLE[nx.tk], za = zoneOf(pg), zb = zoneOf(nx);
    if (b === 'calc' && carrySrc(pg, nx)) return 'carry';
    if (za && zb) {
      if (a === 'cue' && $(pg.el, '.cue-band') && b === 'data') return 'grow';
      if (a === 'data' && b === 'data') return 'cols';
      if (b === 'argue' && a !== 'argue') return 'rise';
    }
    if (a === 'cue' && b === 'cue') return 'step';
    return 'chapter';
  }
  async function turn(pg, nx) {
    if (!live()) { pageOff(pg); return nx.enter(D); }   // ?capture、打印、手机长文：直接到位
    const how = pickTurn(pg, nx); D.lastTurn = how;   // 自查用：最近一次翻页用了哪种（退回换章时由 chapter 改写）
    const L = layers(pg, nx);
    try { await RUN[how](pg, nx, L); }
    finally {
      pageOff(pg);
      for (const p of [pg, nx]) { const s = p.el.style; s.opacity = ''; s.transform = ''; s.clipPath = ''; }
      L.hid.forEach((e) => { e.style.visibility = ''; }); L.undo.forEach((f) => f());
      L.top.remove(); L.under.remove();
    }
  }
  const pageOff = (pg) => D.show(pg, false);

  function strip(s, bg = {}) {
    if (!s) return '';
    if (s.kind === 'bars') {
      const mx = Math.max(...s.v), mk = new Set((s.labels || []).filter((l) => l.hi).map((l) => l.at));
      return `<div class="cue-strip cs-bars zn${bg.tone === 'bad' ? ' bad' : ''}" data-e><div class="csb-in" data-b="1"${srcA(s.src)}>
        <div class="csb"><span class="dw dw-col" aria-hidden="true"></span>${s.v.map((v, i) => `<i class="${[i + 1 >= (s.hiFrom || 99) ? 'hi' : '', mk.has(i + 1) ? 'mk' : ''].join(' ').trim()}" style="--h:${(v / mx).toFixed(3)}"></i>`).join('')}</div>
        <div class="csl">${(s.labels || []).map((l) => `<span style="--x:${((l.at - 0.5) / s.v.length).toFixed(3)}" class="${l.hi ? 'hi' : ''}">${esc(l.text)}</span>`).join('')}</div></div></div>`;
    }
    if (s.kind === 'steps') {
      const mx = s.steps[0].v;
      return `<div class="cue-strip cs-steps zn"><div class="cst-in" data-b="1"${srcA(s.src)}>${s.steps.map((st, i) => {
        const pv = i ? s.steps[i - 1].v : 0, lost = pv - st.v;
        return `${i ? `<div class="cst-gap${i === s.hi ? ' hi' : ''}" style="--b:${(st.v / mx).toFixed(3)};--l:${(lost / mx).toFixed(3)}"><i></i><b>−${fmt(lost)}</b></div>` : ''}<div class="cst" style="--h:${(st.v / mx).toFixed(3)}"><em>${esc(st.label)}</em><div class="cst-r"><i></i><b>${fmt(st.v)}</b></div></div>`;
      }).join('')}</div></div>`;
    }
    if (s.kind === 'dots') {
      return `<div class="cue-strip cs-dots zn"><i class="dw dw-zg" aria-hidden="true"></i>${s.items.map((it) => `<div class="csd ${it.ok ? 'ok' : 'miss'}"${srcA(it.src)}><i class="csd-m" data-b="1"><i class="dw-g"></i></i><em data-e>${esc(it.label)}</em></div>`).join('')}</div>`;
    }
    return '';
  }
  function coverBand(o = {}) {
    const br = C.pages.find((p) => p.type === 'cuebridge'); if (!br || !br.start || !br.end) return '';
    const f = (num(br.start.v) / num(br.end.v)) * 100;
    return `<div class="cue-band zn" data-e>
      <div class="cbn-r"><div class="cbn-t"><i class="cbn-b" style="height:${f.toFixed(2)}%"></i></div><em>${esc(br.start.label)}</em></div>
      <div class="cbn-r"><div class="cbn-t"><i class="cbn-b" style="height:${f.toFixed(2)}%"></i><i class="cbn-up" style="bottom:${f.toFixed(2)}%;height:${(100 - f).toFixed(2)}%"><i class="cbn-gw"><i class="dw dw-gl"></i></i><span>${esc(o.text || '多出来的这一截')}</span></i></div><em>${esc(br.end.label)}</em></div>
    </div>`;
  }

  function pairCol(p) {
    const mx = Math.max(...p.map((x) => num(x.v)));
    return `<div class="cue-pair zn" data-e>${p.map((x) => `<div class="cpr${x.hi ? ' hi' : ''}" style="--h:${(num(x.v) / mx).toFixed(3)}"><div class="cpr-t"><i></i><b${srcA(x.src)}>${esc(x.v)}<u>${esc(x.unit || '')}</u></b></div><em>${esc(x.label)}</em></div>`).join('')}</div>`;
  }
  TYPES.cue = (d) => {
    const pair = !d.strip && Array.isArray(d.pair) && d.pair.length === 2 ? pairCol(d.pair) : '';
    const band = d.strip || pair || d.band === false ? '' : coverBand(d.band || {}), kind = d.strip ? d.strip.kind : pair ? 'pair' : (band ? 'band' : 'none');
    const pg = page(d, 'cue', d.strip ? 1 : 0, `
  <div class="cue-w k-${kind}${d.strip || band || pair ? '' : ' nostrip'}${/^(band|dots|steps|pair)$/.test(kind) ? ' side' : ''}">
    <div class="cue-hero">${kind === 'steps' ? '<i class="dw-hb" aria-hidden="true"></i>' : ''}
    ${d.lead ? `<p class="cue-lead" data-e>${esc(d.lead)}</p>` : ''}
    ${big(d.big)}
    <p class="cue-line" data-e>${tpl(d.title)}</p>
    ${d.sub ? `<p class="cue-sub" data-e>${esc(d.sub)}</p>` : ''}
    </div>
    ${band}${pair}${strip(d.strip, d.big)}
  </div>`, {
      article: () => `<p class="a-big"><b class="ac">${esc(d.big.sign || '')}${esc(d.big.v)}</b><u>${esc(d.big.unit || '')}</u></p>${d.sub ? `<p>${esc(d.sub)}</p>` : ''}`,
      tick(e) {
        const on = e >= 0;
        if (kind === 'band') {
          const gl = $(sec, '.dw-gl'), H = gl.parentElement.offsetHeight, gh = gl.offsetHeight;
          if (!on) return op(gl, 0);
          op(gl, 1); tx(gl, 0, H - sm(cyc(e, 2.6, 1.4)) * (H + gh));
        } else if (kind === 'dots') {
          const cards = $$(sec, '.csd'), row = cards[0].parentElement, miss = $$(sec, '.csd.miss .csd-m');
          const zg = $(sec, '.dw-zg'), pre = D.b < 1, RH = row.offsetHeight;
          if (zg) { const zh = zg.offsetHeight; if (!on || !pre) op(zg, 0); else { op(zg, .85); tx(zg, 0, -zh + cyc(e, 3.4, 0.9) * (RH + zh)); } }
          const y = -160 + cyc(e, 3.4, 0.9) * (RH + 160);
          cards.forEach((c) => { const m = c.querySelector('.csd-m'), g = m && m.querySelector('.dw-g'); if (!g) return; if (!on || pre) return op(g, 0); op(g, 1); tx(g, 0, y - c.offsetTop - m.offsetTop); });
          miss.forEach((m) => { m.style.backgroundPosition = on ? `${(e * 7).toFixed(1)}px 0` : ''; });
        } else if (kind === 'steps') {
          const y = on ? `${(e * 9).toFixed(1)}px` : '0px';
          $(sec, '.dw-hb').style.backgroundPosition = `0 ${y}`;
          sec.style.setProperty('--hp', on ? `0 ${y}` : '0 0');
        } else if (kind === 'bars') {
          const bg = $(sec, '.cue-big'), col = $(sec, '.dw-col'), m = $(sec, '.csb > i.mk'), pre = D.b < 1;
          sheen(bigParts(bg), on && pre ? sm(cyc(e, 1.8, 2.6)) : -1);
          if (m) m.style.backgroundPosition = on && !pre ? `${(e * 6).toFixed(1)}px 0` : '';
          if (!col || !m || !on || pre) { if (col) op(col, 0); return; }
          const H = col.parentElement.offsetHeight, ch = col.offsetHeight, top = H - m.offsetHeight, P = 4.4, c = e % P;
          col.style.left = `${m.offsetLeft}px`; col.style.width = `${m.offsetWidth}px`;
          let y, o;
          if (c < 1.3) { const k = outC(c / 1.3); y = lerp(-ch, top - ch * 0.62, k); o = Math.min(1, c / 0.3); }
          else { y = top - ch * 0.62; o = c < 2.2 ? 1 : Math.max(0, 1 - (c - 2.2) / 0.7); }
          tx(col, 0, y); op(col, o.toFixed(3));
        } else {
          sheen(bigParts($(sec, '.cue-big')), on ? sm(cyc(e, 1.8, 2.6)) : -1);
        }
      },
    });
    const sec = pg.el; pg.tk = kind;
    pg.e0.unshift($(sec, '.cue-big'));
    return pg;
  };

  function geo(it) {
    if (it.grid === false) return '';
    const v = String(it.v), bars = (a, b, hiFirst) => { const mx = Math.max(a, b);
      return `<div class="c3-g gb" aria-hidden="true"><i class="${hiFirst ? 'm' : ''}" style="--w:${(a / mx).toFixed(3)}"></i><i class="${hiFirst ? '' : 'm'}" style="--w:${(b / mx).toFixed(3)}"></i></div>`; };
    if (v.includes('→')) { const [a, b] = v.split('→').map(num); if (a > 0 && b > 0) return bars(a, b, false); }
    const pc = it.unit === '%' && /([\d.]+)\s*%/.exec(it.sub || '');
    if (pc && num(v) > 0) return bars(num(v), +pc[1], true);
    const gu = it.gridUnit || (/人$/.test(it.unit || '') ? '人' : '');
    if (isNum(v) && gu) {
      const x = num(v), u = [100, 1000].find((k) => x / k >= 8 && x / k <= 40 && x % k === 0);
      if (u) return `<div class="c3-g gc"><div class="gcs" aria-hidden="true">${'<i></i>'.repeat(x / u)}</div><p class="gcl">一格 ${fmt(u)} ${esc(gu)}</p></div>`;
    }
    return '';
  }
  TYPES.cue3 = (d) => {
    const n = d.items.length;
    const pg = page(d, 'cue3', n, `
  <div class="cue3-w zn" style="grid-template-columns:repeat(${n},1fr)">${d.items.map((it, i) => `<div class="c3" data-e><i class="c3-r"><i class="dw dw-gl"></i></i>
    <div class="c3-in" data-b="${i + 1}">${big(it, 'c3-big')}<p class="c3-t">${esc(it.text)}</p>${geo(it)}${it.sub ? `<p class="c3-s">${esc(it.sub)}</p>` : ''}</div></div>`).join('')}</div>`, {
      beat(k) { cols.forEach((c, i) => c.classList.toggle('cur', i === k - 1)); countIn(cols[k - 1], 60, 480); },
      calm() { cols.forEach((c, i) => c.classList.toggle('cur', i === D.b - 1)); },
      reset() { cols.forEach((c) => c.classList.remove('cur')); },
      tick(e) {
        const gls = cols.map((c) => $(c, '.dw-gl')), W = cols[0].offsetWidth, gw = 220;
        if (e < 0) return gls.forEach((g) => op(g, 0));
        const cur = D.b;
        if (!cur) { const k = cyc(e, 4.2, 0.6) * n; gls.forEach((g, i) => { const f = k - i; if (f < 0 || f > 1) return op(g, 0); op(g, 1); tx(g, -gw + f * (W + gw)); }); }
        else { const k = sm(cyc(e, 2.4, 1.2)); gls.forEach((g, i) => { if (i !== cur - 1) return op(g, 0); op(g, 1); tx(g, -gw + k * (W + gw)); }); }
      },
      article: () => `<ol class="a-ol">${d.items.map((it) => `<li><b>${esc(it.pre || '')}${esc(it.sign || '')}${esc(it.v)}${esc(it.unit || '')}</b> ${esc(it.text)}${it.sub ? `<br><span class="a-who">${esc(it.sub)}</span>` : ''}</li>`).join('')}</ol>`,
    });
    const cols = $$(pg.el, '.c3');
    return pg;
  };

  let CLN = 0;
  TYPES.cueline = (d) => {
    const v = d.series, n = v.length, s0 = d.start || 1, ix = (m) => m - s0 + 1, at = ix(d.event.at);
    const AD = d.avgDigits || 0, avgTx = (x) => { const r = +(x * 10 ** AD).toFixed(6); return fmt(Math.sign(r) * Math.round(Math.abs(r)) / 10 ** AD, AD); };   // 四舍五入：先去掉浮点尾巴（24.549999… 按 24.55 算，显示 24.6），跟查账一样
    const L = 120, R = 1800, T = 330, B = 900, top = d.max || Math.ceil(Math.max(...v) * 1.12 / (d.maxStep || 500)) * (d.maxStep || 500);
    const xs = (i) => L + 40 + (i * (R - L - 80)) / (n - 1), ys = (y) => B - (y / top) * (B - T);
    const avg = d.avg.map((a) => { const s = v.slice(ix(a.from) - 1, ix(a.to)); return { ...a, i0: ix(a.from) - 1, i1: ix(a.to) - 1, v: s.reduce((p, c) => p + c, 0) / s.length }; });
    const pts = (a, b) => v.slice(a, b + 1).map((y, j) => `${j ? 'L' : 'M'}${xs(a + j).toFixed(1)},${ys(y).toFixed(1)}`).join(' ');
    const xe = (xs(at - 2) + xs(at - 1)) / 2;
    const seg = (a, i) => `<line class="cl-avg a${i}" x1="${xs(a.i0) - 20}" x2="${xs(a.i1) + 20}" y1="${ys(a.v)}" y2="${ys(a.v)}" pathLength="1"/>`;
    const lab = (a, i) => `<div class="cl-al a${i}" ${i ? 'data-b="2"' : 'data-e'} style="left:${xs(a.i0) - 20}px;top:${ys(a.v) - 112}px"><em>${esc(a.label)}</em><b${srcA(d.src, a.how || `${a.from}–${a.to} 月每月新客的平均`)}>${avgTx(a.v)}</b><u>${esc(d.unit || '')}</u></div>`;
    const ZT = T - 72, ZB = 974, MBW = 64;
    const pg = page(d, 'cueline', 2, `
  <svg class="cl-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">
    <rect class="cl-zn" x="${L}" y="${ZT}" width="${R - L}" height="${ZB - ZT}"/>
    <rect class="cl-hz" data-b="1" x="${xe}" y="${ZT}" width="${R - xe}" height="${B - ZT}"/>
    <defs><linearGradient id="clmb${++CLN}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="mbs0"/><stop offset=".5" class="mbs1"/><stop offset="1" class="mbs0"/></linearGradient>
      <clipPath id="clmc${CLN}"><rect x="${L}" y="${ZT}" width="${R - L}" height="${B - ZT}"/></clipPath></defs>
    <rect class="dw dw-mb" clip-path="url(#clmc${CLN})" fill="url(#clmb${CLN})" x="0" y="${B}" width="${MBW}" height="0"/>
    <line class="cl-base" x1="${L}" x2="${R}" y1="${B}" y2="${B}"/>
    <line class="cl-ev" data-b="1" x1="${xe}" x2="${xe}" y1="${T - 40}" y2="${B}"/>
    ${seg(avg[0], 0)}${seg(avg[1], 1)}
    <path class="cl-p p0" d="${pts(0, at - 2)}" pathLength="1"/>
    <path class="cl-p p1" d="${pts(at - 2, n - 1)}" pathLength="1"/>
    ${v.map((y, i) => `<circle class="cl-d ${i >= at - 1 ? 'd1' : 'd0'}" cx="${xs(i)}" cy="${ys(y)}" r="7"/>`).join('')}
  </svg>
  <div class="cl-evl" data-b="1" style="left:${xe + 18}px;top:${T - 46}px">${esc(d.event.text)}</div>
  ${lab(avg[0], 0)}${lab(avg[1], 1)}
  <div class="cl-x">${v.map((_, i) => `<span style="left:${xs(i)}px">${s0 + i} 月</span>`).join('')}</div>`, {
      reset() { draw(0, 0); },
      enter() { tween(D.d(380), (t) => draw(t, 0), { ease: E.enter, delay: D.d(40) }); },
      beat(k) { if (k === 2) tween(D.d(520), (t) => draw(1, t), { ease: E.enter, delay: D.d(40) }); },
      calm() { draw(1, D.b >= 2 ? 1 : 0); },
      article: () => `<p>${avg.map((a) => `${esc(a.label)} <b>${avgTx(a.v)}</b> ${esc(d.unit || '')}`).join(' → ')}</p><p class="a-who">${esc(d.event.text)}</p>`,
      tick(e) {
        if (e < 0) return op(mb, 0);
        const f0 = D.b >= 2 ? avg[1].i0 : 0, last = D.b >= 2 ? avg[1].i1 : at - 2, span = Math.max(1, last - f0), per = 0.62, P = span * per + 1.1, c = e % P;
        const k = Math.min(c / per, span), i = f0 + Math.floor(k), f = sm(k - Math.floor(k)), j = Math.min(i + 1, last);
        const x = xs(i) + (xs(j) - xs(i)) * f; let y = ys(v[i]) + (ys(v[j]) - ys(v[i])) * f + 14;
        [$(el, '.cl-al.a0'), D.b >= 2 && $(el, '.cl-al.a1'), D.b >= 1 && $(el, '.cl-evl')].forEach((t) => {
          if (t && x + MBW / 2 > t.offsetLeft && x - MBW / 2 < t.offsetLeft + t.offsetWidth && y < t.offsetTop + t.offsetHeight + 10) y = Math.max(y, t.offsetTop + t.offsetHeight + 10);
        });
        const fade = c > span * per + 0.7 ? 1 - (c - span * per - 0.7) / 0.4 : Math.min(1, c / 0.3);
        op(mb, Math.max(0, fade).toFixed(3)); mb.setAttribute('x', (x - MBW / 2).toFixed(1)); mb.setAttribute('y', y.toFixed(1)); mb.setAttribute('height', Math.max(0, B - y).toFixed(1));
      },
    });
    const el = pg.el, p0 = $(el, '.p0'), p1 = $(el, '.p1'), a0 = $(el, '.cl-avg.a0'), a1 = $(el, '.cl-avg.a1'), d0 = $$(el, '.d0'), d1 = $$(el, '.d1'), mb = $(el, '.dw-mb');
    function draw(f0, f1) {
      p0.style.strokeDashoffset = 1 - f0; a0.style.strokeDashoffset = 1 - clamp(f0 * 1.4 - 0.4); d0.forEach((c, i) => c.style.opacity = f0 >= i / d0.length ? 1 : 0);
      p1.style.strokeDashoffset = 1 - f1; a1.style.strokeDashoffset = 1 - clamp(f1 * 1.4 - 0.4); d1.forEach((c, i) => c.style.opacity = f1 > (i + 1) / (d1.length + 1) ? 1 : 0);
    }
    draw(1, 1);
    return pg;
  };

  const WD = '一二三四五六日';
  function weekOfDate(due) {
    const t = new Date(String(due) + 'T00:00:00'); if (isNaN(t)) return null;
    const wd = (t.getDay() + 6) % 7; return { wd, days: [...Array(7)].map((_, i) => new Date(t.getFullYear(), t.getMonth(), t.getDate() - wd + i).getDate()) };
  }
  function weekOf(lead) {
    const m = String(lead || '').match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*[（(]\s*(?:周|星期)([一二三四五六日天])\s*[）)]/); if (!m) return null;
    const dd = +m[2], wd = WD.indexOf(m[3] === '天' ? '日' : m[3]), mon = dd - wd;
    return mon >= 1 ? { wd, days: [...Array(7)].map((_, i) => mon + i) } : null;
  }
  TYPES.cueask = (d) => {
    const wk = d.due ? weekOfDate(d.due) : weekOf(d.lead);
    const pg = page(d, 'cueask', 1, `
  <div class="ca-w ca-ask">
    <p class="cue-lead" data-e>${esc(d.lead)}</p>
    ${wk ? `<div class="ca-wk zn" data-e aria-hidden="true"><i class="dw dw-wk"></i>${wk.days.map((x, i) => `<div class="wk-d${i === wk.wd ? ' hi' : ''}"><b>${x}</b><em>周${WD[i]}</em></div>`).join('')}</div>` : ''}
    <div class="ca-row">${d.needs.map((x) => `<div class="ca-n" data-e>${big({ ...x, tone: 'plain' }, 'ca-big')}<p>${esc(x.text)}</p></div>`).join('')}</div>
    <p class="ca-get" data-b="1">${esc(d.gets.text)}<b class="ac"${srcA(d.gets.src, d.gets.how)}>${d.gets.pre ? `<i class="pre">${esc(d.gets.pre)}</i>` : ''}<span class="cgv">${esc(d.gets.v)}</span></b><u>${esc(d.gets.unit || '')}</u>${d.gets.link ? '<em class="ca-calc" hidden></em>' : ''}</p>
  </div>`, {
      article: () => `${d.needs.map((x) => `<p><b>${esc(x.pre || '')}${esc(x.sign || '')}${esc(x.v)}${esc(x.unit || '')}</b> ${esc(x.text)}</p>`).join('')}<p>${esc(d.gets.text)}<b>${esc(d.gets.pre || '')}${esc(d.gets.v)}</b>${esc(d.gets.unit || '')}</p>`,
      tick(e) {
        if (!wk) {
          const bs = $$(pg.el, '.ca-big'), st = 1.1, sw = 1.5, P = (bs.length - 1) * st + sw + 2.2, c = e < 0 ? -1 : e % P;
          bs.forEach((b, i) => { const t = c - i * st; sheen(bigParts(b), c >= 0 && t >= 0 && t <= sw ? sm(t / sw) : -1); });
          return;
        }
        const w = $(pg.el, '.dw-wk'), cells = $$(pg.el, '.wk-d');
        if (e < 0) return op(w, 0);
        const step = 0.55, hold = 1.3, P = wk.wd * step + hold + 0.5, c = e % P;
        let pos, o = 1;
        if (c < wk.wd * step) { const k = c / step, i = Math.floor(k); pos = i + sm(k - i); }
        else { pos = wk.wd; if (c > wk.wd * step + hold) o = 1 - (c - wk.wd * step - hold) / 0.5; }
        const i0 = Math.floor(pos), f = pos - i0, a = cells[i0], b = cells[Math.min(i0 + 1, 6)];
        w.style.width = `${a.offsetWidth}px`; op(w, Math.max(0, o).toFixed(3)); tx(w, a.offsetLeft + (b.offsetLeft - a.offsetLeft) * f, 0);
      },
    });
    if (d.gets.link) {
      const sec = pg.el, gv = $(sec, '.cgv'), gb = gv.closest('b'), note = $(sec, '.ca-calc'), ex = d.gets.exact;
      let L = null;
      linkSub((o) => {
        L = o; gv.textContent = o.isDef ? d.gets.v : o.shown;
        note.hidden = o.isDef; note.textContent = `按第 ${o.page} 页的推演`;
        gb.dataset.src = o.isDef ? (d.gets.src || '') : `第 ${o.page} 页推演：${o.desc}；这是估算，不是保证`;
      });
      pg.notesLive = (ns) => {
        if (!L || L.isDef) return ns;
        const eu = d.gets.exactUnit || '人', ed = d.gets.exactDigits || 0, ef = (x) => fmt(ed ? x : Math.round(x), ed);
        const head = `现在屏上是第 ${L.page} 页拖过的推演值：精确算出来 ${ef(L.exact)} ${eu}（${L.desc}）。${d.gets.linkNote || '推演值'}；按第 ${L.page} 页“恢复默认”回到 ${ef(ex)} ${eu}。`;
        return [head, ...ns.filter((x) => !x.includes(fmt(ex)) && !(ed && x.includes(ef(ex))))];
      };
    }
    return pg;
  };

  TYPES.cuebridge = (d) => {
    const st = d.steps, n = st.length + 2, L = 120, W = 1680, cw = W / n, bw = 190;
    const T = 330, B = 700, lo = d.lo, hi = d.hi, ys = (y) => B - ((y - lo) / (hi - lo)) * (B - T);
    const DG = dgOf([d.start.v, d.end.v, ...st.map((x) => x.v)], d.digits), F = (x) => nf(x, DG);
    let cum = d.start.v; const cols = [{ k: 'lv', label: d.start.label, y: ys(d.start.v), txt: F(d.start.v), src: d.start.src, b: 'data-e' }];
    st.forEach((x) => { const a = cum; cum += x.v; cols.push({ k: x.v < 0 ? 'neg' : x.hi ? 'hi' : 'pos', label: x.label, ya: ys(a), yb: ys(cum), txt: (x.v < 0 ? '−' : '+') + F(Math.abs(x.v)), src: x.src, b: x.hi ? 'data-b="1"' : 'data-b="2"' }); });
    cols.push({ k: 'lv end', label: d.end.label, y: ys(d.end.v), txt: F(d.end.v), src: d.end.src, b: 'data-b="2"' });
    const cx = (i) => L + cw * i + cw / 2;
    const col = (c, i) => {
      const x = cx(i), top = c.k.startsWith('lv') ? c.y - 2 : Math.min(c.ya, c.yb), h = c.k.startsWith('lv') ? 4 : Math.abs(c.ya - c.yb);
      const prevY = i ? (cols[i - 1].k.startsWith('lv') ? cols[i - 1].y : cols[i - 1].yb) : null;
      const link = i ? `<i class="cb-k" style="left:${cx(i - 1) + bw / 2}px;width:${cw - bw}px;top:${prevY}px"></i>` : '';
      return `<div class="cb-c ${c.k}" ${c.b}>${link}<i class="cb-bar" style="left:${x - bw / 2}px;top:${top}px;width:${bw}px;height:${h}px">${c.k === 'hi' ? '<i class="dw dw-gl"></i>' : ''}</i>
      <div class="cb-t" style="left:${x - cw / 2 + 12}px;width:${cw - 24}px"><em>${esc(c.label)}</em><b${srcA(c.src)}>${esc(c.txt)}</b></div></div>`;
    };
    const y0 = cols[0].y, rx0 = cx(0) + bw / 2, rx1 = cx(n - 1) - bw / 2;
    const pg = page(d, 'cuebridge', 2, `<div class="cb-zn zn" aria-hidden="true"></div><div class="cb-w"><i class="cb-ru" data-e style="left:${rx0}px;width:${rx1 - rx0}px;top:${y0 - 1}px"></i>${cols.map(col).join('')}</div>`, {
      article: () => `<p>${cols.map((c) => `${esc(c.label)} <b>${esc(c.txt)}</b>`).join('，')}${esc(d.unit ? ' ' + d.unit : '')}</p>`,
      tick(e) {
        const w = $(pg.el, '.cb-w'), gl = $(pg.el, '.dw-gl');
        if (e < 0) { w.style.setProperty('--mx', '0px'); if (gl) op(gl, 0); return; }
        w.style.setProperty('--mx', `${(e * 20).toFixed(1)}px`);
        if (gl) { if (D.b < 1) op(gl, 0); else { const H = gl.parentElement.offsetHeight; op(gl, 1); tx(gl, 0, H - sm(cyc(e, 2.2, 1.3)) * (H + 160)); } }
      },
    });
    return pg;
  };

  TYPES.cueshift = (d) => {
    const P = d.parts, A = d.a.v, Bv = d.b.v, sum = (v) => v.reduce((p, c) => p + c, 0), sa = sum(A), sb = sum(Bv);
    const DG = dgOf(A.concat(Bv), d.digits), F = (x) => nf(x, DG);
    const X0 = 420, XW = 1380, sc = XW / Math.max(sa, sb), H = d.tall ? 176 : 128, YA = d.tall ? 290 : 330, YB = d.tall ? 668 : 600;
    const segs = (v) => { let x = X0; return v.map((w, i) => { const s = { i, x, w: w * sc, v: w }; x += w * sc; return s; }); };
    const sA = segs(A), sB = segs(Bv), hiI = P.indexOf(d.hi);
    const cls = (i) => (i === hiI ? 'hi' : `s${Math.min(i, 3)}`);
    const bar = (ss, y, b, r) => `<div class="cs2-row r${r}" ${b}>${ss.filter((s) => s.v > 0).map((s) => `<div class="cs2-s ${cls(s.i)}" style="left:${s.x}px;top:${y}px;width:${s.w - 3}px;height:${H}px"><i class="dw-g"></i><em>${esc(P[s.i])}</em><b>${F(s.v)}</b></div>`).join('')}</div>`;
    const tot = (o, y, b, ac) => `<div class="cs2-tot" ${b} style="top:${y + (d.tall ? 40 : 10)}px"><em>${esc(o.label)}</em><b class="${ac ? 'ac' : ''}"${srcA(o.src)}>${F(sum(o.v))}<u>${esc(d.unit || '')}</u></b></div>`;
    const link = sA.map((a, i) => { const b = sB[i]; if (!(b.v > 0)) return ''; if (!(a.v > 0)) return ''; /* 去年没有的项不画连接块：尖从相邻两项交界发出，会看成从那两项挪来的（独立复核 P3-5） */ return `<polygon class="cs2-l ${cls(i)}" points="${a.x},${YA + H} ${a.x + a.w - 3},${YA + H} ${b.x + b.w - 3},${YB} ${b.x},${YB}"/>`; }).join('');
    const fresh = sA.map((a, i) => (!(a.v > 0) && sB[i].v > 0 ? `<span class="cs2-new ${cls(i)}" style="left:${sB[i].x}px;width:${sB[i].w - 3}px;top:${YB - 52}px">去年没有这一项</span>` : '')).join('');
    const delta = sB.map((b, i) => { const df = +(Bv[i] - A[i]).toFixed(DG); if (!df) return ''; return `<span class="${i === hiI ? 'hi' : ''}" style="left:${b.x + b.w / 2}px">${df > 0 ? '+' : '−'}${F(Math.abs(df))}<u>${esc(d.unit || '')}</u></span>`; }).join('');
    const gid = `cs2f${C.pages.indexOf(d)}`, FL = YB - YA - H;
    const pg = page(d, 'cueshift', 2, `
  <svg class="cs2-svg" viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true" data-b="1">
    <defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${YA + H - FL}" y2="${YB - FL}"><stop offset="0" style="stop-color:var(--bg);stop-opacity:0"/><stop offset=".62" style="stop-color:var(--bg);stop-opacity:0"/><stop offset=".86" style="stop-color:var(--bg);stop-opacity:.8"/><stop offset="1" style="stop-color:var(--bg);stop-opacity:0"/></linearGradient></defs>
    ${link}<g class="dw dw-fl" fill="url(#${gid})">${link.replace(/class="cs2-l [^"]*"/g, '')}</g></svg>
  ${tot(d.a, YA, 'data-e', false)}${bar(sA, YA, 'data-e', 'a')}
  ${tot(d.b, YB, 'data-b="1"', true)}${bar(sB, YB, 'data-b="1"', 'b')}<div class="cs2-row" data-b="1">${fresh}</div>
  <div class="cs2-d" data-b="2" style="top:${YB + H + 22}px">${delta}</div>`, {
      article: () => `<p>${esc(d.a.label)} ${F(sa)} → ${esc(d.b.label)} ${F(sb)} ${esc(d.unit || '')}</p><p>${P.map((p, i) => `${esc(p)} ${F(A[i])} → ${F(Bv[i])}`).join('；')}</p>`,
      tick(e) {
        const ra = $$(pg.el, '.cs2-row.ra .cs2-s'), fl = $(pg.el, '.dw-fl'), lg = $(pg.el, `#${gid}`);
        if (e < 0) { sweep(ra, 0, false); op(fl, 0); return; }
        if (D.b < 1) { op(fl, 0); sweep(ra, X0 - 260 + sm(cyc(e, 3.2, 1.0)) * (XW + 260), true); return; }
        sweep(ra, 0, false); op(fl, 1);
        lg.setAttribute('gradientTransform', `translate(0 ${(cyc(e, 2.2, 0.7) * 2 * FL).toFixed(1)})`);
      },
    });
    return pg;
  };

  TYPES.cuepick = (d) => {
    const pk = d.plans.find((x) => x.pick) || d.plans[0], alt = d.plans.find((x) => x !== pk);
    const U = 1000, sq = (x) => { const v = num(x.exact) / U; if (!(v > 0)) return ''; const k = Math.floor(v), r = v - k; return '<i></i>'.repeat(k) + (r > 0.004 ? `<i style="width:${(r * 48).toFixed(1)}px"></i>` : ''); };
    const grid = pk.exact && alt.exact ? `<div class="cp-sq zn" data-e aria-hidden="true">
      <div class="cp-sr a"><em>${esc(pk.key)}</em><div class="cp-sqs">${sq(pk)}</div></div>
      <div class="cp-sr b"><em>${esc(alt.key)}</em><div class="cp-sqs">${sq(alt)}</div><span class="cp-sql">一格 1,000 人</span></div></div>` : '';
    const pg = page(d, 'cuepick', 1, `
  <div class="ca-w cp-w">
    <p class="cue-lead" data-e>${esc(d.lead)}</p>
    <div class="cp-row">
      <div class="cp-main" data-e><p class="cp-k">推荐 ${esc(pk.key)}<span>${esc(pk.name)}</span></p>${big({ ...pk, tone: 'good' }, 'cue-big')}<p class="cp-t">${esc(pk.text)}</p></div>
      <div class="cp-alt" data-e><p class="cp-k">对照 ${esc(alt.key)}<span>${esc(alt.name)}</span></p>${big({ ...alt, tone: 'plain' }, 'cp-abig')}<p class="cp-t">${esc(alt.text)}</p></div>
    </div>
    ${grid}
    <p class="ca-get cp-get" data-b="1">${esc(d.diff.text)}<b${srcA(d.diff.src, d.diff.how)}>${d.diff.pre ? `<i class="pre">${esc(d.diff.pre)}</i>` : ''}${esc(d.diff.v)}</b><u>${esc(d.diff.unit || '')}</u></p>
  </div>`, {
      article: () => `${[pk, alt].map((x) => `<p><b>${x === pk ? '推荐 ' : ''}${esc(x.key)} ${esc(x.name)}</b>：${esc(x.pre || '')}${esc(x.v)}${esc(x.unit || '')}，${esc(x.text)}</p>`).join('')}<p>${esc(d.diff.text)}${esc(d.diff.pre || '')}${esc(d.diff.v)}${esc(d.diff.unit || '')}</p>`,
      tick(e) {
        const qs = $$(pg.el, '.cp-sr.a .cp-sqs i'); if (!qs.length) return;
        if (e < 0) return qs.forEach((q) => { q.style.opacity = ''; });
        const n = qs.length, k = cyc(e, 3.3, 0), pos = outC(k) * (n + 1) - 1, amp = Math.sin(Math.PI * k);
        qs.forEach((q, i) => { const dd = i - pos; q.style.opacity = (1 - 0.4 * amp * Math.exp(-dd * dd / 0.9)).toFixed(3); });
      },
    });
    return pg;
  };

  TYPES.cuecalc = (d) => {
    const P = d.params, R = d.result || {}, keys = P.map((p) => p.key), f = new Function(...keys, `return (${d.formula});`);
    const st = {}, dec = (p) => (p.step < 1 ? 1 : 0), def = () => P.forEach((p) => { st[p.key] = p.def; });
    const show = (v) => (R.approx === '万' ? (v / 1e4).toFixed(1) : fmt(v, R.digits || 0));
    def();
    const G = d.grid && d.grid !== false ? d.grid : null;
    const pc = G && P.find((p) => p.key === G.rows), pe = G && P.find((p) => p.key === G.cols);
    const gr = pc && pe ? { r: pc.max, c: pe.max, rk: pc.key, ck: pe.key, label: G.label || '' } : null;
    const LM = isFinite(+d.limit) && d.limit !== '' && d.limit != null ? +d.limit : null, LL = d.limitLabel || '上限';
    const LT = LM == null ? 0 : +d.limitMax || Math.ceil(LM * 1.25), lp = (x) => clamp(x / LT) * 100;
    const pg = page(d, 'cuecalc', 0, `
  <div class="cc-w${gr ? '' : ' ng'}">
    <div class="cc-l zn" data-e>${P.map((p) => `<div class="cc-s" data-k="${p.key}"><div class="cc-h"><em>${esc(p.label)}</em><b><span class="csv"></span><u${p.unit === '%' ? ' class="pct"' : ''}>${esc(p.unit || '')}</u></b></div>
      <input class="rg" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.def}" aria-label="${esc(p.label)}">
      <div class="cc-mm"><span>${fmt(p.min, dec(p)).replace('-', '−')}</span><span>${fmt(p.max, dec(p)).replace('-', '−')}</span></div></div>`).join('')}
      <button type="button" class="creset">恢复默认</button></div>
    <div class="cc-r" data-e><p class="cue-lead">${esc(R.label || '')}</p><b class="cue-big good"${srcA(d.src, d.formulaText || '')}>${R.pre ? `<i class="pre">${esc(R.pre)}</i>` : ''}<span class="ccv"></span><u>${esc(R.unit || '')}</u></b>${d.sub ? `<p class="cue-sub">${esc(d.sub)}</p>` : ''}
      ${LM != null ? `<div class="cc-lim"><div class="cc-lt" aria-hidden="true"><i class="cc-lf">${gr ? '' : '<span class="dw dw-ls"></span>'}</i>${gr ? '' : '<i class="cc-lg"></i>'}<i class="cc-lx" style="left:${lp(LM)}%"></i><i class="cc-lk" style="left:${lp(LM)}%"></i></div><p class="cc-ll"><span>${esc(LL)} ${nf(LM, R.digits || 0)} ${esc(R.unit || '')}</span><b class="cc-lo"></b></p></div>` : ''}
      ${gr ? `<div class="cc-g" aria-hidden="true" style="grid-template-columns:repeat(${gr.c},30px)">${'<i></i>'.repeat(gr.r * gr.c)}</div><p class="cc-gl">${esc(gr.label)}</p>` : ''}</div>
  </div>`, {
      reset() { paint(); },   // 翻走再翻回来，拖过的值留着；只有“恢复默认”和刷新页面回到默认
      enter() { paint(); },
      calm() { paint(); },
      article: () => `<p>${esc(R.label || '')} <b>${esc(R.pre || '')}${show(f(...keys.map((k) => st[k])))}</b>${esc(R.unit || '')}${LM != null ? `（${esc(LL)} ${nf(LM, R.digits || 0)} ${esc(R.unit || '')}）` : ''}</p><p>${P.map((p) => `${esc(p.label)} ${fmt(p.def, dec(p))}${esc(p.unit || '')}`).join('，')}</p>`,
      tick(e) {
        if (!gr) {
          if (LM == null) return sheen(bigParts($(sec, '.cc-r .cue-big')), e < 0 ? -1 : sm(cyc(e, 1.8, 2.6)));
          const ls = $(sec, '.dw-ls'), lg = $(sec, '.cc-lg'), f = ls.parentElement, W = f.offsetWidth, lw = ls.offsetWidth, P = 4.6, c = e % P;
          if (e < 0 || !W) { op(ls, 0); lg.style.opacity = ''; return; }
          if (c < 1.5) { op(ls, 1); tx(ls, lerp(-lw, W, sm(c / 1.5))); } else op(ls, 0);
          const g = c < 1.3 ? 0 : c < 1.8 ? (c - 1.3) / 0.5 : c < 2.6 ? 1 : Math.max(0, 1 - (c - 2.6) / 0.6);
          lg.style.opacity = (0.35 + 0.65 * g).toFixed(3);
          return;
        }
        const on = $$(sec, '.cc-g i.on');
        if (e < 0) return on.forEach((c) => { c.style.opacity = ''; });
        on.forEach((c) => { const i = +c.dataset.i, r = Math.floor(i / gr.c), q = i % gr.c, ph = (q + r) / 6 - e / 2.3; c.style.opacity = (0.84 + 0.16 * Math.cos(ph * 2 * Math.PI)).toFixed(3); });
      },
    });
    const sec = pg.el, inputs = $$(sec, 'input.rg'), out = $(sec, '.ccv'), cells = $$(sec, '.cc-g i');
    cells.forEach((c, i) => { c.dataset.i = i; });
    function paint() {
      P.forEach((p, i) => { const v = st[p.key]; inputs[i].value = v; inputs[i].style.setProperty('--f', ((v - p.min) / (p.max - p.min)) * 100 + '%'); $(sec, `.cc-s[data-k="${p.key}"] .csv`).textContent = fmt(v, dec(p)).replace('-', '−'); });
      if (gr) cells.forEach((c, i) => { const on = Math.floor(i / gr.c) < st[gr.rk] && i % gr.c < st[gr.ck]; c.classList.toggle('on', on); if (!on) c.style.opacity = ''; });
      const v = f(...keys.map((k) => st[k]));
      out.textContent = show(v);
      if (LM != null) {
        const dg = R.digits || 0, vs = +(+v).toFixed(dg), over = vs > LM, rr = $(sec, '.cc-r'), bg = $(rr, '.cue-big');
        rr.classList.toggle('over', over); bg.classList.toggle('good', !over); bg.classList.toggle('bad', over);
        $(sec, '.cc-lf').style.width = lp(Math.min(vs, LM)) + '%';
        $(sec, '.cc-lx').style.width = (over ? lp(vs) - lp(LM) : 0) + '%';
        const lg = $(sec, '.cc-lg'); if (lg) { lg.style.left = lp(Math.min(vs, LM)) + '%'; lg.style.width = (over ? 0 : lp(LM) - lp(vs)) + '%'; }
        $(sec, '.cc-lo').textContent = over ? `超出 ${nf(vs - LM, dg)} ${R.unit || ''}` : `在${LL}以内`;
      }
      linkPub({ exact: v, shown: show(v), isDef: P.every((p) => st[p.key] === p.def), page: D.pages.indexOf(pg) + 1 || (C.pages.indexOf(d) + 1),
        desc: P.map((p) => `${p.label} ${fmt(st[p.key], dec(p)).replace('-', '−')}${p.unit && p.unit !== '%' ? ' ' : ''}${p.unit || ''}`).join('，') });
    }
    inputs.forEach((inp, i) => {
      inp.addEventListener('input', () => { st[P[i].key] = +inp.value; paint(); });
      inp.addEventListener('pointerup', () => setTimeout(() => inp.blur(), 0));
    });
    $(sec, '.creset').addEventListener('click', () => { def(); paint(); });
    paint();
    return pg;
  };

  const nb = document.createElement('aside'); nb.className = 'cue-notes'; nb.setAttribute('aria-label', '讲者备注');
  document.querySelector('.stage').append(nb);
  let nbP = -1, nbT = 0;
  function nbBuild() {
    const pg = D.pages[D.p]; if (!pg) return; nbP = D.p;
    const d = C.pages[D.p] || {};
    const ns = pg.notesLive ? pg.notesLive(d.notes || []) : (d.notes || []);
    nb.innerHTML = `<header><em>讲者备注</em><b>第 ${String(D.p + 1).padStart(2, '0')} 页</b><span>只给讲的人看 · 再按 N 收起</span></header>${ns.length ? `<ul>${notesOf({ notes: ns })}</ul>` : '<p>这一页没有备注。</p>'}`;
  }
  const prevKey = D.onKey;
  D.onKey = (k, e) => {
    if (k === 'n' || k === 'N') {
      const on = document.body.classList.toggle('notes');
      if (on) { nbBuild(); clearInterval(nbT); nbT = setInterval(() => { if (D.p !== nbP) nbBuild(); }, 300); } else { clearInterval(nbT); nbP = -1; }
      return true;
    }
    return prevKey ? prevKey(k, e) : false;
  };
})();
