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

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $$('.kbd-mod').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });

  /* ---------- Theme ---------- */
  const themeBtns = $$('.theme-toggle');
  const syncTheme = () => {
    const dark = doc.getAttribute('data-theme') === 'dark';
    themeBtns.forEach((b) => b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'));
  };
  const toggleTheme = () => {
    const next = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    doc.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    syncTheme();
  };
  syncTheme();
  themeBtns.forEach((b) => b.addEventListener('click', toggleTheme));

  /* ---------- Save as PDF ---------- */
  $$('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  /* ---------- Scroll lock shared by the drawer and the palette ---------- */
  let locks = 0;
  const lock = () => {
    if (locks++ === 0) {
      doc.style.setProperty('--sbw', `${window.innerWidth - doc.clientWidth}px`);
      doc.classList.add('is-locked');
    }
  };
  const unlock = () => {
    locks = Math.max(0, locks - 1);
    if (locks === 0) doc.classList.remove('is-locked');
  };

  /* ---------- Reveal on scroll ---------- */
  const revealables = $$('.reveal');
  const onVisible = new Map();
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        onVisible.get(entry.target)?.();
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    revealables.forEach((n) => io.observe(n));
  } else {
    revealables.forEach((n) => n.classList.add('is-visible'));
  }
  const whenVisible = (node, fn) => {
    if (!node) return;
    if (node.classList.contains('is-visible')) fn();
    else onVisible.set(node, fn);
  };

  /* ---------- Count-up stats ---------- */
  const counters = $$('[data-count]');
  const finalText = (n) => parseFloat(n.dataset.count).toFixed(parseInt(n.dataset.decimals || '0', 10));
  if (hasIO && !reduceMotion) {
    counters.forEach((n) => { n.textContent = (0).toFixed(parseInt(n.dataset.decimals || '0', 10)); });
    whenVisible($('.stats'), () => {
      counters.forEach((n) => {
        const target = parseFloat(n.dataset.count);
        const decimals = parseInt(n.dataset.decimals || '0', 10);
        const start = performance.now();
        const duration = 1300;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          n.textContent = (target * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        setTimeout(() => { n.textContent = finalText(n); }, duration + 200);
      });
    });
  }

  /* ---------- about.ts typing ---------- */
  const codeLines = $$('.code .line');
  if (!hasIO || reduceMotion) {
    codeLines.forEach((l) => l.classList.add('is-on'));
  } else {
    const caret = el('span', 'caret');
    caret.setAttribute('aria-hidden', 'true');
    whenVisible($('.code-card'), () => {
      codeLines.forEach((line, i) => setTimeout(() => { line.classList.add('is-on'); line.append(caret); }, 200 + i * 85));
    });
  }

  window.addEventListener('beforeprint', () => {
    revealables.forEach((n) => n.classList.add('is-visible'));
    counters.forEach((n) => { n.textContent = finalText(n); });
    codeLines.forEach((l) => l.classList.add('is-on'));
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
  $$('.job-dur[data-from]').forEach((n) => {
    n.textContent = formatDuration(new Date(n.dataset.from), n.dataset.to ? new Date(n.dataset.to) : new Date());
  });

  /* ---------- Top bar, progress, back to top ---------- */
  const topbar = $('.topbar');
  const progress = $('.progress');
  const toTop = $('.to-top');
  if (hasIO && topbar) {
    const tio = new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      topbar.classList.toggle('is-shown', show);
      topbar.inert = !show;
      topbar.setAttribute('aria-hidden', String(!show));
    }, { rootMargin: '-56px 0px 0px 0px' });
    tio.observe($('.tblock'));

    const navLinks = $$('.tb-nav a');
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    $$('main .section[id]').forEach((s) => sio.observe(s));
  }
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = doc.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ======================================================================
     Data
     Which role used which technology comes from the resume's per-role
     technology lists. Dates, bullets and summaries are read from the page.
     ====================================================================== */

  const roles = $$('.rev[data-role]').map((rev) => {
    const dur = $('.job-dur', rev);
    return {
      id: rev.dataset.role,
      no: $('.rev-no', rev)?.textContent.trim() || '',
      org: rev.dataset.org,
      title: rev.dataset.title,
      dates: $('.job-dates', rev).textContent.trim(),
      from: new Date(dur.dataset.from),
      to: dur.dataset.to ? new Date(dur.dataset.to) : new Date(),
      current: !dur.dataset.to,
      summary: $('.job-summary', rev)?.textContent.trim() || '',
      points: $$('.job-points li', rev).map((li) => li.textContent.trim()),
      el: rev,
    };
  });
  const roleById = Object.fromEntries(roles.map((r) => [r.id, r]));

  const CATS = [
    { id: 'sp', code: 'A', label: 'SharePoint & M365' },
    { id: 'pp', code: 'B', label: 'Power Platform' },
    { id: 'wf', code: 'C', label: 'Workflow & Forms' },
    { id: 'az', code: 'D', label: 'Azure & Integration' },
    { id: 'dev', code: 'E', label: 'Development' },
    { id: 'ops', code: 'F', label: 'DevOps & Migration' },
  ];
  const catById = Object.fromEntries(CATS.map((c) => [c.id, c]));

  // keys: phrases highlighted in the matching resume bullets.
  const TECH = [
    { id: 'spo', label: 'SharePoint Online', name: 'SharePoint Online', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['SharePoint Online'], aliases: ['SharePoint'] },
    { id: 'spfx', label: 'SPFx', name: 'SharePoint Framework (SPFx)', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['SPFx'], aliases: ['SPFx'] },
    { id: 'sp-onprem', label: 'SharePoint 2013/2016', name: 'SharePoint 2013 / 2016', cat: 'sp', roles: ['sopra', 'accenture', 'cognizant', 'ltim'], keys: ['SharePoint 2013/2016', 'SharePoint 2013', 'on-premises'], aliases: ['SharePoint 2013', 'SharePoint 2013 (SSOM)', 'SharePoint 2013 (CSOM)'] },
    { id: 'sp-rest', label: 'SharePoint REST API', name: 'SharePoint REST API', cat: 'sp', roles: ['mphasis', 'ltim'], keys: ['REST APIs', 'REST API'], aliases: ['SharePoint REST', 'REST API'] },
    { id: 'csom', label: 'CSOM / SSOM', name: 'CSOM / SSOM', cat: 'sp', roles: ['cognizant', 'ltim'], keys: ['CSOM', 'SSOM'] },
    { id: 'pha', label: 'Provider-hosted apps', name: 'Provider-hosted apps', cat: 'sp', roles: ['ltim'], keys: ['provider-hosted app model'] },
    { id: 'm365', label: 'Microsoft 365', name: 'Microsoft 365', cat: 'sp', roles: ['mphasis', 'sopra', 'accenture', 'cognizant'], keys: ['Microsoft 365'], aliases: ['Outlook', 'Teams'] },

    { id: 'power-apps', label: 'Power Apps', name: 'Power Apps', cat: 'pp', roles: ['mphasis', 'sopra', 'accenture'], keys: ['Power Apps'] },
    { id: 'power-automate', label: 'Power Automate', name: 'Power Automate', cat: 'pp', roles: ['mphasis', 'sopra', 'accenture'], keys: ['Power Automate'] },
    { id: 'dataverse', label: 'Dataverse', name: 'Dataverse', cat: 'pp', roles: ['sopra'], keys: ['Dataverse'] },
    { id: 'dataflows', label: 'Dataflows', name: 'Dataflows', cat: 'pp', roles: ['sopra'], keys: ['Dataflows'] },

    { id: 'nac', label: 'Nintex Automation Cloud', name: 'Nintex Automation Cloud', cat: 'wf', roles: ['sopra'], keys: ['Nintex Automation Cloud'] },
    { id: 'nintex-o365', label: 'Nintex for Office 365', name: 'Nintex for Office 365', cat: 'wf', roles: ['sopra'], keys: ['Nintex for Office 365', 'Nintex workflows'] },
    { id: 'nintex-forms', label: 'Nintex Forms', name: 'Nintex Forms', cat: 'wf', roles: ['sopra', 'accenture'], keys: ['Nintex Forms'] },
    { id: 'infopath', label: 'InfoPath', name: 'InfoPath', cat: 'wf', roles: ['sopra'], keys: ['InfoPath'] },

    { id: 'azure', label: 'Microsoft Azure', name: 'Microsoft Azure', cat: 'az', roles: ['mphasis', 'sopra'], keys: ['Azure-based integrations', 'Azure services', 'Azure app registrations'] },
    { id: 'azure-functions', label: 'Azure Functions', name: 'Azure Functions', cat: 'az', roles: ['mphasis'], keys: ['Azure Functions'] },
    { id: 'graph', label: 'Microsoft Graph API', name: 'Microsoft Graph API', cat: 'az', roles: ['mphasis', 'sopra'], keys: ['Microsoft Graph API', 'Microsoft Graph'], aliases: ['Microsoft Graph'] },
    { id: 'app-reg', label: 'App registrations', name: 'Azure App Registrations', cat: 'az', roles: ['sopra'], keys: ['app registrations'] },

    { id: 'react', label: 'React', name: 'React', cat: 'dev', roles: ['mphasis', 'sopra', 'accenture'], keys: ['React'] },
    { id: 'typescript', label: 'TypeScript', name: 'TypeScript', cat: 'dev', roles: ['sopra'], keys: ['TypeScript'] },
    { id: 'javascript', label: 'JavaScript', name: 'JavaScript', cat: 'dev', roles: ['cognizant', 'ltim'], keys: ['JavaScript'] },
    { id: 'csharp', label: 'C# .NET', name: 'C# .NET', cat: 'dev', roles: ['cognizant', 'ltim'], keys: ['C#'] },
    { id: 'aspnet', label: 'ASP.NET', name: 'ASP.NET', cat: 'dev', roles: ['ltim'], keys: ['ASP.NET'] },
    { id: 'sql', label: 'SQL / MySQL', name: 'SQL / MySQL', cat: 'dev', roles: ['cognizant'], keys: ['SQL'], aliases: ['MySQL', 'SQL'] },
    { id: 'winsvc', label: 'Windows Services', name: 'Windows Services', cat: 'dev', roles: ['ltim'], keys: ['Windows service'] },

    { id: 'devops', label: 'Azure DevOps CI/CD', name: 'Azure DevOps CI/CD', cat: 'ops', roles: ['mphasis', 'sopra'], keys: ['Azure DevOps', 'CI/CD'], aliases: ['Azure DevOps'] },
    { id: 'powershell', label: 'PowerShell', name: 'PowerShell', cat: 'ops', roles: ['mphasis', 'sopra'], keys: ['PowerShell'] },
    { id: 'pnp', label: 'PnP PowerShell', name: 'PnP PowerShell', cat: 'ops', roles: ['mphasis'], keys: ['PnP PowerShell'] },
    { id: 'sharegate', label: 'ShareGate', name: 'ShareGate', cat: 'ops', roles: ['sopra', 'accenture'], keys: ['Migrated SharePoint 2013/2016 to SharePoint Online', 'data migration'] },
  ].map((t) => ({ ...t, roles: t.roles.filter((id) => roleById[id]) }));

  // Short codes (A1 … F4) let the search palette match by code
  CATS.forEach((c) => TECH.filter((t) => t.cat === c.id).forEach((t, i) => { t.code = `${c.code}${i + 1}`; }));
  const techById = Object.fromEntries(TECH.map((t) => [t.id, t]));
  $$('.tech-total').forEach((n) => { n.textContent = String(TECH.length); if (n.dataset.count) n.dataset.count = String(TECH.length); });

  const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const techByName = new Map();
  TECH.forEach((t) => [t.name, t.label, ...(t.aliases || [])].forEach((a) => techByName.set(norm(a), t.id)));

  const START = roles.length ? new Date(Math.min(...roles.map((r) => r.from))) : new Date('2016-12-01');
  const END = new Date();
  const pct = (d) => Math.max(0, Math.min(100, ((d - START) / (END - START)) * 100));

  const usage = (t) => {
    const rs = t.roles.map((id) => roleById[id]);
    if (!rs.length) return { roles: [], fromYear: '', toLabel: '', years: 0 };
    const current = rs.some((r) => r.current);
    const months = rs.reduce((sum, r) => sum + (r.to - r.from) / MONTH, 0);
    return {
      roles: rs,
      fromYear: new Date(Math.min(...rs.map((r) => r.from))).getFullYear(),
      toLabel: current ? 'Present' : String(new Date(Math.max(...rs.map((r) => r.to))).getFullYear()),
      years: Math.round((months / 12) * 10) / 10,
    };
  };

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlight = (text, keys) => {
    const frag = document.createDocumentFragment();
    if (!keys.length) { frag.append(text); return frag; }
    const re = new RegExp(`(${keys.map(escapeRe).join('|')})`, 'gi');
    text.split(re).forEach((part, i) => { if (part) frag.append(i % 2 ? el('mark', null, part) : part); });
    return frag;
  };
  const mentions = (text, keys) => keys.some((k) => text.toLowerCase().includes(k.toLowerCase()));

  /* ---------- Tracing: highlight a technology everywhere it appears ---------- */
  let cleanups = [];
  const bpTabs = [];
  const clearTrace = () => { cleanups.forEach((f) => f()); cleanups = []; };
  const mark = (node, color, cls = 'is-traced') => {
    node.classList.add(cls);
    if (color) node.style.setProperty('--trace', color);
    cleanups.push(() => { node.classList.remove(cls); node.style.removeProperty('--trace'); });
  };
  const trace = (ids) => {
    clearTrace();
    ids.forEach((id) => {
      const t = techById[id];
      if (!t) return;
      const color = `var(--c-${t.cat})`;
      $$('.node-box[data-tech], .tag-btn[data-tech], .item[data-tech]').forEach((n) => {
        if (n.dataset.tech.split(' ').includes(id)) mark(n, color);
      });
      t.roles.forEach((rid) => mark(roleById[rid].el, color));
      bpTabs.forEach((tab) => { if (tab._techs.has(id)) mark(tab, color); });
      const catEl = $(`.cat[data-cat="${t.cat}"]`);
      if (catEl && !catEl.classList.contains('is-open')) mark(catEl, null, 'is-trace-hint');
    });
  };
  const bindTrace = (node, ids) => {
    if (finePointer) {
      node.addEventListener('pointerenter', () => trace(ids));
      node.addEventListener('pointerleave', clearTrace);
    }
    node.addEventListener('focus', () => trace(ids));
    node.addEventListener('blur', clearTrace);
  };

  /* ---------- Detail drawer ---------- */
  const drawer = $('#tech-drawer');
  const panel = $('.drawer-panel', drawer);
  const content = $('.drawer-content', drawer);
  const closeBtn = $('.drawer-close', drawer);
  let lastTrigger = null;
  let selectBp = () => {};
  const bpCards = $$('[data-bp]');

  const linkButton = (code, label, color, onClick) => {
    const b = el('button');
    b.type = 'button';
    if (color) {
      b.style.setProperty('--c-link', color);
      b.append(el('i', 'd-link-dot'), label);
    } else {
      b.append(el('b', null, code), label);
    }
    b.addEventListener('click', onClick);
    return b;
  };

  const fillDrawer = (t) => {
    const u = usage(t);
    const cat = catById[t.cat];
    panel.style.setProperty('--c', `var(--c-${t.cat})`);
    content.classList.remove('is-in');

    const kicker = el('p', 'd-cat');
    kicker.append(el('span', 'd-dot'), cat.label);
    const head = el('div', 'd-head');
    const title = el('h3', 'd-title', t.name);
    title.id = 'drawer-title';
    title.tabIndex = -1;
    head.append(title);

    const stats = el('dl', 'd-stats');
    [['period', `${u.fromYear} – ${u.toLabel}`], ['roles', `${u.roles.length} of ${roles.length}`], ['role tenure', `${u.years} yrs`]]
      .forEach(([k, v]) => { const c = el('div'); c.append(el('dt', null, k), el('dd', null, v)); stats.append(c); });

    const tlTitle = el('h4', 'd-sub', 'Career timeline');
    const timeline = el('div', 'd-timeline');
    timeline.setAttribute('role', 'img');
    timeline.setAttribute('aria-label', `${t.name} used at ${u.roles.map((r) => r.org).join(', ')}`);
    roles.slice().reverse().forEach((r, k) => {
      const row = el('div', `dt-row${t.roles.includes(r.id) ? ' is-used' : ''}`);
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

    const parts = [kicker, head, stats, tlTitle, timeline, whereTitle, list];

    const bps = bpCards.map((card, i) => ({ card, i })).filter(({ i }) => bpTabs[i]?._techs.has(t.id));
    if (bps.length) {
      const wrap = el('div', 'd-links');
      bps.forEach(({ card, i }) => wrap.append(linkButton(String(i + 1).padStart(2, '0'), $('.bp-title', card).textContent, null, () => {
        closeDrawer(false);
        selectBp(i);
        $('#blueprints').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      })));
      parts.push(el('h4', 'd-sub', 'Appears in blueprints'), wrap);
    }

    const related = TECH.filter((x) => x.cat === t.cat && x.id !== t.id);
    if (related.length) {
      const wrap = el('div', 'd-links');
      related.forEach((x) => wrap.append(linkButton(x.code, x.label, `var(--c-${x.cat})`, () => {
        showTech(x.id);
        $('#drawer-title', drawer)?.focus({ preventScroll: true });
      })));
      parts.push(el('h4', 'd-sub', `More in ${cat.label}`), wrap);
    }

    parts.forEach((p, i) => p.style.setProperty('--d', i));
    content.replaceChildren(...parts);
    panel.scrollTop = 0;
    void content.offsetWidth;
    requestAnimationFrame(() => content.classList.add('is-in'));
  };

  function showTech(id, trigger) {
    const t = techById[id];
    if (!t) return;
    if (trigger) lastTrigger = trigger;
    clearTrace();
    fillDrawer(t);
    if (!drawer.classList.contains('is-open')) {
      lock();
      drawer.inert = false;
      drawer.setAttribute('aria-hidden', 'false');
      drawer.classList.add('is-open');
      setTimeout(() => closeBtn.focus({ preventScroll: true }), 60);
    }
  }

  function closeDrawer(restoreFocus = true) {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    unlock();
    if (restoreFocus) lastTrigger?.focus({ preventScroll: true });
  }
  $$('[data-close]', drawer).forEach((n) => n.addEventListener('click', () => closeDrawer()));

  const trapFocus = (e, container) => {
    const focusables = $$('button, a[href], input', container).filter((n) => n.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  /* ---------- Stack legend ---------- */
  const catsEl = $('.cats');
  const setCat = (id) => {
    $$('.cat', catsEl).forEach((w) => {
      const open = w.dataset.cat === id;
      w.classList.toggle('is-open', open);
      $('.cat-btn', w).setAttribute('aria-expanded', String(open));
      $('.cat-panel', w).inert = !open;
    });
  };
  if (catsEl) {
    CATS.forEach((c) => {
      const items = TECH.filter((t) => t.cat === c.id);
      const wrap = el('div', 'cat');
      wrap.dataset.cat = c.id;
      wrap.style.setProperty('--c', `var(--c-${c.id})`);

      const btn = el('button', 'cat-btn');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', `cat-${c.id}`);
      const sign = el('span', 'cat-sign');
      sign.setAttribute('aria-hidden', 'true');
      btn.append(el('span', 'cat-dot'), el('span', 'cat-name', c.label), el('span', 'cat-count', String(items.length)), sign);
      btn.addEventListener('click', () => setCat(wrap.classList.contains('is-open') ? null : c.id));

      const panelEl = el('div', 'cat-panel');
      panelEl.id = `cat-${c.id}`;
      const inner = el('div', 'cat-inner');
      const ul = el('ul', 'items');
      items.forEach((t, i) => {
        const u = usage(t);
        const li = el('li');
        const b = el('button', 'item');
        b.type = 'button';
        b.dataset.tech = t.id;
        b.style.setProperty('--i', i);
        b.title = `${t.name} · ${u.fromYear}–${u.toLabel} · ${u.roles.length} role${u.roles.length > 1 ? 's' : ''}`;
        b.setAttribute('aria-label', `${t.name}, ${u.fromYear} to ${u.toLabel}. Show details`);
        b.append(el('span', 'item-dot'), el('span', 'item-name', t.label), el('span', 'item-yrs', `${u.years} yrs`));
        b.addEventListener('click', () => showTech(t.id, b));
        bindTrace(b, [t.id]);
        li.append(b);
        ul.append(li);
      });
      inner.append(ul);
      panelEl.append(inner);
      wrap.append(btn, panelEl);
      catsEl.append(wrap);
    });
    setCat('sp');
  }

  /* ---------- Tags become buttons ---------- */
  $$('.tags li').forEach((li) => {
    const label = li.textContent.trim();
    const id = techByName.get(norm(label));
    if (!id) return;
    const t = techById[id];
    const b = el('button', 'tag-btn');
    b.type = 'button';
    b.dataset.tech = id;
    b.style.setProperty('--c', `var(--c-${t.cat})`);
    b.append(el('span', 'tag-dot'), label);
    b.setAttribute('aria-label', `${label}: show where it was used`);
    b.addEventListener('click', () => showTech(id, b));
    bindTrace(b, [id]);
    li.replaceChildren(b);
    li.classList.add('is-btn');
  });

  /* ---------- Blueprints ---------- */
  const tabsEl = $('.bp-tabs');
  const SHORT = { 'bp-approvals': 'Approvals', 'bp-spfx': 'SPFx + CI/CD', 'bp-nintex': 'Nintex', 'bp-migration': 'Migration', 'bp-azure': 'Azure + Graph', 'bp-classic': 'SP 2013 app' };
  if (tabsEl && bpCards.length) {
    let current = 0;

    bpCards.forEach((card, ci) => {
      const nodes = $$('.node', card);
      nodes.forEach((li, i) => {
        const ids = (li.dataset.tech || '').split(' ').filter((id) => techById[id]);
        const box = el(ids.length ? 'button' : 'div', 'node-box');
        if (ids.length) {
          box.type = 'button';
          box.dataset.tech = ids.join(' ');
          li.style.setProperty('--c', `var(--c-${techById[ids[0]].cat})`);
          box.setAttribute('aria-label', `${li.textContent.trim().replace(/\s+/g, ' ')}. Uses ${ids.map((id) => techById[id].name).join(', ')}. Show details`);
          box.addEventListener('click', () => showTech(ids[0], box));
          bindTrace(box, ids);
        }
        box.append(...Array.from(li.childNodes));
        box.prepend(el('span', 'node-cat', ids.length ? catById[techById[ids[0]].cat].label : 'Process step'));
        li.removeAttribute('data-tech');
        li.style.setProperty('--i', i * 2);
        li.append(box);
        if (i < nodes.length - 1) {
          const link = el('li', 'link');
          link.setAttribute('aria-hidden', 'true');
          link.style.setProperty('--i', i * 2 + 1);
          link.style.setProperty('--k', i);
          link.append(el('span', 'packet'));
          li.after(link);
        }
      });

      const tab = el('button', 'bp-tab');
      tab.type = 'button';
      tab.id = `tab-${card.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', card.id);
      tab.append(el('span', 'no', String(ci + 1).padStart(2, '0')), SHORT[card.id] || $('.bp-title', card).textContent);
      tab._techs = new Set($$('.node-box[data-tech]', card).flatMap((b) => b.dataset.tech.split(' ')));
      tab.addEventListener('click', () => selectBp(ci));
      card.setAttribute('role', 'tabpanel');
      card.setAttribute('aria-labelledby', tab.id);
      tabsEl.append(tab);
      bpTabs.push(tab);
    });

    const draw = (card) => {
      if (reduceMotion) return;
      card.classList.remove('is-drawing');
      void card.offsetWidth;
      card.classList.add('is-drawing');
    };

    selectBp = (i, focus) => {
      current = i;
      bpTabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      bpCards.forEach((c, k) => { c.hidden = k !== i; });
      draw(bpCards[i]);
      if (focus) bpTabs[i].focus();
      if (tabsEl.scrollWidth > tabsEl.clientWidth) {
        const r = bpTabs[i].getBoundingClientRect();
        const p = tabsEl.getBoundingClientRect();
        tabsEl.scrollBy({ left: r.left - p.left - 24, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    };
    tabsEl.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      selectBp((current + (e.key === 'ArrowRight' ? 1 : -1) + bpCards.length) % bpCards.length, true);
    });

    bpTabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === 0)); t.tabIndex = k === 0 ? 0 : -1; });
    bpCards.forEach((c, k) => { c.hidden = k !== 0; });
    whenVisible($('.bp'), () => draw(bpCards[current]));
  }

  /* ---------- Career rows ---------- */
  const setRole = (r, open) => {
    r.el.classList.toggle('is-open', open);
    $('.rev-head', r.el).setAttribute('aria-expanded', String(open));
    $('.rev-panel', r.el).inert = !open;
  };
  roles.forEach((r) => {
    setRole(r, r.el.classList.contains('is-open'));
    $('.rev-head', r.el).addEventListener('click', () => setRole(r, !r.el.classList.contains('is-open')));
  });

  /* ---------- Search palette ---------- */
  const palette = $('#palette');
  const pInput = $('.palette-input', palette);
  const pList = $('#palette-list', palette);
  let pItems = [];
  let pActive = 0;
  let pReturn = null;

  const scrollTo = (node) => node?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  const ENTRIES = [
    ...TECH.map((t) => {
      const u = usage(t);
      return { group: 'Technologies', code: t.code, dot: true, color: `var(--c-${t.cat})`, label: t.name, meta: `${catById[t.cat].label} · ${u.fromYear}–${u.toLabel}`, keywords: [t.label, catById[t.cat].label, ...(t.aliases || [])].join(' '), run: () => showTech(t.id) };
    }),
    ...bpCards.map((card, i) => ({
      group: 'Blueprints', code: String(i + 1).padStart(2, '0'), label: $('.bp-title', card).textContent, meta: $('.bp-cat', card).textContent,
      keywords: $$('.node-name', card).map((n) => n.textContent).join(' '),
      run: () => { selectBp(i); scrollTo($('#blueprints')); },
    })),
    ...roles.map((r) => ({
      group: 'Career', code: r.no, label: `${r.org} — ${r.title}`, meta: r.dates, keywords: r.summary,
      run: () => { setRole(r, true); scrollTo(r.el); },
    })),
    { group: 'Actions', code: '@', label: 'Email Vishnu', meta: 'vishnu.m70@gmail.com', keywords: 'contact mail', run: () => { window.location.href = 'mailto:vishnu.m70@gmail.com'; } },
    { group: 'Actions', code: 'in', label: 'Open LinkedIn profile', meta: 'linkedin.com', keywords: 'contact', run: () => window.open('https://www.linkedin.com/in/vishnumuralikrishnan', '_blank', 'noopener') },
    { group: 'Actions', code: 'PDF', label: 'Save as PDF', meta: 'print', keywords: 'resume cv download', run: () => setTimeout(() => window.print(), 80) },
    { group: 'Actions', code: '◐', label: 'Toggle light / dark theme', meta: 'theme', keywords: 'dark light mode', run: toggleTheme },
  ];

  const score = (entry, q) => {
    if (!q) return 1;
    const label = entry.label.toLowerCase();
    if (label.startsWith(q) || entry.code.toLowerCase() === q) return 4;
    if (label.split(/[\s(/·—-]+/).some((w) => w.startsWith(q))) return 3;
    if (label.includes(q)) return 2;
    if (`${entry.keywords} ${entry.meta}`.toLowerCase().includes(q)) return 1;
    return 0;
  };

  const setActive = (idx) => {
    if (!pItems.length) { pInput.removeAttribute('aria-activedescendant'); return; }
    pActive = (idx + pItems.length) % pItems.length;
    pItems.forEach(({ li }, i) => li.setAttribute('aria-selected', String(i === pActive)));
    const active = pItems[pActive].li;
    pInput.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  };

  const renderPalette = () => {
    const q = norm(pInput.value);
    const groups = new Map();
    ENTRIES.forEach((entry) => {
      const s = score(entry, q);
      if (!s) return;
      if (!groups.has(entry.group)) groups.set(entry.group, []);
      groups.get(entry.group).push({ entry, s });
    });
    pList.replaceChildren();
    pItems = [];
    groups.forEach((list, group) => {
      const head = el('li', 'pl-group', group);
      head.setAttribute('role', 'presentation');
      pList.append(head);
      list.sort((a, b) => b.s - a.s).forEach(({ entry }) => {
        const idx = pItems.length;
        const li = el('li', 'pl-item');
        li.id = `pl-${idx}`;
        li.setAttribute('role', 'option');
        if (entry.color) li.style.setProperty('--c', entry.color);
        const label = el('span', 'pl-label');
        const at = q ? entry.label.toLowerCase().indexOf(q) : -1;
        if (at >= 0) label.append(entry.label.slice(0, at), el('mark', null, entry.label.slice(at, at + q.length)), entry.label.slice(at + q.length));
        else label.textContent = entry.label;
        li.append(entry.dot ? el('span', 'pl-dot') : el('span', 'pl-code', entry.code), label, el('span', 'pl-meta', entry.meta));
        li.addEventListener('pointermove', () => { if (pActive !== idx) setActive(idx); });
        li.addEventListener('click', () => runEntry(idx));
        pList.append(li);
        pItems.push({ li, entry });
      });
    });
    if (!pItems.length) pList.append(el('li', 'pl-empty', `No match for “${pInput.value}”`));
    setActive(0);
  };

  const openPalette = () => {
    if (palette.classList.contains('is-open')) return;
    if (drawer.classList.contains('is-open')) closeDrawer(false);
    pReturn = document.activeElement;
    lock();
    palette.inert = false;
    palette.setAttribute('aria-hidden', 'false');
    palette.classList.add('is-open');
    pInput.value = '';
    renderPalette();
    setTimeout(() => pInput.focus(), 30);
  };
  const closePalette = (restore = true) => {
    if (!palette.classList.contains('is-open')) return;
    palette.classList.remove('is-open');
    palette.setAttribute('aria-hidden', 'true');
    palette.inert = true;
    unlock();
    if (restore) pReturn?.focus?.({ preventScroll: true });
  };
  function runEntry(idx) {
    const item = pItems[idx];
    if (!item) return;
    closePalette(false);
    item.entry.run();
  }

  pInput.addEventListener('input', renderPalette);
  pInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(pActive + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(pActive - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); runEntry(pActive); }
  });
  $$('[data-palette-close]', palette).forEach((n) => n.addEventListener('click', () => closePalette()));
  $$('[data-palette]').forEach((b) => b.addEventListener('click', openPalette));

  /* ---------- Global keys ---------- */
  const isTyping = (node) => node && (node.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(node.tagName));
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette.classList.contains('is-open')) closePalette(); else openPalette();
      return;
    }
    if (palette.classList.contains('is-open')) {
      if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
      else if (e.key === 'Tab') trapFocus(e, palette);
      return;
    }
    if (drawer.classList.contains('is-open')) {
      if (e.key === 'Escape') closeDrawer();
      else if (e.key === 'Tab') trapFocus(e, panel);
      return;
    }
    if (e.key === '/' && !isTyping(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openPalette();
    }
  });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
