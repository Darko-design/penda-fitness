/* Penda.fitness · interakcije sajta */
(() => {
  'use strict';

  /* forma se šalje preko Web3Forms; ključ određuje na koji email stižu prijave
     (ključ je za stefanpenda1998@gmail.com; za drugi email napravi novi ključ na web3forms.com
     i zameni ga ovde i u skrivenom polju access_key u index.html) */
  const FORM_ENDPOINT = 'https://api.web3forms.com/submit';
  const FORM_KEY = '80515ad9-f5cb-414f-ad50-5569be4d9a0a';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('reduce');
  const isDesk = () => innerWidth >= 1024;

  const onResize = [];
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => onResize.forEach((f) => f()), 120); });

  /* ---------------- header + mobile menu ---------------- */
  const hdr = $('#hdr');
  const burger = $('.burger');
  const menu = $('#meni');
  let lastY = scrollY;
  const menuOpen = () => document.body.classList.contains('menu-open');

  function onScrollHeader() {
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 24);
    if (!menuOpen()) hdr.classList.toggle('is-hidden', y > lastY + 2 && y > 480);
    if (y < lastY - 2) hdr.classList.remove('is-hidden');
    lastY = y;
  }
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    if (open) {
      hdr.classList.remove('is-hidden');
      const first = $('a', menu);
      if (first) first.focus({ preventScroll: true });
    }
  }
  burger.addEventListener('click', () => setMenu(!menuOpen()));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  onResize.push(() => { if (isDesk() && menuOpen()) setMenu(false); });

  /* ---------------- problem: petlja ---------------- */
  const loop = $('[data-loop]');
  function arrow(dir, x, y, col) {
    const d = {
      r: `M${x - 3.5} ${y - 6}L${x + 3.5} ${y}L${x - 3.5} ${y + 6}`,
      l: `M${x + 3.5} ${y - 6}L${x - 3.5} ${y}L${x + 3.5} ${y + 6}`,
      d: `M${x - 6} ${y - 3.5}L${x} ${y + 3.5}L${x + 6} ${y - 3.5}`,
      u: `M${x - 6} ${y + 3.5}L${x} ${y - 3.5}L${x + 6} ${y + 3.5}`,
    }[dir];
    return `<path d="${d}" stroke="${col}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }
  function drawLoop() {
    if (!loop) return;
    const svg = $('.loop__svg', loop);
    const again = $('.loop__again', loop);
    const R = loop.getBoundingClientRect();
    const pts = $$('.loop__num', loop).map((n) => {
      const r = n.getBoundingClientRect();
      return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 };
    });
    if (pts.length < 2) return;
    const W = R.width, H = R.height;
    const A = '#8FA6F0', B = '#3A5BEE';
    let d, arrows = [];
    if (isDesk()) {
      const top = pts[0].y, bot = H - 16, L = -24, Rx = W + 24, r = 24;
      d = `M${pts[0].x} ${top}H${Rx - r}Q${Rx} ${top} ${Rx} ${top + r}V${bot - r}Q${Rx} ${bot} ${Rx - r} ${bot}H${L + r}Q${L} ${bot} ${L} ${bot - r}V${top + r}Q${L} ${top} ${L + r} ${top}H${pts[0].x}`;
      for (let i = 0; i < pts.length - 1; i++) arrows.push(arrow('r', (pts[i].x + pts[i + 1].x) / 2, top, A));
      arrows.push(arrow('d', Rx, (top + bot) / 2, A));
      arrows.push(arrow('l', W * 0.28, bot, B), arrow('l', W * 0.79, bot, B));
      arrows.push(arrow('u', L, (top + bot) / 2, B));
      again.style.top = '';
    } else {
      const x = pts[0].x, rx = x - 24, t = pts[0].y, b = pts[pts.length - 1].y;
      d = `M${x} ${t}V${b}H${rx + 8}Q${rx} ${b} ${rx} ${b - 8}V${t + 8}Q${rx} ${t} ${rx + 8} ${t}H${x}`;
      for (let i = 0; i < pts.length - 1; i++) arrows.push(arrow('d', x, (pts[i].y + pts[i + 1].y) / 2, A));
      arrows.push(arrow('u', rx, t + (b - t) * 0.22, B), arrow('u', rx, t + (b - t) * 0.82, B));
      again.style.top = `${(t + b) / 2}px`;
    }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<path d="${d}" stroke="rgba(143,166,240,0.28)" stroke-width="1.5" fill="none"/>`
      + `<path class="flow" d="${d}" stroke="#3A5BEE" stroke-width="2" stroke-dasharray="10 14" stroke-linecap="round" fill="none"/>` + arrows.join('');
  }

  /* ---------------- rešenje: uspon ---------------- */
  const rs = $('.rs');
  function drawPath() {
    if (!rs || innerWidth < 1200) return;
    const svg = $('.path__svg', rs);
    const R = rs.getBoundingClientRect();
    const c = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2 }; };
    const [a, b, k] = $$('.rstep__ic', rs).map(c);
    const e = c($('.path__node--end', rs));
    const W = R.width, H = R.height, t1 = W * 0.3301, t2 = W * 0.6699, q = 16;
    const start = `M56 ${H - 8}H28Q0 ${H - 8} 0 ${H - 36}V${H - 92}Q0 ${H - 120} 28 ${H - 120}H84Q112 ${H - 120} 112 ${H - 92}V${a.y - 16}Q112 ${a.y} 128 ${a.y}`;
    const main = `M128 ${a.y}H${t1 - q}Q${t1} ${a.y} ${t1} ${a.y - q}V${b.y + q}Q${t1} ${b.y} ${t1 + q} ${b.y}H${t2 - q}Q${t2} ${b.y} ${t2} ${b.y - q}V${k.y + q}Q${t2} ${k.y} ${t2 + q} ${k.y}H${e.x - 24}`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<path class="flow" d="${start}" stroke="#8FA6F0" stroke-opacity=".6" stroke-width="2" stroke-dasharray="10 14" stroke-linecap="round" fill="none"/>`
      + `<path d="${main}" stroke="#3A5BEE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }

  /* ---------------- proces: korak po korak ----------------
     desktop: sekcija se zaustavlja, skrol otvara sledeći korak i nova fotografija izlazi preko prethodne
     telefon: kartice koje se prevlače, sa tačkama ispod */
  const proc = $('[data-proces]');
  if (proc) {
    const items = $$('.proces__item', proc);
    const shots = $$('.proces__shot', proc);
    const list = $('.proces__list', proc);
    const dots = $$('.proces__dots span', proc);
    const n = items.length;
    let cur = -1;
    let ticking = false;
    const run = () => proc.getBoundingClientRect().height - innerHeight;

    const frame = () => {
      ticking = false;
      if (!isDesk()) {
        if (cur !== -2) { items.forEach((li, i) => { li.classList.toggle('is-on', i === 0); li.classList.remove('is-past'); }); cur = -2; }
        return;
      }
      const p = clamp(-proc.getBoundingClientRect().top / Math.max(1, run()), 0, 1) * (n - 1);
      let idx = 0;
      shots.forEach((s, k) => {
        if (!k) return;
        const t = clamp((p - (k - 1) - 0.15) / 0.7, 0, 1);
        s.style.setProperty('--r', (1 - t).toFixed(3));
        if (t > 0.5) idx = k;
      });
      items.forEach((li, i) => li.style.setProperty('--f', clamp((p - i) / 0.85, 0, 1).toFixed(3)));
      if (idx === cur) return;
      cur = idx;
      items.forEach((li, i) => { li.classList.toggle('is-on', i === idx); li.classList.toggle('is-past', i < idx); });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true });
    onResize.push(onScroll);
    frame();

    items.forEach((li, i) => li.addEventListener('click', () => {
      if (!isDesk()) return;
      const top = scrollY + proc.getBoundingClientRect().top;
      const p = i === 0 ? 0 : i - 0.1;
      scrollTo({ top: top + run() * (p / (n - 1)), behavior: reduce ? 'auto' : 'smooth' });
    }));

    list.addEventListener('scroll', () => {
      const x = list.scrollLeft;
      let best = 0, dist = Infinity;
      items.forEach((li, i) => { const dd = Math.abs(li.offsetLeft - list.offsetLeft - x - parseFloat(getComputedStyle(list).paddingLeft)); if (dd < dist) { dist = dd; best = i; } });
      if (x + list.clientWidth >= list.scrollWidth - 4) best = n - 1;
      dots.forEach((d, i) => d.classList.toggle('on', i === best));
    }, { passive: true });
  }

  /* ---------------- transformacije: traka koja se vrti ---------------- */
  const mq = $('[data-marquee]');
  if (mq) {
    const track = $('.track', mq);
    const cur = $('.dragc', mq);
    const curIn = cur.firstElementChild;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    let x = 0, last = performance.now(), hover = false, drag = false, px = 0, raf = 0, running = false;
    const startX = () => { const w = $('.trans .wrap'); x = w ? w.getBoundingClientRect().left : 20; };
    startX();
    const period = () => (track.scrollWidth + parseFloat(getComputedStyle(track).columnGap || 0)) / 2;
    function frame(t) {
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      if (!drag && !reduce) x -= (isDesk() ? 36 : 28) * (hover ? 0.35 : 1) * dt;
      const p = period();
      if (p > 0) { while (x <= -p) x += p; while (x > 0) x -= p; }
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(frame);
    }
    const run = (on) => {
      if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      if (!on && running) { running = false; cancelAnimationFrame(raf); }
    };
    new IntersectionObserver(([en]) => run(en.isIntersecting), { rootMargin: '100px' }).observe(mq);
    const place = (e) => {
      const r = mq.getBoundingClientRect();
      cur.style.transform = `translate(${e.clientX - r.left - 40}px, ${e.clientY - r.top - 40}px)`;
    };
    mq.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; if (fine) { cur.style.opacity = '1'; place(e); } } });
    mq.addEventListener('pointerleave', () => { hover = false; drag = false; mq.classList.remove('is-drag'); cur.style.opacity = '0'; curIn.style.transform = ''; });
    mq.addEventListener('pointermove', (e) => {
      if (fine && e.pointerType === 'mouse') place(e);
      if (drag) { x += e.clientX - px; px = e.clientX; }
    });
    mq.addEventListener('pointerdown', (e) => {
      drag = true; px = e.clientX; mq.classList.add('is-drag');
      try { mq.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      curIn.style.transform = 'scale(0.86)';
    });
    const up = () => { drag = false; mq.classList.remove('is-drag'); curIn.style.transform = ''; };
    mq.addEventListener('pointerup', up);
    mq.addEventListener('pointercancel', up);
    mq.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ---------------- iskustva: zid poruka koji se ispisuje na skrol ---------------- */
  const pin = $('[data-pin]');
  const lb = $('#lb');
  if (pin) {
    const sticky = $('.pin__sticky', pin);
    const zone = $('.zone', pin);
    const shots = $$('.shot', zone);
    const STARTS = { 4: [0, 56, 20, 84], 3: [0, 56, 28], 2: [0, 48] };
    let n = 0, cols = [];
    const count = () => (innerWidth >= 1024 ? 4 : innerWidth >= 640 ? 3 : 2);
    function build() {
      const want = count();
      if (want === n) return;
      n = want;
      const per = Math.ceil(shots.length / n);
      zone.innerHTML = '';
      cols = [];
      for (let c = 0; c < n; c++) {
        const col = document.createElement('div');
        col.className = 'col';
        const inner = document.createElement('div');
        inner.className = 'col__in';
        shots.slice(c * per, (c + 1) * per).forEach((s) => inner.appendChild(s));
        col.appendChild(inner);
        zone.appendChild(col);
        cols.push(inner);
      }
    }
    function sync() {
      if (reduce) { shots.forEach((s) => s.classList.add('is-in')); return; }
      const zh = sticky.clientHeight;
      const starts = STARTS[n];
      const tallest = Math.max(...cols.map((c, i) => c.offsetHeight + starts[i]));
      const want = Math.max(zh, tallest);
      if (Math.abs(pin.offsetHeight - want) > 1) pin.style.height = `${want}px`;
      const top = parseFloat(getComputedStyle(sticky).top) || 0;
      const travel = pin.offsetHeight - zh;
      const p = travel > 0 ? clamp((top - pin.getBoundingClientRect().top) / travel, 0, 1) : 0;
      cols.forEach((c, i) => {
        const end = Math.min(starts[i], zh - c.offsetHeight);
        c.style.transform = `translate3d(0,${(starts[i] + p * (end - starts[i])).toFixed(1)}px,0)`;
      });
      const zr = zone.getBoundingClientRect();
      if (zr.top < innerHeight - 60) {
        const limit = Math.min(zr.bottom, innerHeight) - 32;
        let k = 0;
        shots.forEach((s) => {
          if (s.classList.contains('is-in')) return;
          if (s.getBoundingClientRect().top < limit) { s.style.transitionDelay = `${k * 90}ms`; s.classList.add('is-in'); k++; }
        });
      }
    }
    build();
    let sRaf = 0;
    addEventListener('scroll', () => { cancelAnimationFrame(sRaf); sRaf = requestAnimationFrame(sync); }, { passive: true });
    onResize.push(() => { build(); sync(); });
    addEventListener('load', sync);
    sync();

    /* uvećanje: screenshot poruke ili video utisak (sa zvukom) */
    const box = $('.lb__box', lb);
    const closeBtn = $('.lb__x', lb);
    let lastFocus = null;
    const clearBox = () => {
      $$('video', box).forEach((v) => { v.pause(); v.removeAttribute('src'); v.load(); });
      $$('.shot, video', box).forEach((s) => s.remove());
    };
    const openLb = (card) => {
      clearBox();
      const [w, h] = (card.style.aspectRatio || '9/16').split('/').map(Number);
      const r = w / h;
      const bw = Math.min(innerWidth - 48, (innerHeight - 96) * r, r >= 1 ? 760 : 420);
      box.style.width = `${Math.round(bw)}px`;
      box.style.aspectRatio = `${w} / ${h}`;
      const img = $('img', card);
      if (card.dataset.video) {
        const v = document.createElement('video');
        v.className = 'lb__video';
        v.src = card.dataset.video;
        v.poster = img.currentSrc || img.src;
        v.controls = true;
        v.playsInline = true;
        box.appendChild(v);
        v.play().catch(() => {});
      } else {
        const big = document.createElement('div');
        big.className = 'shot is-in';
        const copy = img.cloneNode();
        copy.loading = 'eager';
        big.appendChild(copy);
        box.appendChild(big);
      }
      lastFocus = card;
      lb.classList.add('is-open');
      closeBtn.focus();
    };
    const closeLb = () => {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open');
      clearBox();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    zone.addEventListener('click', (e) => { const s = e.target.closest('.shot'); if (s) openLb(s); });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb__x')) closeLb(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen()) { setMenu(false); burger.focus(); } });

  /* ---------------- faq: razgovor sa Stefanom ---------------- */
  const chips = $$('.chip');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const id = `qa${chip.dataset.q}`;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    $$('.qa').forEach((qa) => {
      if (qa.id === id) {
        const fresh = qa.cloneNode(true);
        fresh.hidden = false;
        qa.replaceWith(fresh);
      } else {
        qa.hidden = true;
      }
    });
    if (!isDesk()) chip.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  }));
  /* telefon: pitanja se prevlače, tačke pokazuju gde si */
  const chipRow = $('.chips');
  const chipDots = $$('.chips__dots i');
  if (chipRow && chipDots.length) chipRow.addEventListener('scroll', () => {
    const x = chipRow.scrollLeft;
    let best = 0, dist = Infinity;
    chips.forEach((c, i) => { const d = Math.abs(c.offsetLeft - chipRow.offsetLeft - x - parseFloat(getComputedStyle(chipRow).paddingLeft)); if (d < dist) { dist = d; best = i; } });
    if (x + chipRow.clientWidth >= chipRow.scrollWidth - 4) best = chips.length - 1;
    chipDots.forEach((d, i) => d.classList.toggle('on', i === best));
  }, { passive: true });

  /* ---------------- pojavljivanje uvoda sekcija: jedan stil za ceo sajt, jednom ---------------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      seen.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('main section .head, main section .lead, .resenje__top > p, .prijava__intro').forEach((el) => {
      if (!el.classList.contains('head')) el.style.transitionDelay = '.08s';
      el.classList.add('rv');
      seen.observe(el);
    });
    const hint = $('.chips__hint');
    if (hint) seen.observe(hint);
  }

  /* ---------------- ponuda: dugme unapred označava ponudu za dvoje ---------------- */
  const duoBtn = $('[data-duo]');
  const duoBox = $('input[name="ponuda_za_dvoje"]');
  if (duoBtn && duoBox) duoBtn.addEventListener('click', () => { duoBox.checked = true; });

  /* ---------------- prijava: mapa ---------------- */
  const map = $('[data-map]');
  function placeMap() {
    if (!map) return;
    const W = map.clientWidth, H = map.clientHeight;
    let px, py;
    if (isDesk()) { px = Math.max(150, W - 388); py = Math.round(H * 0.3); }
    else if (W >= 640) { px = Math.round(W * 0.32); py = Math.round(H * 0.36); }
    else { px = 72; py = 168; }
    map.style.setProperty('--px', `${px}px`);
    map.style.setProperty('--py', `${py}px`);
    const canvas = $('.map__canvas', map);
    const S = 2 * Math.max(px, W - px, py, H - py) + 40;
    Object.assign(canvas.style, { width: `${S}px`, height: `${S}px`, left: `${px - S / 2}px`, top: `${py - S / 2}px` });
  }

  /* ---------------- prijava: forma ---------------- */
  const form = $('#forma');
  if (form) {
    const done = $('.done', form.parentElement);
    const errBox = $('.f-error', form);
    const btn = $('.f-submit', form);
    const btnT = $('.f-submit__t', form);
    const MSG = {
      ime: 'Upiši ime i prezime.',
      telefon: 'Upiši broj telefona.',
      email: 'Email adresa nije ispravna.',
    };
    const setErr = (input, msg) => {
      const fld = input.closest('.fld');
      let el = $('.fld__err', fld);
      if (msg) {
        if (!el) { el = document.createElement('span'); el.className = 'fld__err'; el.id = `err-${input.name}`; fld.appendChild(el); }
        el.textContent = msg;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', el.id);
      } else {
        if (el) el.remove();
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    };
    const check = (input) => {
      const v = input.value.trim();
      if (input.name === 'ime') return v.length >= 2 ? '' : MSG.ime;
      if (input.name === 'telefon') return v.replace(/[^\d]/g, '').length >= 6 ? '' : MSG.telefon;
      if (input.name === 'email') return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : MSG.email;
      return '';
    };
    const fields = ['ime', 'telefon', 'email'].map((nm) => form.elements[nm]);
    fields.forEach((f) => {
      f.addEventListener('blur', () => { if (f.value || f.hasAttribute('aria-invalid')) setErr(f, check(f)); });
      f.addEventListener('input', () => { if (f.hasAttribute('aria-invalid')) setErr(f, check(f)); });
    });
    /* poruka počinje u jednom redu i raste dok se kuca (gde browser to ne radi sam) */
    const msg = form.elements.poruka;
    if (msg && !(window.CSS && CSS.supports('field-sizing', 'content'))) {
      msg.addEventListener('input', () => { msg.style.height = 'auto'; msg.style.height = `${Math.min(msg.scrollHeight + 2, 160)}px`; });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.hidden = true;
      let firstBad = null;
      fields.forEach((f) => { const m = check(f); setErr(f, m); if (m && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); return; }

      const fd = new FormData(form);
      const pomoc = fd.getAll('pomoc');
      const nacin = fd.getAll('nacin');
      const payload = {
        access_key: FORM_KEY,
        subject: fd.get('subject'),
        from_name: 'Penda.fitness sajt',
        botcheck: fd.get('botcheck') || '',
        'Ime i prezime': fd.get('ime').trim(),
        'Broj telefona': fd.get('telefon').trim(),
        Email: (fd.get('email') || '').trim() || 'nije upisan',
        'Način treninga': nacin.length ? nacin.join(', ') : 'nije izabrano',
        'Potrebna pomoć': pomoc.length ? pomoc.join(', ') : 'nije izabrano',
        'Ponuda za dvoje': fd.get('ponuda_za_dvoje') ? 'Da, dovodi prijatelja, partnera ili člana porodice' : 'Ne',
        Poruka: (fd.get('poruka') || '').trim() || 'bez poruke',
      };
      if (payload.Email !== 'nije upisan') payload.replyto = payload.Email;

      if (payload.botcheck) { showDone(); return; }
      delete payload.botcheck;
      btn.disabled = true;
      btnT.textContent = 'Šaljem…';
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
        showDone();
      } catch (err) {
        errBox.innerHTML = 'Slanje nije uspelo. Pokušaj ponovo ili me pozovi na <a href="tel:+381666661151">066 666 1151</a>.';
        errBox.hidden = false;
      } finally {
        btn.disabled = false;
        btnT.textContent = 'Pošalji prijavu';
      }
    });

    function showDone() {
      const h = form.offsetHeight;
      form.hidden = true;
      done.hidden = false;
      done.style.minHeight = isDesk() ? `${h}px` : '';
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
    $('[data-reset]', done).addEventListener('click', () => {
      form.reset();
      if (msg) msg.style.height = '';
      fields.forEach((f) => setErr(f, ''));
      done.hidden = true;
      form.hidden = false;
      form.elements.ime.focus();
    });
  }

  /* ---------------- crtanje i preračunavanje ---------------- */
  const redraw = () => { drawLoop(); drawPath(); placeMap(); };
  onResize.push(redraw);
  redraw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  addEventListener('load', redraw);
})();
