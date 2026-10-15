// HANA — Background automatik i produkteve
// Heq sfondin uniform (i bardhë/gri) të fotos së produktit dhe e lë transparent,
// kështu produkti përshtatet me sfondin e faqes. Punon vetëm për foto të të njëjtit domen.
(function () {
  const cache = new Map();
  const MAX = 420;      // px — madhësia e punës
  const TOL = 44;       // tolerancë ngjyre (distancë RGB)
  const CORNER = 10;    // px — zona e mostrës në qoshe

  const dist = (r, g, b, c) => Math.sqrt((r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2);

  function cornerColor(d, w, h, cx, cy) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = cy; y < cy + CORNER; y++) for (let x = cx; x < cx + CORNER; x++) {
      const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
    return [r / n, g / n, b / n];
  }

  function cut(img) {
    const sc = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(CORNER * 2, Math.round(img.naturalWidth * sc));
    const h = Math.max(CORNER * 2, Math.round(img.naturalHeight * sc));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const im = ctx.getImageData(0, 0, w, h);   // hedh përjashtim nëse foto është cross-origin
    const d = im.data;

    // 4 qoshet duhet të kenë ngjyrë të ngjashme → sfond studio. Përndryshe është skenë: mos e prek.
    const cs = [
      cornerColor(d, w, h, 0, 0), cornerColor(d, w, h, w - CORNER, 0),
      cornerColor(d, w, h, 0, h - CORNER), cornerColor(d, w, h, w - CORNER, h - CORNER)
    ];
    const lum = k => 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
    if (cs.every(k => lum(k) < 80)) return 'dark';   // sfond i zi: përzierje 'lighten' e bën të padukshëm mbi kartën e errët
    const bg = cs[0];
    if (cs.some(k => dist(k[0], k[1], k[2], bg) > 30)) return null;

    // Flood fill nga skajet
    const mask = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (mask[p]) return;
      const i = p * 4;
      if (dist(d[i], d[i + 1], d[i + 2], bg) > TOL) return;
      mask[p] = 1; stack.push(p);
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const p = stack.pop(), x = p % w, y = (p / w) | 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }

    let removed = 0;
    for (let p = 0; p < mask.length; p++) if (mask[p]) removed++;
    const ratio = removed / mask.length;
    if (ratio < 0.08 || ratio > 0.92) return null;   // asgjë për të hequr / pothuajse gjithçka u fshi

    // Alfa + buzë e butë (feather) në kufirin e produktit
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x, i = p * 4;
      if (mask[p]) { d[i + 3] = 0; continue; }
      const edge = (x > 0 && mask[p - 1]) || (x < w - 1 && mask[p + 1]) || (y > 0 && mask[p - w]) || (y < h - 1 && mask[p + w]);
      if (edge) d[i + 3] = 150;
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  }

  function process(img) {
    if (img.dataset.abg || !img.complete || !img.naturalWidth) return;
    img.dataset.abg = '1';
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith('data:')) return;
    const apply = u => {
      if (u === 'dark') img.classList.add('abg-dark');
      else if (u) { img.removeAttribute('srcset'); img.src = u; img.classList.add('abg'); }
    };
    if (cache.has(src)) { apply(cache.get(src)); return; }
    try {
      const url = cut(img);
      cache.set(src, url);
      apply(url);
    } catch (e) { cache.set(src, null); }
  }

  const SEL = '.product-card .product-media img.main-image, #productModalImg, .admin-product-photo';
  function scan(root) {
    (root || document).querySelectorAll(SEL).forEach(img => {
      if (img.complete && img.naturalWidth) process(img);
      else if (!img.dataset.abgWait) { img.dataset.abgWait = '1'; img.addEventListener('load', () => process(img), { once: true }); }
    });
  }

  window.HanaAutoBg = { scan, process };
  new MutationObserver(m => { if (m.some(x => x.addedNodes.length)) scan(); })
    .observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => scan());
  window.addEventListener('load', () => scan());
})();
