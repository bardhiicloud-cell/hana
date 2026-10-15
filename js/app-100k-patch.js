// HANA FREE SHOP — 100K Patch for app.js
// Adds WebP, srcset, LQIP, security, features, animations, pagination, maintenance, etc.

console.log('[100K] Patch loading...');

// Helper: get optimized image with WebP srcset
function getOptimizedImage(originalUrl, width = 400) {
  if(!originalUrl) return 'images/hero-premium-bag-400w.webp';
  // If already WebP with width variant, use it
  if(originalUrl.includes('.webp')) return originalUrl;
  
  // Try to convert .jpg to .webp variant
  const base = originalUrl.replace(/\.(jpg|jpeg|png)$/i, '');
  const webp400 = `${base}-400w.webp`;
  const webp800 = `${base}-800w.webp`;
  const webpOriginal = `${base}.webp`;
  
  // Return object with srcset
  return {
    src: `${base}-400w.webp`,
    srcset: `${webp400} 400w, ${webp800} 800w, ${webpOriginal} 1200w`,
    fallback: originalUrl,
    lqip: `${base}-lqip.jpg`
  };
}

// Helper: sanitize with DOMPurify if available
function safeHtml(str) {
  if(window.DOMPurify) return DOMPurify.sanitize(str);
  if(window.Security) return Security.escapeHtml(str);
  // Fallback escape
  return String(str).replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Helper: count-up animation
function animateCountUp(element, target, duration = 800) {
  if(!element) return;
  const start = parseFloat(element.textContent) || 0;
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * easeOut;
    element.textContent = current.toFixed(2) + '€';
    if(progress < 1) requestAnimationFrame(animate);
    else {
      element.classList.add('animated');
      setTimeout(()=>element.classList.remove('animated'), 300);
    }
  };
  requestAnimationFrame(animate);
}

// Helper: confetti gold
function triggerConfetti(count = 20) {
  const container = document.getElementById('confettiContainer');
  if(!container) return;
  
  for(let i=0; i<count; i++) {
    const confetti = document.createElement('div');
    confetti.className = `confetti gold ${Math.random() > 0.5 ? 'circle' : ''}`;
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
    confetti.style.background = `linear-gradient(135deg, #FFF1C6, #D4AF37)`;
    confetti.style.transform = `rotate(${Math.random()*360}deg)`;
    container.appendChild(confetti);
    setTimeout(()=>confetti.remove(), 4000);
  }
}

// Pagination - limit 20 infinite scroll
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
let isLoadingMore = false;

function getPaginatedProducts(products) {
  return products.slice(0, currentPage * ITEMS_PER_PAGE);
}

function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting && !isLoadingMore) {
        const totalProducts = window.HANA ? window.HANA.getProducts().length : 0;
        if(currentPage * ITEMS_PER_PAGE < totalProducts) {
          isLoadingMore = true;
          // Show skeleton
          const grid = document.getElementById('productGrid');
          if(grid) {
            for(let i=0; i<4; i++) {
              const skel = document.createElement('div');
              skel.className = 'skeleton-card skeleton';
              grid.appendChild(skel);
            }
          }
          setTimeout(() => {
            currentPage++;
            if(window.renderProducts) {
              // Re-render with more items
              const originalRender = window.renderProducts;
              // We'll trigger re-render via event
              document.dispatchEvent(new CustomEvent('loadMoreProducts'));
            }
            isLoadingMore = false;
          }, 600);
        }
      }
    });
  }, {rootMargin: '200px'});
  
  const sentinel = document.createElement('div');
  sentinel.id = 'infinite-sentinel';
  sentinel.style.height = '1px';
  document.body.appendChild(sentinel);
  observer.observe(sentinel);
}

// Enhanced cart with time slots, express, coupons
function init100KCartEnhancements() {
  // Time slots
  const timeSlotsContainer = document.getElementById('timeSlots');
  if(timeSlotsContainer && window.Features100K) {
    const slots = Features100K.timeSlots.getAll();
    const selected = Features100K.timeSlots.getSelected();
    timeSlotsContainer.innerHTML = slots.map(slot => `
      <button class="time-slot-btn ${selected?.id === slot.id ? 'active' : ''}" data-slot="${slot.id}" style="padding:10px;border-radius:10px;border:1px solid ${selected?.id === slot.id ? 'var(--gold-400)' : 'var(--border)'};background:${selected?.id === slot.id ? 'rgba(232,198,122,0.15)' : 'var(--bg-3)'};text-align:left;transition:0.2s;">
        <div style="font-weight:700;font-size:12px;">${slot.label}</div>
        <div style="font-size:11px;color:var(--text-3);">${slot.time}</div>
        ${slot.price > 0 ? `<div style="font-size:11px;color:var(--gold-300);">+${slot.price}€</div>` : ''}
      </button>
    `).join('');
    
    timeSlotsContainer.querySelectorAll('.time-slot-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slotId = btn.dataset.slot;
        Features100K.timeSlots.select(slotId);
        timeSlotsContainer.querySelectorAll('.time-slot-btn').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = 'var(--border)';
          b.style.background = 'var(--bg-3)';
        });
        btn.classList.add('active');
        btn.style.borderColor = 'var(--gold-400)';
        btn.style.background = 'rgba(232,198,122,0.15)';
        if(window.updateCartTotals) window.updateCartTotals();
        if(window.haptic) haptic('selection');
      });
    });
  }

  // Express toggle
  const expressToggle = document.getElementById('expressToggle');
  const expressSlider = document.getElementById('expressSlider');
  const expressRow = document.getElementById('expressRow');
  if(expressToggle && window.Features100K) {
    expressToggle.checked = Features100K.expressDelivery.isEnabled();
    if(expressToggle.checked && expressRow) expressRow.style.display = 'flex';
    if(expressSlider) {
      expressSlider.style.transform = expressToggle.checked ? 'translateX(20px)' : 'translateX(0)';
      expressSlider.style.background = expressToggle.checked ? 'var(--gold-400)' : 'white';
    }
    
    expressToggle.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      Features100K.expressDelivery.toggle(enabled);
      if(expressRow) expressRow.style.display = enabled ? 'flex' : 'none';
      if(expressSlider) {
        expressSlider.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
        expressSlider.style.background = enabled ? 'var(--gold-400)' : 'white';
      }
      if(window.updateCartTotals) window.updateCartTotals();
      if(window.haptic) haptic(enabled ? 'success' : 'light');
    });
  }

  // Coupons list
  const couponList = document.getElementById('couponList');
  if(couponList && window.Features100K) {
    Features100K.coupons.getActive().then(coupons => {
      couponList.innerHTML = coupons.slice(0,3).map(c => `
        <button class="coupon-chip" data-code="${c.code}" style="padding:6px 10px;background:rgba(232,198,122,0.12);border:1px dashed rgba(232,198,122,0.3);border-radius:999px;font-size:11px;font-weight:600;color:var(--gold-300);cursor:pointer;">
          ${c.code} - ${c.discount}${c.type === 'percent' ? '%' : '€'}
        </button>
      `).join('');
      
      couponList.querySelectorAll('.coupon-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const input = document.getElementById('discountInput');
          if(input) {
            input.value = chip.dataset.code;
            document.getElementById('discountApply')?.click();
          }
        });
      });
    });
  }

  // Gift message preview
  const giftNoteText = document.getElementById('giftNoteText');
  const giftPreview = document.getElementById('giftPreview');
  if(giftNoteText && giftPreview && window.Features100K) {
    giftNoteText.value = Features100K.giftMessage.get();
    giftNoteText.addEventListener('input', (e) => {
      Features100K.giftMessage.set(e.target.value);
      giftPreview.innerHTML = Features100K.giftMessage.preview();
    });
    // Initial preview
    if(giftNoteText.value) giftPreview.innerHTML = Features100K.giftMessage.preview();
  }

  // Abandoned cart check
  if(window.Features100K) {
    Features100K.abandonedCart.markActive();
    setInterval(() => Features100K.abandonedCart.markActive(), 30000);
  }
}

// Recently viewed
function initRecentlyViewed() {
  if(!window.Features100K) return;
  const recent = Features100K.recentlyViewed.get();
  const section = document.getElementById('recentlyViewedSection');
  const grid = document.getElementById('recentlyViewedGrid');
  if(recent.length > 0 && section && grid) {
    section.style.display = 'block';
    grid.innerHTML = recent.slice(0,6).map(p => `
      <article class="product-card" data-id="${p.id}" style="cursor:pointer;">
        <div class="product-media">
          <img src="${p.image || 'images/hero-premium-bag-400w.webp'}" alt="${safeHtml(p.name)}" loading="lazy" decoding="async" style="width:100%;height:140px;object-fit:cover;">
        </div>
        <div class="product-info">
          <span class="product-brand">${safeHtml(p.brand || '')}</span>
          <h3 class="product-name">${safeHtml(p.name)}</h3>
          <div class="product-prices"><span class="price-new gold">${p.price}€</span></div>
        </div>
      </article>
    `).join('');
    
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        if(window.openProductModal) window.openProductModal(id);
      });
    });
  }
}

// Product modal with zoom, video, similar, reviews
window.openProductModal = function(productId) {
  const products = window.HANA ? window.HANA.getProducts() : [];
  const product = products.find(p => p.id === productId);
  if(!product) return;
  
  // Add to recently viewed
  if(window.Features100K) Features100K.recentlyViewed.add(product);
  
  const modal = document.getElementById('productModal');
  const backdrop = document.getElementById('productBackdrop');
  const title = document.getElementById('productModalTitle');
  const body = document.getElementById('productModalBody');
  
  if(!modal || !body) return;
  
  title.textContent = product.name;
  
  const priceInfo = product.price;
  const similar = window.Features100K ? Features100K.similarProducts.get(product, products, 4) : [];
  
  body.innerHTML = `
    <div>
      <div class="image-wrapper" style="border-radius:16px;overflow:hidden;background:var(--bg-2);aspect-ratio:1;">
        <img src="${product.image}" alt="${safeHtml(product.name)}" style="width:100%;height:100%;object-fit:cover;cursor:zoom-in;" id="productModalImg" loading="eager" decoding="async">
      </div>
      ${product.video ? `<div style="margin-top:12px;border-radius:12px;overflow:hidden;aspect-ratio:16/9;background:var(--bg-2);">${Features100K.videoGallery.render(product.video)}</div>` : ''}
      <div style="margin-top:16px;display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;">
        ${(product.images || [product.image]).slice(0,5).map(img => `
          <img src="${img}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid transparent;" onclick="document.getElementById('productModalImg').src=this.src" loading="lazy">
        `).join('')}
      </div>
    </div>
    <div>
      <div style="font-size:12px;letter-spacing:0.1em;color:var(--gold-300);font-weight:700;">${safeHtml(product.brand)}</div>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:600;margin:8px 0;line-height:1.2;">${safeHtml(product.name)}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin:12px 0;">
        <span style="font-size:22px;font-weight:800;color:var(--gold-300);">${priceInfo}€</span>
        ${product.originalPrice ? `<span style="font-size:14px;color:var(--text-4);text-decoration:line-through;">${product.originalPrice}€</span>` : ''}
        ${product.discount ? `<span style="background:var(--gold-400);color:#1A1200;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">-${product.discount}%</span>` : ''}
      </div>
      <p style="font-size:14px;color:var(--text-2);line-height:1.6;margin:12px 0;">${safeHtml(product.description || 'Produkt premium nga koleksioni Hana Free Shop. Cilësi e garantuar, origjinale 100%.')}</p>
      
      <div style="margin:16px 0;padding:12px;background:var(--bg-2);border-radius:12px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;">📦 ${product.stock > 10 ? 'Në stok' : product.stock > 0 ? `Vetëm ${product.stock} në stok` : 'Jashtë stokut'} • 🚚 Dërgesë e shpejtë</div>
        <div style="font-size:12px;color:var(--text-3);">Kategoria: ${safeHtml(product.category)} • Marka: ${safeHtml(product.brand)}</div>
      </div>

      <div style="display:flex;gap:10px;margin:16px 0;">
        <button class="btn btn-gold full magnetic" onclick="window.addToCartEnhanced('${product.id}')" style="flex:2;">🛒 Shto në shportë</button>
        <button class="icon-btn" onclick="Features100K.wishlist.add('${product.id}');this.innerHTML='❤️'" style="width:48px;height:48px;border-radius:12px;background:var(--bg-2);border:1px solid var(--border);">🤍</button>
      </div>

      ${similar.length > 0 ? `
        <div style="margin-top:20px;">
          <h4 style="font-size:14px;font-weight:700;margin-bottom:10px;">✨ Produkte të ngjashme</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${similar.map(p => `
              <div style="background:var(--bg-2);border-radius:10px;padding:8px;cursor:pointer;display:flex;gap:8px;align-items:center;" onclick="openProductModal('${p.id}')">
                <img src="${p.image}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;" loading="lazy">
                <div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${safeHtml(p.name)}</div><div style="font-size:11px;color:var(--gold-300);">${p.price}€</div></div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div id="productReviews" style="margin-top:20px;">
        <h4 style="font-size:14px;font-weight:700;margin-bottom:10px;">⭐ Vlerësime</h4>
        <div style="font-size:13px;color:var(--text-3);">Vlerësime nga klientët tanë • 4.9/5 • Mbi 5000 klientë të kënaqur</div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <select id="reviewRating" style="background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text-1);">
            <option value="5">★★★★★ 5</option>
            <option value="4">★★★★ 4</option>
            <option value="3">★★★ 3</option>
            <option value="2">★★ 2</option>
            <option value="1">★ 1</option>
          </select>
          <input id="reviewComment" placeholder="Komenti juaj..." style="flex:1;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text-1);">
          <button class="btn btn-sm btn-gold" onclick="Features100K.reviews.add('${product.id}', parseInt(document.getElementById('reviewRating').value), document.getElementById('reviewComment').value, 'Anonim'); alert('Faleminderit për vlerësimin!')">Dërgo</button>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Zoom functionality
  const img = document.getElementById('productModalImg');
  if(img) {
    img.addEventListener('click', () => {
      img.style.transform = img.style.transform === 'scale(2)' ? 'scale(1)' : 'scale(2)';
      img.style.cursor = img.style.transform === 'scale(2)' ? 'zoom-out' : 'zoom-in';
      img.style.transition = 'transform 0.3s ease';
    });
  }
  
  if(window.Security) Security.logAudit('product_view', {productId});
};

// Close product modal
function closeProductModal() {
  document.getElementById('productModal')?.classList.remove('open');
  document.getElementById('productBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('closeProductModal')?.addEventListener('click', closeProductModal);
document.getElementById('productBackdrop')?.addEventListener('click', closeProductModal);

// Enhanced add to cart with all features
window.addToCartEnhanced = function(productId) {
  const products = window.HANA ? window.HANA.getProducts() : [];
  const product = products.find(p => p.id === productId);
  if(!product) return;
  
  // Find the product card image for fly animation
  const card = document.querySelector(`[data-id="${productId}"]`);
  const img = card?.querySelector('img');
  
  if(window.addToCart) {
    // Use existing addToCart if available
    const event = new CustomEvent('addToCart', {detail: {id: productId, img}});
    document.dispatchEvent(event);
  }
  
  // Trigger confetti on first add
  if(Math.random() > 0.7) triggerConfetti(15);
  
  // Haptic
  if(window.haptic) haptic('success');
  
  // Update recently viewed
  initRecentlyViewed();
  
  // Close modal
  closeProductModal();
};

// Maintenance mode check
function checkMaintenanceMode() {
  // Check if STORE_SETTINGS has maintenanceMode
  const check = () => {
    if(window.STORE_SETTINGS && window.STORE_SETTINGS.maintenanceMode) {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:grid;place-items:center;background:var(--bg-0);color:var(--text-1);text-align:center;padding:20px;">
          <div>
            <div style="width:80px;height:80px;background:var(--gold-gradient);border-radius:20px;display:grid;place-items:center;margin:0 auto 20px;font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:700;color:#1A1200;">H</div>
            <h1 style="font-family:'Cormorant Garamond',serif;font-size:32px;margin-bottom:12px;">Punime në progres</h1>
            <p style="color:var(--text-2);max-width:400px;margin:0 auto;">Hana Free Shop është në mirëmbajtje për të sjellë përvojë edhe më të mirë. Kthehemi së shpejti!</p>
            <p style="margin-top:16px;color:var(--gold-300);">📞 +383 48 588 886</p>
          </div>
        </div>
      `;
    }
  };
  
  // Check on load and every 30s
  setTimeout(check, 1000);
  setInterval(check, 30000);
}

// Cookie banner GDPR
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if(!banner) return;
  
  const consent = localStorage.getItem('hana_cookie_consent');
  if(!consent) {
    setTimeout(() => {
      banner.style.display = 'flex';
      banner.style.animation = 'pageEnter 0.4s ease';
    }, 2000);
  }
  
  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('hana_cookie_consent', 'accepted');
    banner.style.display = 'none';
    if(window.Security) Security.logAudit('cookie_consent', {choice: 'accepted'});
  });
  
  document.getElementById('cookieDecline')?.addEventListener('click', () => {
    localStorage.setItem('hana_cookie_consent', 'declined');
    banner.style.display = 'none';
    if(window.Security) Security.logAudit('cookie_consent', {choice: 'declined'});
  });
}

// Invoice PDF generation (simple)
window.generateInvoicePDF = function(order) {
  // In production, use jsPDF
  const content = `
HANA FREE SHOP - FATURA
-----------------------
ID: ${order.trackingId || order.id}
Data: ${new Date(order.createdAt).toLocaleString('sq-AL')}
Klienti: ${order.customer?.name}
Telefoni: ${order.customer?.phone}
Email: ${order.customer?.email}
Adresa: ${order.customer?.address}

Produktet:
${order.items?.map(item => `- ${item.name} x${item.qty} = ${item.price * item.qty}€`).join('\n')}

Nëntotali: ${order.subtotal}€
Dërgesa: ${order.deliveryFee}€
Totali: ${order.total}€

Faleminderit për besimin!
+383 48 588 886
  `;
  
  const blob = new Blob([content], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fatura-${order.trackingId || order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  if(window.Security) Security.logAudit('invoice_generated', {orderId: order.id});
};

// Enhanced checkout with guest, saved address, gift message, time slot, express, coupons
function enhanceCheckout() {
  const guestBtn = document.getElementById('guestCheckoutBtn');
  const saveAddressCheck = document.getElementById('saveAddressCheck');
  const coGiftMsg = document.getElementById('coGiftMsg');
  const giftMsgPreview = document.getElementById('giftMsgPreview');
  
  if(guestBtn && window.Features100K) {
    guestBtn.addEventListener('click', () => {
      Features100K.guestCheckout.enable();
      guestBtn.textContent = '✓ Vizitor - Vazhdoni';
      guestBtn.style.background = 'var(--gold-gradient)';
      if(window.haptic) haptic('success');
    });
  }
  
  if(coGiftMsg && giftMsgPreview && window.Features100K) {
    coGiftMsg.addEventListener('input', (e) => {
      Features100K.giftMessage.set(e.target.value);
      giftMsgPreview.innerHTML = Features100K.giftMessage.preview();
    });
  }
  
  // Saved addresses
  const useSavedBtn = document.getElementById('useSavedAddressBtn');
  if(useSavedBtn && window.Features100K) {
    const saved = Features100K.savedAddresses.getDefault();
    if(saved) {
      useSavedBtn.style.display = 'inline-flex';
      useSavedBtn.addEventListener('click', () => {
        document.getElementById('coName').value = saved.name || '';
        document.getElementById('coPhone').value = saved.phone || '';
        document.getElementById('coEmail').value = saved.email || '';
        document.getElementById('coAddress').value = saved.address || '';
        document.getElementById('coCity').value = saved.city || 'peje';
        toast('Adresa e ruajtur u ngarkua', 'gold');
      });
    }
  }
  
  // Save address on order
  const originalPlaceOrder = document.getElementById('placeOrderBtn');
  if(originalPlaceOrder) {
    originalPlaceOrder.addEventListener('click', () => {
      if(saveAddressCheck?.checked && window.Features100K) {
        const address = {
          name: document.getElementById('coName')?.value,
          phone: document.getElementById('coPhone')?.value,
          email: document.getElementById('coEmail')?.value,
          address: document.getElementById('coAddress')?.value,
          city: document.getElementById('coCity')?.value,
          isDefault: true
        };
        Features100K.savedAddresses.save(address);
      }
    });
  }
}

// Initialize all 100K enhancements after main app init
function init100KEnhancements() {
  console.log('[100K] Initializing enhancements...');
  
  // Wait for main app to init
  setTimeout(() => {
    init100KCartEnhancements();
    initRecentlyViewed();
    initCookieBanner();
    checkMaintenanceMode();
    enhanceCheckout();
    setupInfiniteScroll();
    
    // Enhance existing product cards with WebP and LQIP
    document.querySelectorAll('.product-card img').forEach(img => {
      if(!img.dataset.enhanced) {
        img.loading = 'lazy';
        img.decoding = 'async';
        img.dataset.enhanced = '1';
        
        // Add LQIP wrapper if not exists
        if(!img.closest('.image-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'image-wrapper';
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          
          // Add LQIP placeholder
          const lqip = document.createElement('img');
          lqip.className = 'lqip';
          lqip.src = img.src.replace(/\.(jpg|webp)$/, '-lqip.jpg');
          lqip.alt = '';
          lqip.loading = 'eager';
          wrapper.insertBefore(lqip, img);
          
          img.classList.add('main-image');
          img.addEventListener('load', () => {
            img.classList.add('loaded');
            lqip.classList.add('hidden');
          });
        }
      }
    });
    
    console.log('[100K] Enhancements initialized - 100k ready');
  }, 1500);
}

// Run after DOM and main app
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init100KEnhancements, 2000));
} else {
  setTimeout(init100KEnhancements, 2000);
}

// Also listen for products loaded
document.addEventListener('productsLoaded', init100KEnhancements);
window.addEventListener('load', () => setTimeout(init100KEnhancements, 1000));

// Export for global
window.getOptimizedImage = getOptimizedImage;
window.triggerConfetti = triggerConfetti;
window.animateCountUp = animateCountUp;
