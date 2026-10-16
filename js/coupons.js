// HANA — kuponët: lista vjen nga admini (settings.coupons) ose nga default-et (HANA_HOME_DEFAULTS.coupons)
// Tipet: percent (%), fixed (€), freeship (dërgesë falas)
(function (root) {
  'use strict';
  const norm = c => String(c || '').trim().toUpperCase();
  let overrides = null;
  const defaults = () => (root.HANA_HOME_DEFAULTS && root.HANA_HOME_DEFAULTS.coupons) || [];
  const list = () => (Array.isArray(overrides) ? overrides : defaults()).filter(c => c && c.code);
  const find = code => { const k = norm(code); return list().find(c => norm(c.code) === k) || null; };
  const money = n => Number(n).toFixed(2).replace(/\.00$/, '') + '€';

  function describe(c) {
    if (c.type === 'percent') return '-' + Number(c.value) + '% zbritje';
    if (c.type === 'fixed') return '-' + money(c.value) + ' zbritje';
    return 'Dërgesë falas';
  }

  function validate(code, subtotal) {
    const c = find(code);
    if (!c || c.active === false) return { valid: false, error: 'Ky kod nuk është i vlefshëm.' };
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { valid: false, error: 'Ky kod ka skaduar.' };
    if (c.minOrder && Number(subtotal) < Number(c.minOrder)) return { valid: false, error: 'Ky kod kërkon porosi minimale ' + money(c.minOrder) + '.' };
    return { valid: true, coupon: c };
  }

  root.HanaCoupons = { list, find, validate, describe, setOverrides(a) { overrides = Array.isArray(a) ? a : null; } };
})(window);
