// HANA — ballina: karusel hero, rreshta me rrëshqitje, shfaqje e lehtë në scroll
// Ekspozon window.HanaHome.{heroRefresh, refresh} që t'i thërrasë site-render.js pasi ndryshon përmbajtja nga CMS.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // ---------- Hero karusel ----------
  let heroTimer = null;
  let heroIdx = 0;
  let heroPaused = false;
  let heroAbort = null;

  function initHero() {
    const slidesEl = document.getElementById('heroSlides');
    if (!slidesEl) return;
    if (heroAbort) heroAbort.abort();
    heroAbort = new AbortController();
    const sig = { signal: heroAbort.signal };
    clearInterval(heroTimer);
    heroTimer = null;

    const hero = document.getElementById('ballina');
    const slides = slidesEl.querySelectorAll('.s-slide');
    const dots = document.querySelectorAll('#heroDots .s-dot');
    heroIdx = 0;

    const mark = () => {
      slides.forEach((sl, k) => sl.classList.toggle('is-active', k === heroIdx));
      dots.forEach((d, k) => d.classList.toggle('active', k === heroIdx));
    };
    const go = i => {
      if (!slides.length) return;
      heroIdx = (i + slides.length) % slides.length;
      slidesEl.scrollTo({ left: slidesEl.clientWidth * heroIdx, behavior: reduce ? 'auto' : 'smooth' });
    };
    const setPaused = v => { heroPaused = v; if (hero) hero.classList.toggle('is-paused', v); };
    const start = () => {
      clearInterval(heroTimer);
      if (reduce || slides.length < 2) return;
      heroTimer = setInterval(() => { if (!heroPaused && !document.hidden) go(heroIdx + 1); }, 6500);
    };

    let st;
    slidesEl.addEventListener('scroll', () => {
      clearTimeout(st);
      st = setTimeout(() => { heroIdx = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth); mark(); }, 60);
    }, { passive: true, ...sig });
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); start(); }, sig));
    ['pointerdown', 'touchstart', 'focusin', 'mouseenter'].forEach(e => slidesEl.addEventListener(e, () => setPaused(true), { passive: true, ...sig }));
    ['mouseleave', 'focusout'].forEach(e => slidesEl.addEventListener(e, () => setPaused(false), sig));
    slidesEl.addEventListener('touchend', () => setTimeout(() => setPaused(false), 4000), { passive: true, ...sig });
    window.addEventListener('resize', () => go(heroIdx), sig);

    // dots të fshehura kur ka vetëm një slide
    const dotsEl = document.getElementById('heroDots');
    if (dotsEl) dotsEl.hidden = slides.length < 2;

    mark();
    start();
  }

  // ---------- Shigjetat e rreshtave (delegim) ----------
  document.addEventListener('click', e => {
    const btn = e.target.closest('.s-arrow');
    if (!btn) return;
    const rail = document.getElementById(btn.dataset.rail);
    if (!rail) return;
    rail.scrollBy({ left: Number(btn.dataset.dir) * rail.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  });

  // ---------- Shfaqje e lehtë në scroll ----------
  let io = null;
  function observeReveal() {
    const items = document.querySelectorAll('.s-reveal:not(.in)');
    if (!('IntersectionObserver' in window) || reduce) { items.forEach(el => el.classList.add('in')); return; }
    if (!io) {
      io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { rootMargin: '0px 0px -8% 0px' });
    }
    items.forEach(el => io.observe(el));
  }

  // ---------- Header me hije ----------
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Badge i shportës ----------
  const cartBadge = document.getElementById('cartCount');
  if (cartBadge && 'MutationObserver' in window) {
    new MutationObserver(() => { cartBadge.classList.remove('pop'); void cartBadge.offsetWidth; cartBadge.classList.add('pop'); })
      .observe(cartBadge, { childList: true, characterData: true, subtree: true });
  }

  window.HanaHome = {
    heroRefresh: initHero,
    refresh: observeReveal
  };

  initHero();
  observeReveal();
})();
