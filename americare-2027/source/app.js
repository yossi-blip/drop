(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const slot = $('#toast-slot');
    if (!slot) return;
    slot.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    slot.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 4600);
  }

  /* ---------------- router ---------------- */
  const ROUTES = {};
  $$('.route').forEach((r) => { ROUTES[r.dataset.route] = r; });
  const NAV_OF = {
    care: 'care', 'skilled-nursing': 'care', 'home-health-aides': 'care', 'health-management': 'care',
    'behavioral-health': 'care', nhtd: 'care', therapy: 'therapy', amerikids: 'amerikids',
    attencia: 'attencia', locations: 'locations', about: 'about'
  };
  const NO_PREFOOTER = new Set(['home', 'get-care', 'refer', 'careers', 'contact', 'intake-desk']);
  let current = null;
  let pending = { prefill: null, subject: null };

  function show(name) {
    if (!ROUTES[name]) name = 'home';
    if (current === name) { window.scrollTo(0, 0); return; }
    Object.keys(ROUTES).forEach((k) => { ROUTES[k].hidden = k !== name; });
    const el = ROUTES[name];
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    current = name;
    document.title = (el.dataset.title ? el.dataset.title + ' — ' : '') + 'Americare';
    const nav = NAV_OF[name];
    $$('.nav-a').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === nav));
    const pf = $('#prefooter'); if (pf) pf.hidden = NO_PREFOOTER.has(name);
    closeMenu();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    window.scrollTo(0, 0);
    observeReveals(document);
    document.dispatchEvent(new CustomEvent('route', { detail: name }));
    if (name === 'get-care') applyPrefill();
    if (name === 'refer' && pending.refer) { const r = pending.refer; pending.refer = null; window.AC.lastReferSource = r.source || ''; const ra = $('#rf-reason'); if (ra && r.reason) ra.value = r.reason; (r.services || []).forEach((id) => { const m = { skilled: 'RN', therapy: 'PT', hha: 'HHA' }[id]; if (m) setChip('rf-svc', m); }); toast('We carried your note into the referral. Review the clinical section.'); }
    if (name === 'contact' && pending.subject) {
      const sel = $('#ct-subject'); if (sel) { sel.value = pending.subject; sel.dispatchEvent(new Event('change')); }
      pending.subject = null;
    }
  }
  function routeFromHash() {
    const h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    return h || 'home';
  }
  window.addEventListener('hashchange', () => {
    const h = routeFromHash();
    if (!ROUTES[h] && document.getElementById(h)) { document.getElementById(h).scrollIntoView({ behavior: 'smooth' }); return; }
    show(h);
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const h = a.getAttribute('href').slice(1);
    if (a.dataset.subject) pending.subject = a.dataset.subject;
    if (a.dataset.scrollHome) { e.preventDefault(); closeMenu(); go('home'); setTimeout(() => { const n = $('#nv-text'); if (n) { n.scrollIntoView({ behavior: 'smooth', block: 'center' }); n.focus({ preventScroll: true }); } }, 80); return; }
    if (h === 'routes') { e.preventDefault(); const m = $('#routes'); m.setAttribute('tabindex', '-1'); m.focus(); return; }
    if (h === current) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); closeMenu(); }
  });
  function go(name) { if (location.hash.slice(1) === name) show(name); else location.hash = name; }

  /* ---------------- header: mobile menu, language ---------------- */
  const menuBtn = $('#menu-btn'), mnav = $('#mnav');
  function closeMenu() {
    if (!mnav) return;
    mnav.hidden = true;
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
  }
  if (menuBtn) menuBtn.addEventListener('click', () => {
    const open = mnav.hidden;
    mnav.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  const langBtn = $('#lang-btn'), langMenu = $('#lang-menu');
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.hidden = !langMenu.hidden;
      langBtn.setAttribute('aria-expanded', String(!langMenu.hidden));
    });
    $$('button[data-lang]', langMenu).forEach((b) => b.addEventListener('click', () => { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('click', (e) => { if (!langMenu.hidden && !e.target.closest('.lang')) { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (langMenu) langMenu.hidden = true; closeMenu(); }
  });

  /* ---------------- reveal on scroll (visible at rest; adds a lift) ---------------- */
  let io = null;
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
  }
  function observeReveals(root) {
    if (!io) return;
    $$('.reveal:not(.in), .draw-line:not(.in)', root).forEach((el) => {
      if (el.offsetParent !== null || el.tagName === 'path') io.observe(el);
    });
  }

  /* ---------------- tabs ---------------- */
  $$('[data-tabs]').forEach((group) => {
    const btns = $$('[data-tab]', group), panels = $$('[data-panel]', group);
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
      panels.forEach((p) => { const on = p.dataset.panel === b.dataset.tab; p.hidden = !on; if (on) { p.classList.remove('panel-in'); void p.offsetWidth; p.classList.add('panel-in'); } });
    }));
  });

  /* ---------------- FAQ accordions ---------------- */
  $$('.faq-q').forEach((q) => {
    q.classList.toggle('open', q.getAttribute('aria-expanded') === 'true');
    q.addEventListener('click', () => {
      const a = document.getElementById(q.getAttribute('aria-controls'));
      const open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', String(open));
      q.classList.toggle('open', open);
      if (a) a.hidden = !open;
    });
  });

  /* ---------------- chip groups that write a hidden value ---------------- */
  $$('[data-chips]').forEach((group) => {
    const multi = group.hasAttribute('data-multi');
    const input = document.getElementById(group.dataset.chips);
    $$('button[data-val]', group).forEach((b) => b.addEventListener('click', () => {
      if (multi) {
        b.classList.toggle('on');
        b.setAttribute('aria-pressed', String(b.classList.contains('on')));
      } else {
        $$('button[data-val]', group).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      }
      if (input) input.value = $$('button.on', group).map((x) => x.dataset.val).join(', ');
      group.classList.remove('err');
      const msg = group.parentElement.querySelector('.chips-err'); if (msg) msg.hidden = true;
    }));
  });
  function setChip(groupId, val) {
    const group = $('[data-chips="' + groupId + '"]');
    if (!group) return;
    const b = $('button[data-val="' + val + '"]', group);
    if (b && !b.classList.contains('on')) b.click();
  }
  function applyPrefill() {
    const p = pending.prefill;
    if (!p) return;
    const needLabel = p.need && p.need.length > 12 ? p.need : { discharge: 'Coming home from the hospital', daily: 'Help with daily living', recovery: 'Recovering from surgery or a fall', chronic: 'Managing a chronic condition', memory: 'Memory or behavioral health', develop: 'A child with developmental needs' }[p.need];
    const whoLabel = { parent: 'My parent', spouse: 'My spouse or partner', me: 'Myself', child: 'My child' }[p.who] || p.who;
    if (whoLabel) setChip('gc-who', whoLabel);
    if (needLabel) setChip('gc-need', needLabel);
    if (p.zip && $('#gc-zip')) $('#gc-zip').value = p.zip;
    if (p.text && $('#gc-msg')) $('#gc-msg').value = p.text + (p.services && p.services.length ? '\n\nNavigator suggested: ' + p.services.join(', ') : '');
    window.AC.lastSource = p.source || '';
    pending.prefill = null;
    toast('We carried over what you told us. Nothing is sent until the last step.');
  }

  /* ---------------- multi-step forms ---------------- */
  function validate(scope) {
    let ok = true;
    $$('input, select, textarea', scope).forEach((f) => {
      if (f.type === 'hidden' || f.disabled || f.closest('[hidden]')) return;
      const bad = (f.required && !String(f.value).trim()) || (f.value && !f.checkValidity());
      f.classList.toggle('err', !!bad);
      if (f.type === 'file') { const l = document.querySelector('label[for="' + f.id + '"]'); if (l) l.classList.toggle('err', !!bad); }
      if (bad) ok = false;
    });
    $$('[data-chips][data-required]', scope).forEach((g) => {
      if (g.closest('[hidden]')) return;
      const input = document.getElementById(g.dataset.chips);
      const bad = !input || !input.value;
      const msg = g.parentElement.querySelector('.chips-err');
      if (msg) msg.hidden = !bad;
      if (bad) ok = false;
    });
    $$('input[type="checkbox"][required]', scope).forEach((c) => { if (!c.checked) { ok = false; c.closest('.check') && c.closest('.check').classList.add('err'); } });
    const m = $('.step-msg', scope);
    if (m) m.hidden = ok;
    if (!ok) { const first = $('.err', scope); if (first && first.focus) first.focus(); }
    return ok;
  }
  $$('input, select, textarea').forEach((f) => f.addEventListener('input', () => f.classList.remove('err')));

  $$('[data-multistep]').forEach((form) => {
    const steps = $$('[data-step]', form);
    const dots = $$('.step-dot', form);
    const label = $('.step-label', form);
    let i = 0;
    const render = () => {
      steps.forEach((s, k) => { s.hidden = k !== i; });
      dots.forEach((d, k) => d.classList.toggle('on', k <= i));
      if (label) { const nm = form.id === 'gc-form' ? window.t('gc_s' + (i + 1)) : (steps[i].dataset.name || ''); label.textContent = window.t('gc_step') + ' ' + (i + 1) + ' ' + window.t('gc_of') + ' ' + steps.length + ' · ' + nm; }
      if (form.dataset.review && i === steps.length - 1) fillReview(form);
    };
    form.addEventListener('click', (e) => {
      const next = e.target.closest('[data-next]'), back = e.target.closest('[data-back]');
      if (next) { e.preventDefault(); if (validate(steps[i])) { i = Math.min(i + 1, steps.length - 1); render(); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
      if (back) { e.preventDefault(); i = Math.max(i - 1, 0); render(); }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(steps[i])) return;
      const done = $(form.dataset.done);
      const data = Object.fromEntries(new FormData(form).entries());
      $$('[data-fill]', done).forEach((el) => { el.textContent = data[el.dataset.fill] || el.dataset.fallback || ''; });
      $$('.ref-code', done).forEach((el) => { el.textContent = form.dataset.prefix + '-' + String(Math.floor(100000 + Math.random() * 899999)); });
      document.dispatchEvent(new CustomEvent(form.id === 'gc-form' ? 'gc-submitted' : 'rf-submitted', { detail: data }));
      form.hidden = true; done.hidden = false;
      done.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    render();
    document.addEventListener('langchange', render);
  });
  function fillReview(form) {
    const box = $('.review', form);
    if (!box) return;
    document.dispatchEvent(new CustomEvent('rf-review'));
    const data = new FormData(form);
    box.innerHTML = '';
    $$('[data-review-label]', form).forEach((f) => {
      const v = data.get(f.name);
      if (!v) return;
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:12px;padding:10px 0;border-bottom:1px solid #DCE6F5;font-size:15px';
      const k = document.createElement('span'); k.style.color = '#4F5566'; k.textContent = f.dataset.reviewLabel;
      const val = document.createElement('span'); val.style.color = '#1B1F2E'; val.style.fontWeight = '500'; val.style.overflowWrap = 'anywhere'; val.textContent = typeof v === 'string' ? v : (v.name || 'File attached');
      row.append(k, val); box.appendChild(row);
    });
  }
  $$('[data-restart]').forEach((b) => b.addEventListener('click', () => {
    const form = $(b.dataset.restart); const done = b.closest('[data-done-panel]');
    form.reset(); $$('.on', form).forEach((x) => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    $$('input[type="hidden"]', form).forEach((x) => { x.value = ''; });
    done.hidden = true; form.hidden = false;
    const first = $$('[data-step]', form); first.forEach((s, k) => { s.hidden = k !== 0; });
    $$('.step-dot', form).forEach((d, k) => d.classList.toggle('on', k === 0));
    const l = $('.step-label', form); if (l) l.textContent = 'Step 1 of ' + first.length + ' · ' + (first[0].dataset.name || '');
  }));

  /* single-step forms (contact, newsletter) */
  const ct = $('#ct-form');
  if (ct) {
    const subj = $('#ct-subject'), resume = $('#ct-resume-wrap');
    const sync = () => { resume.hidden = subj.value !== 'Apply for Home Health Aide Training'; };
    subj.addEventListener('change', sync); sync();
    ct.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(ct)) return;
      $('#ct-done-name').textContent = $('#ct-first').value.trim();
      ct.hidden = true; $('#ct-done').hidden = false;
    });
  }
  const news = $('#news-form');
  if (news) news.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = $('#news'), out = $('#news-out');
    if (!f.value.trim() || !f.checkValidity()) { out.textContent = 'Enter an email address like name@example.com.'; return; }
    out.textContent = 'You’re on the list. (Prototype: nothing was sent.)';
    f.value = '';
  });

  /* file drop zones: show chosen file name */
  $$('input[type="file"]').forEach((inp) => inp.addEventListener('change', () => {
    const lab = document.getElementById(inp.id + '-name');
    if (lab) lab.textContent = inp.files && inp.files[0] ? inp.files[0].name : 'No file chosen';
  }));
  $$('.check input').forEach((c) => c.addEventListener('change', () => { const w = c.closest('.check'); w.classList.toggle('on', c.checked); w.classList.remove('err'); }));

  /* ---------------- ZIP coverage check ---------------- */
  function zipRegion(z) {
    if (!/^\d{5}$/.test(z)) return null;
    const p = +z.slice(0, 3);
    if (p >= 100 && p <= 102) return 'Manhattan';
    if (p === 103) return 'Staten Island';
    if (p === 104) return 'the Bronx';
    if (p === 112) return 'Brooklyn';
    if ([110, 111, 113, 114, 116].includes(p)) return 'Queens';
    if ([115, 117, 118, 119].includes(p)) return 'Long Island';
    if (p >= 105 && p <= 108) return 'Westchester and Putnam';
    if (p === 109) return 'Rockland and Orange';
    if (p === 125 || p === 126) return 'Dutchess';
    if (p === 127) return 'Sullivan';
    if (p === 124) return 'Ulster';
    return '';
  }
  function checkZip(inputId) {
    const inp = document.getElementById(inputId), out = document.getElementById(inputId + '-out');
    if (!inp || !out) return;
    const r = zipRegion(inp.value.trim());
    out.className = 'zip-out';
    if (r === null) { out.textContent = 'Enter a 5-digit ZIP code.'; out.classList.add('no'); return; }
    if (r) { out.textContent = 'Yes, Americare serves ' + r + '. Intake confirms coverage for your address.'; out.classList.add('ok'); }
    else { out.textContent = 'That ZIP looks outside our listed service area. Call 1-800-704-4341 and we’ll confirm.'; out.classList.add('no'); }
  }
  $$('[data-zip-check]').forEach((b) => b.addEventListener('click', () => checkZip(b.dataset.zipCheck)));
  $$('input[data-zip-input]').forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); checkZip(inp.id); } }));

  /* ---------------- filters: locations, guides ---------------- */
  $$('[data-filter-group]').forEach((group) => {
    const target = $(group.dataset.filterGroup);
    const items = $$('[data-tags]', target);
    const search = group.dataset.search ? $(group.dataset.search) : null;
    const empty = group.dataset.empty ? $(group.dataset.empty) : null;
    let tag = 'all';
    const apply = () => {
      const q = search ? search.value.trim().toLowerCase() : '';
      let n = 0;
      items.forEach((it) => {
        const okTag = tag === 'all' || it.dataset.tags.split(' ').includes(tag);
        const okQ = !q || it.textContent.toLowerCase().includes(q);
        it.hidden = !(okTag && okQ);
        if (!it.hidden) n++;
      });
      if (empty) empty.hidden = n > 0;
    };
    $$('button[data-filter]', group).forEach((b) => b.addEventListener('click', () => {
      tag = b.dataset.filter;
      $$('button[data-filter]', group).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      apply();
    }));
    if (search) search.addEventListener('input', apply);
  });

  /* ---------------- careers disciplines ---------------- */
  const DISC = {
    rn: ['Registered Nurses', 'Skilled nursing visits for adults and children: health monitoring, medication management, wound care, patient and caregiver education, and care coordination.', 'Skilled Nursing (CHHA) · Amerikids'],
    pt: ['Physical Therapists', 'Help patients rebuild strength, balance and mobility at home, from the first steps after surgery to the stairs to their front door.', 'Americare Therapy Services · Amerikids'],
    ot: ['Occupational Therapists', 'Turn everyday tasks like dressing, eating and cooking into everyday victories, adapted to each patient’s own home.', 'Americare Therapy Services · Amerikids'],
    slp: ['Speech-Language Pathologists', 'Help patients find their words, manage stuttering and swallow safely, so they can enjoy meals with the people they love.', 'Americare Therapy Services · Amerikids'],
    hha: ['Home Health Aides', 'Personal care, home assistance and companionship for patients across New York. Not certified yet? We’ll train you for free.', 'Home Health Aides · Personal Care'],
    sw: ['Medical Social Workers', 'Connect patients and families with community resources and support as their care needs change.', 'Skilled Nursing (CHHA)']
  };
  const disc = $('#disc');
  if (disc) {
    $$('button[data-disc]', disc).forEach((b) => b.addEventListener('click', () => {
      $$('button[data-disc]', disc).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const d = DISC[b.dataset.disc];
      $('#disc-title').textContent = d[0];
      $('#disc-body').textContent = d[1];
      $('#disc-where').textContent = d[2];
      $('#disc-train').hidden = b.dataset.disc !== 'hha';
      const p = $('#disc-panel'); p.classList.remove('panel-in'); void p.offsetWidth; p.classList.add('panel-in');
    }));
  }

  /* ---------------- NHTD eligibility check ---------------- */
  const elig = $('#elig');
  if (elig) {
    const out = $('#elig-out');
    const upd = () => {
      const n = $$('input[type="checkbox"]', elig).filter((c) => c.checked).length;
      out.className = 'result ' + (n === 3 ? 'ok' : 'maybe');
      out.textContent = n === 3
        ? 'You may be eligible for the NHTD Waiver Program. A service coordinator confirms eligibility, and we help with every form.'
        : 'Check all three to see if you may qualify. Not sure about one? Call 1-800-704-4341 and we’ll help you find out.';
    };
    $$('input[type="checkbox"]', elig).forEach((c) => c.addEventListener('change', upd));
    upd();
  }

  /* ---------------- testimonials (home) ---------------- */
  const QUOTES = [
    ['As my mother’s primary caregiver, I struggled to juggle her needs after her debilitating stroke with my full-time job and young kids at home. Having Americare’s compassionate nurses provide skilled care allowed mom to regain her strength and start caring for herself again.', 'S. Thompson', 'Family caregiver'],
    ['My father cherished his independence, so when he needed more assistance in his 90s, he was reluctant to accept help. But Americare’s home health aides quickly put him at ease with their friendly manner and patience.', 'James W.', 'Family caregiver'],
    ['Recovering from major surgery as a single woman with no family nearby was daunting. But Americare’s skilled nurses helped with my medications, changed bandages, and assisted me with getting to the bathroom.', 'Jessica', 'Patient'],
    ['My wife’s early onset dementia turned our golden years upside down. Americare’s specially trained staff took the time to get to know her likes and dislikes. Their gentle approach kept her calm and comforted during a difficult time.', 'M. Davis', 'Family caregiver'],
    ['When hospice care was recommended, Americare’s nurses and aides became part of our family. They kept him comfortable and let him pass peacefully at home, surrounded by loved ones and his belongings.', 'Stephanie L.', 'Family caregiver'],
    ['As my wife’s primary caregiver, I was burning out between medical appointments and household duties. Having an Americare aide stop by regularly gave me a necessary break so I could recharge.', 'M. Chen', 'Family caregiver'],
    ['At 90 years old, I cherished my independence but needed some help at home after being hospitalized. Americare’s kind nurses helped me with my medications, meal prep and light housework allowing me to recover while giving my family peace of mind.', 'Dorothy', 'Patient'],
    ['Keeping up with the daily care needs of my wheelchair bound father at home became exhausting for our family. Americare’s home health aides gave him the expert care he required while giving us an opportunity to recharge.', 'N. Rodrigez', 'Family caregiver'],
    ['As a busy single mom, I had no way to care for my elderly mother after her bad fall. With Americare’s skilled nurses stopping by, I knew mom would get the attentive care she deserved in spite of my hectic schedule.', 'Lisa Brown', 'Family caregiver'],
    ['After major surgery, my social butterfly wife felt isolated and alone at home. But Americare’s thoughtful home health aides kept her company playing cards, doing crafts and enjoying friendly conversation.', 'D. Lee', 'Family caregiver'],
    ['Their skill, attention, patience, dedication are making such an incredible difference in the healing process. They treat my parents with unsurpassed dignity and are truly vested in getting them better.', 'Penina Mezei', 'Family caregiver']
  ];
  const tq = $('#t-quote');
  if (tq) {
    let k = 0;
    const paintQ = () => {
      tq.textContent = QUOTES[k][0];
      $('#t-name').textContent = QUOTES[k][1];
      $('#t-role').textContent = QUOTES[k][2];
      $('#t-count').textContent = (k + 1) + ' of ' + QUOTES.length;
      tq.classList.remove('panel-in'); void tq.offsetWidth; tq.classList.add('panel-in');
    };
    $$('[data-t]').forEach((b) => b.addEventListener('click', () => { k = (k + (b.dataset.t === 'next' ? 1 : -1) + QUOTES.length) % QUOTES.length; paintQ(); }));
  }

  /* ---------------- in-page scroll buttons ---------------- */
  $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    const t = document.getElementById(b.dataset.scroll);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* ---------------- copy-to-clipboard for phone numbers ---------------- */
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const txt = b.dataset.copy;
    const done = () => toast('Copied ' + txt);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, () => toast(txt));
    else toast(txt);
  }));

  /* ---------------- runtime capabilities: Ask (sample) + comments ---------------- */
  const use = (n) => (window.claude && window.claude.use ? window.claude.use(n).catch(() => null) : Promise.resolve(null));
  let comments = null;
  use('comments').then((c) => { comments = c; });

  $$('[data-ask]').forEach((btn) => {
    const inp = document.getElementById(btn.dataset.ask);
    const run = () => { const q = inp.value.trim(); if (!q) { inp.focus(); return; } inp.value = ''; if (window.ASK) window.ASK.open(q); };
    btn.addEventListener('click', run);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
  });
  $$('[data-ask-q]').forEach((chip) => chip.addEventListener('click', () => { if (window.ASK) window.ASK.open(chip.dataset.askQ); }));

  const fb = $('#fb-btn');
  if (fb) fb.addEventListener('click', () => {
    const route = ROUTES[current];
    const target = (route && (route.querySelector('h1') || route)) || document.body;
    if (!comments) { toast('To leave feedback, turn on Comment mode in the bar above this page, then click anything you want to comment on.'); return; }
    comments.openComposer({ element: target }).then((r) => {
      if (!r || !r.opened) toast('Finish the comment you already have open, then try again.');
    }).catch(() => toast('Commenting isn’t available in this view. Use Comment mode in the bar above the page.'));
  });

  window.AC = { go, toast, setChip, pending, current: () => current, routes: ROUTES };

  /* ---------------- boot ---------------- */
  show(routeFromHash());
})();
