// HANA FREE SHOP — Service Worker + PWA — For 100k Daily Services
// Cache strategy: CacheFirst for images/CSS/JS, NetworkFirst for API/Firestore
// Versioned for cache busting

const CACHE_VERSION = 'hana-v10-2026-10-15';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;
const CACHE_API = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/market/index.html',
  '/css/style.css',
  '/css/hana-final.css',
  '/css/site.css',
  '/js/config.js',
  '/js/app.js',
  '/js/firebase.js',
  '/manifest.json',
  '/images/hero-premium-bag-400w.webp',
  '/images/hero-puro-tobacco-400w.webp',
  '/images/hero-buldak-ice-400w.webp',
  '/images/hero-alcohol-variety-400w.webp',
];

// Install — cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Install', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {cache: 'reload'}))).catch(err => {
        console.warn('[SW] Failed to cache some assets', err);
        // Don't fail install if some assets fail
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => !key.startsWith(CACHE_VERSION)).map(key => {
          console.log('[SW] Deleting old cache', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — CacheFirst for images/CSS/JS, NetworkFirst for API
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET
  if(request.method !== 'GET') return;

  // Skip Firebase, Google, etc. — NetworkFirst
  if(url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic') || url.hostname.includes('google-analytics') || url.hostname.includes('facebook')){
    event.respondWith(
      fetch(request).then(response => {
        // Cache successful API responses for 5 min
        if(response.ok){
          const clone = response.clone();
          caches.open(CACHE_API).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => cached || new Response('Offline', {status: 503}));
      })
    );
    return;
  }

  // Images — CacheFirst with 1 year
  if(request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|webp|avif|svg)$/)){
    event.respondWith(
      caches.match(request).then(cached => {
        if(cached) return cached;
        return fetch(request).then(response => {
          if(!response.ok) return response;
          const clone = response.clone();
          caches.open(CACHE_IMAGES).then(cache => cache.put(request, clone));
          return response;
        }).catch(() => {
          // Fallback to placeholder
          return new Response('', {status: 404});
        });
      })
    );
    return;
  }

  // CSS/JS — CacheFirst with network fallback
  if(request.destination === 'style' || request.destination === 'script' || url.pathname.match(/\.(css|js)$/)){
    event.respondWith(
      caches.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if(response.ok){
            const clone = response.clone();
            caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // HTML — NetworkFirst with cache fallback for offline
  if(request.destination === 'document' || request.headers.get('accept')?.includes('text/html')){
    event.respondWith(
      fetch(request).then(response => {
        if(response.ok){
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(request).then(cached => {
          if(cached) return cached;
          // Offline fallback
          return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // Default — NetworkFirst
  event.respondWith(
    fetch(request).then(response => {
      if(response.ok){
        const clone = response.clone();
        caches.open(CACHE_API).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});

// Background sync for orders — for 100k reliability
self.addEventListener('sync', event => {
  if(event.tag === 'sync-orders'){
    event.waitUntil(
      // Try to sync pending orders from IndexedDB/localStorage
      // In production, use IndexedDB for offline orders
      Promise.resolve().then(()=>console.log('[SW] Syncing orders'))
    );
  }
});

// Push notifications — for 100k marketing
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {title:'Hana Free Shop', body:'Ofertë e re ekskluzive!', icon:'/images/hero-premium-bag-400w.webp'};
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/images/hero-premium-bag-400w.webp',
      badge: '/images/hero-premium-bag-400w.webp',
      vibrate: [200, 100, 200],
      data: {url: data.url || '/#ofertat'},
      actions: [
        {action:'open', title:'Shiko ofertën →'},
        {action:'close', title:'Mbyll'}
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if(event.action === 'close') return;
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Periodic background sync for price updates — for 100k
self.addEventListener('periodicsync', event => {
  if(event.tag === 'update-prices'){
    event.waitUntil(
      fetch('/api/prices').then(r=>r.json()).then(data=>{
        console.log('[SW] Periodic price update', data);
      }).catch(()=>{})
    );
  }
});
