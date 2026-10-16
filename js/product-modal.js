// HANA — faqja e produktit (modal): foto, çmim, stok, sasi, shto në shportë, të ngjashme
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Number(n || 0).toFixed(2) + '€';

  let currentId = null;
  let qty = 1;

  function gallery(p) {
    const list = [p.mainImage, p.image, ...(Array.isArray(p.gallery) ? p.gallery : []), ...(Array.isArray(p.images) ? p.images : [])]
      .filter(Boolean);
    return [...new Set(list)].slice(0, 6);
  }

  function stockInfo(p) {
    if (p.availability === 'out_of_stock' || (typeof p.stock === 'number' && p.stock <= 0)) return { cls: 'out', text: 'Jashtë stokut', max: 0 };
    if (typeof p.stock === 'number' && p.stock <= (p.lowStockThreshold || 5)) return { cls: 'low', text: 'Vetëm ' + p.stock + ' copë në stok', max: p.stock };
    return { cls: 'in', text: 'Në stok', max: typeof p.stock === 'number' ? p.stock : 99 };
  }

  function render(p) {
    const H = window.HANA;
    const price = H.priceOf(p);
    const imgs = gallery(p);
    const st = stockInfo(p);
    const HC = window.HanaCities;
    const city = HC && HC.current();
    const catName = (H.getCategories().find(c => c.id === p.category) || {}).name || '';
    const catHref = H.catHref(p.category);
    const wished = H.isWished(p.id);
    const related = H.getProducts().filter(x => x.id !== p.id && x.category === p.category).slice(0, 8);
    const desc = p.fullDesc || p.shortDesc || p.description || '';

    $('#productModalTitle').textContent = p.name;
    $('#productModalBody').innerHTML = `
      <div class="pm">
        <div class="pm-media">
          <div class="pm-stage"><img id="pmImg" class="pm-img" src="${esc(imgs[0] || 'images/hero-premium-bag-400w.webp')}" alt="${esc(p.brand + ' ' + p.name)}" decoding="async"></div>
          ${imgs.length > 1 ? `<div class="pm-thumbs">${imgs.map((src, i) => `<button type="button" class="pm-thumb${i === 0 ? ' active' : ''}" data-src="${esc(src)}" aria-label="Foto ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
        </div>
        <div class="pm-info">
          <span class="pm-brand">${esc(p.brand)}</span>
          <h2 class="pm-name">${esc(p.name)}</h2>
          <div class="pm-price">
            <strong>${fmt(price.finalPrice)}</strong>
            ${price.originalPrice && price.originalPrice > price.finalPrice ? `<s>${fmt(price.originalPrice)}</s><span class="pm-badge">-${price.discount || Math.round((1 - price.finalPrice / price.originalPrice) * 100)}%</span>` : ''}
          </div>
          ${desc ? `<p class="pm-desc">${esc(desc)}</p>` : ''}
          <ul class="pm-facts">
            <li class="pm-stock ${st.cls}"><span class="dot"></span>${esc(st.text)}</li>
            <li>Dorëzim brenda ${esc(city ? city.minutes : 30)} minutash${city ? ' në ' + esc(city.name) : ''}</li>
            <li>Pagesa në dorë kur e merr porosinë</li>
            ${catName ? `<li>Kategoria: <a href="${esc(catHref)}">${esc(catName)}</a></li>` : ''}
          </ul>
          <div class="pm-actions">
            ${st.max > 0 ? `
              <div class="pm-qty" role="group" aria-label="Sasia"><button type="button" id="pmDec" aria-label="Pakëso">−</button><span id="pmQty">1</span><button type="button" id="pmInc" aria-label="Shto">+</button></div>
              <button type="button" class="s-btn s-btn-gold pm-add" id="pmAdd">Shto në shportë · <span id="pmSum">${fmt(price.finalPrice)}</span></button>`
              : `<div class="pm-soldout">Ky produkt nuk është në stok tani.</div>`}
            <button type="button" class="pm-wish pm-share" id="pmShare" aria-label="Ndaj produktin"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/></svg></button>
            <button type="button" class="pm-wish${wished ? ' active' : ''}" id="pmWish" aria-label="Wishlist" aria-pressed="${wished}"><svg width="20" height="20" viewBox="0 0 24 24" fill="${wished ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0l-1.3 1.3-1.3-1.3c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l8 8 8-8c1.5-1.5 1.5-4 0-5.5z"/></svg></button>
          </div>
        </div>
      </div>
      ${related.length ? `<div class="pm-related"><h3>Të ngjashme</h3><div class="pm-rail">${related.map(r => {
        const rp = H.priceOf(r);
        return `<button type="button" class="pm-rel" data-id="${esc(r.id)}"><span class="pm-rel-img"><img src="${esc(r.mainImage || r.image)}" alt="" loading="lazy"></span><span class="pm-rel-name">${esc(r.name)}</span><span class="pm-rel-price">${fmt(rp.finalPrice)}</span></button>`;
      }).join('')}</div></div>` : ''}`;

    const body = $('#productModalBody');
    const maxQty = st.max;
    const sync = () => {
      $('#pmQty') && ($('#pmQty').textContent = qty);
      $('#pmSum') && ($('#pmSum').textContent = fmt(price.finalPrice * qty));
      $('#pmDec') && ($('#pmDec').disabled = qty <= 1);
      $('#pmInc') && ($('#pmInc').disabled = qty >= maxQty);
    };
    sync();
    $('#pmDec')?.addEventListener('click', () => { if (qty > 1) { qty--; sync(); } });
    $('#pmInc')?.addEventListener('click', () => { if (qty < maxQty) { qty++; sync(); } });
    $('#pmAdd')?.addEventListener('click', e => {
      H.addToCart(p.id, qty, $('#pmImg'));
      close();
    });
    $('#pmWish')?.addEventListener('click', e => {
      H.toggleWishlist(p.id);
      const on = H.isWished(p.id);
      const b = e.currentTarget;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
      b.querySelector('svg').setAttribute('fill', on ? 'currentColor' : 'none');
    });
    $('#pmShare')?.addEventListener('click', async () => {
      const url = location.origin + '/market?p=' + encodeURIComponent(p.id);
      try {
        if (navigator.share) { await navigator.share({ title: p.brand + ' ' + p.name, text: p.brand + ' ' + p.name + ' — Hana Free Shop', url }); return; }
        await navigator.clipboard.writeText(url);
        window.dispatchEvent(new CustomEvent('hana:toast', { detail: 'Linku u kopjua' }));
      } catch (e) { /* anuluar */ }
    });
    body.querySelectorAll('.pm-thumb').forEach(t => t.addEventListener('click', () => {
      $('#pmImg').src = t.dataset.src;
      body.querySelectorAll('.pm-thumb').forEach(x => x.classList.toggle('active', x === t));
    }));
    body.querySelectorAll('.pm-rel').forEach(b => b.addEventListener('click', () => open(b.dataset.id)));
    if (window.HanaAutoBg) window.HanaAutoBg.scan(body);
  }

  function open(id) {
    const H = window.HANA;
    if (!H) return;
    const p = H.getProducts().find(x => x.id === id);
    if (!p) return;
    currentId = id; qty = 1;
    if (window.Features100K && Features100K.recentlyViewed) { try { Features100K.recentlyViewed.add(p); } catch (e) { /* */ } }
    render(p);
    if (H.trackView) H.trackView(id);
    $('#productModal').classList.add('open');
    $('#productBackdrop').classList.add('open');
    $('#productModal').setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#productModalBody').scrollTop = 0;
    $('#productModal').scrollTop = 0;
    $('#closeProductModal')?.focus({ preventScroll: true });
  }

  function close() {
    $('#productModal')?.classList.remove('open');
    $('#productBackdrop')?.classList.remove('open');
    $('#productModal')?.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.drawer.open, .modal.open')) document.body.style.overflow = '';
  }

  window.openProductModal = open;
  window.closeProductModal = close;
  document.addEventListener('click', e => {
    if (e.target.closest('#closeProductModal') || e.target.id === 'productBackdrop') close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#productModal')?.classList.contains('open')) close(); });
})();
