(() => {
  const D = window.Deck; if (!D) return;
  const Q = new URLSearchParams(location.search);
  const ROLE = Q.has('presenter') ? 'presenter' : Q.get('pv') === 'cur' ? 'cur' : Q.get('pv') === 'next' ? 'next' : 'audience';
  const root = document.documentElement; root.classList.add('pv-' + ROLE);
  const A = window.PRESENTER_ADAPTER || {};
  const WIN = 'eric-slides-presenter';
  const NEXT = ['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'], PREV = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
  const CLICKER = ['ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp', 'Enter', 'Backspace'];
  const FWD = ['r', 'R', 'v', 'V', 'b', 'B', '.', 'Home', 'End', 't', 'T', ...(A.keys || [])];   // 讲者窗口里按了，原样交给观众窗口；各套另加的键放 A.keys
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pv = (window.__pv = { role: ROLE, t0: performance.now(), marks: {} });
  const mark = (k) => { if (!(k in pv.marks)) pv.marks[k] = Math.round(performance.now() - pv.t0); };

  const pageEls = () => D.pages.map((pg) => pg.el);
  const inBox = (el) => !el.closest('.cue-notes,.srcpop,.printdeck,.pv');
  const ctrls = () => pageEls().flatMap((s) => $$('input[type=range],input[type=checkbox],input[type=radio],select', s)).filter(inBox);
  const btns = () => pageEls().flatMap((s) => $$('button', s)).filter(inBox);
  const pageOf = (el) => pageEls().findIndex((s) => s.contains(el));
  const label = (el) => el.getAttribute('aria-label') || (el.closest('label') && el.closest('label').innerText.trim()) || '';
  const rowOf = (el) => { const up = el.parentElement; return (up && up.closest('[data-k]')) || up; };
  const valueText = A.valueText || ((el) => {
    const row = rowOf(el), b = row && row.querySelector('b');
    if (!b) return String(el.value);
    return [...b.childNodes].map((n) => n.textContent).join(' ').replace(/\s+/g, ' ').replace(/ %$/, '%').trim();
  });
  const rangeEnds = (el) => { const row = rowOf(el), m = row && row.querySelectorAll('.cc-mm span'); return m && m.length === 2 ? [m[0].textContent, m[1].textContent] : [String(el.min), String(el.max)]; };
  function readCtrls() {
    return ctrls().map((el, i) => ({ i, page: pageOf(el), kind: el.type || el.tagName.toLowerCase(), v: el.value, on: !!el.checked, min: el.min, max: el.max, step: el.step,
      label: label(el), text: valueText(el), ends: el.type === 'range' ? rangeEnds(el) : null }));
  }
  function setCtrl(el, v, on) {
    let ch = false;
    if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked !== !!on) { el.checked = !!on; ch = true; } }
    else if (String(el.value) !== String(v)) { el.value = v; ch = true; }
    if (ch) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    return ch;
  }
  function applyCtrls(list) { const els = ctrls(); let n = 0; for (const c of list || []) if (els[c.i] && setCtrl(els[c.i], c.v, c.on)) n++; return n; }
  const notesDef = (p) => {
    const C = window.DECK_CONTENT || {}, pg = D.pages[p], d = (C.pages || [])[p] || {};
    if (pg && pg.notesLive) return pg.notesLive(d.notes || []);
    const li = pg && pg.el ? $$('.cue-notes li', pg.el) : [];
    if (li.length) return li.map((x) => x.textContent.replace(/\s+/g, ' ').trim());
    let ns = d.notes == null ? [] : d.notes;
    if (typeof ns === 'string') ns = ns.split(/(?<=。)/);
    if (!Array.isArray(ns)) ns = [ns];
    const N = C.nums || {};
    return ns.map((x) => (x && typeof x === 'object' ? String(x._ ?? x.t ?? '') : String(x ?? '')).trim()).filter(Boolean)
      .map((x) => x.replace(/\{([^{}@]+)\}/g, (m, k) => (N[k] && N[k].t != null ? String(N[k].t) : m)));
  };
  const guard = (f, fb) => { try { return f(); } catch (e) { console.warn('[讲者视图] adapter 出错：', e && e.message); return fb(); } };
  const notesFor = (p) => (A.notes ? guard(() => A.notes(p, D) || [], () => notesDef(p)) : notesDef(p));
  const titleOf = (p) => { const el = D.pages[p] && D.pages[p].el.querySelector('.title,h1,h2,.kicker'); return el ? el.innerText.replace(/\s+/g, ' ').trim() : ''; };
  const blackEl = () => document.querySelector('.blackout');
  function looks() { return { theme: D.theme, skin: D.skin, accent: D.accent && D.accent.input, black: !!(blackEl() && blackEl().classList.contains('on')), ext: A.state ? guard(() => A.state.get(D), () => null) : null }; }
  function applyLooks(o) {
    if (o.skin && o.skin !== D.skin && D.setSkin) D.setSkin(o.skin, true);
    if (o.theme && o.theme !== D.theme) D.setTheme(o.theme);
    if (o.accent && D.accent && o.accent !== D.accent.input) D.setAccent(o.accent, true);
    const bl = blackEl(); if (bl) bl.classList.toggle('on', !!o.black);
    if (A.state && o.ext) guard(() => A.state.set(o.ext, D), () => null);
  }
  function keepSlides() {
    if (D.mode !== 'article') return;
    document.body.classList.remove('art'); root.classList.remove('art'); D.mode = 'slides'; D.fit && D.fit();
  }

  if (ROLE === 'cur' || ROLE === 'next') {
    const block = (e) => { e.stopImmediatePropagation(); e.preventDefault(); };
    for (const t of ['keydown', 'keyup', 'keypress', 'click', 'mousedown', 'pointerdown', 'wheel', 'contextmenu']) addEventListener(t, block, true);
    let busyUntil = 0, queue = [], lastShow = '';
    if (ROLE === 'cur') for (const name of ['next', 'prev', 'replay']) { const f = D[name]; D[name] = function (...a) { busyUntil = performance.now() + 1700; return f.apply(this, a); }; }
    const ready = () => window.__ready === true;
    async function handle(m) {
      if (ROLE === 'cur') {
        if (m.t === 'step') { D[m.c] && D[m.c](); return; }
        if (m.t === 'sync') {
          applyLooks(m); applyCtrls(m.ctrls);
          const want = () => +document.body.dataset.page === m.p + 1 && +document.body.dataset.beat === m.b;
          while (!want() && performance.now() < busyUntil) await new Promise((r) => setTimeout(r, 80));
          if (!want() && pv.lastSync === m) await D.goTo(m.p, m.b);
        }
      } else if (m.t === 'show') {
        const key = JSON.stringify([m.p, m.b, m.ctrls, m.theme, m.accent, m.ext]);
        if (key === lastShow) return; lastShow = key;
        applyLooks({ ...m, black: false }); applyCtrls(m.ctrls);
        if (m.p >= 0 && m.p < D.pages.length) { await D.goTo(m.p, m.b); const pg = D.pages[m.p]; pg.calm && pg.calm(D); }
        mark('shown');
      }
    }
    addEventListener('message', (e) => {
      if (e.source !== window.parent || !e.data || e.data.pv !== 1) return;
      if (e.data.t === 'sync') pv.lastSync = e.data;
      if (ready()) handle(e.data); else queue.push(e.data);
    });
    const s = D.start; D.start = async function (...a) { const r = await s.apply(this, a); keepSlides(); mark('ready'); const q = queue; queue = []; for (const m of q) await handle(m); return r; };
    return;
  }

  if (ROLE === 'audience') {
    let pw = null, sid = '', linked = false, synth = false, lastSent = '';
    const tm = { started: false, run: false, acc: 0, t0: 0 };
    const tmNow = () => tm.acc + (tm.run ? Date.now() - tm.t0 : 0);
    const startTimer = () => { if (!tm.started) { tm.started = true; tm.run = true; tm.t0 = Date.now(); tm.acc = 0; } };
    const send = (t, o = {}) => { if (pw && !pw.closed) { try { pw.postMessage({ pv: 1, sid, t, ...o }, '*'); } catch (e) {} } };
    function snap() {
      const p = D.p;
      return { p, b: D.b, n: D.pages.length, beats: D.pages.map((x) => x.beats), title: titleOf(p), notes: notesFor(p).map(String),
        ctrls: readCtrls(), btns: btns().map((el, i) => ({ i, page: pageOf(el), text: el.innerText.trim() })),
        ...looks(), timer: { started: tm.started, run: tm.run, ms: tmNow(), at: Date.now() }, hidden: document.hidden, size: [innerWidth, innerHeight] };
    }
    let qT = 0;
    function pushState(force) {
      if (!linked) return;
      clearTimeout(qT);
      qT = setTimeout(() => { const s = snap(), k = JSON.stringify({ ...s, timer: { ...s.timer, ms: 0, at: 0 } }); if (force || k !== lastSent) { lastSent = k; send('state', s); } }, 30);
    }
    function link() {
      linked = true; root.classList.add('pv-linked'); document.body.classList.remove('notes'); quietCheck(); keepSlides(); lastSent = ''; pushState(true);
    }
    function unlink() { linked = false; root.classList.remove('pv-linked'); }
    function quietCheck() { if (document.body.classList.contains('check') && D.toggleCheck) D.toggleCheck(); if (D.hideSrc) D.hideSrc(); }
    function openPresenter() {
      if (pw && !pw.closed && linked) { try { pw.focus(); } catch (e) {} pushState(true); return; }
      sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      const u = new URL(location.href); u.search = '?presenter=' + sid; u.hash = '';
      pw = window.open(u.href, WIN, 'popup,width=1280,height=800');
      if (!pw) { D.toast('浏览器拦住了讲者窗口。请在地址栏右边允许这个文件弹出窗口，再按一次 D。', 5200); return; }
      link();
    }
    D.openPresenter = openPresenter;
    for (const name of ['next', 'prev', 'replay']) {
      const f = D[name];
      D[name] = function (...a) { if (linked) { if (name !== 'replay') startTimer(); send('step', { c: name }); } return f.apply(this, a); };
    }
    function exec(m) {
      if (m.c === 'next') D.next();
      else if (m.c === 'prev') D.prev();
      else if (m.c === 'goto') D.goTo(m.p, m.b);
      else if (m.c === 'key') { synth = true; try { dispatchEvent(new KeyboardEvent('keydown', { key: m.k, bubbles: true, cancelable: true })); } finally { synth = false; } }
      else if (m.c === 'ctrl') { const el = ctrls()[m.i]; if (el) setCtrl(el, m.v, m.on); }
      else if (m.c === 'btn') { const el = btns()[m.i]; if (el) el.click(); }
      else if (m.c === 'timer') {
        if (m.op === 'pause' && tm.run) { tm.acc = tmNow(); tm.run = false; }
        else if (m.op === 'resume' && tm.started && !tm.run) { tm.t0 = Date.now(); tm.run = true; }
        else if (m.op === 'reset') { tm.started = false; tm.run = false; tm.acc = 0; }
      }
      pushState(true); setTimeout(() => pushState(), 400);
    }
    addEventListener('message', (e) => {
      const m = e.data; if (!pw || e.source !== pw || !m || m.pv !== 1 || m.sid !== sid) return;
      if (m.t === 'hello') { if (!linked) link(); pushState(true); }
      else if (m.t === 'ping') { send('pong'); pushState(); }
      else if (m.t === 'cmd') exec(m);
      else if (m.t === 'bye') unlink();
    });
    addEventListener('keydown', (e) => {
      if (synth || e.metaKey || e.ctrlKey || e.altKey || D.mode === 'article') return;
      if (e.target.closest && e.target.closest('input:not([type=range]),textarea,select,[contenteditable]')) return;
      if (e.key === 'd' || e.key === 'D') { e.preventDefault(); e.stopImmediatePropagation(); openPresenter(); }
      else if (linked && ['n', 'N', 's', 'S'].includes(e.key)) { e.preventDefault(); e.stopImmediatePropagation(); }   // 投影上不出备注（N）和出处描框（S）
    }, true);
    addEventListener('resize', () => { if (linked) { keepSlides(); pushState(); } });
    addEventListener('input', () => pushState(), true);
    addEventListener('change', () => pushState(), true);
    addEventListener('click', () => { pushState(); setTimeout(() => pushState(), 400); }, true);
    addEventListener('pagehide', () => send('bye'));
    document.addEventListener('visibilitychange', () => pushState(true));
    setInterval(() => { if (linked && (!pw || pw.closed)) unlink(); }, 500);
    const s = D.start;
    D.start = function (...a) {
      const r = s.apply(this, a);   // 工具栏在 start 一开头就挂上了
      const ui = document.querySelector('.ui');
      if (ui) {
        const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'pv-open'; bt.textContent = '讲者视图（D）'; bt.title = '投影放这个窗口，讲者窗口在笔记本上看备注、下一页和计时';
        bt.addEventListener('click', openPresenter); ui.insertBefore(bt, ui.lastElementChild);
      }
      new MutationObserver(() => pushState()).observe(document.body, { attributes: true, attributeFilter: ['data-page', 'data-beat'] });
      new MutationObserver(() => pushState()).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-skin', 'style'] });
      Promise.resolve(r).then(() => { const bl = blackEl(); if (bl) new MutationObserver(() => pushState()).observe(bl, { attributes: true, attributeFilter: ['class'] }); });
      return r;
    };
    return;
  }

  const SID = Q.get('presenter'), aud = window.opener;
  let S = null, alive = false, lastHeard = 0, frames = null, nextKey = '';
  const post = (t, o = {}) => { if (aud && !aud.closed) { try { aud.postMessage({ pv: 1, sid: SID, t, ...o }, '*'); } catch (e) {} } };
  const cmd = (c, o = {}) => { if (!alive) { flash(); return; } post('cmd', { c, ...o }); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const two = (n) => String(n).padStart(2, '0');
  const fmtT = (ms) => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600); return (h ? h + ':' : '') + two(Math.floor((s % 3600) / 60)) + ':' + two(s % 60); };
  const base = () => { const u = new URL(location.href); u.search = ''; u.hash = ''; return u.href; };

  const box = document.createElement('div'); box.className = 'pv'; box.dataset.ui = '1';
  box.innerHTML = `
  <header class="pv-top">
    <div class="pv-where"><b class="pv-pn">--</b><span class="pv-bt"></span><em class="pv-tt"></em></div>
    <div class="pv-time"><b class="pv-tm">00:00</b><span class="pv-tms">第一次翻页时开始计时</span>
      <button type="button" class="pv-tp">暂停</button><button type="button" class="pv-tr">清零</button></div>
    <div class="pv-clock"><b class="pv-ck">--:--</b><span>现在时间</span></div>
  </header>
  <div class="pv-bad" hidden></div>
  <main class="pv-main">
    <section class="pv-l">
      <p class="pv-lb">现在 · 观众看到的<i class="pv-black" hidden>观众黑屏中</i><i class="pv-hidw" hidden>观众窗口被整个盖住了：动画暂停，露出来后接上</i></p>
      <div class="pv-fr pv-cur"></div>
      <div class="pv-ctl" hidden></div>
    </section>
    <section class="pv-r">
      <p class="pv-lb">讲者备注</p>
      <div class="pv-notes"></div>
      <p class="pv-lb pv-nlb">下一页</p>
      <div class="pv-fr pv-next"><p class="pv-end" hidden>这是最后一页</p></div>
    </section>
  </main>
  <footer class="pv-foot">
    <button type="button" class="pv-prev">← 上一步</button><button type="button" class="pv-nx">下一步 →</button>
    <p class="pv-tip">在观众窗口按 F 全屏，或在会议里只共享观众窗口。观众窗口别整个盖住：整个盖住时浏览器会停掉它的动画。</p>
  </footer>`;
  const q = (s) => box.querySelector(s);
  const el = { pn: q('.pv-pn'), bt: q('.pv-bt'), tt: q('.pv-tt'), tm: q('.pv-tm'), tms: q('.pv-tms'), tp: q('.pv-tp'), tr: q('.pv-tr'), ck: q('.pv-ck'),
    bad: q('.pv-bad'), cur: q('.pv-cur'), next: q('.pv-next'), end: q('.pv-end'), nlb: q('.pv-nlb'), notes: q('.pv-notes'), ctl: q('.pv-ctl'), black: q('.pv-black'), hidw: q('.pv-hidw'),
    prev: q('.pv-prev'), nx: q('.pv-nx') };
  function flash() { el.bad.classList.remove('flash'); void el.bad.offsetWidth; el.bad.classList.add('flash'); }
  function setAlive(a, why) {
    alive = a; root.classList.toggle('pv-off', !a);
    el.bad.hidden = a; if (!a) el.bad.textContent = why;
    el.prev.disabled = el.nx.disabled = !a;
  }
  setAlive(false, aud ? '正在连接观众窗口……' : '这个窗口没有连上幻灯片。请回到幻灯片窗口，按 D 或点右上角“讲者视图”打开。');

  function frameUrl(kind, p, b, s) { return `${base()}?pv=${kind}&slides&skin=${encodeURIComponent(s.skin)}&theme=${s.theme}${kind === 'next' ? '&motion=reduced' : ''}&page=${p + 1}&beat=${b}`; }
  function mkFrame(host, kind, p, b, s) {
    const f = document.createElement('iframe'); f.tabIndex = -1; f.title = kind === 'cur' ? '现在的页' : '下一页'; f.setAttribute('aria-hidden', 'true');
    f.addEventListener('load', () => { mark(kind + 'Load'); if (S && frames) { if (kind === 'next') nextKey = ''; syncFrames(S); } });
    f.src = frameUrl(kind, p, b, s); host.prepend(f); return f;
  }
  const toFrame = (f, m) => { try { f.contentWindow.postMessage({ pv: 1, ...m }, '*'); } catch (e) {} };
  function nextOf(s) { return s.p < s.n - 1 ? { p: s.p + 1, b: s.beats[s.p + 1] } : null; }
  function syncFrames(s) {
    const lk = { theme: s.theme, skin: s.skin, accent: s.accent, ext: s.ext, ctrls: s.ctrls.map(({ i, v, on }) => ({ i, v, on })) };
    if (!frames) {
      const nx = nextOf(s) || { p: s.p, b: s.beats[s.p] };
      frames = { cur: mkFrame(el.cur, 'cur', s.p, s.b, s), next: mkFrame(el.next, 'next', nx.p, nx.b, s) };
    }
    toFrame(frames.cur, { t: 'sync', p: s.p, b: s.b, black: s.black, ...lk });
    const nx = nextOf(s); el.end.hidden = !!nx; frames.next.style.visibility = nx ? '' : 'hidden';
    el.nlb.textContent = nx ? `下一页 · 第 ${two(nx.p + 1)} 页` : '下一页';
    if (nx) { const k = JSON.stringify([nx, lk]); if (k !== nextKey) { nextKey = k; toFrame(frames.next, { t: 'show', ...nx, ...lk }); } }
  }

  let notesKey = '', ctlKey = '';
  function render(s) {
    el.pn.textContent = `${two(s.p + 1)} / ${two(s.n)}`;
    const nb = s.beats[s.p];
    el.bt.textContent = nb ? `第 ${s.b + 1} / ${nb + 1} 拍${s.b < nb ? ` · 这一页还有 ${nb - s.b} 拍` : ''}` : '这一页只有一拍';
    el.tt.textContent = s.title;
    el.black.hidden = !s.black; el.hidw.hidden = !s.hidden;
    const nk = JSON.stringify([s.p, s.notes]);
    if (nk !== notesKey) { notesKey = nk; el.notes.innerHTML = s.notes.length ? `<ul>${s.notes.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="pv-none">这一页没有备注。</p>'; el.notes.scrollTop = 0; }
    const cs = s.ctrls.filter((c) => c.page === s.p), bs = s.btns.filter((b) => b.page === s.p);
    const ck = JSON.stringify([s.p, cs.map((c) => [c.i, c.kind, c.min, c.max, c.step, c.label]), bs]);
    if (ck !== ctlKey) {
      ctlKey = ck; el.ctl.hidden = !cs.length && !bs.length;
      el.ctl.innerHTML = `<p class="pv-lb">这一页能改的数（在这里拖，观众那边跟着变）</p>${cs.map((c) => c.kind === 'range'
        ? `<div class="pv-rg" data-i="${c.i}"><div class="pv-rh"><em>${esc(c.label)}</em><b></b></div><input type="range" min="${esc(c.min)}" max="${esc(c.max)}" step="${esc(c.step)}" value="${esc(c.v)}" aria-label="${esc(c.label)}"><div class="pv-mm"><span>${esc(c.ends[0])}</span><span>${esc(c.ends[1])}</span></div></div>`
        : `<label class="pv-ck2" data-i="${c.i}"><input type="checkbox"${c.on ? ' checked' : ''}> ${esc(c.label)}</label>`).join('')}${bs.length ? `<div class="pv-bs">${bs.map((b) => `<button type="button" data-b="${b.i}">${esc(b.text)}</button>`).join('')}</div>` : ''}`;
      el.ctl.querySelectorAll('input').forEach((inp) => {
        const i = +inp.closest('[data-i]').dataset.i;
        inp.addEventListener('input', () => cmd('ctrl', { i, v: inp.value, on: inp.checked }));
        inp.addEventListener('pointerup', () => setTimeout(() => inp.blur(), 0));
      });
      el.ctl.querySelectorAll('[data-b]').forEach((b) => b.addEventListener('click', () => cmd('btn', { i: +b.dataset.b })));
    }
    for (const c of cs) {
      const row = el.ctl.querySelector(`[data-i="${c.i}"]`); if (!row) continue;
      const inp = row.querySelector('input'), t = row.querySelector('b');
      if (t) t.textContent = c.text;
      if (inp && document.activeElement !== inp && !inp.matches(':active')) { if (c.kind === 'range') inp.value = c.v; else inp.checked = c.on; }
    }
    paintTimer();
  }
  function paintTimer() {
    if (!S) return; const t = S.timer, ms = t.ms + (t.run ? Date.now() - t.at : 0);
    el.tm.textContent = fmtT(ms);
    el.tms.textContent = !t.started ? '第一次翻页时开始计时' : t.run ? '已讲' : '已暂停';
    el.tp.textContent = t.run || !t.started ? '暂停' : '继续'; el.tp.disabled = !t.started;
    const d = new Date(); el.ck.textContent = `${two(d.getHours())}:${two(d.getMinutes())}`;
  }
  el.tp.addEventListener('click', () => cmd('timer', { op: S && S.timer.run ? 'pause' : 'resume' }));
  el.tr.addEventListener('click', () => cmd('timer', { op: 'reset' }));
  el.prev.addEventListener('click', () => cmd('prev'));
  el.nx.addEventListener('click', () => cmd('next'));

  addEventListener('message', (e) => {
    const m = e.data; if (!aud || !m || m.pv !== 1 || m.sid !== SID) return;
    if (e.source !== aud && !(m.t === 'bye' && e.source === null)) return;
    lastHeard = performance.now();
    if (m.t === 'state') { S = m; if (!alive) setAlive(true); mark('firstState'); render(m); syncFrames(m); }
    else if (m.t === 'pong') { if (!alive && S) setAlive(true); }
    else if (m.t === 'step') { if (frames && !(S && S.hidden)) toFrame(frames.cur, { t: 'step', c: m.c }); }   // 观众窗口被整个盖住时动画停了，缩略图不自己往前播，只跟它实际的页拍
    else if (m.t === 'bye') setAlive(false, '观众窗口断开了（刷新或关掉了）。这里先不能翻页，免得两边对不上。回到观众窗口按 D，会重新打开讲者视图并接上当前的页。');
  });
  addEventListener('keydown', (e) => {
    const k = e.key;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const rng = e.target.closest && e.target.closest('input[type=range]');
    if (rng && !CLICKER.includes(k)) { e.stopImmediatePropagation(); return; }   // ↑ ↓ 留给滑块改数
    if (rng) rng.blur();
    e.stopImmediatePropagation();
    if (NEXT.includes(k)) { e.preventDefault(); cmd('next'); }
    else if (PREV.includes(k)) { e.preventDefault(); cmd('prev'); }
    else if (FWD.includes(k)) { e.preventDefault(); cmd('key', { k }); }
  }, true);
  addEventListener('click', (e) => { if (!e.target.closest('button,input,label,a')) e.stopImmediatePropagation(); }, true);
  addEventListener('pagehide', () => post('bye'));
  setInterval(() => {
    paintTimer();
    if (!aud) return;
    if (aud.closed) { setAlive(false, '观众窗口已经关掉了。重新打开幻灯片文件，再按 D。'); return; }
    post(S ? 'ping' : 'hello');
    if (S && alive && performance.now() - lastHeard > 3000) setAlive(false, '观众窗口没有回应（刷新了，或被浏览器冻结了）。这里先不能翻页。回到观众窗口按 D 重新连接。');
  }, 1000);
  D.start = async () => {
    D.article = null; document.title = '讲者视图 · ' + document.title;
    document.body.append(box);
    try { await document.fonts.ready; } catch (e) {}
    if (aud) post('hello');
    mark('ui'); window.__ready = true;
  };
})();
