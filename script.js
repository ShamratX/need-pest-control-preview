(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* Header shadow once the page scrolls */
  const bar = $('#top-bar');
  const onScroll = () => bar.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu: a full-viewport overlay (see .nav in styles.css), so it never has to be
     measured against or lined up with the real header's current height/scroll state. While
     it's open the background is locked in place (instead of just left scrollable underneath
     a fixed panel) so a scroll position carried over from before the menu opened — including
     one restored by the browser on reload — can't leave the page and the panel disagreeing
     about where the top of the viewport is. */
  const menuBtn = $('.menu-btn');
  const navClose = $('.nav__close');
  const nav = $('#site-nav');
  let lockedScrollY = 0;
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
    if (open) {
      lockedScrollY = window.scrollY;
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.classList.add('menu-open');
      navClose.focus();
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.top = '';
      window.scrollTo(0, lockedScrollY);
    }
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  navClose.addEventListener('click', () => { setMenu(false); menuBtn.focus(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* Services dropdown button (hover/focus also opens it on desktop) */
  $$('.nav__drop-btn').forEach((btn) => {
    const item = btn.closest('.nav__item--drop');
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* Scroll reveals. Every card pops in with a stagger; the classes are removed afterwards
     so hover and tilt transitions run without the reveal delay. Added by JS so content shows without it. */
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('is-in');
        io.unobserve(el);
        const wait = 1000 + parseFloat(el.style.getPropertyValue('--d') || 0) * 1000;
        setTimeout(() => { el.classList.remove('reveal', 'reveal--card', 'is-in'); el.style.removeProperty('--d'); }, wait);
      });
    }, { rootMargin: '0px', threshold: 0 });
    const add = (el, delay = 0, card = false) => {
      el.classList.add('reveal');
      if (card) el.classList.add('reveal--card');
      el.style.setProperty('--d', delay.toFixed(2) + 's');
      io.observe(el);
    };
    $$('.sec-head, .about__media, .about__copy, .why__copy, .estimate__inner, .faq__grid > div:first-child, .reviews__head > div:first-child, .svc__figure').forEach((el) => add(el));
    // single cards
    $$('.quote-card, .g-card, .tips, .svc__cta, .g-reviews-slider').forEach((el) => add(el, 0.1, true));
    // card groups: stagger by column so each row cascades left to right
    const groups = { '.cards': 3, '.areas': 3, '.value-grid': 3, '.crew-grid': 3, '.year': 4, '.trust__bar': 4, '.foot__panel': 3, '.steps': 5, '.contact-cards': 1, '.svc__steps': 1, '.svc__side': 1, '.faq__list': 1, '.features': 1 };
    Object.entries(groups).forEach(([sel, cols]) => {
      $$(sel).forEach((group) => [...group.children].forEach((el, i) => add(el, (i % cols) * 0.1 + (cols === 1 ? Math.min(i, 5) * 0.06 : 0), true)));
    });
  }

  /* Pointer tilt for the main cards (mouse devices only). Sets --rx/--ry/--mx/--my; CSS does the rest. */
  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.card, .area, .season, .value, .crew-card, .g-card, .contact-cards li, .side-card').forEach((card) => {
      card.classList.add('tilt');
      let frame = 0;
      card.addEventListener('pointermove', (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      });
    });
  }

  /* Seasons: mark the current one */
  const month = new Date().getMonth() + 1;
  $$('.season').forEach((season) => {
    if (!season.dataset.months.split(',').map(Number).includes(month)) return;
    season.classList.add('is-now');
    const badge = document.createElement('span');
    badge.className = 'season__now';
    badge.textContent = 'Now';
    $('.season__name', season).append(badge);
  });

  /* Mobile call bar: show after the first section, hide over the form */
  const callbar = $('.callbar');
  const first = $('main > section');
  const formArea = $('#quote');
  if (callbar && first && hasIO) {
    let pastTop = false;
    let atForm = false;
    const update = () => callbar.classList.toggle('is-visible', pastTop && !atForm);
    new IntersectionObserver(([e]) => { pastTop = !e.isIntersecting; update(); }).observe(first);
    if (formArea) new IntersectionObserver(([e]) => { atForm = e.isIntersecting; update(); }).observe(formArea);
  }

  /* Contact form */
  const form = $('#contact-form');
  if (form) {
    const status = $('#form-status');
    const pestSelect = $('#f-pest');
    const rules = {
      name: (v) => (v.trim() ? '' : 'Enter your name.'),
      phone: (v) => (v.replace(/\D/g, '').length >= 10 ? '' : 'Enter a phone number with area code, like 226 600 5597.'),
      email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter an email like name@example.com, or leave it blank.'),
      pest: (v) => (v ? '' : 'Choose the problem, or pick “Not sure”.'),
    };
    const check = (field) => {
      const rule = rules[field.name];
      if (!rule) return true;
      const msg = rule(field.value);
      const err = document.getElementById(`${field.id}-err`);
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) field.setAttribute('aria-describedby', err.id); else field.removeAttribute('aria-describedby');
      err.textContent = msg;
      return !msg;
    };
    const setStatus = (msg, ok) => { status.textContent = msg; status.className = `form__status ${ok ? 'is-ok' : 'is-err'}`; };

    // Service pages link here with ?pest=...; pre-select it
    const wanted = new URLSearchParams(location.search).get('pest');
    if (wanted && [...pestSelect.options].some((o) => o.value === wanted || o.text === wanted)) {
      pestSelect.value = wanted;
      const field = pestSelect.closest('.field');
      field.classList.add('is-flash');
    }

    form.addEventListener('focusout', (e) => { if (e.target.name in rules && e.target.value) check(e.target); });
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const invalid = $$('input, select, textarea', form).filter((f) => !check(f));
      if (invalid.length) { invalid[0].focus(); setStatus('Check the highlighted fields.', false); return; }

      // Posts to the CMS worker's /api/contact (backend/worker). Field names are the ones
      // its validator expects; `service` must be one of its ALLOWED_SERVICES, which match
      // the options in this form's select.
      const endpoint = form.dataset.endpoint;
      if (!endpoint) { setStatus('Online requests aren’t connected yet. Please call (226) 600-5597.', false); return; }

      const f = new FormData(form);
      const payload = {
        clientName: (f.get('name') || '').trim(),
        phone: (f.get('phone') || '').trim(),
        email: (f.get('email') || '').trim(),
        service: f.get('pest') || '',
        message: (f.get('message') || '').trim(),
      };

      form.classList.add('is-sending');
      setStatus('Sending…', true);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.ok === false) throw new Error(out.message || String(res.status));
        form.reset();
        setStatus('Request sent. We’ll call you back soon.', true);
      } catch (err) {
        setStatus(`${err.message && err.message.length < 120 ? err.message : 'Your request didn’t go through.'} Please call (226) 600-5597.`, false);
      } finally {
        form.classList.remove('is-sending');
      }
    });
  }

  /* Back to top: the header is sticky, so an anchor to it cannot scroll; scroll the window instead */
  const totop = $('.totop');
  if (totop) {
    totop.addEventListener('click', (e) => {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      $('.brand').focus({ preventScroll: true });
    });
  }

  // Before/after slider: the native range input handles mouse, touch and keyboard; JS only moves the split
  $$('[data-ba]').forEach((box) => {
    const frame = $('.ba__frame', box), range = $('.ba__range', box);
    const set = () => frame.style.setProperty('--p', range.value + '%');
    range.addEventListener('input', set);
    set();
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
