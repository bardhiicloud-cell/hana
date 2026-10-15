// HANA — qytetet e shërbimit (Pejë, Prishtinë, ...). Default nga HANA_HOME_DEFAULTS.cities, i mbishkruar nga admini (settings.cities).
(function (root) {
  'use strict';
  const KEY = 'hana_location_city';

  let overrides = null; // array nga STORE_SETTINGS.cities
  let deliveryCfg = {};  // STORE_SETTINGS.deliveryConfig

  const base = () => ((root.HANA_HOME_DEFAULTS && root.HANA_HOME_DEFAULTS.cities) || []);

  function all() {
    const merged = base().map(c => Object.assign({}, c, (overrides || []).find(o => o.id === c.id) || {}));
    (overrides || []).forEach(o => { if (o && o.id && !merged.find(c => c.id === o.id)) merged.push(Object.assign({ active: true, minutes: 30, hours: '08:00–22:00' }, o)); });
    return merged.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  const list = () => all().filter(c => c.active !== false);
  const get = id => all().find(c => c.id === id) || null;
  const name = id => (get(id) || {}).name || (id ? id.charAt(0).toUpperCase() + id.slice(1) : '');

  function current() {
    let id = null;
    try { id = localStorage.getItem(KEY); } catch (e) { /* */ }
    const c = id && list().find(x => x.id === id);
    return c || list()[0] || base()[0] || null;
  }
  function set(id) {
    try { localStorage.setItem(KEY, id); } catch (e) { /* */ }
    document.dispatchEvent(new CustomEvent('hana:city', { detail: { id } }));
  }
  // tarifat: qyteti → cilësimet e dërgesës → default
  function cfg(id) {
    const c = get(id) || current() || {};
    const dc = deliveryCfg || {};
    const pick = (a, b, d) => (a != null && a !== '' ? Number(a) : (b != null && b !== '' ? Number(b) : d));
    return {
      flatFee: pick(c.flatFee, dc.flatFee, 2),
      freeThreshold: pick(c.freeThreshold, dc.freeThreshold, 25),
      minOrder: pick(c.minOrder, dc.minOrder, 0),
      maxOrder: pick(dc.maxOrder, null, 500)
    };
  }
  function ctx(cityObj) {
    const c = cityObj || current() || {};
    return { city: c.name || '', minutes: c.minutes || 30, hours: c.hours || '', freeThreshold: cfg(c.id).freeThreshold, phone: (root.HANA_CONFIG && root.HANA_CONFIG.phone) || '' };
  }

  function distKm(lat1, lng1, lat2, lng2) {
    const R = 6371, rad = x => x * Math.PI / 180;
    const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  // qyteti aktiv më i afërt + distanca në km
  function nearest(lat, lng) {
    let best = null;
    list().forEach(c => {
      if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return;
      const d = distKm(lat, lng, c.lat, c.lng);
      if (!best || d < best.km) best = { city: c, km: d };
    });
    return best;
  }

  // elementet me data-tpl marrin tekstin e plotësuar me qytetin aktual
  function fillDom(scope) {
    const S = root.HanaSite;
    if (!S) return;
    const cx = ctx();
    (scope || document).querySelectorAll('[data-tpl]').forEach(el => { el.textContent = S.fill(el.dataset.tpl, cx); });
  }

  root.HanaCities = {
    all, list, get, name, current, set, ctx, cfg, nearest, distKm, fillDom,
    setOverrides(arr, dc) { overrides = Array.isArray(arr) ? arr : null; deliveryCfg = dc || {}; }
  };
})(window);
