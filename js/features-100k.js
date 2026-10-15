// HANA FREE SHOP — 100K Features Module
// Guest checkout, saved address, time slot, express, dynamic coupons, tracking, wishlist cloud, recently viewed, etc.

const Features100K = {
  // Guest checkout
  guestCheckout: {
    isGuest: false,
    enable() {
      this.isGuest = true;
      localStorage.setItem('hana_guest', '1');
      console.log('[100K] Guest checkout enabled');
    },
    disable() {
      this.isGuest = false;
      localStorage.removeItem('hana_guest');
    }
  },

  // Saved addresses
  savedAddresses: {
    getAll() {
      return JSON.parse(localStorage.getItem('hana_addresses') || '[]');
    },
    save(address) {
      const all = this.getAll();
      address.id = address.id || Date.now().toString();
      address.createdAt = new Date().toISOString();
      const existing = all.findIndex(a => a.id === address.id);
      if(existing >= 0) all[existing] = address;
      else all.push(address);
      localStorage.setItem('hana_addresses', JSON.stringify(all));
      if(window.Security) Security.logAudit('address_saved', {id: address.id});
      return address;
    },
    remove(id) {
      const all = this.getAll().filter(a => a.id !== id);
      localStorage.setItem('hana_addresses', JSON.stringify(all));
    },
    getDefault() {
      const all = this.getAll();
      return all.find(a => a.isDefault) || all[0] || null;
    }
  },

  // Time slot picker
  timeSlots: {
    slots: [
      {id: 'morning', label: 'Mëngjes', time: '09:00 - 12:00', price: 0},
      {id: 'afternoon', label: 'Pasdite', time: '12:00 - 16:00', price: 0},
      {id: 'evening', label: 'Mbrëmje', time: '16:00 - 20:00', price: 0},
      {id: 'express', label: 'Express 1h', time: 'Brenda 1 ore', price: 2.99},
    ],
    selected: null,
    getAll() { return this.slots; },
    select(id) {
      this.selected = this.slots.find(s => s.id === id) || null;
      localStorage.setItem('hana_timeslot', JSON.stringify(this.selected));
      return this.selected;
    },
    getSelected() {
      if(this.selected) return this.selected;
      const saved = localStorage.getItem('hana_timeslot');
      return saved ? JSON.parse(saved) : this.slots[0];
    }
  },

  // Express delivery toggle
  expressDelivery: {
    enabled: false,
    price: 3.99,
    toggle(enabled) {
      this.enabled = enabled;
      localStorage.setItem('hana_express', enabled ? '1' : '0');
      if(window.updateCartTotals) window.updateCartTotals();
      return this.enabled;
    },
    isEnabled() {
      return localStorage.getItem('hana_express') === '1';
    }
  },

  // Dynamic coupons from Firestore
  coupons: {
    async getActive() {
      try {
        if(window.firebaseDB && window.collection && window.getDocs && window.query && window.where) {
          const q = window.query(window.collection(window.firebaseDB, 'coupons'), window.where('status', '==', 'active'));
          const snap = await window.getDocs(q);
          const coupons = [];
          snap.forEach(doc => coupons.push({id: doc.id, ...doc.data()}));
          return coupons;
        }
      } catch(e) {
        console.warn('[100K] Failed to fetch coupons', e);
      }
      // Fallback
      return [
        {code: 'HANA10', discount: 10, type: 'percent', minOrder: 20, description: '10% zbritje për porosi mbi 20€'},
        {code: 'WELCOME5', discount: 5, type: 'fixed', minOrder: 15, description: '5€ zbritje për klientët e rinj'},
        {code: 'EXPRESSFREE', discount: 3.99, type: 'fixed', minOrder: 30, description: 'Transport express falas mbi 30€'},
      ];
    },
    async validate(code, orderTotal) {
      const coupons = await this.getActive();
      const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
      if(!coupon) return {valid: false, error: 'Kuponi nuk ekziston'};
      if(coupon.minOrder && orderTotal < coupon.minOrder) return {valid: false, error: `Minimum ${coupon.minOrder}€ për këtë kupon`};
      if(coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return {valid: false, error: 'Kuponi ka skaduar'};
      if(coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return {valid: false, error: 'Kuponi ka arritur limitin'};
      return {valid: true, coupon};
    },
    apply(code, orderTotal) {
      return this.validate(code, orderTotal);
    }
  },

  // Gift message preview
  giftMessage: {
    message: '',
    set(msg) {
      this.message = msg.slice(0, 200);
      localStorage.setItem('hana_gift_msg', this.message);
    },
    get() {
      return localStorage.getItem('hana_gift_msg') || '';
    },
    preview() {
      const msg = this.get();
      if(!msg) return '';
      return `
        <div style="background:linear-gradient(135deg,rgba(232,198,122,0.12),rgba(232,198,122,0.04));border:1px solid rgba(232,198,122,0.2);border-radius:12px;padding:14px;margin:12px 0;">
          <div style="font-size:11px;letter-spacing:0.2em;color:var(--gold-300);font-weight:700;margin-bottom:6px;">🎁 MESAZH DHURATE</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:15px;font-style:italic;color:var(--text-1);line-height:1.5;">"${Security ? Security.escapeHtml(msg) : msg}"</div>
        </div>
      `;
    }
  },

  // Order tracking real-time
  tracking: {
    async getOrder(trackingId) {
      try {
        if(window.firebaseDB && window.collection && window.getDocs && window.query && window.where) {
          const q = window.query(window.collection(window.firebaseDB, 'orders'), window.where('trackingId', '==', trackingId));
          const snap = await window.getDocs(q);
          if(!snap.empty) {
            const doc = snap.docs[0];
            return {id: doc.id, ...doc.data()};
          }
        }
      } catch(e) {
        console.warn('[100K] Tracking fetch failed', e);
      }
      // Fallback local
      const orders = JSON.parse(localStorage.getItem('hana_orders') || '[]');
      return orders.find(o => o.trackingId === trackingId) || null;
    },
    async listen(trackingId, callback) {
      try {
        if(window.firebaseDB && window.onSnapshot && window.collection && window.query && window.where) {
          const q = window.query(window.collection(window.firebaseDB, 'orders'), window.where('trackingId', '==', trackingId));
          return window.onSnapshot(q, snap => {
            if(!snap.empty) {
              const doc = snap.docs[0];
              callback({id: doc.id, ...doc.data()});
            }
          });
        }
      } catch(e) {
        console.warn('[100K] Tracking listen failed', e);
      }
      // Fallback polling
      const interval = setInterval(async () => {
        const order = await this.getOrder(trackingId);
        if(order) callback(order);
      }, 5000);
      return () => clearInterval(interval);
    },
    statusSteps: [
      {id: 'pending', label: 'Porosia u pranua', icon: '📝', desc: 'Po e përgatisim porosinë tuaj'},
      {id: 'confirmed', label: 'Konfirmuar', icon: '✅', desc: 'Telefonuam dhe konfirmuam'},
      {id: 'preparing', label: 'Në përgatitje', icon: '📦', desc: 'Paketimi në proces'},
      {id: 'out_for_delivery', label: 'Në shpërndarje', icon: '🚚', desc: 'Korrieri është rrugës'},
      {id: 'delivered', label: 'U dorëzua', icon: '🎉', desc: 'Faleminderit për besimin!'},
    ],
    renderTimeline(currentStatus) {
      const currentIndex = this.statusSteps.findIndex(s => s.id === currentStatus);
      return this.statusSteps.map((step, idx) => {
        const isCompleted = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return `
          <div style="display:flex;gap:14px;padding:12px 0;${idx < this.statusSteps.length -1 ? 'border-left:2px solid '+(isCompleted ? 'var(--gold-400)' : 'rgba(255,255,255,0.1)')+';margin-left:16px;padding-left:22px;' : 'margin-left:16px;padding-left:22px;'} ${isCurrent ? 'background:rgba(232,198,122,0.08);border-radius:12px;' : ''}">
            <div style="width:34px;height:34px;border-radius:50%;background:${isCompleted ? 'var(--gold-gradient)' : 'var(--bg-3)'};display:grid;place-items:center;font-size:16px;margin-left:-40px;flex-shrink:0;border:2px solid ${isCompleted ? 'var(--gold-400)' : 'rgba(255,255,255,0.1)'};">${step.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:${isCurrent ? '700' : '600'};font-size:14px;color:${isCompleted ? 'var(--text-1)' : 'var(--text-3)'};">${step.label} ${isCurrent ? '• Tani' : ''} ${isCompleted && !isCurrent ? '✓' : ''}</div>
              <div style="font-size:12px;color:var(--text-3);margin-top:2px;">${step.desc}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // Wishlist cloud Firestore
  wishlist: {
    async get() {
      try {
        const userId = localStorage.getItem('hana_user_id');
        if(userId && window.firebaseDB) {
          // Try Firestore
          const docRef = window.doc(window.firebaseDB, 'wishlists', userId);
          const snap = await window.getDoc(docRef);
          if(snap.exists()) return snap.data().items || [];
        }
      } catch(e) {
        console.warn('[100K] Wishlist cloud fetch failed', e);
      }
      return JSON.parse(localStorage.getItem('hana_wishlist') || '[]');
    },
    async add(productId) {
      let list = await this.get();
      if(!list.includes(productId)) {
        list.push(productId);
        localStorage.setItem('hana_wishlist', JSON.stringify(list));
        // Try sync to Firestore
        try {
          const userId = localStorage.getItem('hana_user_id');
          if(userId && window.firebaseDB) {
            const docRef = window.doc(window.firebaseDB, 'wishlists', userId);
            await window.setDoc(docRef, {items: list, updatedAt: new Date()}, {merge: true});
          }
        } catch(e) {}
        if(window.PWA) PWA.bounceBadge('.wishlist-badge');
        if(window.haptic) haptic('success');
      }
      return list;
    },
    async remove(productId) {
      let list = await this.get();
      list = list.filter(id => id !== productId);
      localStorage.setItem('hana_wishlist', JSON.stringify(list));
      try {
        const userId = localStorage.getItem('hana_user_id');
        if(userId && window.firebaseDB) {
          const docRef = window.doc(window.firebaseDB, 'wishlists', userId);
          await window.setDoc(docRef, {items: list, updatedAt: new Date()}, {merge: true});
        }
      } catch(e) {}
      return list;
    }
  },

  // Recently viewed
  recentlyViewed: {
    maxItems: 12,
    add(product) {
      let list = this.get();
      list = list.filter(p => p.id !== product.id);
      list.unshift({id: product.id, name: product.name, image: product.image || product.images?.[0], price: product.price, brand: product.brand, viewedAt: new Date().toISOString()});
      if(list.length > this.maxItems) list = list.slice(0, this.maxItems);
      localStorage.setItem('hana_recent', JSON.stringify(list));
    },
    get() {
      return JSON.parse(localStorage.getItem('hana_recent') || '[]');
    },
    clear() {
      localStorage.removeItem('hana_recent');
    }
  },

  // Similar products AI (simple logic: same category + brand)
  similarProducts: {
    get(product, allProducts, limit = 6) {
      if(!product || !allProducts) return [];
      return allProducts
        .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
        .sort((a,b) => {
          let scoreA = 0, scoreB = 0;
          if(a.category === product.category) scoreA += 2;
          if(b.category === product.category) scoreB += 2;
          if(a.brand === product.brand) scoreA += 3;
          if(b.brand === product.brand) scoreB += 3;
          if(a.popular) scoreA += 1;
          if(b.popular) scoreB += 1;
          return scoreB - scoreA;
        })
        .slice(0, limit);
    }
  },

  // Video gallery support
  videoGallery: {
    isVideoUrl(url) {
      return url && (url.includes('.mp4') || url.includes('.webm') || url.includes('youtube') || url.includes('vimeo'));
    },
    render(url) {
      if(url.includes('youtube')) {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        return `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:12px;"></iframe>`;
      }
      return `<video src="${url}" controls playsinline style="width:100%;height:100%;object-fit:cover;border-radius:12px;"></video>`;
    }
  },

  // Abandoned cart email reminder (local check)
  abandonedCart: {
    check() {
      const cart = JSON.parse(localStorage.getItem('hana_cart') || '[]');
      const lastActive = localStorage.getItem('hana_cart_last_active');
      if(cart.length > 0 && lastActive) {
        const hoursSince = (Date.now() - parseInt(lastActive)) / (1000*60*60);
        if(hoursSince > 1 && hoursSince < 24) {
          // In production, trigger Cloud Function to send email
          console.log('[100K] Abandoned cart detected', cart.length, 'items');
          if(window.Security) Security.logAudit('abandoned_cart', {items: cart.length, hours: hoursSince});
          return true;
        }
      }
      return false;
    },
    markActive() {
      localStorage.setItem('hana_cart_last_active', Date.now().toString());
    }
  },

  // Reviews ratings
  reviews: {
    async getForProduct(productId) {
      try {
        if(window.firebaseDB && window.collection && window.getDocs && window.query && window.where) {
          const q = window.query(window.collection(window.firebaseDB, 'reviews'), window.where('productId', '==', productId));
          const snap = await window.getDocs(q);
          const reviews = [];
          snap.forEach(doc => reviews.push({id: doc.id, ...doc.data()}));
          return reviews;
        }
      } catch(e) {}
      // Fallback mock
      return JSON.parse(localStorage.getItem(`hana_reviews_${productId}`) || '[]');
    },
    async add(productId, rating, comment, userName = 'Anonim') {
      const review = {
        productId,
        rating,
        comment: comment.slice(0, 500),
        userName,
        createdAt: new Date().toISOString(),
        verified: false
      };
      const key = `hana_reviews_${productId}`;
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      all.push(review);
      localStorage.setItem(key, JSON.stringify(all));
      
      try {
        if(window.firebaseDB && window.addDoc && window.collection) {
          await window.addDoc(window.collection(window.firebaseDB, 'reviews'), {
            ...review,
            createdAt: window.serverTimestamp ? window.serverTimestamp() : new Date()
          });
        }
      } catch(e) {}
      
      return review;
    },
    average(reviews) {
      if(!reviews || reviews.length === 0) return 0;
      return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }
  },

  // Multi-language sq/en/sr
  i18n: {
    current: localStorage.getItem('hana_lang') || 'sq',
    translations: {
      sq: {
        add_to_cart: 'Shto në shportë',
        checkout: 'Përfundo porosinë',
        total: 'Totali',
        delivery: 'Transporti',
        free: 'Falas',
        popular: 'Më të kërkuarit',
        offers: 'Ofertat e javës',
        brands: 'Marka botërore',
        search: 'Kërko produkte...',
        cart: 'Shporta',
        wishlist: 'Lista e dëshirave',
        tracking: 'Gjurmo porosinë',
        address: 'Adresa',
        phone: 'Telefoni',
        email: 'Email',
        guest_checkout: 'Vazhdo si vizitor',
        saved_addresses: 'Adresat e ruajtura',
        time_slot: 'Koha e dorëzimit',
        express: 'Express 1 orë',
        gift_message: 'Mesazh dhurate',
        similar: 'Produkte të ngjashme',
        recently_viewed: 'Shikuar së fundi',
        reviews: 'Vlerësime',
        video: 'Video',
      },
      en: {
        add_to_cart: 'Add to cart',
        checkout: 'Checkout',
        total: 'Total',
        delivery: 'Delivery',
        free: 'Free',
        popular: 'Most popular',
        offers: 'Weekly offers',
        brands: 'World brands',
        search: 'Search products...',
        cart: 'Cart',
        wishlist: 'Wishlist',
        tracking: 'Track order',
        address: 'Address',
        phone: 'Phone',
        email: 'Email',
        guest_checkout: 'Continue as guest',
        saved_addresses: 'Saved addresses',
        time_slot: 'Delivery time',
        express: 'Express 1 hour',
        gift_message: 'Gift message',
        similar: 'Similar products',
        recently_viewed: 'Recently viewed',
        reviews: 'Reviews',
        video: 'Video',
      },
      sr: {
        add_to_cart: 'Dodaj u korpu',
        checkout: 'Završi porudžbinu',
        total: 'Ukupno',
        delivery: 'Dostava',
        free: 'Besplatno',
        popular: 'Najpopularniji',
        offers: 'Nedeljne ponude',
        brands: 'Svetski brendovi',
        search: 'Pretraži proizvode...',
        cart: 'Korpa',
        wishlist: 'Lista želja',
        tracking: 'Prati porudžbinu',
        address: 'Adresa',
        phone: 'Telefon',
        email: 'Email',
        guest_checkout: 'Nastavi kao gost',
        saved_addresses: 'Sačuvane adrese',
        time_slot: 'Vreme dostave',
        express: 'Express 1 sat',
        gift_message: 'Poklon poruka',
        similar: 'Slični proizvodi',
        recently_viewed: 'Nedavno pregledano',
        reviews: 'Recenzije',
        video: 'Video',
      }
    },
    t(key) {
      return this.translations[this.current]?.[key] || this.translations['sq'][key] || key;
    },
    set(lang) {
      if(['sq','en','sr'].includes(lang)) {
        this.current = lang;
        localStorage.setItem('hana_lang', lang);
        document.documentElement.lang = lang;
        // In production, re-render UI
        location.reload();
      }
    }
  }
};

window.Features100K = Features100K;
console.log('[100K] Features module loaded');
