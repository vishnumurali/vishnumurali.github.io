(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

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
    revealables.forEach((node) => io.observe(node));
  } else {
    revealables.forEach((node) => node.classList.add('is-visible'));
  }

  /* ---------- Count-up highlights ---------- */
  const counters = $$('[data-count]');
  const finalText = (node) => parseFloat(node.dataset.count).toFixed(parseInt(node.dataset.decimals || '0', 10));
  if (hasIO && !reduceMotion) {
    counters.forEach((node) => { node.textContent = (0).toFixed(parseInt(node.dataset.decimals || '0', 10)); });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        cio.unobserve(node);
        const target = parseFloat(node.dataset.count);
        const decimals = parseInt(node.dataset.decimals || '0', 10);
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          node.textContent = (target * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => { node.textContent = finalText(node); }, duration + 200);
      });
    }, { threshold: 0.6 });
    counters.forEach((node) => cio.observe(node));
  }

  window.addEventListener('beforeprint', () => {
    revealables.forEach((node) => node.classList.add('is-visible'));
    counters.forEach((node) => { node.textContent = finalText(node); });
  });

  /* ---------- Role durations ---------- */
  const MONTH = 1000 * 60 * 60 * 24 * 30.4375;
  const formatDuration = (from, to) => {
    const months = Math.max(1, Math.round((to - from) / MONTH));
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
    return parts.join(' ');
  };
  $$('.job-dur[data-from]').forEach((node) => {
    const to = node.dataset.to ? new Date(node.dataset.to) : new Date();
    node.textContent = formatDuration(new Date(node.dataset.from), to);
  });

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

  /* ---------- Reading progress + back to top ---------- */
  const progress = $('.progress');
  const toTop = $('.to-top');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Cursor spotlight on cards ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.('.spot');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ======================================================================
     Technologies
     Which role used which technology comes from the resume's per-role
     technology lists. Dates, bullets and summaries are read from the page.
     ====================================================================== */

  const roles = $$('.job[data-role]').map((job) => {
    const dur = $('.job-dur', job);
    return {
      id: job.dataset.role,
      org: job.dataset.org,
      title: job.dataset.title,
      dates: $('.job-dates', job).textContent.trim(),
      from: new Date(dur.dataset.from),
      to: dur.dataset.to ? new Date(dur.dataset.to) : new Date(),
      current: !dur.dataset.to,
      summary: $('.job-summary', job)?.textContent.trim() || '',
      points: $$('.job-points li', job).map((li) => li.textContent.trim()),
    };
  });
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));

  const CATS = [
    { id: 'all', label: 'All' },
    { id: 'sp', label: 'SharePoint & M365' },
    { id: 'pp', label: 'Power Platform' },
    { id: 'wf', label: 'Workflow & Forms' },
    { id: 'az', label: 'Azure & Integration' },
    { id: 'dev', label: 'Development' },
    { id: 'ops', label: 'DevOps & Migration' },
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));

  // keys: phrases highlighted in the matching resume bullets.
  const TECH = [
    { id: 'spo', name: 'SharePoint Online', short: 'SPO', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['SharePoint Online'], aliases: ['SharePoint'] },
    { id: 'spfx', name: 'SharePoint Framework (SPFx)', short: 'SPFx', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['SPFx'], aliases: ['SPFx'] },
    { id: 'sp-onprem', name: 'SharePoint 2013 / 2016', short: 'SP', cat: 'sp', roles: ['sopra', 'accenture', 'cognizant', 'ltim'], keys: ['SharePoint 2013/2016', 'SharePoint 2013', 'on-premises'], aliases: ['SharePoint 2013', 'SharePoint 2013 (SSOM)', 'SharePoint 2013 (CSOM)'] },
    { id: 'sp-rest', name: 'SharePoint REST API', short: 'API', cat: 'sp', roles: ['mphasis', 'ltim'], keys: ['REST APIs', 'REST API'], aliases: ['SharePoint REST', 'REST API'] },
    { id: 'csom', name: 'CSOM / SSOM', short: 'OM', cat: 'sp', roles: ['cognizant', 'ltim'], keys: ['CSOM', 'SSOM'] },
    { id: 'pha', name: 'Provider-hosted apps', short: 'PHA', cat: 'sp', roles: ['ltim'], keys: ['provider-hosted app model'] },
    { id: 'm365', name: 'Microsoft 365', short: '365', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['Microsoft 365'] },

    { id: 'power-apps', name: 'Power Apps', short: 'PA', cat: 'pp', roles: ['mphasis', 'sopra', 'accenture'], keys: ['Power Apps'] },
    { id: 'power-automate', name: 'Power Automate', short: 'PAu', cat: 'pp', roles: ['mphasis', 'sopra', 'accenture'], keys: ['Power Automate'] },
    { id: 'dataverse', name: 'Dataverse', short: 'DV', cat: 'pp', roles: ['sopra'], keys: ['Dataverse'] },
    { id: 'dataflows', name: 'Dataflows', short: 'DF', cat: 'pp', roles: ['sopra'], keys: ['Dataflows'] },

    { id: 'nac', name: 'Nintex Automation Cloud', short: 'NAC', cat: 'wf', roles: ['sopra'], keys: ['Nintex Automation Cloud'] },
    { id: 'nintex-o365', name: 'Nintex for Office 365', short: 'NWF', cat: 'wf', roles: ['sopra'], keys: ['Nintex for Office 365', 'Nintex workflows'] },
    { id: 'nintex-forms', name: 'Nintex Forms', short: 'NF', cat: 'wf', roles: ['sopra', 'accenture'], keys: ['Nintex Forms'] },
    { id: 'infopath', name: 'InfoPath', short: 'IP', cat: 'wf', roles: ['sopra'], keys: ['InfoPath'] },

    { id: 'azure', name: 'Microsoft Azure', short: 'Az', cat: 'az', roles: ['mphasis', 'sopra'], keys: ['Azure-based integrations', 'Azure services', 'Azure app registrations'] },
    { id: 'azure-functions', name: 'Azure Functions', short: 'Fx', cat: 'az', roles: ['mphasis'], keys: ['Azure Functions'] },
    { id: 'graph', name: 'Microsoft Graph API', short: 'G', cat: 'az', roles: ['mphasis', 'sopra'], keys: ['Microsoft Graph API', 'Microsoft Graph'], aliases: ['Microsoft Graph'] },
    { id: 'app-reg', name: 'Azure App Registrations', short: 'AR', cat: 'az', roles: ['sopra'], keys: ['app registrations'] },

    { id: 'react', name: 'React', short: 'Re', cat: 'dev', roles: ['mphasis', 'sopra', 'accenture'], keys: ['React'] },
    { id: 'typescript', name: 'TypeScript', short: 'TS', cat: 'dev', roles: ['sopra'], keys: ['TypeScript'] },
    { id: 'javascript', name: 'JavaScript', short: 'JS', cat: 'dev', roles: ['cognizant', 'ltim'], keys: ['JavaScript'] },
    { id: 'csharp', name: 'C# .NET', short: 'C#', cat: 'dev', roles: ['cognizant', 'ltim'], keys: ['C#'] },
    { id: 'aspnet', name: 'ASP.NET', short: 'ASP', cat: 'dev', roles: ['ltim'], keys: ['ASP.NET'] },
    { id: 'sql', name: 'SQL / MySQL', short: 'SQL', cat: 'dev', roles: ['cognizant'], keys: ['SQL'], aliases: ['MySQL', 'SQL'] },
    { id: 'winsvc', name: 'Windows Services', short: 'WS', cat: 'dev', roles: ['ltim'], keys: ['Windows service'] },

    { id: 'devops', name: 'Azure DevOps CI/CD', short: 'CI', cat: 'ops', roles: ['mphasis', 'sopra'], keys: ['Azure DevOps', 'CI/CD'], aliases: ['Azure DevOps'] },
    { id: 'powershell', name: 'PowerShell', short: 'PS', cat: 'ops', roles: ['mphasis', 'sopra'], keys: ['PowerShell'] },
    { id: 'pnp', name: 'PnP PowerShell', short: 'PnP', cat: 'ops', roles: ['mphasis'], keys: ['PnP PowerShell'] },
    { id: 'sharegate', name: 'ShareGate', short: 'SG', cat: 'ops', roles: ['sopra', 'accenture'], keys: ['Migrated SharePoint 2013/2016 to SharePoint Online', 'data migration'] },
  ].map((t) => ({ ...t, roles: t.roles.filter((id) => roleById[id]) }));
  const techById = Object.fromEntries(TECH.map((t) => [t.id, t]));

  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const techByName = new Map();
  TECH.forEach((t) => [t.name, ...(t.aliases || [])].forEach((a) => techByName.set(norm(a), t.id)));

  // Career axis: first role start → today.
  const START = roles.length ? new Date(Math.min(...roles.map((r) => r.from))) : new Date('2016-12-01');
  const END = new Date();
  const pct = (d) => Math.max(0, Math.min(100, ((d - START) / (END - START)) * 100));

  const usage = (t) => {
    const rs = t.roles.map((id) => roleById[id]);
    const from = new Date(Math.min(...rs.map((r) => r.from)));
    const current = rs.some((r) => r.current);
    const to = new Date(Math.max(...rs.map((r) => r.to)));
    const months = rs.reduce((sum, r) => sum + (r.to - r.from) / MONTH, 0);
    return {
      roles: rs,
      fromYear: from.getFullYear(),
      toLabel: current ? 'Present' : String(to.getFullYear()),
      years: Math.round(months / 12 * 10) / 10,
      orgs: new Set(rs.map((r) => r.org)).size,
    };
  };

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlight = (text, keys) => {
    const frag = document.createDocumentFragment();
    if (!keys.length) { frag.append(text); return frag; }
    const re = new RegExp(`(${keys.map(escapeRe).join('|')})`, 'gi');
    text.split(re).forEach((part, i) => {
      if (!part) return;
      frag.append(i % 2 ? el('mark', null, part) : part);
    });
    return frag;
  };
  const mentions = (text, keys) => keys.some((k) => text.toLowerCase().includes(k.toLowerCase()));

  /* ---------- Detail drawer ---------- */
  const drawer = $('#tech-drawer');
  const panel = $('.drawer-panel', drawer);
  const content = $('.drawer-content', drawer);
  const closeBtn = $('.drawer-close', drawer);
  let lastTrigger = null;

  const fillDrawer = (t) => {
    const u = usage(t);
    panel.style.setProperty('--c', `var(--c-${t.cat})`);
    content.classList.remove('is-in');

    const cat = el('p', 'd-cat');
    cat.append(el('span', 'd-cat-dot'), catById[t.cat].label);

    const head = el('div', 'd-head');
    const icon = el('span', 'd-icon', t.short);
    icon.setAttribute('aria-hidden', 'true');
    const title = el('h3', 'd-title', t.name);
    title.id = 'drawer-title';
    title.tabIndex = -1;
    head.append(icon, title);

    const stats = el('dl', 'd-stats');
    [
      ['Period', `${u.fromYear} – ${u.toLabel}`],
      ['Roles', `${u.roles.length} of ${roles.length}`],
      ['Role tenure', `${u.years} yrs`],
    ].forEach(([k, v]) => {
      const cell = el('div');
      cell.append(el('dt', null, k), el('dd', null, v));
      stats.append(cell);
    });

    // Career timeline with this technology highlighted
    const tlTitle = el('h4', 'd-sub', 'Career timeline');
    const timeline = el('div', 'd-timeline');
    timeline.setAttribute('role', 'img');
    timeline.setAttribute('aria-label', `${t.name} used at ${u.roles.map((r) => r.org).join(', ')}`);
    roles.slice().reverse().forEach((r, k) => {
      const used = t.roles.includes(r.id);
      const row = el('div', `dt-row${used ? ' is-used' : ''}`);
      const track = el('div', 'dt-track');
      const bar = el('span', 'dt-bar');
      bar.style.left = `${pct(r.from)}%`;
      bar.style.width = `${Math.max(1.5, pct(r.to) - pct(r.from))}%`;
      bar.style.setProperty('--k', k);
      track.append(bar);
      row.append(el('span', 'dt-label', r.org), track);
      timeline.append(row);
    });
    const axis = el('div', 'dt-axis');
    axis.setAttribute('aria-hidden', 'true');
    for (let y = START.getFullYear() + 1; y <= END.getFullYear(); y += 1) {
      const tick = el('span', null, `'${String(y).slice(2)}`);
      tick.style.left = `${pct(new Date(y, 0, 1))}%`;
      axis.append(tick);
    }
    timeline.append(axis);

    // Where it was used, with the matching resume bullets
    const whereTitle = el('h4', 'd-sub', 'Where I used it');
    const list = el('ol', 'd-roles');
    u.roles.forEach((r) => {
      const item = el('li', 'd-role');
      const rh = el('div', 'd-role-head');
      rh.append(el('span', 'd-org', r.org), el('span', 'd-dates', r.dates));
      item.append(rh, el('p', 'd-role-title', r.title));
      const pts = r.points.filter((p) => mentions(p, t.keys));
      if (pts.length) {
        const ul = el('ul', 'd-points');
        pts.forEach((p) => { const li = el('li'); li.append(highlight(p, t.keys)); ul.append(li); });
        item.append(ul);
      } else {
        item.append(el('p', 'd-note', r.summary));
      }
      list.append(item);
    });

    // Related technologies in the same category
    const related = TECH.filter((x) => x.cat === t.cat && x.id !== t.id);
    const parts = [cat, head, stats, tlTitle, timeline, whereTitle, list];
    if (related.length) {
      const relTitle = el('h4', 'd-sub', `More in ${catById[t.cat].label}`);
      const rel = el('div', 'd-related');
      related.forEach((x) => {
        const b = el('button', null, x.name);
        b.type = 'button';
        b.addEventListener('click', () => {
          showTech(x.id);
          // The clicked chip is replaced, so keep focus inside the panel.
          $('#drawer-title', drawer)?.focus({ preventScroll: true });
        });
        rel.append(b);
      });
      parts.push(relTitle, rel);
    }
    parts.forEach((p, i) => p.style.setProperty('--d', i));
    content.replaceChildren(...parts);
    panel.scrollTop = 0;
    void content.offsetWidth;
    requestAnimationFrame(() => content.classList.add('is-in'));
  };

  const showTech = (id, trigger) => {
    const t = techById[id];
    if (!t) return;
    if (trigger) lastTrigger = trigger;
    fillDrawer(t);
    if (!drawer.classList.contains('is-open')) {
      doc.style.setProperty('--sbw', `${window.innerWidth - doc.clientWidth}px`);
      doc.classList.add('drawer-lock');
      drawer.inert = false;
      drawer.removeAttribute('inert');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.classList.add('is-open');
      setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
    }
  };

  const closeDrawer = () => {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    doc.classList.remove('drawer-lock');
    lastTrigger?.focus({ preventScroll: true });
  };

  $$('[data-close]', drawer).forEach((n) => n.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key !== 'Tab') return;
    const focusables = $$('button, a[href]', panel).filter((n) => n.offsetParent !== null);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Tags become buttons that open the drawer ---------- */
  $$('.tags li').forEach((li) => {
    const label = li.textContent.trim();
    const id = techByName.get(norm(label));
    if (!id) return;
    const b = el('button', 'tag-btn', label);
    b.type = 'button';
    b.setAttribute('aria-label', `${label}: show where it was used`);
    b.addEventListener('click', () => showTech(id, b));
    li.replaceChildren(b);
    li.classList.add('is-btn');
  });

  /* ---------- Per-role "Technologies used" toggles ---------- */
  $$('.job-tech').forEach((wrap) => {
    const btn = $('.tech-toggle', wrap);
    const panelEl = $('.job-tech-panel', wrap);
    $$('.tags li', wrap).forEach((li, i) => li.style.setProperty('--i', i));
    panelEl.inert = true;
    btn.addEventListener('click', () => {
      const open = !wrap.classList.contains('is-open');
      wrap.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panelEl.inert = !open;
    });
  });

  /* ---------- Tech stack explorer ---------- */
  const tabsEl = $('.tech-tabs');
  const grid = $('.tech-grid');
  if (tabsEl && grid) {
    const indicator = $('.tab-indicator', tabsEl);
    let current = 'all';
    let shown = false;
    let settleTimer;

    const tabs = CATS.map((c) => {
      const count = c.id === 'all' ? TECH.length : TECH.filter((t) => t.cat === c.id).length;
      const b = el('button', 'tab');
      b.type = 'button';
      b.dataset.cat = c.id;
      b.setAttribute('aria-pressed', String(c.id === current));
      if (c.id !== 'all') {
        b.style.setProperty('--c', `var(--c-${c.id})`);
        b.append(el('span', 'tab-dot'));
      }
      b.append(c.label, el('span', 'tab-count', String(count)));
      b.addEventListener('click', () => select(c.id));
      tabsEl.append(b);
      return b;
    });

    const moveIndicator = () => {
      const active = tabs.find((b) => b.dataset.cat === current);
      if (!active) return;
      indicator.style.width = `${active.offsetWidth}px`;
      indicator.style.height = `${active.offsetHeight}px`;
      indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
      if (tabsEl.scrollWidth > tabsEl.clientWidth) {
        tabsEl.scrollTo({ left: active.offsetLeft - (tabsEl.clientWidth - active.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };

    const tile = (t, i) => {
      const u = usage(t);
      const b = el('button', 'tech spot');
      b.type = 'button';
      b.style.setProperty('--i', Math.min(i, 16));
      b.style.setProperty('--c', `var(--c-${t.cat})`);
      b.setAttribute('aria-label', `${t.name}, ${u.fromYear} to ${u.toLabel}, ${u.roles.length} roles. Show details`);
      const icon = el('span', 'tech-icon', t.short);
      icon.setAttribute('aria-hidden', 'true');
      const body = el('span', 'tech-body');
      body.append(
        el('span', 'tech-name', t.name),
        el('span', 'tech-meta', `${u.fromYear} – ${u.toLabel} · ${u.roles.length} ${u.roles.length > 1 ? 'roles' : 'role'}`),
      );
      const bar = el('span', 'tech-bar');
      bar.setAttribute('aria-hidden', 'true');
      u.roles.slice().sort((a, b2) => a.from - b2.from).forEach((r, k) => {
        const seg = el('span', 'seg');
        seg.style.left = `${pct(r.from)}%`;
        seg.style.width = `${Math.max(2, pct(r.to) - pct(r.from))}%`;
        seg.style.setProperty('--k', k);
        bar.append(seg);
      });
      body.append(bar);
      b.append(icon, body);
      b.addEventListener('click', () => showTech(t.id, b));
      return b;
    };

    const settle = (count) => {
      clearTimeout(settleTimer);
      grid.classList.remove('is-settled');
      settleTimer = setTimeout(() => grid.classList.add('is-settled'), Math.min(count, 16) * 28 + 1200);
    };

    const render = () => {
      const items = current === 'all' ? TECH : TECH.filter((t) => t.cat === current);
      const before = grid.offsetHeight;
      grid.classList.remove('is-in');
      grid.replaceChildren(...items.map(tile));
      if (!shown) return;
      // Animate the container height so content below glides instead of jumping.
      if (!reduceMotion) {
        const after = grid.scrollHeight;
        grid.style.height = `${before}px`;
        void grid.offsetHeight;
        grid.classList.add('is-sizing');
        grid.style.height = `${after}px`;
        const done = () => { grid.classList.remove('is-sizing'); grid.style.height = ''; };
        grid.addEventListener('transitionend', function onEnd(e) {
          if (e.target === grid && e.propertyName === 'height') { grid.removeEventListener('transitionend', onEnd); done(); }
        });
        setTimeout(done, 700);
      }
      requestAnimationFrame(() => { grid.classList.add('is-in'); settle(items.length); });
    };

    const select = (cat) => {
      if (cat === current) return;
      current = cat;
      tabs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
      moveIndicator();
      if (reduceMotion || !shown) { render(); return; }
      grid.classList.add('is-leaving');
      setTimeout(() => { grid.classList.remove('is-leaving'); render(); }, 170);
    };

    render();
    moveIndicator();
    requestAnimationFrame(() => tabsEl.classList.add('is-ready'));
    window.addEventListener('resize', moveIndicator);
    document.fonts?.ready.then(moveIndicator);

    const reveal = () => {
      shown = true;
      grid.classList.add('is-in');
      settle(TECH.length);
    };
    if (hasIO && !reduceMotion) {
      const gio = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { gio.disconnect(); reveal(); }
      }, { threshold: 0.1 });
      gio.observe(grid);
    } else {
      reveal();
    }
  }

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
