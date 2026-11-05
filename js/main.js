/* Cosmo's Heating & Air — interactions */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Image slots: show a tasteful placeholder until the real image exists ---------- */
  $$('.img-slot').forEach(slot => {
    const img = $('img', slot);
    if (!img) return;
    const check = () => slot.classList.toggle('empty', !(img.complete && img.naturalWidth > 0));
    img.addEventListener('error', () => slot.classList.add('empty'));
    img.addEventListener('load', () => slot.classList.remove('empty'));
    if (img.complete) check();
  });

  /* ---------- Theme toggle (light default, remembers choice) ---------- */
  const root = document.documentElement, tt = $('#themeToggle');
  const isLight = () => root.getAttribute('data-theme') !== 'dark';
  const syncTheme = () => {
    tt.setAttribute('aria-label', isLight() ? 'Switch to dark theme' : 'Switch to light theme');
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = isLight() ? '#f5f8f7' : '#041a21';
  };
  tt.addEventListener('click', () => {
    const next = isLight() ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('cosmo-theme', next); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  /* ---------- Optional logo image ---------- */
  $$('.logo-img').forEach(img => {
    const show = () => { img.hidden = false; img.closest('.logo').classList.add('has-img'); };
    img.addEventListener('load', show);
    if (img.complete && img.naturalWidth > 0) show();
  });

  /* ---------- Marquee ---------- */
  const words = ['Las Vegas', 'Henderson', 'North Las Vegas', 'Residential & Commercial', "Man's Most Reliable", 'Cosmo’s Comfort Guarantee™', 'Honest Service', 'Transparent Pricing'];
  const run = words.map(w => `<span>${w}</span>`).join('');
  $('#marquee').innerHTML = run + run;

  /* ---------- Split headings into animated words ---------- */
  const splitNode = (node, counter) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.innerHTML = `<span style="--i:${counter.i++}">${part}</span>`;
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitNode(n, counter);
    });
  };
  $$('[data-split]').forEach(el => {
    el.setAttribute('aria-label', el.textContent.trim());
    if (el.dataset.base) el.style.setProperty('--base', el.dataset.base + 'ms');
    splitNode(el, { i: 0 });
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  let started = false;
  const start = () => {
    if (started) return; started = true;
    loader.classList.add('done');
    document.body.classList.add('ready');
    setTimeout(() => { $$('.hero [data-reveal], .hero [data-split]').forEach(el => el.classList.add('in')); }, 500);
  };
  window.addEventListener('load', () => setTimeout(start, 1000));
  setTimeout(start, 2600); // safety net if an asset hangs

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.reveal-img', e.target).forEach(x => x.classList.add('in'));
      if (e.target.matches('[data-count]')) count(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-split]').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- Counters ---------- */
  function count(el) {
    const end = +el.dataset.count; const dur = 1800; const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Header, progress, back-to-top, scroll spy ---------- */
  const header = $('#header'), prog = $('#progress'), toTop = $('#toTop');
  const links = $$('.nav a.link');
  const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hide', y > lastY && y > 500 && !$('#nav').classList.contains('open'));
    lastY = y;
    toTop.classList.toggle('show', y > 900);
    // active link
    let cur = targets[0];
    targets.forEach(t => { if (t.getBoundingClientRect().top < innerHeight * .4) cur = t; });
    links.forEach(a => a.classList.toggle('active', $(a.getAttribute('href')) === cur && y > 80));
    // parallax
    if (!reduce) $$('[data-parallax]').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(0, ${y * +el.dataset.parallax}px, 0)`;
    });
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 960) setMenu(false); });

  /* ---------- Cursor glow, magnetic buttons, card spotlight ---------- */
  if (finePointer && !reduce) {
    const glow = $('#glow'); let gx = 0, gy = 0, cx = 0, cy = 0;
    addEventListener('mousemove', e => { gx = e.clientX; gy = e.clientY; glow.classList.add('on'); }, { passive: true });
    (function loop() { cx += (gx - cx) * .12; cy += (gy - cy) * .12; glow.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();

    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => b.style.transform = '');
    });
    $$('.card').forEach(c => c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
  }

  /* ---------- Smooth anchor scrolling with offset ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (a.dataset.tab) selectTab(a.dataset.tab);
    if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    const top = id === '#top' ? 0 : t.getBoundingClientRect().top + scrollY - 70;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------- Tabs ---------- */
  const tabs = $$('.tab'), pill = $('#pill');
  function movePill() {
    const a = $('.tab[aria-selected="true"]'); if (!a) return;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop - 7}px)`;
    pill.style.height = a.offsetHeight + 'px';
    pill.style.top = '7px';
  }
  function selectTab(name) {
    const t = $(`.tab[data-tab="${name}"]`); if (!t) return;
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + name));
    movePill();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t.dataset.tab));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        n.focus(); selectTab(n.dataset.tab);
      }
    });
  });
  addEventListener('resize', movePill);
  document.fonts && document.fonts.ready.then(movePill);
  movePill();

  /* ---------- FAQ ---------- */
  const faqs = [
    ['ac', 'Air Conditioning', 'How often should my air conditioner be serviced for peak comfort and efficiency?', 'Schedule maintenance at least once a year — ideally twice. A spring tune-up keeps your home cool all summer, and a fall visit prepares your system for the heating season. With a Cosmo’s tune-up, you’ll enjoy lower bills, longer equipment life, and consistent comfort for your family.'],
    ['ac', 'Air Conditioning', 'My air conditioning isn’t cooling like it used to — what should I do?', 'Start by checking your thermostat settings and air filter. If those look fine, it might be time for a professional inspection. One of our certified technicians can quickly diagnose whether it’s a refrigerant issue, coil problem, or airflow restriction — and get your comfort back on track fast.'],
    ['ac', 'Air Conditioning', 'How can I make my AC more energy efficient without losing comfort?', 'Regular filter changes, smart thermostat use, and annual maintenance go a long way. Our Comfort Club also includes performance checks and energy optimization — helping your system cool smarter, not harder.'],
    ['heating', 'Heating', 'When should I schedule my annual heating tune-up?', 'The best time for a heating check-up is early fall, before the first chill hits. That way, your furnace or heat pump is clean, efficient, and ready to deliver reliable comfort all winter long.'],
    ['heating', 'Heating', 'My furnace is making strange noises — should I be worried?', 'A little hum is normal, but banging, rattling, or whistling can signal a loose part or airflow problem. Our technicians can inspect and repair your system before a small sound turns into a big issue.'],
    ['heating', 'Heating', 'How can I tell if my heating system needs to be replaced instead of repaired?', 'If your system is over 15 years old, needs frequent repairs, or struggles to maintain even heat, it may be time to upgrade. We’ll walk you through your options and help you choose a system that delivers lasting comfort and energy savings.'],
    ['iaq', 'Air Quality', 'Why is indoor air quality so important for my home?', 'The air inside your home can be 2–5 times more polluted than the air outside. Our indoor air quality solutions — from air purifiers to humidity control — keep the air you breathe cleaner, fresher, and healthier every day.'],
    ['iaq', 'Air Quality', 'How do I know if I need an air purifier or dehumidifier?', 'If you’re noticing musty smells, excessive dust, or allergy flare-ups, your air may need a boost. Our comfort experts can assess your home’s air quality and recommend the right system to restore balance and comfort.'],
    ['iaq', 'Air Quality', 'Can my HVAC system really help with allergies and asthma?', 'With proper filtration, ventilation, and humidity control, your HVAC system can make a big difference. Our systems are designed to reduce airborne irritants so you can breathe easier and feel better at home.'],
    ['duct', 'Duct Cleaning', 'How often should I have my air ducts cleaned?', 'Most homes benefit from professional air duct cleaning every 3–5 years. Homes with pets, smokers, allergy sufferers, or recent renovations may benefit from more frequent cleanings.'],
    ['duct', 'Duct Cleaning', 'How long does air duct cleaning take?', 'Most residential appointments take 2–4 hours, depending on the size of your home and the condition of your ductwork.'],
    ['duct', 'Duct Cleaning', 'Will duct cleaning reduce dust, and can it help with allergies?', 'Yes. Cleaning your ductwork removes built-up dust, dirt, and debris that can circulate through your HVAC system, and removing pollen, pet dander and other allergens can help reduce airborne irritants. While some household dust is normal, many homeowners notice cleaner surfaces afterward.'],
    ['duct', 'Duct Cleaning', 'Do you clean both supply and return ducts — and is it messy?', 'We clean both supply and return ducts. We use professional negative-air equipment designed to contain dust and debris, and we leave the work area clean when we’re finished.'],
    ['duct', 'Duct Cleaning', 'How do I know if my air ducts need cleaning?', 'Common signs include excess dust around vents, musty odors when the HVAC runs, recent remodeling or construction, visible debris inside vents, indoor allergy symptoms, and pets that shed frequently.'],
    ['duct', 'Duct Cleaning', 'Do you offer free estimates?', 'Absolutely! Contact Cosmo’s Heating & Air today for a free estimate on professional air duct cleaning in Las Vegas.']
  ];
  const list = $('#faqList'), chips = $('#chips');
  list.innerHTML = faqs.map((f, i) => `
    <div class="faq-item" data-cat="${f[0]}">
      <h3 style="font-size:inherit"><button class="faq-q" aria-expanded="false" aria-controls="fa${i}" id="fq${i}"><span><span class="faq-cat" style="margin:0 0 6px">${f[1]}</span><span style="display:block">${f[2]}</span></span><span class="pm"></span></button></h3>
      <div class="faq-a" id="fa${i}" role="region" aria-labelledby="fq${i}"><div><p>${f[3]}</p></div></div>
    </div>`).join('');
  const cats = [['all', 'All'], ['ac', 'Air Conditioning'], ['heating', 'Heating'], ['iaq', 'Air Quality'], ['duct', 'Duct Cleaning']];
  chips.innerHTML = cats.map(c => `<button class="chip" data-c="${c[0]}" aria-pressed="${c[0] === 'all'}">${c[1]}</button>`).join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', chips).forEach(c => c.setAttribute('aria-pressed', c === b));
    $$('.faq-item', list).forEach(it => it.hidden = !(b.dataset.c === 'all' || it.dataset.cat === b.dataset.c));
  });
  list.addEventListener('click', e => {
    const q = e.target.closest('.faq-q'); if (!q) return;
    const item = q.closest('.faq-item'), open = !item.classList.contains('open');
    $$('.faq-item.open', list).forEach(i => { i.classList.remove('open'); $('.faq-q', i).setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('open', open); q.setAttribute('aria-expanded', open);
  });
  $('.faq-item', list).classList.add('open'); $('.faq-q', list).setAttribute('aria-expanded', 'true');

  /* ---------- Contact form (validates, then opens the visitor's email app) ---------- */
  const form = $('#form'), box = $('#formBox');
  $('#sv').addEventListener('change', e => e.target.classList.toggle('filled', !!e.target.value));
  const rules = {
    fn: v => v.trim().length > 1,
    ln: v => v.trim().length > 1,
    em: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
    ph: v => v.replace(/\D/g, '').length >= 10,
    sv: v => !!v
  };
  const validate = id => {
    const el = $('#' + id), ok = rules[id](el.value);
    el.closest('.field').classList.toggle('error', !ok); return ok;
  };
  Object.keys(rules).forEach(id => { $('#' + id).addEventListener('blur', () => validate(id)); $('#' + id).addEventListener('input', () => $('#' + id).closest('.field').classList.remove('error')); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = Object.keys(rules).map(validate).every(Boolean);
    if (!ok) { const bad = $('.field.error input, .field.error select', form); bad && bad.focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const body = `Name: ${d.first} ${d.last}\nPhone: ${d.phone}\nEmail: ${d.email}\nService: ${d.service}\n\n${d.message || ''}`;
    box.classList.add('sent'); $('#formOk').classList.add('show');
    location.href = `mailto:service@cosmosaclv.com?subject=${encodeURIComponent('Quote request — ' + d.service)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Hero: gentle floating "frost" particles ---------- */
  const cv = $('#snow');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, P = [];
    const size = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; P = Array.from({ length: Math.min(70, Math.floor(W / 22)) }, () => mk(true)); };
    const mk = init => ({ x: Math.random() * W, y: init ? Math.random() * H : -10, r: Math.random() * 1.8 + .4, v: Math.random() * .35 + .12, s: Math.random() * Math.PI * 2, gold: Math.random() > .75 });
    let vis = true;
    new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(cv);
    const draw = () => {
      if (vis) {
        ctx.clearRect(0, 0, W, H);
        P.forEach(p => {
          p.y += p.v; p.s += .008; p.x += Math.sin(p.s) * .25;
          if (p.y > H + 10) Object.assign(p, mk(false));
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = isLight() ? (p.gold ? 'rgba(176,125,31,.55)' : 'rgba(70,120,180,.4)') : (p.gold ? 'rgba(226,176,80,.6)' : 'rgba(200,225,255,.55)'); ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size); draw();
  }
})();
