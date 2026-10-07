(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---------- Theme ---------- */
  $('.theme-toggle')?.addEventListener('click', () => {
    const next = doc.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });

  /* ---------- Mobile menu ---------- */
  const nav = $('.nav');
  const menuBtn = $('.menu-toggle');
  const setMenu = (open) => {
    nav.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 961px)').addEventListener?.('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Staggered reveal ---------- */
  $$('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i % 6));
  });

  const revealables = $$('[data-reveal]');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1600;
    const start = performance.now();
    const final = target.toFixed(decimals);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Guarantee the final value even if animation frames are throttled.
    setTimeout(() => { el.textContent = final; }, duration + 200);
  };
  if (hasIO && !reduceMotion) {
    counters.forEach((el) => { el.textContent = (0).toFixed(parseInt(el.dataset.decimals || '0', 10)); });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Small delay so the count starts after the hero entrance animation.
          setTimeout(() => runCounter(entry.target), 500);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- Typewriter ---------- */
  const typed = $('.typed');
  if (typed && !reduceMotion) {
    const words = typed.dataset.words.split('|');
    let w = 0;
    let c = words[0].length;
    let deleting = true;
    const step = () => {
      const word = words[w];
      if (deleting) {
        c -= 1;
        typed.textContent = word.slice(0, c);
        if (c === 0) {
          deleting = false;
          w = (w + 1) % words.length;
          return setTimeout(step, 350);
        }
        return setTimeout(step, 28);
      }
      const next = words[w];
      c += 1;
      typed.textContent = next.slice(0, c);
      if (c === next.length) {
        deleting = true;
        return setTimeout(step, 2200);
      }
      return setTimeout(step, 55);
    };
    setTimeout(step, 2600);
  }

  /* ---------- Marquee (duplicate list for a seamless loop) ---------- */
  const marqueeList = $('.marquee-list');
  if (marqueeList) {
    const clone = marqueeList.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    marqueeList.parentElement.appendChild(clone);
  }

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

  /* ---------- Scroll-driven UI ---------- */
  const progressBar = $('.scroll-progress');
  const toTop = $('.to-top');
  const timeline = $('.timeline');
  const tlItems = $$('.tl-item');

  const updateTimeline = () => {
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const anchor = window.innerHeight * 0.55;
    const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
    timeline.style.setProperty('--progress', progress.toFixed(4));
    tlItems.forEach((item) => {
      const dot = item.querySelector('.tl-dot');
      item.classList.toggle('is-active', dot.getBoundingClientRect().top < anchor);
    });
  };

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-scrolled', y > 12);
    toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);
    updateTimeline();
  };
  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);
  onScroll();

  /* ---------- Active nav link ---------- */
  const navLinks = new Map($$('.nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
  if (hasIO) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.remove('is-active'));
        navLinks.get(entry.target.id)?.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => sio.observe(s));
  }

  /* ---------- Pointer effects ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) {
    $$('.spot').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });

    const hero = $('.hero');
    const glow = $('.hero-grid--glow');
    if (hero && glow && !reduceMotion) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty('--hx', `${e.clientX - r.left}px`);
        glow.style.setProperty('--hy', `${e.clientY - r.top}px`);
      });
      hero.addEventListener('pointerleave', () => {
        glow.style.setProperty('--hx', '-500px');
        glow.style.setProperty('--hy', '-500px');
      });
    }
  }

  /* ---------- Project filters ---------- */
  const filterBtns = $$('.filter');
  const projects = $$('.project');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      projects.forEach((card) => {
        const show = f === 'all' || card.dataset.org.split(' ').includes(f);
        card.hidden = !show;
        if (show) {
          card.classList.add('is-visible');
          card.classList.remove('pop');
          void card.offsetWidth; // restart animation
          card.classList.add('pop');
        }
      });
    });
  });

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Email address copied');
      } catch (e) {
        window.location.href = `mailto:${text}`;
      }
    });
  });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
