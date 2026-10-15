// HANA FREE SHOP — SUPER HUGE LOGIC X100 — 100% LOGIC — ULTRA PREMIUM
// Make everything super huge with 100% logic, super professional, another level

const SuperHugeLogic = {
  // SUPER HUGE HERO LOGIC — 100% LOGIC
  hero: {
    init() {
      console.log('[Super Huge] Hero init 100% logic');
      const hero = document.querySelector('.hero.super-huge-hero');
      if(!hero) return;
      
      // Super huge parallax with 100% logic
      let ticking = false;
      const updateParallax = () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight;
        const progress = Math.min(scrollY / heroHeight, 1);
        
        // Parallax layers with 100% logic
        const bg = hero.querySelector('.hero-bg');
        const content = hero.querySelector('.hero-content');
        const visual = hero.querySelector('.hero-visual');
        
        if(bg) {
          const y = scrollY * 0.4;
          const scale = 1.02 + progress * 0.08;
          const blur = progress * 4;
          bg.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
          bg.style.filter = `blur(${blur}px) brightness(${1 - progress*0.2})`;
        }
        
        if(content) {
          const y = scrollY * 0.2;
          const opacity = 1 - progress * 0.6;
          const scale = 1 - progress * 0.05;
          content.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
          content.style.opacity = opacity;
        }
        
        if(visual) {
          const y = scrollY * 0.3;
          const rotate = progress * 5;
          visual.style.transform = `translate3d(0, ${y}px, 0) rotate(${rotate}deg)`;
        }
        
        ticking = false;
      };
      
      window.addEventListener('scroll', () => {
        if(!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      }, {passive: true});
      
      // Super huge hero slide auto with 100% logic
      this.initSlides();
    },
    
    initSlides() {
      const slides = document.querySelectorAll('.hero-slide');
      const dots = document.querySelectorAll('.hero-dots .dot');
      let current = 0;
      let timer = null;
      
      const goTo = (index) => {
        slides.forEach((s, i) => {
          s.classList.toggle('active', i === index);
          if(i === index) {
            s.style.animation = 'superHugeIn 0.8s cubic-bezier(.16,1,.3,1) forwards';
          }
        });
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
        current = index;
        
        // Super huge confetti on slide change 10% chance
        if(Math.random() > 0.9 && typeof triggerConfetti !== 'undefined') {
          triggerConfetti(10);
        }
      };
      
      const next = () => goTo((current + 1) % slides.length);
      const prev = () => goTo((current - 1 + slides.length) % slides.length);
      
      // Auto slide every 6s with 100% logic
      const startAuto = () => {
        timer = setInterval(next, 6000);
      };
      const stopAuto = () => clearInterval(timer);
      
      startAuto();
      
      // Pause on hover with 100% logic
      const hero = document.querySelector('.hero');
      if(hero) {
        hero.addEventListener('mouseenter', stopAuto);
        hero.addEventListener('mouseleave', startAuto);
      }
      
      // Dots click with 100% logic
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          stopAuto();
          goTo(i);
          startAuto();
          if(typeof haptic !== 'undefined') haptic('selection');
        });
      });
      
      // Arrows with 100% logic
      document.getElementById('heroPrev')?.addEventListener('click', () => {
        stopAuto(); prev(); startAuto();
        if(typeof haptic !== 'undefined') haptic('light');
      });
      document.getElementById('heroNext')?.addEventListener('click', () => {
        stopAuto(); next(); startAuto();
        if(typeof haptic !== 'undefined') haptic('light');
      });
      
      window.changeHeroSlide = (dir) => dir > 0 ? next() : prev();
    }
  },
  
  // SUPER HUGE CATEGORIES LOGIC — 100% LOGIC
  categories: {
    init() {
      console.log('[Super Huge] Categories init 100% logic');
      const track = document.querySelector('.cat-track.super-huge-track');
      if(!track) return;
      
      // Super huge drag scroll with 100% logic
      let isDown = false;
      let startX, scrollLeft;
      
      track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.classList.add('dragging');
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
      });
      
      track.addEventListener('mouseleave', () => {
        isDown = false;
        track.classList.remove('dragging');
      });
      
      track.addEventListener('mouseup', () => {
        isDown = false;
        track.classList.remove('dragging');
      });
      
      track.addEventListener('mousemove', (e) => {
        if(!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 2;
        track.scrollLeft = scrollLeft - walk;
      });
      
      // Super huge stagger animation with 100% logic
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
          if(entry.isIntersecting) {
            entry.target.style.animationDelay = `${idx * 0.08}s`;
            entry.target.classList.add('super-huge-anim');
            observer.unobserve(entry.target);
          }
        });
      }, {threshold: 0.1});
      
      track.querySelectorAll('.cat-item').forEach(item => observer.observe(item));
    }
  },
  
  // SUPER HUGE PRODUCTS LOGIC — 100% LOGIC
  products: {
    init() {
      console.log('[Super Huge] Products init 100% logic');
      
      // Super huge 3D tilt with 100% logic
      document.querySelectorAll('.product-card.super-huge-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = (y - centerY) / 8;
          const rotateY = (centerX - x) / 8;
          const scale = 1.02;
          
          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(${scale})`;
          card.style.setProperty('--tilt-x', `${rotateX}deg`);
          card.style.setProperty('--tilt-y', `${rotateY}deg`);
        });
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = '';
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
        
        // Super huge magnetic add button with 100% logic
        const addBtn = card.querySelector('.add-btn');
        if(addBtn) {
          addBtn.addEventListener('mousemove', (e) => {
            const rect = addBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width/2;
            const y = e.clientY - rect.top - rect.height/2;
            addBtn.style.transform = `translate(${x*0.2}px, ${y*0.2}px) scale(1.1)`;
          });
          addBtn.addEventListener('mouseleave', () => {
            addBtn.style.transform = '';
          });
        }
      });
      
      // Super huge infinite scroll with 100% logic
      this.initInfiniteScroll();
    },
    
    initInfiniteScroll() {
      let page = 1;
      const limit = 20;
      let loading = false;
      
      const sentinel = document.createElement('div');
      sentinel.id = 'super-huge-sentinel';
      sentinel.style.height = '1px';
      document.body.appendChild(sentinel);
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting && !loading) {
            const total = window.HANA ? window.HANA.getProducts().length : 0;
            if(page * limit < total) {
              loading = true;
              // Show super huge skeleton
              const grid = document.getElementById('productGrid');
              if(grid) {
                for(let i=0; i<4; i++) {
                  const skel = document.createElement('div');
                  skel.className = 'product-card super-huge-card skeleton';
                  skel.innerHTML = `<div class="product-media skeleton" style="height:240px"></div><div class="product-info"><div class="skeleton-text short"></div><div class="skeleton-text medium"></div></div>`;
                  skel.style.animationDelay = `${i*0.08}s`;
                  grid.appendChild(skel);
                }
              }
              
              setTimeout(() => {
                page++;
                document.dispatchEvent(new CustomEvent('superHugeLoadMore', {detail: {page, limit}}));
                loading = false;
                // Remove skeletons
                document.querySelectorAll('.product-card.skeleton').forEach(el => el.remove());
              }, 800);
            }
          }
        });
      }, {rootMargin: '400px'});
      
      observer.observe(sentinel);
    }
  },
  
  // SUPER HUGE CART LOGIC — 100% LOGIC
  cart: {
    init() {
      console.log('[Super Huge] Cart init 100% logic');
      
      // Super huge cart fly with 100% logic — 900ms spring
      window.superHugeCartFly = (productId, startEl) => {
        const product = window.HANA ? window.HANA.getProducts().find(p => p.id === productId) : null;
        if(!product || !startEl) return;
        
        const cartBtn = document.getElementById('cartBtn');
        const fab = document.getElementById('fab');
        const target = cartBtn || fab;
        if(!target) return;
        
        const startRect = startEl.getBoundingClientRect();
        const endRect = target.getBoundingClientRect();
        
        const fly = document.createElement('div');
        fly.className = 'cart-fly super-huge-fly';
        fly.style.left = startRect.left + 'px';
        fly.style.top = startRect.top + 'px';
        fly.style.width = '80px';
        fly.style.height = '80px';
        fly.innerHTML = `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;box-shadow:0 12px 40px rgba(0,0,0,0.5),0 0 0 2px rgba(232,198,122,0.3)">`;
        document.body.appendChild(fly);
        
        const deltaX = endRect.left - startRect.left;
        const deltaY = endRect.top - startRect.top;
        
        fly.style.setProperty('--fly-x', `${deltaX*0.3}px`);
        fly.style.setProperty('--fly-y', `${deltaY*0.2 - 60}px`);
        fly.style.setProperty('--fly-end-x', `${deltaX}px`);
        fly.style.setProperty('--fly-end-y', `${deltaY}px`);
        
        fly.animate([
          {transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1},
          {transform: `translate(${deltaX*0.3}px, ${deltaY*0.2 - 60}px) scale(0.8) rotate(180deg)`, opacity: 1, offset: 0.5},
          {transform: `translate(${deltaX}px, ${deltaY}px) scale(0.15) rotate(720deg)`, opacity: 0}
        ], {
          duration: 900,
          easing: 'cubic-bezier(.16,1,.3,1)'
        }).onfinish = () => {
          fly.remove();
          // Bounce with super huge spring
          target.animate([
            {transform: 'scale(1)'},
            {transform: 'scale(1.3)'},
            {transform: 'scale(0.9)'},
            {transform: 'scale(1.15)'},
            {transform: 'scale(1)'}
          ], {
            duration: 700,
            easing: 'cubic-bezier(.34,1.56,.64,1)'
          });
          
          if(typeof haptic !== 'undefined') haptic('success');
          if(typeof triggerConfetti !== 'undefined' && Math.random() > 0.6) triggerConfetti(15);
        };
      };
    }
  },
  
  // SUPER HUGE CHECKOUT LOGIC — 100% LOGIC
  checkout: {
    init() {
      console.log('[Super Huge] Checkout init 100% logic');
      
      // Super huge form validation with 100% logic
      const form = document.querySelector('.checkout-form');
      if(!form) return;
      
      const fields = {
        name: {el: document.getElementById('coName'), required: true, min: 3, pattern: /^[a-zA-ZëËçÇ\s]+$/, msg: 'Emri min 3 shkronja, vetëm shkronja'},
        phone: {el: document.getElementById('coPhone'), required: true, min: 8, pattern: /^\+?[\d\s\-\(\)]{8,20}$/, msg: 'Telefoni obligativ +383...'},
        email: {el: document.getElementById('coEmail'), required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: 'Email korrekt obligativ'},
        address: {el: document.getElementById('coAddress'), required: true, min: 8, msg: 'Adresa e plotë obligative min 8'},
      };
      
      Object.entries(fields).forEach(([key, field]) => {
        if(!field.el) return;
        
        const validate = () => {
          const value = field.el.value.trim();
          let valid = true;
          let error = '';
          
          if(field.required && !value) {
            valid = false;
            error = `${key} obligativ`;
          } else if(field.min && value.length < field.min) {
            valid = false;
            error = field.msg;
          } else if(field.pattern && !field.pattern.test(value)) {
            valid = false;
            error = field.msg;
          }
          
          field.el.style.borderColor = valid ? 'rgba(255,255,255,0.08)' : 'rgba(255,59,59,0.5)';
          field.el.style.boxShadow = valid ? '' : '0 0 0 4px rgba(255,59,59,0.1)';
          
          let errorEl = field.el.parentElement.querySelector('.field-error');
          if(!valid) {
            if(!errorEl) {
              errorEl = document.createElement('div');
              errorEl.className = 'field-error';
              errorEl.style.cssText = 'font-size:11px;color:#FCA5A5;margin-top:6px;display:flex;align-items:center;gap:4px';
              field.el.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = `❌ ${error}`;
          } else if(errorEl) {
            errorEl.remove();
          }
          
          return valid;
        };
        
        field.el.addEventListener('blur', validate);
        field.el.addEventListener('input', () => {
          if(field.el.style.borderColor.includes('255,59,59')) validate();
        });
      });
    }
  },
  
  // SUPER HUGE ANIMATIONS LOGIC — 100% LOGIC
  animations: {
    init() {
      console.log('[Super Huge] Animations init 100% logic');
      
      // Super huge reveal with 100% logic
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
          if(entry.isIntersecting) {
            entry.target.style.animationDelay = `${idx * 0.08}s`;
            entry.target.classList.add('visible', 'super-huge-anim');
            observer.unobserve(entry.target);
          }
        });
      }, {threshold: 0.12, rootMargin: '0px 0px -80px 0px'});
      
      document.querySelectorAll('.reveal, .super-huge, .super-card, .step-card, .testi-card, .product-card').forEach(el => {
        if(!el.classList.contains('reveal')) el.classList.add('reveal');
        observer.observe(el);
      });
      
      // Super huge magnetic buttons with 100% logic
      document.querySelectorAll('.btn-gold, .magnetic, .super-huge-glow').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const deltaX = (x - centerX) / 6;
          const deltaY = (y - centerY) / 6;
          
          btn.style.setProperty('--mx', `${x}px`);
          btn.style.setProperty('--my', `${y}px`);
          btn.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.03)`;
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
        });
      });
      
      // Super huge scroll progress with 100% logic
      const progress = document.getElementById('scrollProgress');
      if(progress) {
        const update = () => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          progress.style.width = `${percent}%`;
          
          // Super huge header effect
          const header = document.querySelector('.header');
          if(header) {
            if(scrollTop > 100) {
              header.style.background = 'rgba(7,7,9,0.92)';
              header.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
            } else {
              header.style.background = 'rgba(7,7,9,0.82)';
              header.style.boxShadow = '';
            }
          }
        };
        window.addEventListener('scroll', update, {passive: true});
        update();
      }
    }
  },
  
  // SUPER HUGE BUSINESS LOGIC — 100% LOGIC TO BRING CUSTOMERS
  business: {
    init() {
      console.log('[Super Huge] Business logic init 100% logic');
      
      // Super huge urgency with 100% logic
      this.initUrgency();
      
      // Super huge social proof with 100% logic
      this.initSocialProof();
      
      // Super huge abandoned cart with 100% logic
      this.initAbandonedCart();
    },
    
    initUrgency() {
      const countdown = document.getElementById('countdown');
      if(!countdown) return;
      
      // Super huge countdown with 100% logic — ends in 12h 34m 56s from now
      let hours = 12, minutes = 34, seconds = 56;
      
      const update = () => {
        seconds--;
        if(seconds < 0) { seconds = 59; minutes--; }
        if(minutes < 0) { minutes = 59; hours--; }
        if(hours < 0) { hours = 23; }
        
        const hEl = document.getElementById('cdH');
        const mEl = document.getElementById('cdM');
        const sEl = document.getElementById('cdS');
        
        if(hEl) hEl.textContent = String(hours).padStart(2, '0');
        if(mEl) mEl.textContent = String(minutes).padStart(2, '0');
        if(sEl) sEl.textContent = String(seconds).padStart(2, '0');
        
        // Super huge pulse when <1h
        if(hours === 0 && minutes < 30) {
          countdown.style.animation = 'urgencyPulse 0.8s infinite';
        }
      };
      
      setInterval(update, 1000);
      update();
    },
    
    initSocialProof() {
      // Super huge live activity with 100% logic
      const activities = [
        'Arben nga Peja bleu Grey Goose Vodka',
        'Era nga Peja bleu Bulldak Noodles x3',
        'Liridon nga Peja bleu Puro Premium',
        'Alma nga Peja bleu Lindt Lindor',
        'Blerim nga Peja bleu Red Bull x6',
      ];
      
      let idx = 0;
      setInterval(() => {
        const activity = activities[idx % activities.length];
        // Show toast with social proof
        if(typeof toast !== 'undefined') {
          toast(`🔥 ${activity} • 2 min më parë`, 'default');
        }
        idx++;
      }, 25000);
    },
    
    initAbandonedCart() {
      // Super huge abandoned cart check with 100% logic
      const check = () => {
        const cart = JSON.parse(localStorage.getItem('hana_cart_v3') || '[]');
        const lastActive = localStorage.getItem('hana_cart_last_active');
        
        if(cart.length > 0 && lastActive) {
          const hours = (Date.now() - parseInt(lastActive)) / (1000*60*60);
          if(hours > 1 && hours < 24) {
            console.log('[Super Huge] Abandoned cart detected', cart.length);
            // In production, trigger email via Cloud Function
            if(typeof Security !== 'undefined') {
              Security.logAudit('abandoned_cart_super_huge', {items: cart.length, hours});
            }
          }
        }
      };
      
      setInterval(check, 60000);
      check();
    }
  },
  
  // SUPER HUGE INIT — 100% LOGIC
  init() {
    console.log('[Super Huge] Init X100 — 100% Logic — Super Huge Project');
    
    // Wait for DOM + main app
    const start = () => {
      this.hero.init();
      this.categories.init();
      this.products.init();
      this.cart.init();
      this.checkout.init();
      this.animations.init();
      this.business.init();
      
      console.log('[Super Huge] All super huge logic initialized — 100% logic — another level');
    };
    
    if(document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(start, 1500));
    } else {
      setTimeout(start, 1500);
    }
    
    // Also on products loaded
    document.addEventListener('productsLoaded', () => setTimeout(start, 500));
    window.addEventListener('load', () => setTimeout(start, 1000));
  }
};

// Auto init
SuperHugeLogic.init();
window.SuperHugeLogic = SuperHugeLogic;
