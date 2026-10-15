// HANA — tekst kinetik: fjalët/shkronjat hyjnë me maskë dhe vonesë, numrat numërojnë. I qetë, profesional, i fikur me "reduce motion".
(function (root) {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // [selektori, mënyra]
  const TARGETS = [
    ['.s-slide h1, .s-slide h2', 'chars'],
    ['.s-head h2', 'words'],
    ['.s-page-head h1', 'words'],
    ['.s-cta-band h2', 'words'],
    ['.pm-name', 'words']
  ];

  function split(el, mode) {
    if (el.dataset.fx) return;
    el.dataset.fx = mode;
    el.setAttribute('aria-label', el.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    let n = 0;
    const frag = document.createDocumentFragment();
    el.childNodes.forEach(node => {
      if (node.nodeType !== 3) { frag.appendChild(node.cloneNode(true)); return; }
      node.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'fx-w';
        w.setAttribute('aria-hidden', 'true');
        const pieces = mode === 'chars' ? [...tok] : [tok];
        pieces.forEach(p => {
          const i = document.createElement('span');
          i.className = 'fx-i';
          i.style.setProperty('--i', n++);
          i.textContent = p;
          w.appendChild(i);
        });
        frag.appendChild(w);
      });
    });
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('fx-ready');
  }

  let io = null;
  function observe(el) {
    if (el.closest('.s-slide')) return;             // hero: komandohet nga .is-active
    if (!('IntersectionObserver' in window)) { el.classList.add('fx-in'); return; }
    if (!io) {
      io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target); }
      }), { rootMargin: '0px 0px -10% 0px' });
    }
    io.observe(el);
  }

  // numrat: "30 min" → numëron nga 0 deri 30
  function countUps(scope) {
    (scope || document).querySelectorAll('.s-strip strong').forEach(el => {
      if (el.dataset.cu) return;
      const m = el.textContent.trim().match(/^(\d{1,4})(\s*[A-Za-zë€%+].*)$/);
      if (!m) return;
      el.dataset.cu = '1';
      const target = Number(m[1]), rest = m[2];
      el.textContent = '0' + rest;
      const run = () => {
        const t0 = performance.now(), dur = 1100;
        const step = t => {
          const k = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))) + rest;
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(); io2.disconnect(); } }), { threshold: .6 });
      io2.observe(el);
    });
  }

  function scan(scope) {
    if (reduce) return;
    const rootEl = scope || document;
    TARGETS.forEach(([sel, mode]) => {
      rootEl.querySelectorAll(sel).forEach(el => {
        split(el, mode);
        if (!el.closest('.s-slide')) {
          if (el.closest('.s-page-head')) requestAnimationFrame(() => el.classList.add('fx-in'));
          else observe(el);
        }
      });
    });
    countUps(rootEl);
  }

  root.HanaFx = { scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => scan());
  else scan();
})(window);
