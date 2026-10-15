// HANA — ballina: karusel hero, rreshta me rrëshqitje, shfaqje e lehtë në scroll
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // ---- Hero karusel
  const slidesEl = document.getElementById('heroSlides');
  if (slidesEl) {
    const slides = slidesEl.querySelectorAll('.s-slide');
    const dots = document.querySelectorAll('#heroDots .s-dot');
    let idx = 0, timer = null, paused = false;
    const go = i => {
      idx = (i + slides.length) % slides.length;
      slidesEl.scrollTo({ left: slidesEl.clientWidth * idx, behavior: reduce ? 'auto' : 'smooth' });
    };
    const hero = document.getElementById('ballina');
    const mark = () => {
      slides.forEach((sl, k) => sl.classList.toggle('is-active', k === idx));
      dots.forEach((d, k) => d.classList.toggle('active', k === idx));
    };
    const sync = () => {
      idx = Math.round(slidesEl.scrollLeft / slidesEl.clientWidth);
      mark();
    };
    mark();
    let st;
    slidesEl.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(sync, 60); }, { passive: true });
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      if (reduce) return;
      stop();
      timer = setInterval(() => { if (!paused && !document.hidden) go(idx + 1); }, 6500);
    };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); start(); }));
    const setPaused = v => { paused = v; hero && hero.classList.toggle('is-paused', v); };
    ['pointerdown', 'touchstart', 'focusin', 'mouseenter'].forEach(e => slidesEl.addEventListener(e, () => setPaused(true), { passive: true }));
    ['mouseleave', 'focusout'].forEach(e => slidesEl.addEventListener(e, () => setPaused(false)));
    slidesEl.addEventListener('touchend', () => { setTimeout(() => setPaused(false), 4000); }, { passive: true });
    window.addEventListener('resize', () => go(idx));
    start();
  }

  // ---- Header me hije kur bën scroll
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Badge i shportës bën "pop" kur ndryshon
  const cartBadge = document.getElementById('cartCount');
  if (cartBadge && 'MutationObserver' in window) {
    new MutationObserver(() => { cartBadge.classList.remove('pop'); void cartBadge.offsetWidth; cartBadge.classList.add('pop'); })
      .observe(cartBadge, { childList: true, characterData: true, subtree: true });
  }

  // ---- Shigjetat e rreshtave
  document.querySelectorAll('.s-arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const rail = document.getElementById(btn.dataset.rail);
      if (!rail) return;
      rail.scrollBy({ left: Number(btn.dataset.dir) * rail.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // ---- Shfaqje e lehtë në scroll (një herë)
  const items = document.querySelectorAll('.s-reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach(el => io.observe(el));
  } else {
    items.forEach(el => el.classList.add('in'));
  }
})();
