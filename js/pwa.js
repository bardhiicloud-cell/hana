// HANA FREE SHOP — PWA Module for 100k Daily Services
// Install prompt, touch gestures, haptic, bottom nav badge bounce, search autocomplete

const PWA = {
  deferredPrompt: null,
  isInstalled: false,

  init() {
    this.registerSW();
    this.setupInstallPrompt();
    this.setupTouchGestures();
    this.setupHaptics();
    this.setupSearchAutocomplete();
    this.setupScrollProgress();
    this.setupCursorFollower();
    this.setupHeroParallax();
    this.setupStaggerObserver();
    this.setup3DTilt();
    this.setupMagneticButtons();
    console.log('[PWA] Initialized for 100k');
  },

  // Service Worker registration
  async registerSW() {
    if('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {scope: '/'});
        console.log('[PWA] SW registered', reg.scope);
        
        // Check for updates every 1 hour
        setInterval(() => reg.update(), 60*60*1000);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if(newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateToast();
            }
          });
        });
      } catch(e) {
        console.warn('[PWA] SW registration failed', e);
      }
    }
  },

  showUpdateToast() {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
      background:var(--bg-3);border:1px solid var(--border-strong);
      padding:12px 18px;border-radius:999px;z-index:9999;
      display:flex;align-items:center;gap:12px;
      box-shadow:0 8px 30px rgba(0,0,0,0.4);
      animation: cartSpring 0.5s cubic-bezier(.34,1.56,.64,1);
    `;
    toast.innerHTML = `
      <span style="color:var(--gold-300);font-size:13px;font-weight:600;">Version i ri disponueshëm</span>
      <button onclick="location.reload()" style="background:var(--gold-gradient);color:#1A1200;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;">Rifresko</button>
    `;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(), 8000);
  },

  // Install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] Install prompt ready');
      // Show custom install banner after 30s if not dismissed
      setTimeout(() => this.showInstallBanner(), 30000);
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('[PWA] App installed');
      if(window.Security) Security.logAudit('pwa_installed', {});
    });

    // Check if already installed
    if(window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  },

  showInstallBanner() {
    if(this.isInstalled || !this.deferredPrompt || localStorage.getItem('hana_pwa_dismissed')) return;
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.style.cssText = `
      position:fixed;bottom:90px;left:16px;right:16px;max-width:400px;margin:0 auto;
      background:linear-gradient(135deg,var(--bg-3),var(--bg-2));
      border:1px solid var(--border-strong);border-radius:18px;
      padding:16px;z-index:9998;display:flex;align-items:center;gap:14px;
      box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 0 1px rgba(232,198,122,0.15);
      animation: cartSpring 0.6s cubic-bezier(.34,1.56,.64,1);
    `;
    banner.innerHTML = `
      <div style="width:48px;height:48px;background:var(--gold-gradient);border-radius:12px;display:grid;place-items:center;font-family:'Cormorant Garamond',serif;font-weight:700;font-size:20px;color:#1A1200;flex-shrink:0;">H</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:14px;color:var(--text-1);">Instalo Hana Free Shop</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px;">Qasje e shpejtë, oferta ekskluzive, offline</div>
      </div>
      <button id="pwa-install-btn" style="background:var(--gold-gradient);color:#1A1200;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;flex-shrink:0;">Instalo</button>
      <button id="pwa-dismiss-btn" style="width:28px;height:28px;display:grid;place-items:center;background:rgba(255,255,255,0.08);border-radius:50%;flex-shrink:0;">✕</button>
    `;
    document.body.appendChild(banner);

    banner.querySelector('#pwa-install-btn').addEventListener('click', async () => {
      if(!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      const {outcome} = await this.deferredPrompt.userChoice;
      console.log('[PWA] Install outcome', outcome);
      if(window.Security) Security.logAudit('pwa_prompt', {outcome});
      this.deferredPrompt = null;
      banner.remove();
    });

    banner.querySelector('#pwa-dismiss-btn').addEventListener('click', () => {
      localStorage.setItem('hana_pwa_dismissed', '1');
      banner.remove();
    });
  },

  async promptInstall() {
    if(this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const {outcome} = await this.deferredPrompt.userChoice;
      return outcome;
    }
    return 'unavailable';
  },

  // Touch gestures — swipe hero, pull-to-refresh
  setupTouchGestures() {
    let startX = 0, startY = 0, currentX = 0;
    let isPulling = false;
    const hero = document.querySelector('.hero');
    const threshold = 80;

    // Hero swipe
    if(hero) {
      hero.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, {passive: true});

      hero.addEventListener('touchmove', e => {
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        const diffY = e.touches[0].clientY - startY;
        if(Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
          hero.style.transform = `translateX(${diffX * 0.3}px)`;
        }
      }, {passive: true});

      hero.addEventListener('touchend', e => {
        const diffX = currentX - startX;
        hero.style.transform = '';
        hero.style.transition = 'transform 0.3s cubic-bezier(.22,.61,.36,1)';
        setTimeout(()=>hero.style.transition='', 300);
        if(Math.abs(diffX) > threshold) {
          // Trigger hero slide change if multiple slides
          if(window.changeHeroSlide) {
            if(diffX < 0) window.changeHeroSlide(1);
            else window.changeHeroSlide(-1);
          }
        }
        startX = 0; currentX = 0;
      }, {passive: true});
    }

    // Pull to refresh (simple)
    let pullStartY = 0;
    document.addEventListener('touchstart', e => {
      if(window.scrollY === 0) {
        pullStartY = e.touches[0].clientY;
        isPulling = true;
      }
    }, {passive: true});

    document.addEventListener('touchmove', e => {
      if(!isPulling) return;
      const pullY = e.touches[0].clientY - pullStartY;
      if(pullY > 0 && pullY < 120 && window.scrollY === 0) {
        const progress = document.querySelector('.scroll-progress-bar');
        if(progress) {
          progress.style.width = `${Math.min(pullY, 100)}%`;
          progress.style.opacity = '0.6';
        }
      }
    }, {passive: true});

    document.addEventListener('touchend', e => {
      if(!isPulling) return;
      const pullY = e.changedTouches[0].clientY - pullStartY;
      isPulling = false;
      const progress = document.querySelector('.scroll-progress-bar');
      if(progress) {
        progress.style.width = '0%';
        progress.style.opacity = '1';
      }
      if(pullY > 80 && window.scrollY === 0) {
        location.reload();
      }
      pullStartY = 0;
    }, {passive: true});
  },

  // Haptic feedback
  setupHaptics() {
    this.haptic = (type = 'light') => {
      if(!('vibrate' in navigator)) return;
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [20, 30, 20],
        error: [50, 30, 50],
        selection: [10]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    };

    // Add haptic to buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('button, .product-card, .cat-card');
      if(btn) this.haptic('light');
    });

    window.haptic = this.haptic;
  },

  // Search autocomplete with typo tolerance (Fuse.js lite)
  setupSearchAutocomplete() {
    const searchInput = document.querySelector('#searchInput, .search-field input');
    if(!searchInput) return;

    let autocompleteEl = null;
    const createAutocomplete = () => {
      if(autocompleteEl) return autocompleteEl;
      autocompleteEl = document.createElement('div');
      autocompleteEl.id = 'search-autocomplete';
      autocompleteEl.style.cssText = `
        position:absolute;top:100%;left:0;right:0;margin-top:8px;
        background:var(--bg-2);border:1px solid var(--border);
        border-radius:16px;overflow:hidden;z-index:100;
        box-shadow:0 12px 40px rgba(0,0,0,0.4);
        max-height:320px;overflow-y:auto;display:none;
      `;
      const wrapper = searchInput.closest('.search-wrap, .search-field');
      if(wrapper) {
        wrapper.style.position = 'relative';
        wrapper.appendChild(autocompleteEl);
      }
      return autocompleteEl;
    };

    // Simple typo-tolerant search (Levenshtein lite)
    const fuzzyMatch = (query, text) => {
      query = query.toLowerCase();
      text = text.toLowerCase();
      if(text.includes(query)) return 100;
      // Simple fuzzy: count matching chars in order
      let qIdx = 0, score = 0;
      for(let i=0; i<text.length && qIdx < query.length; i++) {
        if(text[i] === query[qIdx]) { score++; qIdx++; }
      }
      return (score / query.length) * 70;
    };

    let debounceTimer = null;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();
      if(query.length < 2) {
        if(autocompleteEl) autocompleteEl.style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(() => {
        const products = window.allProducts || window.products || [];
        const results = products
          .map(p => ({product: p, score: Math.max(
            fuzzyMatch(query, p.name || ''),
            fuzzyMatch(query, p.brand || ''),
            fuzzyMatch(query, p.category || '')
          )}))
          .filter(r => r.score > 30)
          .sort((a,b) => b.score - a.score)
          .slice(0, 6);

        const el = createAutocomplete();
        if(results.length === 0) {
          el.innerHTML = `<div style="padding:14px;color:var(--text-3);font-size:13px;">Nuk u gjet asgjë për "${Security ? Security.escapeHtml(query) : query}"</div>`;
          el.style.display = 'block';
          return;
        }
        el.innerHTML = results.map(r => `
          <div class="autocomplete-item" data-id="${r.product.id}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;transition:0.2s;border-bottom:1px solid rgba(255,255,255,0.05);">
            <img src="${r.product.image || r.product.images?.[0] || 'images/hero-premium-bag-400w.webp'}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;" loading="lazy">
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Security ? Security.escapeHtml(r.product.name) : r.product.name}</div>
              <div style="font-size:11px;color:var(--text-3);">${Security ? Security.escapeHtml(r.product.brand || r.product.category) : (r.product.brand || r.product.category)} • ${r.product.price}€</div>
            </div>
            <div style="font-size:11px;color:var(--gold-300);">${Math.round(r.score)}%</div>
          </div>
        `).join('');
        el.style.display = 'block';

        el.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.dataset.id;
            if(window.openProductModal) window.openProductModal(id);
            el.style.display = 'none';
            searchInput.value = '';
          });
        });
      }, 250);
    });

    // Hide on outside click
    document.addEventListener('click', e => {
      if(autocompleteEl && !e.target.closest('#search-autocomplete') && !e.target.closest('.search-field')) {
        autocompleteEl.style.display = 'none';
      }
    });
  },

  // Scroll progress bar
  setupScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    if(!progressBar) return;
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    };
    window.addEventListener('scroll', updateProgress, {passive: true});
    updateProgress();
  },

  // Cursor follower (desktop only)
  setupCursorFollower() {
    if(window.innerWidth < 768) return;
    const follower = document.querySelector('.cursor-follower');
    if(!follower) return;
    
    let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;
    
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      follower.classList.remove('hidden');
    });

    document.addEventListener('mouseleave', () => {
      follower.classList.add('hidden');
    });

    const animate = () => {
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      follower.style.left = `${followerX}px`;
      follower.style.top = `${followerY}px`;
      requestAnimationFrame(animate);
    };
    animate();

    // Active on interactive elements
    document.addEventListener('mouseover', e => {
      if(e.target.closest('button, a, .product-card, .cat-card')) {
        follower.classList.add('active');
      }
    });
    document.addEventListener('mouseout', e => {
      if(e.target.closest('button, a, .product-card, .cat-card')) {
        follower.classList.remove('active');
      }
    });
  },

  // Hero parallax scrollY*0.3
  setupHeroParallax() {
    const heroBg = document.querySelector('.hero-bg');
    if(!heroBg) return;
    
    let ticking = false;
    const updateParallax = () => {
      const scrollY = window.scrollY;
      const hero = document.querySelector('.hero');
      if(!hero) return;
      const heroTop = hero.offsetTop;
      const heroHeight = hero.offsetHeight;
      
      if(scrollY < heroTop + heroHeight) {
        const parallaxY = scrollY * 0.3;
        const scale = 1.02 + (scrollY * 0.0001);
        heroBg.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(${scale})`;
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if(!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, {passive: true});
  },

  // Stagger observer
  setupStaggerObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.classList.add('stagger-container');
        }
      });
    }, {threshold: 0.1, rootMargin: '0px 0px -50px 0px'});

    document.querySelectorAll('.categories, .products-grid, .brands-grid, .reveal').forEach(el => {
      observer.observe(el);
    });
  },

  // 3D Tilt
  setup3DTilt() {
    document.querySelectorAll('.product-card, .tilt-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.setProperty('--tilt-x', `${rotateX}deg`);
        card.style.setProperty('--tilt-y', `${rotateY}deg`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  },

  // Magnetic buttons
  setupMagneticButtons() {
    document.querySelectorAll('.magnetic, .gold-cta, .btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--mag-x', `${x * 0.15}px`);
        btn.style.setProperty('--mag-y', `${y * 0.15}px`);
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mag-x', '0px');
        btn.style.setProperty('--mag-y', '0px');
      });
    });
  },

  // Bottom nav badge bounce
  bounceBadge(selector) {
    const badge = document.querySelector(selector);
    if(!badge) return;
    badge.style.animation = 'none';
    badge.offsetHeight; // Trigger reflow
    badge.style.animation = 'cartSpring 0.6s cubic-bezier(.34,1.56,.64,1)';
  }
};

document.addEventListener('DOMContentLoaded', () => PWA.init());
window.PWA = PWA;
