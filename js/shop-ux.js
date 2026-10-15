// HANA — përvoja e blerjes: lokacioni, mini-shporta, ekrani i suksesit, ripple, parallax i lehtë
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Number(n || 0).toFixed(2) + '€';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ================= LOKACIONI (GPS) =================
  let loc = null;
  try { loc = JSON.parse(sessionStorage.getItem('hana_geo') || 'null'); } catch (e) { loc = null; }

  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Ky shfletues nuk e mbështet lokacionin. Shkruaj adresën.'));
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), accuracy: Math.round(p.coords.accuracy || 0) }),
        err => {
          const msg = {
            1: 'Lokacioni u refuzua. Mund ta lejosh nga cilësimet e shfletuesit, ose shkruaj adresën.',
            2: 'Lokacioni nuk është i disponueshëm tani. Shkruaj adresën.',
            3: 'Koha për lokacionin skadoi. Provo përsëri ose shkruaj adresën.'
          }[err.code] || 'Nuk u mor lokacioni.';
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  }

  const mapsUrl = l => 'https://www.google.com/maps?q=' + l.lat + ',' + l.lng;

  function setGeoStatus(html, state) {
    const el = $('#coGeoStatus');
    if (!el) return;
    el.innerHTML = html;
    const box = $('#coGeo');
    if (box) { box.classList.remove('ok', 'err', 'busy'); if (state) box.classList.add(state); }
  }

  function resetGeo() {
    if (loc) showGeo(loc);
    else setGeoStatus('Lejo lokacionin që korrieri ta gjejë më shpejt adresën tënde.', '');
  }

  function showGeo(l) {
    const HC = window.HanaCities;
    const near = HC ? HC.nearest(l.lat, l.lng) : null;
    let extra = '';
    if (near && near.km > 40) extra = ' <span class="geo-warn">Duket larg zonave tona (' + esc(near.city.name) + ' ~' + Math.round(near.km) + ' km).</span>';
    setGeoStatus('Lokacioni u ruajt' + (l.accuracy ? ' (±' + l.accuracy + ' m)' : '') + '. <a href="' + mapsUrl(l) + '" target="_blank" rel="noopener">Shiko në hartë</a>.' + extra, 'ok');
    const btn = $('#coLocBtn span');
    if (btn) btn.textContent = 'Përditëso lokacionin';
  }

  async function onLocClick() {
    const btn = $('#coLocBtn');
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    setGeoStatus('Duke kërkuar lokacionin… (lejo kur shfletuesi të pyesë)', 'busy');
    try {
      loc = await locate();
      try { sessionStorage.setItem('hana_geo', JSON.stringify(loc)); } catch (e) { /* */ }
      showGeo(loc);
      // qyteti më i afërt
      const HC = window.HanaCities;
      const near = HC ? HC.nearest(loc.lat, loc.lng) : null;
      if (near && near.km <= 40 && window.HANA && near.city.id !== (HC.current() || {}).id) {
        window.HANA.setCity(near.city.id);
        const sel = $('#coCity'); if (sel) sel.value = near.city.id;
      }
    } catch (e) {
      loc = null;
      try { sessionStorage.removeItem('hana_geo'); } catch (x) { /* */ }
      setGeoStatus(esc(e.message), 'err');
    } finally {
      btn.disabled = false;
    }
  }

  // ================= MINI SHPORTA =================
  let lastCount = 0;
  function cartChanged() {
    const bar = $('#miniCart');
    if (!bar || !window.HANA) return;
    const s = window.HANA.getCartSummary();
    if (s.count <= 0) { bar.hidden = true; lastCount = 0; return; }
    $('#mcCount').textContent = s.count;
    $('#mcTotal').textContent = fmt(s.subtotal);
    const wasHidden = bar.hidden;
    bar.hidden = false;
    if (!reduce && (wasHidden || s.count !== lastCount)) {
      bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
    }
    lastCount = s.count;
  }

  // ================= EKRANI I SUKSESIT =================
  function openSuccess() { $('#successModal')?.classList.add('open'); $('#successBackdrop')?.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSuccess() { $('#successModal')?.classList.remove('open'); $('#successBackdrop')?.classList.remove('open'); document.body.style.overflow = ''; }

  function orderSuccess(o) {
    $('#successMsg').textContent = 'Ne telefonojmë në ' + o.phone + ' për konfirmim. Dorëzimi pritet brenda rreth ' + o.minutes + ' minutash në ' + o.city + '. Total: ' + fmt(o.total) + ' (pagesa në dorë).';
    $('#successId').textContent = o.id;
    const check = $('#successModal .success-check');
    if (check) { check.classList.remove('draw'); void check.getBoundingClientRect(); check.classList.add('draw'); }
    $('#successTrack').onclick = () => { closeSuccess(); window.HANA.openTracking(o.id); };
    openSuccess();
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
  }

  // ================= RIPPLE + HAPTIC =================
  function ripple(e) {
    const t = e.target.closest('.s-btn, .btn, .add-btn, .qty-stepper button, .co-geo-btn, .loc-option, .s-chip');
    if (!t || t.disabled) return;
    if (!reduce) {
      const r = t.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 1.6;
      const s = document.createElement('span');
      s.className = 'rip';
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      if (getComputedStyle(t).position === 'static') t.style.position = 'relative';
      t.style.overflow = t.style.overflow || 'hidden';
      t.appendChild(s);
      setTimeout(() => s.remove(), 650);
    }
    if (navigator.vibrate && t.matches('.add-btn, .qty-stepper button')) navigator.vibrate(8);
  }

  // ================= PARALLAX I LEHTË NË HERO =================
  function initParallax() {
    const hero = $('#ballina');
    if (!hero || reduce) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = hero.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      hero.style.setProperty('--py', Math.max(-30, Math.min(30, -r.top * 0.08)) + 'px');
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // lartësia e cookie banner → mini shporta ngrihet sipër tij
  function syncCookie() {
    const b = $('#cookieBanner');
    const vis = b && getComputedStyle(b).display !== 'none';
    document.documentElement.style.setProperty('--ck', vis ? (b.offsetHeight + 10) + 'px' : '0px');
  }
  const cb = $('#cookieBanner');
  if (cb && 'MutationObserver' in window) new MutationObserver(syncCookie).observe(cb, { attributes: true, attributeFilter: ['style', 'class'] });
  window.addEventListener('resize', syncCookie);
  setTimeout(syncCookie, 800); setTimeout(syncCookie, 2500);

  document.addEventListener('pointerdown', ripple, { passive: true });
  document.addEventListener('click', e => {
    if (e.target.closest('#coLocBtn')) onLocClick();
    if (e.target.closest('#miniCartBtn')) window.HANA && window.HANA.openCart();
    if (e.target.closest('#successClose') || e.target.id === 'successBackdrop') closeSuccess();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSuccess(); });

  window.HanaShopUX = { locate, getLocation: () => loc, resetGeo, cartChanged, orderSuccess, closeSuccess };

  initParallax();
  // mini shporta pas ngarkimit të shportës
  window.addEventListener('load', () => setTimeout(cartChanged, 600));
})();
