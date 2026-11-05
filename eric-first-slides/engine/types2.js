(() => {
  const D = Deck, { E, T, tween, wait, set, to, count, clamp, lerp } = D;
  const X = window.__TYPES, { TYPES, frame, base, resetGroups, enterHead, beatIn, calmGroups, appear, hide, showNow, phase, esc, fmt, srcA, txt, cf, ink, tone, acc, MO, tpl, CALC, hours, calcVals, paintCalc, $, $$ } = X;
  const C = window.DECK_CONTENT, M = C.meta;
  const sk = () => D.skin;

  TYPES.quote = (d) => {
    const sec = frame(d, 'quote', `
  <blockquote class="q"><span class="qm" aria-hidden="true">“</span>${esc(d.quote)}</blockquote>
  <div class="qwho">${esc(d.who)}</div>
  <div class="qstat" data-b="1"><b class="ac"${srcA(d.statSrc)}>${d.k}</b><span>／${d.n}</span><p>${esc(d.stat)}</p></div>
  <div class="q2" data-b="2"><p>${esc(d.quote2)}</p><em>${esc(d.who2)}</em></div>`);
    const pg = base(sec, d, 2), S = pg.S, q = $(sec, '.q'), who = $(sec, '.qwho');
    q.dataset.keep = '';
    const G = () => ({
      precise: { x: 120, y: 760, cols: 46, r: 0, sq: 22, gap: 8 },
      theater: { x: 960 - (23 * 30) / 2, y: 780, cols: 23, r: 7, gap: 30 },
      editorial: { x: 1384, y: 420, cols: 8, r: 0, sq: 24, gap: 28 },
      gallery: { x: 324, y: 860, cols: 46, r: 3.5, gap: 20 },
    })[sk()];
    Object.assign(pg, {
      type: 'quote',
      reset() { resetGroups(pg); hide(q); hide(who); },
      async enter() { enterHead(pg); appear(q, D.d(150)); appear(who, D.d(500)); await wait(D.d(700)); },
      beat(k) { return beatIn(pg, k, 900); },
      calm() { calmGroups(pg); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        const b1 = S.b[1]; if (!b1) return;
        const g = G();
        const lit = d.k;
        const ring = b1 >= 1 && D.alive && D.b >= 1 ? Math.min(d.k - 1, Math.floor(phase(S, t, d.k * 0.8, 1.5) * d.k)) : -1;
        for (let i = 0; i < d.n; i++) {
          const f = clamp(b1 * d.n * 1.4 - i * 1.2); if (!f) continue;
          const cx = g.x + (i % g.cols) * (g.gap + (g.sq || 0)), cy = g.y + Math.floor(i / g.cols) * (g.gap + (g.sq || 0));
          const on = i < lit && i < d.k * Math.min(1, b1 * 1.2);
          ctx.globalAlpha = f;
          if (g.sq) { if (on) { ctx.fillStyle = acc(); ctx.fillRect(cx, cy, g.sq, g.sq); } else { ctx.strokeStyle = ink(0.4); ctx.lineWidth = 1.5; ctx.strokeRect(cx + 0.75, cy + 0.75, g.sq - 1.5, g.sq - 1.5); } }
          else { ctx.beginPath(); ctx.arc(cx, cy, g.r, 0, 7); if (on) { ctx.fillStyle = acc(); ctx.fill(); } else { ctx.strokeStyle = ink(0.4); ctx.lineWidth = 1.2; ctx.stroke(); } }
          if (i === ring && f >= 1) { const rr = g.sq ? g.sq * 0.95 : g.r + 7, ox = g.sq ? g.sq / 2 : 0; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx + ox, cy + ox, rr, 0, 7); ctx.strokeStyle = acc(); ctx.lineWidth = 2; ctx.stroke(); }
        }
        ctx.globalAlpha = 1;
      },
      article: () => `<blockquote class="a-q">“${esc(d.quote)}”</blockquote><p class="a-who">${esc(d.who)}</p>
        <p class="a-big"><b class="ac"${srcA(d.statSrc)}>${d.k}</b><u>／${d.n}</u></p><p>${esc(d.stat)}</p>
        <blockquote class="a-q2">“${esc(d.quote2)}”</blockquote><p class="a-who">${esc(d.who2)}</p>`,
    });
    return pg;
  };

  const QUESTIONS = {
    A: ['Where does Lily work on Saturdays?', 'What time does she start work?', 'How much does she earn an hour?', 'Who does she work with?', 'What does she buy with the money?'],
    B: ['Why does Lily get up early on Saturdays?', 'What can we learn about her boss?', 'Is the job easy for her? How do you know?', 'Why does she save half of the money?', 'What does "a busy morning" mean here?', 'How does Lily feel at the end of the day?', 'Would she keep the job next year? Why?'],
    C: ['Retell paragraph 2 in your own words.', 'Use three words to describe Lily. Explain one.', 'Rewrite the last sentence from her mum\'s view.', 'What would you do with your first salary?', 'Write a title for the story. Explain it.', 'Find two sentences that show she is careful.', 'Change "busy" into another word. Rewrite.', 'Ask Lily two questions about her job.', 'Write 40 words: my weekend job.'],
  };
  function docHTML(it, passage) {
    const qs = QUESTIONS[it.tag] || [];
    return `<div class="doc"><i class="ghl" aria-hidden="true"></i><div class="dh"><span>${esc(passage)}</span><b>${esc(it.tag)} 档 · ${esc(it.name)}</b></div>
      <div class="dname">Name ________　Class ____　No. ____</div>
      <div class="dpass"><p>Lily is fourteen. Every Saturday morning she works at a small bakery near her home. She gets up at six and starts work at seven. She cleans the tables, puts the bread on the shelves and says "Good morning" to every customer.</p><p>It is a busy morning, but Lily likes it. Her boss, Mrs. Wang, often gives her a warm bun. Lily earns 20 yuan an hour. She saves half of the money for a new bike.</p></div>
      <ol class="dq">${qs.map((s) => `<li><span>${esc(s)}</span><i></i>${it.tag === 'C' ? '<i></i>' : ''}</li>`).join('')}</ol></div>`;
  }
  TYPES.gallery = (d) => {
    const sec = frame(d, 'gallery', `
  <i class="gmat" aria-hidden="true"></i>
  <div class="gwall">${d.items.map((it, i) => `<figure class="gi gi-${i}"><div class="gframe"><div class="gs">${docHTML(it, d.passage)}</div></div>
    <figcaption><span class="gno">${String(i + 1).padStart(2, '0')}</span><b>${esc(it.tag)} 档 · ${esc(it.name)}</b><em>${esc(it.meta)} · ${esc(it.who)}</em></figcaption></figure>`).join('')}</div>
  <p class="gside">${esc(d.stand || '')}</p>
  ${d.items.map((it, i) => `<div class="gnote gnote-${i}" data-b="${i + 1}"><b>${esc(it.tag)} 档</b><p>${esc(it.note)}</p><span>这一档 ${esc(it.who)}</span></div>`).join('')}
  <p class="gcredit">${esc(d.note)}</p>`);
    const pg = base(sec, d, d.items.length), S = pg.S, figs = $$(sec, '.gi'), wall = $(sec, '.gwall');
    $$(sec, '.gnote').forEach((e) => { e.dataset.keep = ''; });   // 说明一次只留一条，不参与剧院的压暗
    S.focus = -1;
    const SHEET = 980, PAD = { precise: 24, theater: 20, editorial: 20, gallery: 0 };
    function fitPapers() {
      const hd = $(sec, '.head'); sec.style.setProperty('--dy', Math.max(-170, Math.min(0, hd.offsetTop + hd.offsetHeight + 64 - 440)) + 'px');
      figs.forEach((f) => {
        const fr = f.querySelector('.gframe'), gs = f.querySelector('.gs'), W = fr.clientWidth, H = fr.clientHeight, p = PAD[sk()];
        const k = Math.min((W - 2 * p) / 600, (H - 2 * p) / SHEET);
        gs.style.transform = `translate(${(W - 600 * k) / 2}px, ${(H - SHEET * k) / 2}px) scale(${k})`;
      });
    }
    function focus(k, dur) {   // 把第 k 张拎出来（框线／放大），其余照样读得清（不低于 0.65）
      S.focus = k;
      const dim = { precise: 0.72, theater: 0.78, editorial: 0.72, gallery: 0.72 }[sk()];
      figs.forEach((f, i) => { const on = k < 0 || i === k; f.classList.toggle('on', i === k); dur ? to(f, { o: on ? 1 : dim }, dur) : set(f, { o: on ? 1 : dim }); });
    }
    function hl(i, y, h, o) { const g = figs[i].querySelector('.ghl'); g.style.top = y + 'px'; g.style.height = h + 'px'; g.style.opacity = o; }
    Object.assign(pg, {
      type: 'gallery',
      reset() { resetGroups(pg); hide(wall); fitPapers(); focus(-1); figs.forEach((f, i) => hl(i, 0, 0, 0)); S.t0 = null; },
      async enter() { enterHead(pg); fitPapers(); figs.forEach((f) => set(f, { o: 1 })); appear(wall, D.d(150)); await wait(D.d(900)); },
      async beat(k) {
        S.t0 = null;
        $$(sec, '.gnote').forEach((e, i) => { if (i + 1 < k) to(e, { o: 0 }, D.d(200)); });
        focus(k - 1, D.d(MO[sk()].dur));
        await beatIn(pg, k, 600);
      },
      calm() { focus(D.b > 0 ? D.b - 1 : -1); $$(sec, '.gnote').forEach((e, i) => set(e, { o: i + 1 === D.b ? 1 : 0 })); figs.forEach((f, i) => hl(i, 0, 0, 0)); },
      resize() { pg.cv.fit(); fitPapers(); },
      tick(t) {
        pg.cv.ctx.clearRect(0, 0, 1920, 1080);
        const k = S.focus;
        figs.forEach((f, i) => {
          if (i !== k || !D.alive) { if (f.querySelector('.ghl').style.opacity !== '0') hl(i, 0, 0, 0); return; }
          const li = $$(f, '.dq li'), n = li.length, p = phase(S, t, n * 1.6, 1.2) * n, j = Math.min(n - 1, Math.floor(p)), u = clamp((p - j) * 6);
          const a = li[j], b = li[Math.max(0, j - 1)], y = lerp(j ? b.offsetTop : a.offsetTop, a.offsetTop, E.inOut(u)), h = lerp(j ? b.offsetHeight : a.offsetHeight, a.offsetHeight, E.inOut(u));
          hl(i, y - 6, h + 8, 1);   // .doc 是定位父级，offsetTop 直接相对纸面
        });
      },
      article: () => `<div class="a-gal">${d.items.map((it) => `<figure><div class="a-gf">${docHTML(it, d.passage)}</div><figcaption><b>${esc(it.tag)} 档 · ${esc(it.name)}</b> · ${esc(it.meta)} · ${esc(it.who)}<br>${esc(it.note)}</figcaption></figure>`).join('')}</div><p class="a-who">${esc(d.note)}</p>`,
    });
    return pg;
  };

  TYPES.calc ??= (d) => {
    const P = d.params;
    const sec = frame(d, 'calc', `
  <div class="csl">${P.map((p) => `<div class="cs" data-k="${p.key}"><div class="csh"><em>${esc(p.label)}</em><b><span class="csv"></span> <u>${esc(p.unit)}</u></b></div>
    <input class="rg" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.def}" aria-label="${esc(p.label)}"><p>${esc(p.note)}</p></div>`).join('')}
    <button type="button" class="creset">恢复默认</button></div>
  <div class="cres"><em>一学期省下</em><b class="ac" data-calc="hours"${srcA(d.src, '班数 × 每班人数 × 每篇省下的分钟 × 作文次数 ÷ 60')}>${calcVals().hours}</b><u>小时</u></div>
  <div class="cform" data-b="1"></div>
  <p class="cass" data-b="2">${esc(d.assume)}</p>
  <div class="cwk" aria-hidden="true"></div>`);
    const pg = base(sec, d, 3), S = pg.S, res = $(sec, '.cres'), form = $(sec, '.cform'), cwk = $(sec, '.cwk'), csl = $(sec, '.csl');
    res.dataset.keep = ''; csl.dataset.keep = '';
    const inputs = $$(sec, 'input.rg');
    const dec = (p) => (p.step < 1 ? 1 : 0);
    function paint() {
      P.forEach((p, i) => { const v = CALC[p.key]; inputs[i].value = v; inputs[i].style.setProperty('--f', ((v - p.min) / (p.max - p.min)) * 100 + '%'); $(sec, `.cs[data-k="${p.key}"] .csv`).textContent = fmt(v, dec(p)); });
      const hh = hours();
      form.innerHTML = `<span>${CALC.classes} 个班</span><i>×</i><span>${CALC.kids} 人</span><i>×</i><span>${fmt(CALC.save, 1)} 分钟</span><i>×</i><span>${CALC.rounds} 次</span><i>÷</i><span>60</span><i>＝</i><b class="ac">${fmt(hh, 1)} 小时</b><i>≈</i><b class="ac">${fmt(Math.round(hh))}</b>`;
      paintCalc();
    }
    inputs.forEach((inp, i) => inp.addEventListener('input', () => { CALC[P[i].key] = +inp.value; paint(); }));
    $(sec, '.creset').addEventListener('click', () => { P.forEach((p) => { CALC[p.key] = p.def; }); paint(); });
    D.onCalc = paint;
    const weeksOf = () => { const r = CALC.rounds, per = (CALC.classes * CALC.kids * CALC.save) / 60, pts = []; let acc2 = 0; for (let w = 1; w <= 18; w++) { const due = Math.floor((w * r) / 18) - Math.floor(((w - 1) * r) / 18); acc2 += due * per; pts.push(acc2); } return pts; };
    const G = () => ({
      precise: { x: 1000, y: 560, w: 800, h: 300 },
      theater: { x: 560, y: 500, w: 800, h: 116 },
      editorial: { x: 1380, y: 640, w: 420, h: 220 },
      gallery: { x: 1060, y: 380, w: 640, h: 200 },
    })[sk()];
    Object.assign(pg, {
      type: 'calc',
      reset() { resetGroups(pg); hide(res); hide(csl); set(cwk, { o: 0 }); paint(); },
      async enter() { enterHead(pg); paint(); appear(res, D.d(150)); appear(csl, D.d(300)); await tween(D.d(1000), (v) => { S.a = v; }, { ease: E.enter, delay: D.d(200) }); },
      async beat(k) {
        if (k === 3) {   // 自动演示：班数从 1 拖回默认，讲的人可以说"一个班是这样，四个班是这样"
          await beatIn(pg, k, 200);
          const p = P[0], goal = CALC[p.key];
          for (let v = p.min; v <= goal; v++) { CALC[p.key] = v; paint(); await wait(D.d(520)); }
          return;
        }
        return beatIn(pg, k, 500);
      },
      calm() { calmGroups(pg); paint(); },
      resize() { pg.cv.fit(); },
      tick(t) {
        const { ctx } = pg.cv; ctx.clearRect(0, 0, 1920, 1080);
        const g = G(), pts = weeksOf(), top = Math.max(pts[17], 1), a = S.a;
        const x = (i) => g.x + (g.w * (i + 0.5)) / 18, y = (v) => g.y + g.h - (v / top) * g.h;
        if (sk() !== 'theater') txt(ctx, '一学期累计省下（小时）', g.x, g.y - 22, cf(15, 500, 'sans'), ink(0.7));
        ctx.fillStyle = ink(0.85); ctx.fillRect(g.x, g.y + g.h, g.w, 1);
        ctx.strokeStyle = sk() === 'editorial' ? acc() : ink(); ctx.lineWidth = sk() === 'gallery' ? 1.25 : 2.5; ctx.beginPath();
        const upto = Math.floor(a * 18);
        for (let i = 0; i < upto; i++) { const xx = g.x + (g.w * i) / 18, yy = y(pts[i]); if (!i) ctx.moveTo(xx, y(0)); ctx.lineTo(xx, yy); ctx.lineTo(xx + g.w / 18, yy); }
        ctx.stroke();
        if (a >= 1) { txt(ctx, fmt(pts[17], 0), g.x + g.w + 10, y(pts[17]) + 6, cf(18, 600), acc()); }
        if (sk() !== 'theater') for (const i of [0, 8, 17]) txt(ctx, `第 ${i + 1} 周`, x(i), g.y + g.h + 26, cf(14, 400, 'sans'), ink(0.5), 'center');
        const i0 = pts.findIndex((v) => v > 0);   // 从第一次有累计的那周走起，不读"累计 0 小时"
        if (a >= 1 && D.alive && i0 >= 0) {
          const p = phase(S, t, 24, 2), i = Math.min(17, i0 + Math.floor(p * (18 - i0))), xx = g.x + (g.w * (i + 0.5)) / 18;
          ctx.fillStyle = sk() === 'gallery' ? acc() : ink(); ctx.fillRect(xx - 0.75, g.y - 4, 1.5, g.h + 4);
          cwk.textContent = `第 ${i + 1} 周 · 累计 ${fmt(pts[i], 0)} 小时`; const wr = cwk.offsetWidth; cwk.style.left = clamp(xx - wr / 2, g.x - 20, g.x + g.w + 40 - wr) + 'px'; cwk.style.top = g.y + g.h + (sk() === 'theater' ? 18 : 40) + 'px'; set(cwk, { o: 1 });
        } else set(cwk, { o: 0 });
      },
      article: () => `<p class="a-big"><b class="ac" data-calc="hours">${calcVals().hours}</b><u>小时</u></p>
        <div class="a-calc">${P.map((p) => `<label><span>${esc(p.label)} <b data-av="${p.key}">${fmt(CALC[p.key], dec(p))}</b> ${esc(p.unit)}</span><input class="rg" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${CALC[p.key]}" data-ak="${p.key}"></label>`).join('')}</div>
        <p class="a-note">班数 × 每班人数 × 每篇省下的分钟 × 作文次数 ÷ 60</p><p class="a-who">${esc(d.assume)}</p>`,
    });
    return pg;
  };

  TYPES.ask ??= (d) => {
    const sec = frame(d, 'ask', `
  <i class="ak-mat" aria-hidden="true"></i>
  <div class="an" data-b="1"><h3>需要</h3>${d.needs.map((x, i) => `<div class="ai"><span class="ano">${i + 1}</span><b>${esc(x.text)}</b><p>${esc(x.sub)}</p></div>`).join('')}</div>
  <div class="ag"><h3>换来</h3>${d.gets.map((x) => `<div class="ai"><b class="agv"${srcA(x.src)}>${tpl(x.v)}<u>${esc(x.unit)}</u></b><p>${esc(x.text)}</p></div>`).join('')}</div>
  <div class="adl" data-b="2"><span>${esc(d.deadline)}</span><i class="caret" aria-hidden="true"></i></div>`);
    const pg = base(sec, d, 2), S = pg.S, caret = $(sec, '.caret'), ag = $(sec, '.ag');
    ag.dataset.keep = '';
    Object.assign(pg, {
      type: 'ask',
      reset() { resetGroups(pg); hide(ag); caret.style.opacity = 0; S.c0 = null; const hd = $(sec, '.head'); sec.style.setProperty('--dy', Math.max(-170, Math.min(0, hd.offsetTop + hd.offsetHeight + 64 - 440)) + 'px'); },
      async enter() { enterHead(pg); appear(ag, D.d(300)); await wait(D.d(700)); },
      async beat(k) { if (k === 2) S.c0 = null; return beatIn(pg, k, 500); },
      calm() { calmGroups(pg); caret.style.opacity = D.b >= 2 ? 0.35 : 0; },
      resize() {},
      tick(t) {
        if (D.b < 2 || !D.alive) { caret.style.opacity = D.b >= 2 ? 0.35 : 0; return; }
        if (S.c0 == null) S.c0 = t;
        const e = t - S.c0; caret.style.opacity = e < 8 ? (Math.floor(e / 0.53) % 2 ? 0 : 1) : 0.35;
      },
      article: () => `<h3 class="a-h3">需要</h3>${d.needs.map((x) => `<p><b>${esc(x.text)}</b><br><span class="a-who">${esc(x.sub)}</span></p>`).join('')}
        <h3 class="a-h3">换来</h3>${d.gets.map((x) => `<p><b class="ac">${tpl(x.v)} ${esc(x.unit)}</b>　${esc(x.text)}</p>`).join('')}
        <p class="a-dl">${esc(d.deadline)}</p>`,
    });
    return pg;
  };

  const pages = C.pages.map((d) => {
    const make = TYPES[d.type]; if (!make) throw new Error('没有这个页型：' + d.type);
    const pg = make(d, C.pages); pg.el.classList.add('page'); return D.page(Object.assign(pg, { el: '#' + pg.el.id }));
  });
  pages.forEach((pg, i) => {
    const nx = pages[i + 1];
    if (pg.type === 'cover' && nx && nx.type === 'trend') {
      pg.leave = async () => {
        const from = pg.stripGeo(); pg.S.morphOut = true;
        const kids = [...pg.el.children].filter((e) => !e.matches('canvas,.foot,.rfoot'));
        kids.forEach((e) => to(e, { o: 0 }, D.d(260), { ease: E.exit }));
        await nx.morphIn(from);
        kids.forEach((e) => set(e, { o: 1 })); pg.S.morphOut = false;
      };
    }
    if (pg.type === 'calc' && nx && nx.type === 'ask') {
      pg.leave = async () => {
        const src = pg.el.querySelector('.cres b'), dst = nx.el.querySelector('.ag .agv [data-calc]');
        to(pg.el, { o: 0 }, D.d(280), { ease: E.exit });
        const ag = nx.el.querySelector('.ag'); set(ag, { o: 1, y: 0 });
        const rest = [...ag.children].flatMap((c) => (c.contains(dst) ? [...c.querySelectorAll('u,p')] : [c]));
        rest.forEach(hide); enterHeadQuick(nx); const hd = nx.el.querySelector('.head'); hide(hd); appear(hd, D.d(300));
        await D.fly(src, dst, D.d(T.morph), { delay: D.d(120) });
        rest.forEach((e, k) => appear(e, k * D.d(60)));
        set(pg.el, { o: 1 });
      };
    }
  });
  function enterHeadQuick(pg) { pg.head.forEach((e) => e && showNow(e)); }

  D.article = () => {
    const art = document.querySelector('.article');
    art.innerHTML = `<p class="tip">这是一份演示稿的手机版。在电脑上打开，可以全屏、按键一步步讲、拖推演器。</p>
      <header class="a-mast"><span>${esc(M.who)}</span><b>${esc(M.deck)}</b></header>
      ${C.pages.map((d, i) => `<section class="a-sec a-t-${d.type}"><div class="a-k">${String(i + 1).padStart(2, '0')} · ${esc(d.kicker)}</div><h2>${tpl(d.title)}</h2>${d.stand ? `<p class="a-stand">${esc(d.stand)}</p>` : ''}${pages[i].article()}</section>`).join('')}
      <p class="a-foot">${esc(M.foot)}。PDF、图片版只是静态版本，没有动态和交互。</p>`;
    art.querySelectorAll('input[data-ak]').forEach((inp) => inp.addEventListener('input', () => {
      CALC[inp.dataset.ak] = +inp.value; const pdef = C.pages.find((p) => p.type === 'calc').params.find((p) => p.key === inp.dataset.ak);
      art.querySelector(`[data-av="${inp.dataset.ak}"]`).textContent = fmt(+inp.value, pdef.step < 1 ? 1 : 0); paintCalc(); D.onCalc && D.onCalc();
    }));
    const sheet = document.querySelector('.sheet');
    art.querySelectorAll('[data-src]').forEach((el) => el.addEventListener('click', () => { sheet.innerHTML = `<b>出处</b>${esc(el.dataset.src)}<button type="button">知道了</button>`; sheet.classList.add('on'); sheet.querySelector('button').onclick = () => sheet.classList.remove('on'); }));
  };

  D.totalPages = pages.length;
  D.endMsg = document.documentElement.dataset.lock ? '到最后一页了。按 Home 回到开头。' : '到最后一页了。按 Home 回到开头；按 K 换一种风格再看一遍。';   // 2026-11-04：锁了风格就不提 K
  D.start();
})();
