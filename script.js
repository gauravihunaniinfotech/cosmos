/* =========================================================
   Cosmo's Heating & Air Conditioning – script.js
   Vanilla JS, no dependencies.
   Sections: helpers · header/nav · scroll effects · reveal ·
   parallax · counters · gallery + lightbox · reviews · form
   ========================================================= */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: sticky state, progress bar, mobile menu ---------- */
  const header   = $('#header');
  const progress = $('#progress');
  const toTop    = $('#to-top');
  const gFloat   = $('.google-float');
  const burger   = $('#burger');
  const nav      = $('#nav');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !e.target.closest('#header')) setMenu(false);
  });

  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Active nav link (scroll-spy) ---------- */
  const navLinks = $$('.nav__link');
  const spyTargets = navLinks
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
  }
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(t => spy.observe(t));
  }

  /* ---------- Smooth-scroll (hash links) + pre-select service ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    const target = $(hash);
    if (!target) return;
    e.preventDefault();

    const svc = a.dataset.service;
    if (svc) {
      const select = $('#service');
      if (select) select.value = svc;
    }
    const offset = header.offsetHeight + 8;
    const y = target.getBoundingClientRect().top + window.scrollY - (hash === '#home' ? 0 : offset - 20);
    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', hash);
    if (hash === '#contact') setTimeout(() => { const f = $('#fname'); if (f) f.focus({ preventScroll: true }); }, 700);
  });

  /* ---------- Scroll-reveal ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Parallax + scroll-linked UI (single rAF loop) ---------- */
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const doc = document.documentElement;

    header.classList.toggle('is-stuck', y > 30);
    const max = doc.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    toTop.classList.toggle('is-on', y > 700);
    gFloat.classList.toggle('is-on', y > 600);

    if (!reduceMotion) {
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;       // off-screen
        const isHero = el.classList.contains('hero__bg');
        const shift = isHero ? y * speed : (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.translate = '0 ' + shift.toFixed(1) + 'px';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Badge: gentle pointer tilt ---------- */
  $$('[data-tilt]').forEach(el => {
    if (reduceMotion) return;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(500px) rotateX(' + (-py * 22) + 'deg) rotateY(' + (px * 22) + 'deg) scale(1.05)';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- Animated counters ---------- */
  const counters = $$('[data-count]');
  function runCounter(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = end.toFixed(dec); return; }
    const dur = 1600;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { runCounter(en.target); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  }

  /* ---------- Project gallery: arrows, drag, lightbox ---------- */
  const track = $('#g-track');
  const gPrev = $('#g-prev');
  const gNext = $('#g-next');
  const step  = () => Math.max(260, Math.round(track.clientWidth * 0.6));

  function updateArrows() {
    const maxScroll = track.scrollWidth - track.clientWidth - 4;
    gPrev.disabled = track.scrollLeft <= 4;
    gNext.disabled = track.scrollLeft >= maxScroll;
  }
  gPrev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  gNext.addEventListener('click', () => track.scrollBy({ left:  step(), behavior: 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // Drag-to-scroll with a mouse (touch already scrolls natively)
  let drag = null, moved = false;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    drag = { x: e.clientX, left: track.scrollLeft };
    moved = false;
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) { moved = true; track.classList.add('is-drag'); }
    if (moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    track.classList.remove('is-drag');
    setTimeout(() => { moved = false; }, 0);
  });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  // Lightbox
  const lb = $('#lightbox'), lbImg = $('#lb-img');
  const items = $$('.g-item', track);
  let lbIndex = 0, lastFocus = null;

  function showLb(i) {
    lbIndex = (i + items.length) % items.length;
    lbImg.src = items[lbIndex].dataset.full;
    lbImg.alt = items[lbIndex].dataset.alt || '';
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showLb(i);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('#lb-close').focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  items.forEach((btn, i) => btn.addEventListener('click', () => openLb(i)));
  $('#lb-close').addEventListener('click', closeLb);
  $('#lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
  $('#lb-next').addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    if (e.key === 'Tab') {                       // keep focus inside the dialog
      const f = $$('button', lb);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Reviews slider ----------
     Add REAL customer reviews here (copy them from Google).
     Example:
       { text: 'Paste the review text exactly as written.', name: 'First L.', rating: 5 }
     With an empty list the slider shows Cosmo's own promise instead,
     so the page never displays invented testimonials.               */
  const REVIEWS = [
    // { text: '', name: '', rating: 5 },
  ];

  const viewport = $('#review-viewport');
  const controls = $('#review-controls');
  const dots     = $('#r-dots');
  let rIndex = 0, rTimer = null;

  const starSvg = n => '<span class="stars" role="img" aria-label="' + n + ' out of 5 stars">' +
    '<svg aria-hidden="true"><use href="#i-star"/></svg>'.repeat(n) + '</span>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderSlide() {
    if (!REVIEWS.length) {
      viewport.innerHTML =
        '<figure class="slide">' +
          '<svg class="slide__q" aria-hidden="true"><use href="#i-quote"/></svg>' +
          '<p class="slide__label">Our promise</p>' +
          '<blockquote>At Cosmo’s, we treat your home like our own — honest service, transparent pricing, and year-round protection.</blockquote>' +
          '<figcaption>Cosmo’s Heating and Air Conditioning &middot; Man’s Most Reliable</figcaption>' +
        '</figure>';
      return;
    }
    const r = REVIEWS[rIndex];
    viewport.innerHTML =
      '<figure class="slide">' +
        '<svg class="slide__q" aria-hidden="true"><use href="#i-quote"/></svg>' +
        '<blockquote>“' + esc(r.text) + '”</blockquote>' +
        '<figcaption>' + starSvg(r.rating || 5) + '<span>' + esc(r.name) + ' &middot; Google review</span></figcaption>' +
      '</figure>';
    $$('button', dots).forEach((d, i) => d.setAttribute('aria-current', String(i === rIndex)));
  }

  function goReview(i) {
    rIndex = (i + REVIEWS.length) % REVIEWS.length;
    renderSlide();
  }
  function autoplay() {
    clearInterval(rTimer);
    if (REVIEWS.length > 1 && !reduceMotion) rTimer = setInterval(() => goReview(rIndex + 1), 7000);
  }

  if (REVIEWS.length > 1) {
    controls.hidden = false;
    REVIEWS.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Show review ' + (i + 1));
      b.addEventListener('click', () => { goReview(i); autoplay(); });
      dots.appendChild(b);
    });
    $('#r-prev').addEventListener('click', () => { goReview(rIndex - 1); autoplay(); });
    $('#r-next').addEventListener('click', () => { goReview(rIndex + 1); autoplay(); });
    $('#review-slider').addEventListener('mouseenter', () => clearInterval(rTimer));
    $('#review-slider').addEventListener('mouseleave', autoplay);
  }
  renderSlide();
  autoplay();

  /* ---------- Contact form ----------
     This is a static site, so there is no server to post to. On submit the
     form is validated, then opens the visitor's email app with the message
     pre-filled to service@cosmosaclv.com. To send to a form service later
     (Formspree, Netlify Forms, etc.), replace sendViaMailto() below.      */
  const form   = $('#contact-form');
  const status = $('#form-status');

  function setError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('has-error', !!msg);
    let err = $('.field__err', field);
    if (msg) {
      if (!err) {
        err = document.createElement('span');
        err.className = 'field__err';
        err.id = input.id + '-err';
        field.appendChild(err);
      }
      err.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', err.id);
    } else {
      if (err) err.remove();
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  function validate() {
    let first = null;
    const fname = $('#fname'), email = $('#email'), phone = $('#phone');
    const rules = [
      [fname, !fname.value.trim() ? 'Please enter your first name.' : ''],
      [email, !email.value.trim() ? 'Please enter your email.' :
              !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? 'Please enter a valid email address.' : ''],
      [phone, phone.value.trim() && phone.value.replace(/\D/g, '').length < 7 ? 'Please enter a valid phone number.' : '']
    ];
    rules.forEach(([el, msg]) => { setError(el, msg); if (msg && !first) first = el; });
    return first;
  }

  function sendViaMailto(data) {
    const subject = 'Free estimate request' + (data.service ? ' – ' + data.service : '');
    const body = [
      'Name: ' + data.first + ' ' + data.last,
      'Email: ' + data.email,
      'Phone: ' + (data.phone || '—'),
      'Interested service: ' + (data.service || '—'),
      '',
      data.message || ''
    ].join('\n');
    window.location.href = 'mailto:service@cosmosaclv.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    status.className = 'form__status';
    const bad = validate();
    if (bad) {
      status.textContent = 'Please fix the highlighted fields.';
      status.classList.add('is-err');
      bad.focus();
      return;
    }
    const fd = Object.fromEntries(new FormData(form).entries());
    sendViaMailto(fd);
    status.textContent = 'Thanks, ' + fd.first + '! Your email app is opening with your request. You can also call us at +1 (702) 960-5555.';
    status.classList.add('is-ok');
  });
  form.addEventListener('input', e => {
    if (e.target.closest('.field.has-error')) setError(e.target, '');
  });
})();
