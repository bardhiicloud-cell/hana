// HANA — render i përmbajtjes së faqes kryesore nga CMS (admin → Faqja Kryesore / Hero / Cilësimet)
// Funksione të pastra (kthejnë HTML) + apply() që i vendos në faqe.
// E njëjta logjikë përdoret nga scripts/build-pages.py (Node) për HTML-në fillestare (SEO / pa JS).
(function (root) {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lines = s => esc(s).replace(/\r?\n/g, '<br>');
  // lejo vetëm lidhje të sigurta (jo javascript:)
  const href = h => {
    const v = String(h == null ? '' : h).trim();
    return /^(\/|#|https?:\/\/|tel:|mailto:)/i.test(v) ? esc(v) : '#';
  };
  // {city} {minutes} {hours} {freeThreshold} {phone} → vlerat e qytetit të zgjedhur
  const fill = (s, ctx) => (typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, k) => (ctx && ctx[k] != null ? String(ctx[k]) : m)) : s);
  const deepFill = (o, ctx) => Array.isArray(o) ? o.map(x => deepFill(x, ctx))
    : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deepFill(v, ctx)]))
    : fill(o, ctx);
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  const ICONS = {
    clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cash: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6h13v10H1zM14 10h5l3 3v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>'
  };

  // ---------- konfigurimi ----------
  function merge(base, over) {
    if (Array.isArray(over)) return over.slice();
    if (over && typeof over === 'object' && base && typeof base === 'object' && !Array.isArray(base)) {
      const out = Object.assign({}, base);
      Object.keys(over).forEach(k => { out[k] = merge(base[k], over[k]); });
      return out;
    }
    return over === undefined ? base : over;
  }
  const buildConfig = (defaults, settings) => merge(defaults, (settings && settings.homepage) || {});

  function contactFrom(defaults, settings, city) {
    const d = (defaults && defaults.contact) || {};
    const s = settings || {};
    const ci = s.contactInfo || {};
    const phone = s.phone || ci.phone || d.phone || '';
    const wa = String(s.whatsapp || d.whatsapp || phone).replace(/\D/g, '');
    const mon = s.openingHours && s.openingHours.monday;
    const hours = mon && !mon.closed && mon.open && mon.close ? 'Çdo ditë ' + mon.open + '–' + mon.close : (d.hours || '');
    return {
      phone,
      tel: String(phone).replace(/[^\d+]/g, ''),
      whatsapp: wa,
      address: city ? (city.address || (city.primary ? (ci.address || s.address || d.address || '') : '')) : (ci.address || s.address || d.address || ''),
      hours: city && city.hours ? 'Çdo ditë ' + city.hours : hours,
      delivery: d.delivery || '',
      social: Object.assign({}, d.social || {}, s.socialLinks || {}, s.socialMedia && (s.socialMedia.facebook || s.socialMedia.instagram || s.socialMedia.tiktok) ? s.socialMedia : {})
    };
  }

  // ---------- hero ----------
  function activeHero(list, now) {
    now = now || new Date();
    return (list || [])
      .filter(h => h && h.visible !== false && (h.status || 'published') === 'published')
      .filter(h => !(h.scheduleStart && new Date(h.scheduleStart) > now))
      .filter(h => !(h.scheduleEnd && new Date(h.scheduleEnd) < now))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  const FOCAL = { center: 'center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center' };

  function imgParts(path) {
    const m = String(path || '').match(/^(images\/hero-[\w-]+)\.(?:jpg|jpeg|png|webp)$/i);
    if (m) {
      return {
        src: m[1] + '-1200w.webp',
        srcset: m[1] + '-800w.webp 800w, ' + m[1] + '-1200w.webp 1200w'
      };
    }
    return { src: String(path || ''), srcset: '' };
  }

  function slideHtml(h, i) {
    const tag = i === 0 ? 'h1' : 'h2';
    const d = imgParts(h.desktopImage);
    const mob = h.mobileImage && h.mobileImage !== h.desktopImage ? imgParts(h.mobileImage) : null;
    const ov = Math.min(0.95, Math.max(0.1, num(h.overlayIntensity, 0.6)));
    const align = ['left', 'center', 'right'].includes(h.textAlign) ? h.textAlign : 'left';
    const pos = FOCAL[h.focalPoint] || 'center';
    const load = i === 0 ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
    const alt = esc(String(h.headline || '').replace(/\r?\n/g, ' '));
    const btn1 = h.primaryBtnText ? '<a class="s-btn s-btn-gold" href="' + href(h.primaryBtnLink) + '">' + esc(h.primaryBtnText) + '</a>' : '';
    const btn2 = h.secondaryBtnText ? '<a class="s-btn s-btn-ghost" href="' + href(h.secondaryBtnLink) + '">' + esc(h.secondaryBtnText) + '</a>' : '';
    return '<article class="s-slide ta-' + align + '" style="--ov:' + ov + '">' +
      '<picture>' +
      (mob ? '<source media="(max-width:700px)"' + (mob.srcset ? ' srcset="' + esc(mob.srcset) + '" sizes="100vw"' : ' srcset="' + esc(mob.src) + '"') + '>' : '') +
      (d.srcset ? '<source type="image/webp" srcset="' + esc(d.srcset) + '" sizes="(max-width:1280px) 100vw, 1280px">' : '') +
      '<img src="' + esc(d.src) + '" alt="' + alt + '" width="1200" height="800" style="object-position:' + pos + '" ' + load + '>' +
      '</picture>' +
      '<div class="s-hero-body">' +
      (h.eyebrow ? '<span class="s-eyebrow">' + esc(h.eyebrow) + '</span>' : '<span></span>') +
      '<' + tag + '>' + lines(h.headline) + '</' + tag + '>' +
      (h.subtext ? '<p>' + esc(h.subtext) + '</p>' : '<p></p>') +
      '<div class="s-cta">' + btn1 + btn2 + '</div>' +
      '</div></article>';
  }

  const F = {
    hero(list) {
      const slides = list.map(slideHtml).join('');
      const dots = list.map((_, i) => '<button type="button" class="s-dot' + (i === 0 ? ' active' : '') + '" aria-label="Slide ' + (i + 1) + '"></button>').join('');
      return { slides, dots };
    },
    strip(cfg) {
      return (cfg.strip.items || []).map(it =>
        '<div><span class="s-strip-ic">' + (ICONS[it.icon] || ICONS.star) + '</span><strong>' + esc(it.value) + '</strong><span>' + esc(it.label) + '</span></div>').join('');
    },
    marquee(cfg) {
      const items = (cfg.brands.items || []).map(b => '<span>' + esc(b) + '</span>').join('');
      return items + items;
    },
    head(sec, arrowsFor) {
      const arrows = arrowsFor ? '<div class="s-arrows"><button type="button" class="s-arrow" data-rail="' + arrowsFor + '" data-dir="-1" aria-label="Mbrapa">‹</button><button type="button" class="s-arrow" data-rail="' + arrowsFor + '" data-dir="1" aria-label="Para">›</button></div>' : '';
      return '<div class="s-head"><div>' +
        (sec.kicker ? '<span class="s-kicker">' + esc(sec.kicker) + '</span>' : '') +
        '<h2>' + esc(sec.title) + '</h2></div>' + arrows +
        (sec.linkText ? '<a href="' + href(sec.linkHref) + '" class="s-link">' + esc(sec.linkText) + '</a>' : '') + '</div>';
    },
    categories(sec) { return F.head(sec) + '<div class="cat-track" id="catTrack"></div>'; },
    offers(sec) {
      return F.head(sec, 'productGrid') + '<div class="product-grid s-rail" id="productGrid"></div>' +
        '<div class="empty-state" id="emptyState" style="display:none"><h3>Nuk ka oferta për momentin</h3><p>Shiko të gjitha produktet.</p><a class="s-btn s-btn-gold" href="/market">Produktet</a></div>';
    },
    best(sec) { return F.head(sec, 'popularGrid') + '<div class="product-grid s-rail" id="popularGrid"></div>'; },
    steps(sec) {
      return F.head(sec) + '<ol class="s-steps">' + (sec.items || []).map((it, i) =>
        '<li><span class="s-step-n">' + (i + 1) + '</span><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></li>').join('') + '</ol>';
    },
    why(sec) {
      return F.head(sec) + '<div class="s-why-grid">' + (sec.items || []).map(it =>
        '<div><h3>' + esc(it.title) + '</h3><p>' + esc(it.text) + '</p></div>').join('') + '</div>';
    },
    cta(sec, c) {
      return '<div><h2>' + esc(sec.title) + '</h2><p>' + esc(sec.text) + '</p></div>' +
        '<div class="s-cta">' +
        (sec.primaryText ? '<a class="s-btn s-btn-gold" href="' + href(sec.primaryHref) + '">' + esc(sec.primaryText) + '</a>' : '') +
        (c.phone ? '<a class="s-btn s-btn-ghost" href="tel:' + esc(c.tel) + '">' + esc(c.phone) + '</a>' : '') +
        (c.whatsapp ? '<a class="s-btn s-btn-ghost" href="https://wa.me/' + esc(c.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') +
        '</div>';
    },
    footer(c, cats) {
      const social = Object.entries(c.social || {}).filter(([, v]) => v && /^https?:\/\//.test(v))
        .map(([k, v]) => '<a href="' + esc(v) + '" target="_blank" rel="noopener">' + esc(k.charAt(0).toUpperCase() + k.slice(1)) + '</a>').join('');
      return '<div class="s-footer-grid">' +
        '<div><div class="s-footer-brand">HANA <span>FREE SHOP</span></div>' +
        '<p>' + esc(c.address) + '<br>' + esc(c.hours) + (c.delivery ? '<br>' + esc(c.delivery) : '') + '</p>' +
        '<p>' + (c.phone ? '<a href="tel:' + esc(c.tel) + '">' + esc(c.phone) + '</a>' : '') +
        (c.whatsapp ? ' · <a href="https://wa.me/' + esc(c.whatsapp) + '" rel="noopener" target="_blank">WhatsApp</a>' : '') + '</p></div>' +
        '<div><h4>Kategoritë</h4>' + (cats || []).map(k => '<a href="' + href(k.href) + '">' + esc(k.name) + '</a>').join('') + '</div>' +
        '<div><h4>Informacion</h4><a href="/shipping.html">Dërgesa</a><a href="/returns.html">Kthimet</a><a href="/terms.html">Kushtet</a><a href="/privacy.html">Privatësia</a>' + social + '</div>' +
        '</div><div class="s-footer-bottom">© ' + new Date().getFullYear() + ' Hana Free Shop. Të gjitha të drejtat e rezervuara.</div>';
    }
  };

  // ---------- apply (vetëm shfletues) ----------
  function setSection(id, sec, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = sec.visible === false;
    el.style.order = String(num(sec.order, 0));
    if (html != null) el.innerHTML = html;
  }

  function apply(data) {
    if (typeof document === 'undefined') return;
    const defaults = root.HANA_HOME_DEFAULTS || {};
    const settings = data.settings || {};
    const HC = root.HanaCities;
    const city = HC ? HC.current() : null;
    const ctx = HC ? HC.ctx() : {};
    const cfg = deepFill(buildConfig(defaults, settings), ctx);
    const contact = deepFill(contactFrom(defaults, settings, city), ctx);
    root.HANA_HOMECFG = cfg;

    // hero: nga koleksioni `hero` (admin → Hero & Banners); nëse bosh, përdor default
    const heroList = deepFill(activeHero(data.hero && data.hero.length ? data.hero : defaults.hero), ctx);
    const slidesEl = document.getElementById('heroSlides');
    if (slidesEl && heroList.length) {
      const h = F.hero(heroList);
      if (slidesEl.innerHTML.replace(/\s+/g, '') !== h.slides.replace(/\s+/g, '')) {
        slidesEl.innerHTML = h.slides;
        const dotsEl = document.getElementById('heroDots');
        if (dotsEl) dotsEl.innerHTML = h.dots;
        slidesEl.scrollLeft = 0;
        if (root.HanaHome) root.HanaHome.heroRefresh();
      }
    }

    const strip = document.getElementById('hm-strip');
    if (strip) { strip.hidden = cfg.strip.visible === false; strip.innerHTML = F.strip(cfg); }
    const mq = document.getElementById('hm-marquee');
    if (mq) { mq.hidden = cfg.brands.visible === false; const tr = mq.querySelector('.s-marquee-track'); if (tr) tr.innerHTML = F.marquee(cfg); }

    const S = cfg.sections;
    setSection('kategorite', S.categories, F.categories(S.categories));
    setSection('ofertat', S.offers, F.offers(S.offers));
    setSection('best', S.best, F.best(S.best));
    setSection('si-funksionon', S.steps, F.steps(S.steps));
    setSection('hm-why', S.why, F.why(S.why));
    setSection('hm-cta', S.cta, F.cta(S.cta, contact));

    const footer = document.getElementById('siteFooter');
    if (footer) footer.innerHTML = F.footer(contact, data.categories || []);

    if (root.HanaHome) root.HanaHome.refresh();
  }

  root.HanaSite = { F, ICONS, esc, href, merge, fill, deepFill, buildConfig, contactFrom, activeHero, apply };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HanaSite;
})(typeof window !== 'undefined' ? window : globalThis);
