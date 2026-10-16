// HANA — aksesueshmëri: kapje e fokusit te dritaret/sirtaret, kthim i fokusit, Escape
(function () {
  'use strict';
  const SEL = '.modal, .drawer, .location-modal, .search-overlay';
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const stack = [];   // [{el, opener}]

  const visible = el => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
  const focusables = el => [...el.querySelectorAll(FOCUSABLE)].filter(visible);

  function onOpen(el) {
    if (stack.find(s => s.el === el)) return;
    stack.push({ el, opener: document.activeElement });
    setTimeout(() => {
      if (!el.contains(document.activeElement)) {
        const f = focusables(el)[0];
        if (f) f.focus({ preventScroll: true });
      }
    }, 60);
  }
  function onClose(el) {
    const i = stack.findIndex(s => s.el === el);
    if (i < 0) return;
    const { opener } = stack.splice(i, 1)[0];
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  }

  const mo = new MutationObserver(ms => ms.forEach(m => {
    const el = m.target;
    if (!el.matches || !el.matches(SEL)) return;
    const was = (m.oldValue || '').split(/\s+/).includes('open');
    const now = el.classList.contains('open');
    if (!was && now) onOpen(el);
    else if (was && !now) onClose(el);
  }));

  function watch() {
    document.querySelectorAll(SEL).forEach(el => mo.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
  }
  watch();
  document.addEventListener('DOMContentLoaded', watch);

  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !stack.length) return;
    const top = stack[stack.length - 1].el;
    const f = focusables(top);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!top.contains(document.activeElement)) { first.focus(); e.preventDefault(); return; }
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
})();
