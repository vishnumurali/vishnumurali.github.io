(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Theme ---------- */
  const themeBtn = $('.theme-toggle');
  const syncThemeLabel = () => {
    const dark = doc.getAttribute('data-theme') === 'dark';
    themeBtn?.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  };
  syncThemeLabel();
  themeBtn?.addEventListener('click', () => {
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncThemeLabel();
  });

  /* ---------- Save as PDF ---------- */
  $$('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));

  /* ---------- Reveal on scroll ---------- */
  const revealables = $$('.reveal');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }
  // Printing must never show half-revealed content.
  window.addEventListener('beforeprint', () => revealables.forEach((el) => el.classList.add('is-visible')));

  /* ---------- Role durations ---------- */
  const formatDuration = (from, to) => {
    const a = new Date(from);
    const b = to ? new Date(to) : new Date();
    const months = Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.4375)));
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
    return parts.join(' ');
  };
  $$('[data-from]').forEach((el) => { el.textContent = formatDuration(el.dataset.from, el.dataset.to); });

  /* ---------- Active section in navigation ---------- */
  const navLinks = $$('.toc a, .mobile-nav a');
  const mobileList = $('.mobile-nav-list');
  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    const chip = mobileList?.querySelector(`a[href="#${id}"]`);
    if (chip && mobileList.scrollWidth > mobileList.clientWidth) {
      const left = chip.offsetLeft - (mobileList.clientWidth - chip.offsetWidth) / 2;
      mobileList.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };
  if (hasIO) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-25% 0px -65% 0px' });
    $$('main .section[id]').forEach((s) => { if (s.id !== 'contact') sio.observe(s); });
  }

  /* ---------- Back to top ---------- */
  const toTop = $('.to-top');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
      ticking = false;
    });
  }, { passive: true });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
