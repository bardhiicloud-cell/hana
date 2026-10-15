// HANA FREE SHOP — Security Module for 100k Daily Services
// XSS, DOMPurify, encryption, rate limiting, audit logs

// Lightweight DOMPurify alternative (if CDN fails, fallback)
const Security = {
  // XSS Protection — sanitize HTML
  sanitize(html) {
    if(window.DOMPurify) {
      return DOMPurify.sanitize(html, {USE_PROFILES: {html: true}});
    }
    // Fallback: strip scripts and dangerous attrs
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  },

  // Escape for innerHTML contexts
  escapeHtml(str) {
    if(typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Validate email
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
  },

  // Validate phone (Kosovo +383 etc)
  isValidPhone(phone) {
    return /^\+?[\d\s\-\(\)]{8,20}$/.test(phone.replace(/\s/g, ''));
  },

  // Encrypt localStorage data (simple XOR + base64 for demo — use real crypto in prod with Web Crypto API)
  encrypt(data, key = 'hana-100k-2026') {
    try {
      const str = JSON.stringify(data);
      let encrypted = '';
      for(let i=0; i<str.length; i++){
        encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted);
    } catch(e) {
      console.error('[Security] Encrypt failed', e);
      return null;
    }
  },

  decrypt(encrypted, key = 'hana-100k-2026') {
    try {
      const decoded = atob(encrypted);
      let decrypted = '';
      for(let i=0; i<decoded.length; i++){
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return JSON.parse(decrypted);
    } catch(e) {
      console.error('[Security] Decrypt failed', e);
      return null;
    }
  },

  // Secure localStorage wrapper
  secureSet(key, value) {
    const enc = this.encrypt(value);
    if(enc) localStorage.setItem(`hana_sec_${key}`, enc);
  },
  secureGet(key) {
    const enc = localStorage.getItem(`hana_sec_${key}`);
    if(!enc) return null;
    return this.decrypt(enc);
  },

  // Rate limiting — 10/min/IP (client-side check, server-side enforced in Cloud Functions)
  rateLimiter: {
    attempts: new Map(),
    check(ip = 'client', limit = 10, windowMs = 60000) {
      const now = Date.now();
      const key = ip;
      let data = this.attempts.get(key);
      if(!data) {
        data = {count: 1, first: now};
        this.attempts.set(key, data);
        return true;
      }
      if(now - data.first > windowMs) {
        data.count = 1;
        data.first = now;
        return true;
      }
      data.count++;
      if(data.count > limit) {
        console.warn(`[Security] Rate limit exceeded for ${ip}`);
        return false;
      }
      return true;
    }
  },

  // CSRF token
  generateCSRF() {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem('hana_csrf', token);
    return token;
  },
  validateCSRF(token) {
    const stored = sessionStorage.getItem('hana_csrf');
    return stored && stored === token;
  },

  // Audit log — append-only
  async logAudit(action, details = {}) {
    const log = {
      action,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: location.href,
      userId: localStorage.getItem('hana_user_id') || 'anonymous'
    };
    // Store locally and try to send to Firestore if available
    const logs = JSON.parse(localStorage.getItem('hana_audit_logs') || '[]');
    logs.push(log);
    if(logs.length > 100) logs.shift(); // Keep last 100
    localStorage.setItem('hana_audit_logs', JSON.stringify(logs));
    
    // Try to send to Firestore if firebase is available
    try {
      if(window.firebaseDB && window.addDoc && window.collection) {
        await window.addDoc(window.collection(window.firebaseDB, 'auditLogs'), {
          ...log,
          createdAt: window.serverTimestamp ? window.serverTimestamp() : new Date()
        });
      }
    } catch(e) {
      console.warn('[Security] Failed to send audit log to Firestore', e);
    }
  },

  // Content Security Policy check
  checkCSP() {
    // In production, CSP is enforced via firebase.json headers
    // This is a client-side sanity check
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(s => {
      const src = s.src;
      const allowed = ['self', 'gstatic', 'googleapis', 'googletagmanager', 'facebook'];
      const isAllowed = allowed.some(domain => src.includes(domain)) || src.startsWith(location.origin);
      if(!isAllowed) {
        console.warn('[Security] Potential CSP violation', src);
        this.logAudit('csp_violation', {src});
      }
    });
  },

  // Input validation for orders
  validateOrder(order) {
    const errors = [];
    if(!order.customer) errors.push('Mungon klienti');
    if(!order.customer?.email || !this.isValidEmail(order.customer.email)) errors.push('Email invalid');
    if(!order.customer?.phone || !this.isValidPhone(order.customer.phone)) errors.push('Telefon invalid');
    if(!order.customer?.address || order.customer.address.length < 5) errors.push('Adresa shumë e shkurtër');
    if(!order.items || order.items.length === 0) errors.push('Shporta bosh');
    if(order.total <= 0) errors.push('Totali invalid');
    return errors;
  }
};

// Initialize security on load
document.addEventListener('DOMContentLoaded', () => {
  Security.generateCSRF();
  Security.checkCSP();
  console.log('[Security] Module initialized for 100k protection');
});

window.Security = Security;
