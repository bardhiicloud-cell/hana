// HANA FREE SHOP — Main App Premium v2
// Super professional: location selector, 4 hero slides, cart fly animation, checkout with mandatory fields, order tracking, smooth animations
import { initFirebase, fetchProducts, fetchCategories, fetchPromos, fetchHero, fetchBrands, fetchBanners, fetchOffers, fetchStoreSettings, fetchDeliveryZones, createOrder, createOrderWithTransaction, fetchProductsPaginated, applyAdvancedFilters, exportLocalStorageBackup, generateReportsData, onAuthState, signInLocal, signUpLocal, signOutLocal, isFirebaseEnabled, getLocalData, calculateFinalPrice, placeOrderServer, trackOrderServer, isLocalDemoHost } from './firebase.js';

const LS_CART = 'hana_cart_v3';
const LS_WISH = 'hana_wish_v3';
try{ localStorage.removeItem('hana_express'); }catch{}
const LS_LOCATION = 'hana_location_selected';
const LS_LOCATION_CITY = 'hana_location_city';

let PRODUCTS = [];
let CATEGORIES = [];
let PROMOS = [];
let HERO_SLIDES = [];
let BRANDS = [];
let BANNERS = [];
let OFFERS = [];
let STORE_SETTINGS = null;
let DELIVERY_ZONES = [];

let cart = [];
let wishlist = [];
let activeCategory = null;
let activeBrand = null;
let activePromo = null;
let searchQuery = '';
let heroIndex = 0;
let heroTimer = null;
let currentCity = 'peje';
let sortMode = 'default';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function loadState(){
 try{ cart = JSON.parse(localStorage.getItem(LS_CART)||'[]'); }catch{ cart=[]; }
 try{ wishlist = JSON.parse(localStorage.getItem(LS_WISH)||'[]'); }catch{ wishlist=[]; }
 try{ currentCity = localStorage.getItem(LS_LOCATION_CITY) || 'peje'; }catch{ currentCity='peje'; }
}
function saveCart(){ localStorage.setItem(LS_CART, JSON.stringify(cart)); updateCartUI(); }
function saveWishlist(){ localStorage.setItem(LS_WISH, JSON.stringify(wishlist)); updateWishlistUI(); }
function formatPrice(p){ return p.toFixed(2)+'€'; }

// TOAST - professional with animation
function toast(msg, type='default'){
 msg = String(msg).replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,'');
 const stack = $('#toastStack');
 if(!stack) return;
 const el = document.createElement('div');
 el.className = 'toast'+(type==='gold'?' gold':'');
 el.innerHTML = `<span class="t-icon">${type==='gold'?'✓':'🛒'}</span><span>${msg}</span>`;
 stack.appendChild(el);
 el.animate([{transform:'translateY(16px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:400,easing:'cubic-bezier(.22,1,.36,1)'});
 setTimeout(()=>{
 el.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY(-8px)',opacity:0}],{duration:300,easing:'ease-in'}).onfinish=()=>el.remove();
 }, 3200);
}

// LOCATION SELECTOR - SUPER PROFESSIONAL ENTRY
const cityName = (id=currentCity) => (window.HanaCities ? window.HanaCities.name(id) : id);
const PIN_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="1.8"><path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';

function populateCitySelect(){
 const sel = $('#coCity');
 if(!sel || !window.HanaCities) return;
 sel.innerHTML = window.HanaCities.list().map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
 sel.value = currentCity;
 if(!sel.dataset.bound){
  sel.dataset.bound = '1';
  sel.addEventListener('change', ()=>setCity(sel.value, {silent:true}));
 }
}

function refreshCityUI(){
 const n = cityName();
 if($('#currentCity')) $('#currentCity').textContent = n;
 if($('#cartCity')) $('#cartCity').textContent = n;
 $$('.cart-city-name').forEach(el=>el.textContent = n);
 if(window.HanaCities) window.HanaCities.fillDom();
 populateCitySelect();
 if(typeof applyHomeContent==='function'){
  applyHomeContent();
  renderCategories(); renderBrands(); renderProducts(); renderPopularGrid(); renderRecent();
 }
 renderCartDrawer();
 updateTotalsUI();
}

function setCity(id, opts={}){
 if(!window.HanaCities || !window.HanaCities.get(id)) return;
 currentCity = id;
 window.HanaCities.set(id);
 try{ localStorage.setItem(LS_LOCATION_CITY, id); }catch{}
 refreshCityUI();
}

function initLocation(){
 const modal = $('#locationModal');
 const backdrop = $('#locationBackdrop');
 const optsEl = $('#locOptions');
 const note = $('#locNote');
 if(!modal || !optsEl || !window.HanaCities) return;
 let required = false;

 const render = ()=>{
  optsEl.innerHTML = window.HanaCities.listAll().map(c=> c.active===false ? `<button type="button" class="loc-option disabled" data-soon="${c.id}" aria-label="${c.name} vjen së shpejti">
   <div class="loc-opt-icon">${PIN_SVG}</div>
   <div class="loc-opt-text"><strong>${c.name}</strong><span>Vjen së shpejti</span></div>
   <span class="loc-badge soon">Së shpejti</span></button>` : `<button type="button" class="loc-option ${c.id===currentCity?'active':''}" data-city="${c.id}">
   <div class="loc-opt-icon">${PIN_SVG}</div>
   <div class="loc-opt-text"><strong>${c.name}</strong><span>${[c.address || (c.primary ? (STORE_SETTINGS?.contactInfo?.address || STORE_SETTINGS?.address || 'General Wesley Clark, Pejë') : ''), `Dorëzim ~${c.minutes} min`].filter(Boolean).join(' • ')}</span></div>
   <div class="loc-opt-check">✓</div></button>`).join('');
 };
 const open = req=>{
  required = !!req;
  render();
  if(note) note.textContent = '';
  modal.classList.add('open'); backdrop?.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  optsEl.querySelector('.loc-option')?.focus();
 };
 const close = ()=>{
  modal.classList.remove('open'); backdrop?.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  try{ localStorage.setItem(LS_LOCATION,'true'); }catch{}
 };

 optsEl.addEventListener('click', e=>{
  const soon = e.target.closest('[data-soon]');
  if(soon){ toast(`${window.HanaCities.name(soon.dataset.soon)} vjen së shpejti. Aktualisht dërgojmë në ${cityName()}.`); return; }
  const b = e.target.closest('[data-city]');
  if(!b) return;
  setCity(b.dataset.city);
  close();
  toast(`Dërgesa në ${cityName()}`, 'gold');
 });
 backdrop?.addEventListener('click', ()=>{ if(!required) close(); });
 document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.classList.contains('open') && !required) close(); });
 const btn = $('#locationBtn');
 btn?.addEventListener('click', ()=>open(false));
 btn?.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); open(false); } });

 $('#locGps')?.addEventListener('click', async()=>{
  if(!window.HanaShopUX){ return; }
  note.textContent = 'Duke kërkuar lokacionin…';
  try{
   const pos = await window.HanaShopUX.locate();
   const near = window.HanaCities.nearest(pos.lat, pos.lng, true);
   if(near && near.km <= 40 && near.city.active===false){
    note.textContent = `${near.city.name} vjen së shpejti. Aktualisht dërgojmë vetëm në ${window.HanaCities.list().map(c=>c.name).join(', ')}.`;
   } else if(near && near.km <= 40){
    setCity(near.city.id); close();
    toast(`Zgjodhëm ${near.city.name} sipas lokacionit tënd`, 'gold');
   } else {
    note.textContent = 'Nuk po të gjejmë afër asnjë qyteti ku dërgojmë. Zgjidh njërin nga lista.';
   }
  }catch(err){ note.textContent = err.message || 'Nuk u mor lokacioni. Zgjidh qytetin nga lista.'; }
 });

 window.HANA_openLocation = open;
 if(new URLSearchParams(location.search).has('fresh')) localStorage.removeItem(LS_LOCATION);
 if(!localStorage.getItem(LS_LOCATION)) setTimeout(()=>open(true), 350);
}

// CART FLY ANIMATION - PROFESSIONAL
function cartFlyAnimation(productId, startEl){
 const prod = PRODUCTS.find(p=>p.id===productId);
 if(!prod) return;
 const fly = $('#cartFly');
 const cartBtn = $('#cartBtn') || $('[data-nav="shporta"]');
 if(!fly || !cartBtn || !startEl) return;

 const startRect = startEl.getBoundingClientRect();
 const endRect = cartBtn.getBoundingClientRect();

 fly.innerHTML = `<img src="${prod.image||prod.mainImage}" alt="">`;
 fly.style.left = startRect.left + 'px';
 fly.style.top = startRect.top + 'px';
 fly.style.opacity = '1';
 fly.classList.add('flying');

 // Force reflow
 fly.offsetHeight;

 const deltaX = endRect.left - startRect.left;
 const deltaY = endRect.top - startRect.top;

 fly.animate([
 {transform:`translate(0,0) scale(1)`,opacity:1},
 {transform:`translate(${deltaX*0.3}px,${deltaY*0.2-40}px) scale(0.8)`,opacity:1,offset:0.4},
 {transform:`translate(${deltaX}px,${deltaY}px) scale(0.2)`,opacity:0}
 ],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'}).onfinish=()=>{
 fly.classList.remove('flying');
 fly.style.opacity='0';
 // Bounce cart icon
 cartBtn.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:400,easing:'cubic-bezier(.34,1.56,.64,1)'});
 const bnCart = $('#bnCartCount');
 if(bnCart) bnCart.animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:400,easing:'cubic-bezier(.34,1.56,.64,1)'});
 };
}

// CART LOGIC - PROFESSIONAL
function addToCart(id, qty=1, startEl=null){
 const prod = PRODUCTS.find(p=>p.id===id);
 if(!prod) return;
 const have = (cart.find(c=>c.id===id)?.qty)||0;
 if(typeof prod.stock==='number' && have+qty>prod.stock){ toast(`Vetëm ${prod.stock} copë në stok për ${prod.name}`); return; }
 if(startEl) cartFlyAnimation(id, startEl);
 const existing = cart.find(c=>c.id===id);
 if(existing) existing.qty += qty;
 else cart.push({ id, qty });
 saveCart();
 toast(`${prod.brand} ${prod.name} u shtua në shportë`, 'gold');
 if(navigator.vibrate) navigator.vibrate(20);
}
function removeFromCart(id){ cart = cart.filter(c=>c.id!==id); saveCart(); }
function setQty(id, qty){ if(qty<=0) return removeFromCart(id); const item = cart.find(c=>c.id===id); if(item){ item.qty = qty; saveCart(); } }
function cartCount(){ return cart.reduce((s,i)=>s+i.qty,0); }
function cartSubtotal(){ return cart.reduce((sum,c)=>{ const p = PRODUCTS.find(x=>x.id===c.id); if(!p) return sum; try{ const priceInfo = getProductFinalPrice ? getProductFinalPrice(p) : {finalPrice:p.price}; return sum + (Math.max(0, priceInfo.finalPrice) * c.qty); }catch{ return sum + (Math.max(0,p.price) * c.qty); } },0); }

// WISHLIST
function toggleWishlist(id){
 const prod = PRODUCTS.find(p=>p.id===id);
 if(wishlist.includes(id)){
 wishlist = wishlist.filter(x=>x!==id);
 toast(`${prod?.name||'Produkti'} u hoq nga wishlist`, 'default');
 }else{
 wishlist.push(id);
 toast(`${prod?.name||'Produkti'} u shtua në wishlist`, 'gold');
 }
 saveWishlist();
 renderProducts();
 renderWishlistDrawer();
 if(navigator.vibrate) navigator.vibrate(15);
}

// CATEGORIES - PREMIUM CIRCULAR
const CAT_ALIAS = { alkoholi:'alkool', duhani:'cigare', buldak:'bulldak', pije:'pije-tonike', embelsira:'cokollata-embelsira', ushqime:'ushqime-pije' };
const CAT_PATH = { 'alkool':'/alkoholi', 'cigare':'/cigare', 'bulldak':'/buldak', 'pije-tonike':'/pije', 'cokollata-embelsira':'/embelsira', 'ushqime-pije':'/ushqime' };
const catHref = id => CAT_PATH[id] || `/market?cat=${encodeURIComponent(id)}`;

function refreshCityTexts(){
 const n = cityName();
 if($('#currentCity')) $('#currentCity').textContent = n;
 if($('#cartCity')) $('#cartCity').textContent = n;
 $$('.cart-city-name').forEach(el=>el.textContent = n);
 if(window.HanaCities) window.HanaCities.fillDom();
 populateCitySelect();
}

function applyHomeContent(){
 try{
  if(window.HanaSite){
   const cats = CATEGORIES.filter(c=>c.visible!==false && PRODUCTS.some(p=>p.category===c.id)).sort((x,y)=>(x.order||0)-(y.order||0)).map(c=>({name:c.name, href:catHref(c.id)}));
   window.HanaSite.apply({ hero:HERO_SLIDES, settings:STORE_SETTINGS||{}, categories:cats });
  }
 }catch(e){ console.warn('applyHomeContent', e); }
}
const homeLimit = (key, d) => Number(window.HANA_HOMECFG?.sections?.[key]?.limit) || d;

function setupPageContext(){
 const page = document.body.dataset.page || 'home';
 if(page==='category'){ activeCategory = document.body.dataset.cat || null; const bq0 = new URLSearchParams(location.search).get('brand'); if(bq0) activeBrand = bq0; }
 else if(page==='market'){
  const c = new URLSearchParams(location.search).get('cat');
  if(c) activeCategory = CAT_ALIAS[c] || c;
  const bq = new URLSearchParams(location.search).get('brand');
  if(bq) activeBrand = bq;
  const q = new URLSearchParams(location.search).get('q');
  if(q){ searchQuery = q; const si=$('#searchInput'); if(si) si.value=q; }
 }
}


// ---------- TË PARË SË FUNDMI ----------
function trackView(id){
 try{
  const l = JSON.parse(localStorage.getItem('hana_recent')||'[]').filter(x=>x!==id);
  l.unshift(id);
  localStorage.setItem('hana_recent', JSON.stringify(l.slice(0,12)));
 }catch{}
 renderRecent();
}
function renderRecent(){
 const sec = $('#recent'); const g = $('#recentGrid');
 if(!sec || !g) return;
 let ids=[]; try{ ids=JSON.parse(localStorage.getItem('hana_recent')||'[]'); }catch{}
 const list = ids.map(id=>PRODUCTS.find(p=>p.id===id)).filter(Boolean).slice(0, homeLimit('recent',8));
 if(!list.length){ sec.hidden = true; return; }
 sec.hidden = window.HANA_HOMECFG?.sections?.recent?.visible===false;
 g.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(g);
 if(window.HanaAutoBg) window.HanaAutoBg.scan(g);
}

// ---------- MARKAT ----------
function brandStats(){
 const m = new Map();
 PRODUCTS.filter(p=>p.status!=='archived' && p.brand).forEach(p=>{
  const pr = getProductFinalPrice(p);
  const disc = pr.originalPrice && pr.originalPrice>pr.finalPrice ? Math.round((1-pr.finalPrice/pr.originalPrice)*100) : 0;
  const e = m.get(p.brand) || { brand:p.brand, count:0, max:0, imgs:[] };
  e.count++; e.max = Math.max(e.max, disc);
  const img = p.mainImage || p.image;
  if(img && e.imgs.length<3 && !e.imgs.includes(img)) e.imgs.push(img);
  m.set(p.brand, e);
 });
 return [...m.values()].sort((a,b)=>b.max-a.max || b.count-a.count);
}

function renderBrands(){
 const g = $('#brandGrid');
 if(!g) return;
 const list = brandStats().slice(0, homeLimit('brands', 8));
 g.innerHTML = list.map(b=>`<a class="brand-card" href="/market?brand=${encodeURIComponent(b.brand)}" aria-label="${b.brand}: ${b.count} produkte">
  <span class="bc-top">${b.max>0?`<span class="bc-off">deri -${b.max}%</span>`:'<span></span>'}<span class="bc-arrow" aria-hidden="true">→</span></span>
  <span class="bc-name">${b.brand}</span>
  <span class="bc-bottom"><span class="bc-count">${b.count} ${b.count===1?'produkt':'produkte'}</span>
   <span class="bc-imgs">${b.imgs.map(src=>`<span class="bc-img"><img src="${src}" alt="" loading="lazy"></span>`).join('')}</span></span>
 </a>`).join('');
 if(window.HanaAutoBg) window.HanaAutoBg.scan(g);
}

function renderBrandChips(){
 const wrap = $('#brandChips');
 if(!wrap) return;
 const base = PRODUCTS.filter(p=>p.status!=='archived' && (!activeCategory || p.category===activeCategory));
 const brands = [...new Set(base.map(p=>p.brand).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'sq'));
 if(brands.length<2){ wrap.innerHTML=''; wrap.hidden = true; return; }
 wrap.hidden = false;
 const isOn = b => activeBrand && activeBrand.toLowerCase()===b.toLowerCase();
 wrap.innerHTML = `<button type="button" class="s-chip sm${activeBrand?'':' active'}" data-brand="">Të gjitha markat</button>` +
  brands.map(b=>`<button type="button" class="s-chip sm${isOn(b)?' active':''}" data-brand="${b.replace(/"/g,'&quot;')}">${b}</button>`).join('');
 if(!wrap.dataset.bound){
  wrap.dataset.bound = '1';
  wrap.addEventListener('click', e=>{
   const b = e.target.closest('[data-brand]');
   if(!b) return;
   activeBrand = b.dataset.brand || null;
   try{ const u = new URL(location.href); if(activeBrand) u.searchParams.set('brand', activeBrand); else u.searchParams.delete('brand'); history.replaceState(null,'',u); }catch{}
   renderBrandChips(); renderProducts();
  });
 }
}

function renderCategories(){
 const track = $('#catTrack');
 if(!track) return;
 const visible = CATEGORIES.filter(c=>c.visible!==false).sort((x,y)=>(x.order||0)-(y.order||0));
 track.classList.add('cat-grid-huge');
 track.style.setProperty('--cols', String(Math.min(visible.filter(c=>PRODUCTS.some(p=>p.category===c.id)).length,5)||3));
 track.innerHTML = visible.map(cat=>({cat, count:PRODUCTS.filter(p=>p.category===cat.id && p.status!=='archived').length})).filter(x=>x.count>0).map(({cat,count})=>{
 const src = cat.image || 'images/hero-premium-bag-800w.webp';
 return `<a class="cat-item cat-huge" href="${catHref(cat.id)}" style="--accent:${cat.accent||'#D4AF37'}" aria-label="${cat.name}">
 <span class="cat-thumb"><img src="${src}" alt="${cat.name}" loading="lazy" decoding="async"></span>
 <span class="cat-meta"><span class="cat-label">${cat.name}</span><span class="cat-count">${count} ${count===1?'produkt':'produkte'} →</span></span>
 </a>`;
 }).join('');
}

// PRODUCTS - PREMIUM CARDS WITH ANIMATION
function getFilteredProducts(){
 let list = [...PRODUCTS];
 if(activeCategory) list = list.filter(p=>p.category===activeCategory);
 if(activeBrand) list = list.filter(p=>String(p.brand).toLowerCase()===activeBrand.toLowerCase());
 if(activePromo==='week') list = list.filter(p=>p.weeklyOffer);
 else if(activePromo==='popular') list = list.filter(p=>p.popular);
 if(searchQuery){
 const ids = new Set(searchProducts(searchQuery, 500).map(p=>p.id));
 list = list.filter(p=>ids.has(p.id));
 }
 return list;
}

function renderProducts(){
 const grid = $('#productGrid');
 const empty = $('#emptyState');
 if(!grid) return;
 const page = document.body.dataset.page || 'home';
 let list = getFilteredProducts();
 if(page==='home') list = list.filter(p=>p.discount>0 || p.weeklyOffer).slice(0, homeLimit('offers',8));
 if(page==='market' && new URLSearchParams(location.search).get('filter')==='oferta') list = list.filter(p=>p.discount>0);
 if(page!=='home'){
  const byPrice = p=>getProductFinalPrice(p).finalPrice;
  if(sortMode==='price-asc') list = [...list].sort((a,b)=>byPrice(a)-byPrice(b));
  else if(sortMode==='price-desc') list = [...list].sort((a,b)=>byPrice(b)-byPrice(a));
  else if(sortMode==='discount') list = [...list].sort((a,b)=>(b.discount||0)-(a.discount||0));
  else if(sortMode==='name') list = [...list].sort((a,b)=>String(a.name).localeCompare(String(b.name),'sq'));
 }
 const count = $('#resultCount');
 if(count) count.textContent = `${list.length} ${list.length===1?'produkt':'produkte'}`;
 if(list.length===0){
  grid.style.display='none';
  if(empty) empty.style.display='block';
  return;
 }
 grid.style.display='grid';
 if(empty) empty.style.display='none';
 grid.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(grid);
 if(window.HanaAutoBg) window.HanaAutoBg.scan(grid);
}

function getProductFinalPrice(p){
  if(OFFERS && OFFERS.length>0){
    try{
      const result = calculateFinalPrice(p, OFFERS);
      if(result && result.finalPrice>=0 && result.finalPrice!==p.price){
        return result;
      }
    }catch{}
  }
  const hasDiscount = p.originalPrice && p.discount>0 && p.originalPrice>p.price;
  return {
    finalPrice: p.price,
    originalPrice: hasDiscount ? p.originalPrice : null,
    discount: p.discount||0,
    hasDiscount,
    appliedOffer: null
  };
}

function renderProductCard(p,i=0){
 const inCart = cart.find(c=>c.id===p.id);
 const isWish = wishlist.includes(p.id);
 const priceInfo = getProductFinalPrice(p);
 const hasDiscount = priceInfo.hasDiscount || priceInfo.discount>0;
 const isLowStock = p.stock>0 && p.stock <= (p.lowStockThreshold||10);
 const isOutOfStock = p.stock<=0 || p.availability==='out_of_stock';
 const displayPrice = Math.max(0, priceInfo.finalPrice);
 const displayOriginal = priceInfo.originalPrice && priceInfo.originalPrice>displayPrice ? priceInfo.originalPrice : null;
 // 100K X: WebP srcset + LQIP + DOMPurify XSS + tilt + gold-pulse + aria
 const safeBrand = (typeof Security!=='undefined' ? Security.escapeHtml(p.brand) : (typeof DOMPurify!=='undefined' ? DOMPurify.sanitize(p.brand) : String(p.brand).replace(/</g,'&lt;')));
 const safeName = (typeof Security!=='undefined' ? Security.escapeHtml(p.name) : (typeof DOMPurify!=='undefined' ? DOMPurify.sanitize(p.name) : String(p.name).replace(/</g,'&lt;')));
 const mainImg = p.mainImage||p.image||'images/hero-premium-bag-400w.webp';
 const webpSrc = mainImg.replace(/\.(jpg|jpeg|png)$/i, '.webp');
 const webp400 = mainImg.replace(/\.(jpg|jpeg|png)$/i, '-400w.webp');
 const webp800 = mainImg.replace(/\.(jpg|jpeg|png)$/i, '-800w.webp');
 const lqip = mainImg.replace(/\.(jpg|jpeg|png|webp)$/i, '-lqip.jpg');
 const isHero = mainImg.includes('hero-');
 const hasWebP = isHero || mainImg.includes('products/') || mainImg.includes('image-search/');
 return `<article class="product-card ${isOutOfStock?'out-of-stock':''}" data-id="${p.id}" style="animation-delay:${i*0.04}s" role="article" aria-label="${safeBrand} ${safeName} - ${p.price}€">
 <div class="product-media image-wrapper">
 ${hasWebP?`<img class="lqip" src="${lqip}" alt="" loading="eager" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(20px);transform:scale(1.1);" onerror="this.style.display='none'">`:''}
 ${hasDiscount?`<span class="badge-discount gold-pulse">-${priceInfo.discount}%</span>`:''}
 ${priceInfo.appliedOffer?`<span class="badge-discount gold-shimmer" style="background:linear-gradient(135deg,#D4AF37,#B8962E);left:auto;right:10px">${priceInfo.appliedOffer.badge||'OFERTË'}</span>`:''}
 ${isLowStock && !isOutOfStock?`<span class="badge-discount" style="left:auto;right:${hasDiscount||priceInfo.appliedOffer?'70px':'10px'};background:linear-gradient(135deg,#F59E0B,#D97706)">Pak stok</span>`:''}
 ${isOutOfStock?`<span class="badge-discount" style="background:rgba(0,0,0,.8);left:50%;transform:translateX(-50%)">Jashtë stokut</span>`:''}
 <button class="wish-btn ${isWish?'active':''} btn-press" data-wish="${p.id}" aria-label="Wishlist ${safeName}">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWish?'currentColor':'none'}" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0l-1.3 1.3-1.3-1.3c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l8 8 8-8c1.5-1.5 1.5-4 0-5.5z"/></svg>
 </button>
 <img src="${isHero?webp800:(hasWebP?webpSrc:mainImg)}" ${isHero?`srcset="${webp400} 400w, ${webp800} 800w, ${webpSrc} 1200w" sizes="(max-width:768px) 50vw, 280px"`:''} alt="${safeBrand} ${safeName} - ${p.category} - Marka botërore origjinale Pejë" loading="lazy" decoding="async" class="main-image loaded${isHero?' scene':''}" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.removeAttribute('srcset');this.src='${mainImg}'}else{this.src='images/hero-premium-bag-400w.webp'}">
 </div>
 <div class="product-info">
 <span class="product-brand">${safeBrand}</span>
 <h3 class="product-name">${safeName}</h3>
 <div class="product-bottom">
  <div class="product-prices">
   ${displayOriginal?`<span class="price-old">${formatPrice(displayOriginal)}</span>`:''}
   <span class="price-new ${hasDiscount?'gold':''}">${formatPrice(displayPrice)}</span>
  </div>
  ${cardFootHtml(p)}
 </div>
 </div>
 </article>`;
}

function cardFootHtml(p){
 const out = p.stock<=0 || p.availability==='out_of_stock';
 const it = cart.find(c=>c.id===p.id);
 if(out) return `<div class="product-foot" data-qty="x"><span class="stock-out">Jashtë stokut</span></div>`;
 if(it){
  const max = typeof p.stock==='number' && it.qty>=p.stock;
  return `<div class="product-foot in-cart" data-qty="${it.qty}"><div class="qty-stepper"><button type="button" data-dec="${p.id}" aria-label="Pakëso">−</button><span>${it.qty}</span><button type="button" data-inc="${p.id}" aria-label="Shto edhe një" ${max?'disabled':''}>+</button></div></div>`;
 }
 return `<div class="product-foot" data-qty="0"><button type="button" class="add-btn" data-add="${p.id}" aria-label="Shto ${String(p.name).replace(/"/g,'')} në shportë"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button></div>`;
}

function syncCardControls(){
 document.querySelectorAll('.product-card').forEach(card=>{
  const p = PRODUCTS.find(x=>x.id===card.dataset.id);
  if(!p) return;
  const foot = card.querySelector('.product-foot');
  if(foot){
   const it = cart.find(c=>c.id===p.id);
   const q = it ? String(it.qty) : '0';
   if(foot.dataset.qty!==q && foot.dataset.qty!=='x'){
    foot.outerHTML = cardFootHtml(p);
    card.querySelector('.product-foot')?.animate([{transform:'scale(.94)',opacity:.6},{transform:'scale(1)',opacity:1}],{duration:200,easing:'ease-out'});
   }
  }
  const w = card.querySelector('.wish-btn');
  if(w){ const on = wishlist.includes(p.id); w.classList.toggle('active',on); w.querySelector('svg')?.setAttribute('fill',on?'currentColor':'none'); }
 });
}

function bindProductGridEvents(grid){
 if(grid.dataset.bound) return;
 grid.dataset.bound = '1';
 grid.addEventListener('click', e=>{
  const add = e.target.closest('[data-add]');
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const wish = e.target.closest('[data-wish]');
  if(add){
   e.stopPropagation();
   const card = add.closest('.product-card');
   addToCart(add.dataset.add, 1, card?.querySelector('.product-media img.main-image') || add);
  } else if(inc){
   e.stopPropagation();
   const id = inc.dataset.inc; const it = cart.find(c=>c.id===id); const p = PRODUCTS.find(x=>x.id===id);
   if(it && !(typeof p?.stock==='number' && it.qty>=p.stock)) setQty(id,it.qty+1);
  } else if(dec){
   e.stopPropagation();
   const id = dec.dataset.dec; const it = cart.find(c=>c.id===id);
   if(it) setQty(id,it.qty-1);
  } else if(wish){
   e.stopPropagation();
   toggleWishlist(wish.dataset.wish); syncCardControls();
  }
 });
}

// Hap modalin e produktit (delegim: punon edhe pasi kartat rindërtohen)
document.addEventListener('click', e=>{
 const card = e.target.closest('.product-card');
 if(!card || e.target.closest('button,a,input')) return;
 if(card.closest('#searchResults')) return;
 if(card.dataset.id && window.openProductModal) window.openProductModal(card.dataset.id);
});

function renderAllGrids(){
 renderProducts();
 renderAlcoholGrid();
 renderTobaccoGrid();
 renderBuldakGrid();
 renderPopularGrid();
}

function renderAlcoholGrid(){
 const grid = $('#alcoholGrid');
 if(!grid) return;
 const list = PRODUCTS.filter(p=> p.category==='alkool').slice(0,8);
 grid.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(grid);
}

function renderTobaccoGrid(){
 const grid = $('#tobaccoGrid');
 if(!grid) return;
 const list = PRODUCTS.filter(p=>p.category==='cigare').slice(0,8);
 grid.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(grid);
}

function renderBuldakGrid(){
 const grid = $('#bulldakGrid');
 if(!grid) return;
 const list = PRODUCTS.filter(p=>p.category==='bulldak').slice(0,8);
 grid.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(grid);
}

function renderPopularGrid(){
 const grid = $('#popularGrid');
 if(!grid) return;
 const list = PRODUCTS.filter(p=>p.popular).slice(0, homeLimit('best',8));
 grid.innerHTML = list.map((p,i)=>renderProductCard(p,i)).join('');
 bindProductGridEvents(grid);
}

// PREMIUM CART CONSTANTS - SECURE CALCULATION FROM STORE SETTINGS - TRUSTED BACKEND LOGIC
const GIFT_WRAP_FEE = 1.50;
let giftWrapEnabled = false;
let discountCode = null;
let discountPercent = 0;
let discountFreeDelivery = false;

function getDeliveryConfig(){
  if(window.HanaCities && window.HanaCities.get(currentCity)){
    const c = window.HanaCities.cfg(currentCity);
    return { flatFee:c.flatFee, freeThreshold:c.freeThreshold, expressFee:0, minOrder:c.minOrder, maxOrder:c.maxOrder };
  }
  // Secure: Use STORE_SETTINGS from CMS, not client-submitted total
  if(STORE_SETTINGS && STORE_SETTINGS.deliveryConfig){
    return {
      flatFee: STORE_SETTINGS.deliveryConfig.flatFee ?? 2.00,
      freeThreshold: STORE_SETTINGS.deliveryConfig.freeThreshold ?? 25.00,
      expressFee: STORE_SETTINGS.deliveryConfig.expressFee ?? 4.00,
      minOrder: STORE_SETTINGS.deliveryConfig.minOrder ?? 0,
      maxOrder: STORE_SETTINGS.deliveryConfig.maxOrder ?? 500,
    };
  }
  // Fallback with zone support
  if(DELIVERY_ZONES && DELIVERY_ZONES.length>0){
    const zone = DELIVERY_ZONES.find(z=>z.municipalities?.includes('Pejë') || z.name.toLowerCase().includes('pejë')) || DELIVERY_ZONES[0];
    return {
      flatFee: zone.fee ?? 2.00,
      freeThreshold: zone.freeThreshold ?? 25.00,
      expressFee: zone.expressFee ?? 4.00,
      minOrder: 0,
      maxOrder: 500,
    };
  }
  return {flatFee:2.00, freeThreshold:25.00, expressFee:4.00, minOrder:0, maxOrder:500};
}

function getDiscountCodes(){
  // In production, validate codes from Firestore offers collection securely
  const codes = {
    'HANA15':{percent:15,desc:'-15% zbritje'},
    'PEJA':{freeDelivery:true,desc:'Dërgesë falas'},
    'HANA10':{percent:10,desc:'-10% zbritje'},
    'GOLDEN':{percent:20,desc:'-20% Golden'},
    'FREE':{freeDelivery:true,desc:'Dërgesë falas'}
  };
  // Add active offers as discount codes
  if(OFFERS){
    OFFERS.forEach(o=>{
      if(o.status==='active' && o.badge){
        const code = o.badge.replace(/[^A-Z0-9]/g,'').toUpperCase() || o.id.toUpperCase();
        if(!codes[code] && o.type==='percentage'){
          codes[code]={percent:o.value,desc:o.name};
        }
      }
    });
  }
  return codes;
}

function clearCoupon(){ discountCode=null; discountPercent=0; discountFreeDelivery=false; window._appliedCoupon=null; window._couponMin=0; }
function setCoupon(c){
 clearCoupon();
 discountCode = String(c.code).toUpperCase();
 window._couponMin = Number(c.minOrder||0);
 if(c.type==='percent') discountPercent = Number(c.value);
 else if(c.type==='fixed') window._appliedCoupon = { code:discountCode, type:'fixed', discount:Number(c.value) };
 else discountFreeDelivery = true;
}

function calculateTotals(){
  // Secure: Calculate from trusted product data, not client input - 100K enhanced
  const subtotal = cartSubtotal();
  const config = getDeliveryConfig();
  
  // 100K: Time slot + express
  let timeSlotFee = 0;
  let timeSlotLabel = '';
  if(typeof Features100K!=='undefined'){
    const selectedSlot = Features100K.timeSlots.getSelected();
    if(selectedSlot && selectedSlot.price>0){
      timeSlotFee = selectedSlot.price;
      timeSlotLabel = selectedSlot.label;
    }
    if(Features100K.expressDelivery.isEnabled()){
      timeSlotFee += Features100K.expressDelivery.price;
      timeSlotLabel += ' + Express';
    }
  }
  
  // Validate min/max order
  if(config.minOrder>0 && subtotal>0 && subtotal < config.minOrder){
    // Will show warning in UI
  }
  if(config.maxOrder>0 && subtotal > config.maxOrder){
    // Will show warning
  }
  
  const couponOk = !window._couponMin || subtotal >= window._couponMin;
  let discountAmount = 0;
  if(discountPercent>0 && couponOk){
    discountAmount = Math.min(subtotal, subtotal * (discountPercent/100));
  }
  // 100K: Coupon from Features100K
  if(window._appliedCoupon && couponOk){
    const coupon = window._appliedCoupon;
    if(coupon.type==='percent') discountAmount += subtotal * (coupon.discount/100);
    else if(coupon.type==='fixed') discountAmount += coupon.discount;
    discountAmount = Math.min(subtotal, discountAmount);
  }
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const isFreeShipping = afterDiscount >= config.freeThreshold || (discountFreeDelivery && couponOk);
  const delivery = isFreeShipping ? 0 : (cart.length>0 ? config.flatFee : 0);
  const gift = giftWrapEnabled ? GIFT_WRAP_FEE : 0;
  const express = (typeof Features100K!=='undefined' && Features100K.expressDelivery.isEnabled()) ? Features100K.expressDelivery.price : 0;
  const grand = Math.max(0, afterDiscount + delivery + gift + timeSlotFee);
  return { subtotal, discountAmount, afterDiscount, delivery, gift, grand, isFreeShipping, config, timeSlotFee, timeSlotLabel, express };
}

function updateFreeShipping(){
 const { subtotal, afterDiscount, isFreeShipping, config } = calculateTotals();
 const FREE_SHIPPING_THRESHOLD = config.freeThreshold;
 const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount);
 const percent = Math.min(100, Math.round((afterDiscount / FREE_SHIPPING_THRESHOLD)*100));
 const freeRemaining = $('#freeRemaining');
 const freePercent = $('#freePercent');
 const freeProgress = $('#freeProgress');
 const freeText = $('#freeShipping .free-text');
 const freeTop = $('#freeShipping');
 if(!freeRemaining) return;
 if(cart.length===0){
 if(freeTop) freeTop.style.display='none';
 return;
 }
 if(freeTop) freeTop.style.display='block';
 if(isFreeShipping){
 freeRemaining.textContent = '0.00 €';
 if(freeText) freeText.innerHTML = `<strong style="color:#6EE7B7">Dërgesa në ${cityName()} është falas</strong>`;
 if(freePercent) freePercent.textContent = '100%';
 if(freeProgress) freeProgress.style.width = '100%';
 if(freeProgress) freeProgress.style.background = 'linear-gradient(90deg,#6EE7B7,#10B981)';
 }else{
 freeRemaining.textContent = `${remaining.toFixed(2)} €`;
 if(freeText) freeText.innerHTML = `Edhe <strong id="freeRemaining">${remaining.toFixed(2)} €</strong> për dërgesë falas në ${cityName()}`;
 if(freePercent) freePercent.textContent = `${percent}%`;
 if(freeProgress) freeProgress.style.width = `${percent}%`;
 if(freeProgress) freeProgress.style.background = 'linear-gradient(90deg,#E8C67A,#D4AF37,#B8962E)';
 }
}

function renderSuggestions(){
 const track = $('#suggestTrack');
 if(!track) return;
 // Suggest products not in cart, popular, like KFC/McD style add snack/drink
 const notInCart = PRODUCTS.filter(p=> !cart.find(c=>c.id===p.id)).slice(0,6);
 const suggestions = notInCart.length>0 ? notInCart : PRODUCTS.slice(0,4);
 track.innerHTML = suggestions.map(p=>`
 <div class="suggest-card" data-suggest="${p.id}">
 <img src="${p.image||p.mainImage}" alt="${p.name}">
 <div><strong>${p.brand} ${p.name.slice(0,18)}</strong><span>${formatPrice(p.price)}</span></div>
 <button class="suggest-add">+</button>
 </div>
 `).join('');
 track.querySelectorAll('.suggest-card').forEach(card=>{
 card.addEventListener('click', ()=>{
 const id = card.dataset.suggest;
 const img = card.querySelector('img');
 addToCart(id,1,img);
 renderCartDrawer();
 // Animate card
 card.animate([{transform:'scale(1)'},{transform:'scale(0.92)'},{transform:'scale(1)'}],{duration:300,easing:'cubic-bezier(.34,1.56,.64,1)'});
 });
 });
}

function updateTotalsUI(){
 const { subtotal, discountAmount, delivery, gift, grand, timeSlotFee, express } = calculateTotals();
 const subEl = $('#cartSubtotal');
 const delEl = $('#cartDelivery');
 const grandEl = $('#cartGrandTotal');
 const countEl = $('#cartDrawerCount');
 const cityEls = $$('.cart-city-name');
 const expressRow = $('#expressRow');
 const expressEl = $('#cartExpress');
 const discountRow = $('#discountRow');
 const discountEl = $('#cartDiscount');
 if(subEl) {
   subEl.textContent = `${subtotal.toFixed(2)} €`;
   if(typeof animateCountUp!=='undefined' && window._lastSubtotal!==subtotal){ animateCountUp(subEl, subtotal, 600); window._lastSubtotal=subtotal; }
 }
 if(delEl){
 if(discountFreeDelivery && cart.length>0){ const cfg=getDeliveryConfig(); delEl.innerHTML = `<span style="text-decoration:line-through;color:var(--text-4)">${cfg.flatFee.toFixed(2)} €</span> <span style="color:#6EE7B7">Falas</span>`; }
 else delEl.textContent = delivery===0 && cart.length>0 ? 'Falas' : `${delivery.toFixed(2)} €`;
 }
 if(expressRow && expressEl){
   if(express>0 || timeSlotFee>0){
     expressRow.style.display='flex';
     expressEl.textContent = `${(express+timeSlotFee).toFixed(2)} €`;
   } else expressRow.style.display='none';
 }
 if(discountRow && discountEl){
   if(discountAmount>0){
     discountRow.style.display='flex';
     discountEl.textContent = `-${discountAmount.toFixed(2)} €`;
   } else discountRow.style.display='none';
 }
 if(grandEl) {
   grandEl.textContent = `${grand.toFixed(2)} €`;
   if(typeof animateCountUp!=='undefined' && window._lastGrand!==grand){ animateCountUp(grandEl, grand, 800); window._lastGrand=grand; }
 }
 if(countEl){
 const count = cartCount();
 countEl.textContent = `${count} ${count===1?'artikull':'artikuj'}`;
 }
 cityEls.forEach(el=>el.textContent = cityName());
 
 const summary = $('#checkoutSummary');
 if(summary && cart.length>0){
 summary.innerHTML = `
 <div><span>Nëntotali (${cartCount()} artikuj)</span><span>${formatPrice(subtotal)}</span></div>
 ${discountAmount>0?`<div><span>Zbritja ${discountCode} (-${discountPercent}%)</span><span style="color:#6EE7B7">-${formatPrice(discountAmount)}</span></div>`:''}
 <div><span>Dërgesa në ${cityName()}</span><span>${delivery===0?'Falas':formatPrice(delivery)}</span></div>
 ${gift>0?`<div><span>Paketim Dhuratë</span><span>${formatPrice(gift)}</span></div>`:''}
 <div style="font-weight:800;border-top:1px solid rgba(255,255,255,.08);padding-top:10px;margin-top:6px;font-size:14px"><span>Gjithsej</span><span style="color:var(--gold-300);font-size:16px">${formatPrice(grand)}</span></div>
 `;
 }
}

// CART DRAWER - SUPER PREMIUM LIKE PHOTO
function renderCartDrawer(){
 const body = $('#cartItems');
 const foot = $('#cartFoot');
 const cartBody = $('#cartBody');
 if(!body) return;
 
 if(cart.length===0){
 body.innerHTML = `<div class="empty-state" style="margin:16px"><div class="empty-icon">🛒</div><h3>Shporta është bosh</h3><p>Shto produkte premium për dërgesë falas mbi ${getDeliveryConfig().freeThreshold}€</p><button class="btn btn-gold" onclick="document.getElementById('ofertat').scrollIntoView({behavior:'smooth'})">Shiko ofertat • Red Bull, Grey Goose, Jack</button></div>`;
 if(foot) foot.style.display='none';
 const freeTop = $('#freeShipping');
 if(freeTop) freeTop.style.display='none';
 const suggest = $('#cartSuggest');
 if(suggest) suggest.style.display='none';
 const gift = $('.cart-gift');
 if(gift) gift.style.display='none';
 const totals = $('#cartTotalsPremium');
 if(totals) totals.style.display='none';
 const disc = $('.discount-row');
 if(disc) disc.style.display='none';
 updateTotalsUI();
 return;
 }
 
 if(foot) foot.style.display='flex';
 const suggest = $('#cartSuggest');
 if(suggest) suggest.style.display='block';
 const giftEl = document.querySelector('.cart-gift');
 if(giftEl) giftEl.style.display='block';
 const totals = $('#cartTotalsPremium');
 if(totals) totals.style.display='grid';
 const disc = document.querySelector('.discount-row');
 if(disc) disc.style.display='grid';

 body.innerHTML = cart.map(c=>{
 const p = PRODUCTS.find(x=>x.id===c.id);
 if(!p) return '';
 return `<div class="cart-item">
 <img src="${p.image||p.mainImage}" alt="${p.name}">
 <div class="cart-item-info">
 <strong>${p.brand} ${p.name}</strong>
 <small>${p.brand} • ${formatPrice(p.price)} / copë • ${p.stock>0?'Në stok':''}</small>
 <div class="cart-item-actions">
  <div class="cart-qty"><button data-cdec="${p.id}">−</button><span>${c.qty}</span><button data-cinc="${p.id}">+</button></div>
  <span class="cart-price">${formatPrice(p.price*c.qty)}</span>
 </div>
 </div>
 <button class="icon-btn" data-crem="${p.id}" style="width:32px;height:32px;background:rgba(255,59,59,.08);border-color:rgba(255,59,59,.12);color:#FF7A7A">🗑️</button>
 </div>`;
 }).join('');
 
 body.querySelectorAll('[data-cinc]').forEach(b=>b.addEventListener('click', ()=>setQty(b.dataset.cinc, (cart.find(x=>x.id===b.dataset.cinc)?.qty||0)+1)));
 body.querySelectorAll('[data-cdec]').forEach(b=>b.addEventListener('click', ()=>setQty(b.dataset.cdec, (cart.find(x=>x.id===b.dataset.cdec)?.qty||0)-1)));
 body.querySelectorAll('[data-crem]').forEach(b=>b.addEventListener('click', ()=>removeFromCart(b.dataset.crem)));
 
 updateFreeShipping();
 renderSuggestions();
 updateTotalsUI();
}

function renderWishlistDrawer(){
 const body = $('#wishlistItems');
 const count = $('#wishlistDrawerCount');
 if(!body) return;
 const items = wishlist.map(id=>PRODUCTS.find(x=>x.id===id)).filter(Boolean);
 if(items.length===0){
  body.innerHTML = `<div class="wl-empty"><h3>Asnjë produkt i ruajtur</h3><p>Shtyp zemrën te një produkt për ta ruajtur këtu.</p><a class="s-btn s-btn-gold" href="/market">Shfleto produktet</a></div>`;
 } else {
  body.innerHTML = items.map(p=>{
   const pr = getProductFinalPrice(p);
   const out = p.stock<=0 || p.availability==='out_of_stock';
   return `<div class="wl-row" data-id="${p.id}">
    <button type="button" class="wl-img" data-wopen="${p.id}" aria-label="Hap ${escH(p.name)}"><img src="${p.mainImage||p.image}" alt="" loading="lazy"></button>
    <div class="wl-info"><small>${escH(p.brand)}</small><strong>${escH(p.name)}</strong><em>${formatPrice(Math.max(0,pr.finalPrice))}</em></div>
    <div class="wl-actions">${out?'<span class="wl-out">Jashtë stokut</span>':`<button type="button" class="wl-add" data-wadd="${p.id}" aria-label="Shto në shportë">+</button>`}<button type="button" class="wl-rem" data-wrem="${p.id}" aria-label="Hiq nga wishlist">✕</button></div>
   </div>`;
  }).join('');
  body.querySelectorAll('[data-wadd]').forEach(b=>b.addEventListener('click', ()=>{ addToCart(b.dataset.wadd,1,b.closest('.wl-row')?.querySelector('img')); }));
  body.querySelectorAll('[data-wrem]').forEach(b=>b.addEventListener('click', ()=>toggleWishlist(b.dataset.wrem)));
  body.querySelectorAll('[data-wopen]').forEach(b=>b.addEventListener('click', ()=>{ closeWishlist(); if(window.openProductModal) window.openProductModal(b.dataset.wopen); }));
 }
 if(count) count.textContent = `(${wishlist.length})`;
}

function updateCartUI(){
 const count = cartCount();
 [$('#cartCount'), $('#bnCartCount')].forEach(el=>{
 if(!el) return;
 el.textContent = count;
 el.style.display = count>0 ? 'grid' : 'none';
 });
 renderCartDrawer();
 syncCardControls();
 if(window.HanaShopUX) window.HanaShopUX.cartChanged();
}
function updateWishlistUI(){
 const c = wishlist.length;
 const el = $('#wishlistCount');
 if(el){ el.textContent=c; el.style.display=c>0?'grid':'none'; }
 renderWishlistDrawer();
}

// SEARCH
const escH = v => String(v==null?'':v).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getSearches(){ try{ return JSON.parse(localStorage.getItem('hana_searches')||'[]'); }catch{ return []; } }
function saveSearch(q){
 q = String(q||'').trim(); if(q.length<2) return;
 const l = getSearches().filter(x=>x.toLowerCase()!==q.toLowerCase()); l.unshift(q);
 try{ localStorage.setItem('hana_searches', JSON.stringify(l.slice(0,6))); }catch{}
}
function renderSearchSuggestions(){
 const box = $('#searchSuggestions');
 if(!box) return;
 const recent = getSearches();
 const brands = brandStats().slice(0,8).map(b=>b.brand);
 const cats = CATEGORIES.filter(c=>c.visible!==false && PRODUCTS.some(p=>p.category===c.id));
 box.innerHTML =
  (recent.length ? `<h4>Kërkimet e fundit <button type="button" class="sg-clear" id="sgClear">Pastro</button></h4><div class="suggestion-chips">${recent.map(q=>`<button type="button" class="chip" data-q="${escH(q)}">${escH(q)}</button>`).join('')}</div>` : '') +
  (brands.length ? `<h4>Marka popullore</h4><div class="suggestion-chips">${brands.map(b=>`<button type="button" class="chip" data-q="${escH(b)}">${escH(b)}</button>`).join('')}</div>` : '') +
  (cats.length ? `<h4>Kategori</h4><div class="suggestion-chips">${cats.map(c=>`<a class="chip" href="${catHref(c.id)}">${escH(c.name)}</a>`).join('')}</div>` : '');
}

const normQ = x => String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ç/g,'c');

function searchProducts(q, limit=20){
 const toks = normQ(q).split(/\s+/).filter(Boolean);
 if(!toks.length) return [];
 return PRODUCTS.filter(p=>p.status!=='archived').map(p=>{
  const catName = CATEGORIES.find(c=>c.id===p.category)?.name || '';
  const hay = normQ([p.name, p.brand, catName, p.sku].join(' '));
  const hit = toks.every(t=>hay.includes(t));
  const score = hit ? (normQ(p.name).startsWith(toks[0]) || normQ(p.brand).startsWith(toks[0]) ? 2 : 1) : 0;
  return {p, score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.p);
}

function renderSearchResults(q){
 const container = $('#searchResults');
 if(!container) return;
 const sug = $('#searchSuggestions');
 if(!q){ container.innerHTML = ''; if(sug) sug.style.display='block'; return; }
 if(sug) sug.style.display='none';
 const list = searchProducts(q);
 const safeQ = String(q).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 if(list.length===0){
  container.innerHTML = `<div class="sr-empty"><h3>Asnjë rezultat për "${safeQ}"</h3><p>Provo një emër tjetër ose shfleto kategoritë.</p><a class="s-btn s-btn-gold" href="/market">Shiko të gjitha produktet</a></div>`;
  return;
 }
 container.innerHTML = `<div class="sr-count">${list.length} ${list.length===1?'rezultat':'rezultate'}</div>` + list.map(p=>{
  const pr = getProductFinalPrice(p);
  const out = p.stock<=0 || p.availability==='out_of_stock';
  const img = p.mainImage || p.image || 'images/hero-premium-bag-400w.webp';
  return `<div class="sr-row" data-id="${p.id}" role="button" tabindex="0">
   <span class="sr-img"><img src="${img}" alt="" loading="lazy"></span>
   <span class="sr-info"><small>${p.brand}</small><strong>${p.name}</strong><em>${formatPrice(Math.max(0,pr.finalPrice))}${pr.originalPrice && pr.originalPrice>pr.finalPrice?` <s>${formatPrice(pr.originalPrice)}</s>`:''}</em></span>
   ${out?'<span class="sr-out">Jashtë stokut</span>':`<button type="button" class="sr-add" data-add="${p.id}" aria-label="Shto ${String(p.name).replace(/"/g,'')} në shportë">+</button>`}
  </div>`;
 }).join('');
 if(window.HanaAutoBg) window.HanaAutoBg.scan(container);
}

// DRAWER CONTROLS
function openCart(){ $('#cartDrawer')?.classList.add('open'); $('#drawerBackdrop')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ $('#cartDrawer')?.classList.remove('open'); if(!$('#wishlistDrawer')?.classList.contains('open')){ $('#drawerBackdrop')?.classList.remove('open'); document.body.style.overflow=''; } }
function openWishlist(){ $('#wishlistDrawer')?.classList.add('open'); $('#drawerBackdrop')?.classList.add('open'); document.body.style.overflow='hidden'; }
function closeWishlist(){ $('#wishlistDrawer')?.classList.remove('open'); if(!$('#cartDrawer')?.classList.contains('open')){ $('#drawerBackdrop')?.classList.remove('open'); document.body.style.overflow=''; } }
function openSearch(){ renderSearchSuggestions(); $('#searchOverlay')?.classList.add('open'); setTimeout(()=>$('#searchOverlayInput')?.focus(),100); document.body.style.overflow='hidden'; }
function closeSearch(){ $('#searchOverlay')?.classList.remove('open'); document.body.style.overflow=''; }
function openAccount(){ $('#accountModal')?.classList.add('open'); $('#accountBackdrop')?.classList.add('open'); }
function closeAccount(){ $('#accountModal')?.classList.remove('open'); $('#accountBackdrop')?.classList.remove('open'); }
function openCheckout(){
 if(cart.length===0){ toast('Shporta është bosh'); return; }
 closeCart();
 $('#checkoutModal')?.classList.add('open');
 $('#checkoutBackdrop')?.classList.add('open');
 document.body.style.overflow='hidden';
 renderCartDrawer();
 populateCitySelect();
 if(window.HanaCities) window.HanaCities.fillDom();
 if(window.HanaShopUX) window.HanaShopUX.resetGeo();
}
function closeCheckout(){ $('#checkoutModal')?.classList.remove('open'); $('#checkoutBackdrop')?.classList.remove('open'); document.body.style.overflow=''; }
function openTracking(){ $('#trackingModal')?.classList.add('open'); $('#trackingBackdrop')?.classList.add('open'); }
function openTrackingPanel(){
 openTracking();
 const res = $('#trackingResult');
 if(res) res.innerHTML = '';
 try{ if(JSON.parse(localStorage.getItem(isFirebaseEnabled()?'hana_my_orders':'hana_orders')||'[]').length) renderMyOrders(); }catch{}
 setTimeout(()=>$('#trackingInput')?.focus(), 350);
}
function closeTracking(){ $('#trackingModal')?.classList.remove('open'); $('#trackingBackdrop')?.classList.remove('open'); }

// HERO SLER - 4 SLES PROFESSIONAL
function renderHeroFromCMS(){
  if(!HERO_SLIDES || HERO_SLIDES.length===0) return;
  const container=$('#heroSlides');
  const dotsContainer=$('#heroDots');
  if(!container) return;
  
  // Filter visible and scheduled
  const now=new Date();
  const visibleSlides=HERO_SLIDES.filter(h=>{
    if(h.visible===false) return false;
    if(h.scheduleStart && new Date(h.scheduleStart)>now) return false;
    if(h.scheduleEnd && new Date(h.scheduleEnd)<now) return false;
    if(h.status && h.status!=='published') return false;
    return true;
  }).sort((a,b)=>(a.order||0)-(b.order||0));

  if(visibleSlides.length===0) return;

  container.innerHTML=visibleSlides.map((h,i)=>`
    <div class="hero-slide ${i===0?'active':''}" data-slide="${i}">
      <div class="hero-bg"><div class="hero-gradient clean"></div></div>
      <div class="hero-inner clean-hero">
        <div class="hero-content">
          <span class="eyebrow">${h.eyebrow||'HANA EXCLUSIVE'}</span>
          <h1 class="hero-title">${(h.headline||'').replace(/\n/g,'<br>')}</h1>
          <p class="hero-sub">${h.subtext||''}</p>
          <div class="hero-ctas">
            ${h.primaryBtnText?`<button class="btn btn-gold" onclick="handleHeroCTA('${h.primaryBtnLink||'#ofertat'}')">${h.primaryBtnText}</button>`:''}
            ${h.secondaryBtnText?`<button class="btn btn-outline" onclick="handleHeroCTA('${h.secondaryBtnLink||'/market'}')">${h.secondaryBtnText}</button>`:''}
          </div>
        </div>
        <div class="hero-visual clean-visual">
          <img src="${h.desktopImage}" alt="${h.headline||'Hana'}" class="hero-main-img" onerror="this.src='images/hero-premium-bag.jpg'">
        </div>
      </div>
    </div>
  `).join('');

  if(dotsContainer){
    dotsContainer.innerHTML=visibleSlides.map((_,i)=>`<button class="dot ${i===0?'active':''}" data-dot="${i}"></button>`).join('');
  }
}

function handleHeroCTA(link){
  if(!link) return;
  if(link.startsWith('#')){ document.querySelector(link)?.scrollIntoView({behavior:'smooth'}); }
  else if(link.startsWith('/')){ location.href=link; }
  else { location.href=link; }
}

function initHero(){
 // First render from CMS if available
 renderHeroFromCMS();
 
 const slides = $$('.hero-slide');
 const dots = $$('#heroDots .dot');
 if(slides.length===0) return;
 function setSlide(i){
 heroIndex = (i+slides.length)%slides.length;
 slides.forEach((s,idx)=>s.classList.toggle('active', idx===heroIndex));
 dots.forEach((d,idx)=>d.classList.toggle('active', idx===heroIndex));
 }
 dots.forEach((dot,i)=>dot.addEventListener('click', ()=>{ setSlide(i); resetTimer(); }));
 $('#heroPrev')?.addEventListener('click', ()=>{ setSlide(heroIndex-1); resetTimer(); });
 $('#heroNext')?.addEventListener('click', ()=>{ setSlide(heroIndex+1); resetTimer(); });
 function resetTimer(){ clearInterval(heroTimer); heroTimer = setInterval(()=>setSlide(heroIndex+1), 6500); }
 resetTimer();
 // Auto pause on hover
 $('#ballina')?.addEventListener('mouseenter', ()=>clearInterval(heroTimer));
 $('#ballina')?.addEventListener('mouseleave', resetTimer);
 // Touch swipe
 let startX=0;
 $('#ballina')?.addEventListener('touchstart', e=>{ startX=e.touches[0].clientX; clearInterval(heroTimer); },{passive:true});
 $('#ballina')?.addEventListener('touchend', e=>{
 const diff = e.changedTouches[0].clientX - startX;
 if(Math.abs(diff)>50){ if(diff>0) setSlide(heroIndex-1); else setSlide(heroIndex+1); }
 resetTimer();
 },{passive:true});
}

// CHECKOUT & ORDER TRACKING - PREMIUM WITH GIFT WRAP & DISCOUNT
function initCheckout(){
 $('#checkoutBtn')?.addEventListener('click', openCheckout);
 $('#closeCheckout')?.addEventListener('click', closeCheckout);
 $('#checkoutBackdrop')?.addEventListener('click', closeCheckout);
 $('#continueShop')?.addEventListener('click', ()=>{ closeCart(); $('#ofertat')?.scrollIntoView({behavior:'smooth'}); });

 // Gift wrap toggle
 $('#giftWrap')?.addEventListener('change', e=>{
 giftWrapEnabled = e.target.checked;
 updateTotalsUI();
 updateFreeShipping();
 toast(giftWrapEnabled ? '🎁 Paketim dhuratë luksoze u shtua (+1.50€)' : 'Paketim dhuratë u hoq', giftWrapEnabled?'gold':'default');
 });

 // Gift note toggle
 $('#giftNoteBtn')?.addEventListener('click', ()=>{
 const input = $('#giftNoteInput');
 if(!input) return;
 const isHidden = input.style.display==='none';
 input.style.display = isHidden ? 'block' : 'none';
 if(isHidden) $('#giftNoteText')?.focus();
 });

 // Discount code — 100K with Firestore dynamic coupons + rate limiting + XSS protection
 $('#discountApply')?.addEventListener('click', ()=>{
 const input = $('#discountInput');
 const msg = $('#discountMsg');
 if(!input || !msg) return;
 const code = input.value.trim().toUpperCase();
 if(!code){ msg.style.display='none'; clearCoupon(); updateTotalsUI(); updateFreeShipping(); return; }
 if(typeof Security!=='undefined' && !Security.rateLimiter.check('coupon', 8, 60000)){
  msg.className='discount-msg error'; msg.style.display='block'; msg.textContent='Shumë përpjekje. Provo pas 1 minute.'; return;
 }
 const r = window.HanaCoupons.validate(code, calculateTotals().subtotal);
 msg.style.display='block';
 if(!r.valid){
  clearCoupon();
  msg.className='discount-msg error'; msg.textContent = r.error;
  if(typeof haptic!=='undefined') haptic('error');
 } else {
  setCoupon(r.coupon);
  const desc = window.HanaCoupons.describe(r.coupon);
  msg.className='discount-msg success'; msg.textContent = `${desc} u aplikua (${code})`;
  toast(`Kodi ${code}: ${desc}`, 'gold');
  if(typeof haptic!=='undefined') haptic('success');
 }
 updateTotalsUI(); updateFreeShipping();
 });
 $('#discountInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#discountApply')?.click(); } });

 $('#placeOrderBtn')?.addEventListener('click', async()=>{
 const name = $('#coName').value.trim();
 const phone = $('#coPhone').value.trim();
 const email = $('#coEmail').value.trim();
 const address = $('#coAddress').value.trim();
 const city = $('#coCity').value;
 const notes = $('#coNotes').value.trim();
 const giftNote = $('#giftNoteText')?.value.trim() || '';

 if(!name || name.length<3){ toast('Emri dhe Mbiemri obligativ • min 3 shkronja'); $('#coName').focus(); return; }
 if(!phone || phone.length<8){ toast('📞 Telefoni obligativ • +383 48 588 886 • p.sh. +383 49 123 456'); $('#coPhone').focus(); return; }
 if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ toast('📧 Email korrekt obligativ • emri@email.com'); $('#coEmail').focus(); return; }
 const geo = window.HanaShopUX ? window.HanaShopUX.getLocation() : null;
 if(!address || address.length<(geo?3:8)){ toast('📍 Shkruaj adresën (rruga, numri, lagjja)'); $('#coAddress').focus(); return; }

 const btn = $('#placeOrderBtn');
 btn.textContent = 'Duke procesuar...'; btn.disabled=true;

 try{
 const totals = calculateTotals();
 const order = {
 items: cart,
 subtotal: totals.subtotal,
 discountCode,
 discountAmount: totals.discountAmount,
 deliveryFee: totals.delivery,
 giftWrap: giftWrapEnabled,
 giftWrapFee: totals.gift,
 giftNote,
 total: totals.grand,
 customer: { name, phone, email, address, city, notes, location: geo },
 location: city,
 payment: 'cash_on_delivery',
 contactPhone: '+383 48 588 886'
 };
 // 100K: Use transaction for stock to prevent race condition + save address + gift message + time slot + express + coupon
           let created;
           const slot = (typeof Features100K!=='undefined') ? Features100K.timeSlots.getSelected() : null;
           if(isFirebaseEnabled()){
             const srv = await placeOrderServer({
               items: cart.map(c=>({id:c.id, qty:c.qty})),
               customer: { name, phone, email, address, city, notes, location: geo },
               giftWrap: giftWrapEnabled,
               giftNote: (typeof Features100K!=='undefined' && Features100K.giftMessage.get()) || giftNote,
               timeSlot: slot?.id || null,
               express: (typeof Features100K!=='undefined') ? Features100K.expressDelivery.isEnabled() : false,
               couponCode: (window._appliedCoupon && window._appliedCoupon.code) || discountCode || ''
             });
             created = { id: srv.trackingId, total: srv.total, status: srv.status, createdAt: srv.createdAt };
             try{
               const mine = JSON.parse(localStorage.getItem('hana_my_orders')||'[]');
               mine.unshift({ id: srv.trackingId, total: srv.total, createdAt: srv.createdAt, status: srv.status, items: cart.map(c=>({id:c.id, qty:c.qty})) });
               localStorage.setItem('hana_my_orders', JSON.stringify(mine.slice(0,30)));
             }catch{}
             totals.grand = srv.total;
           } else if(isLocalDemoHost()){
             order.timeSlot = slot;
             order.express = (typeof Features100K!=='undefined') ? Features100K.expressDelivery.isEnabled() : false;
             order.coupon = (typeof window._appliedCoupon!=='undefined') ? window._appliedCoupon : null;
             order.giftMessage = (typeof Features100K!=='undefined') ? Features100K.giftMessage.get() : giftNote;
             created = await createOrderWithTransaction(order);
           } else {
             toast('Porosia online është përkohësisht e pa disponueshme. Thirr: '+(window.HANA_CONFIG?.phone||'+383 48 588 886'));
             return;
           }
           
           // 100K: Save address if checked
           try{
             if($('#saveAddressCheck')?.checked && typeof Features100K!=='undefined'){
               Features100K.savedAddresses.save({name, phone, email, address, city, isDefault:true});
             }
           }catch{}
           
           // 100K: Confetti + haptic + audit log + invoice
           try{
             if(typeof triggerConfetti!=='undefined') triggerConfetti(30);
             if(typeof haptic!=='undefined') haptic('success');
             if(typeof Security!=='undefined') Security.logAudit('order_created', {orderId: created.id, total: totals.grand});
           }catch{}
 // Reset + ekran suksesi
 closeCheckout();
 cart=[];
 giftWrapEnabled=false;
 const gw = $('#giftWrap'); if(gw) gw.checked=false;
 discountCode=null; discountPercent=0; discountFreeDelivery=false;
 const di = $('#discountInput'); if(di) di.value='';
 const dm = $('#discountMsg'); if(dm) dm.style.display='none';
 const gn = $('#giftNoteText'); if(gn) gn.value='';
 const gni = $('#giftNoteInput'); if(gni) gni.style.display='none';
 saveCart();
 const cc = window.HanaCities ? window.HanaCities.get(city) : null;
 if(window.HanaShopUX && window.HanaShopUX.orderSuccess){
  window.HanaShopUX.orderSuccess({ id: created.id, total: totals.grand, phone, minutes: cc ? cc.minutes : 30, city: cityName(city) });
 } else {
  toast(`Porosia ${created.id} u krijua`, 'gold');
  openTracking(); $('#trackingInput').value = created.id; renderTrackingResult(created.id);
 }

 }catch(e){
 console.error(e);
 const userFacing = ['functions/failed-precondition','functions/invalid-argument','functions/resource-exhausted'].includes(e?.code);
 toast(userFacing && e.message ? e.message : 'Gabim gjatë krijimit të porosisë • Thirr +383 48 588 886');
 }finally{
 btn.textContent = 'Konfirmo porosinë'; btn.disabled=false;
 }
 });
}

async function renderTrackingResult(orderId){
 const result = $('#trackingResult');
 if(!result) return;
 const safeId = String(orderId).replace(/[^A-Za-z0-9-]/g,'').slice(0,40);
 const phoneTxt = window.HANA_CONFIG?.phone||'+383 48 588 886';
 const notFound = ()=>{ result.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><h3>Nuk u gjet porosia ${safeId}</h3><p>Kontrollo ID-në ose kontakto ${phoneTxt} • Hana Free Shop</p></div>`; };
 let order = null;
 if(isFirebaseEnabled()){
  result.innerHTML = '<div class="empty-state"><p>Duke kërkuar…</p></div>';
  try{ const t = await trackOrderServer(safeId); order = { id:t.trackingId, status:t.status, total:t.total, createdAt:t.createdAt, itemCount:t.itemCount, history:t.history }; }
  catch(e){ if(e?.code==='functions/resource-exhausted'){ result.innerHTML='<div class="empty-state"><p>Shumë kërkime. Provo pas pak.</p></div>'; return; } return notFound(); }
 } else {
  let orders=[]; try{ orders=JSON.parse(localStorage.getItem('hana_orders')||'[]'); }catch{}
  order = orders.find(o=>o.id===safeId);
 }
 if(!order) return notFound();
 const statusMap = {
 pending:{label:'Pending • Pranuar',desc:'Porosia u pranua, presim konfirmimin',color:'pending'},
 confirmed:{label:'Konfirmuar • Telefonuar',desc:'Ne ju thirrëm dhe u konfirmua',color:'confirmed'},
 on_the_way:{label:'Në rrugë • Korrieri u nis',desc:'Porosia është nisur drejt adresës suaj',color:'on_the_way'},
 delivered:{label:'Dërguar • Dorëzuar',desc:'Porosia u dorëzua me sukses',color:'delivered'}
 };
 const currentStatus = order.status==='new' ? 'pending' : (order.status || 'pending');
 const steps = ['pending','confirmed','on_the_way','delivered'];
 const cancelled = currentStatus==='cancelled';
 const currentIdx = steps.indexOf(currentStatus);
 const esc = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pii = order.customer ? `<div style="margin-top:12px;padding:10px;background:rgba(255,255,255,.03);border-radius:10px;font-size:11px;color:var(--text-3)">📍 ${esc(order.customer.address)} • 📞 ${esc(order.customer.phone)}</div>` : '';
 const histMap = {}; (order.history||[]).forEach(h=>{ const k = h.status==='new' ? 'pending' : h.status; if(!histMap[k]) histMap[k] = h.timestamp; });
 const fmtT = ts => ts ? new Date(ts).toLocaleTimeString('sq-AL',{hour:'2-digit',minute:'2-digit'}) : '';
 const stepsHtml = steps.map((s,i)=>{
  const info = statusMap[s];
  const done = i<currentIdx, cur = i===currentIdx;
  const t = histMap[s] ? fmtT(histMap[s]) : (i===0 ? fmtT(order.createdAt) : '');
  return `<li class="tl-step${done?' done':''}${cur?' current':''}"><span class="tl-dot">${done?'✓':''}</span><div class="tl-body"><strong>${info.label.split(' • ')[0]}</strong><small>${info.desc}</small></div><span class="tl-time">${t}</span></li>`;
 }).join('');
 const minutes = (window.HanaCities && window.HanaCities.current() ? window.HanaCities.current().minutes : 30) || 30;
 const eta = ['pending','confirmed','on_the_way'].includes(currentStatus) ? new Date(new Date(order.createdAt).getTime() + minutes*60000) : null;
 const etaHtml = eta ? `<div class="tl-eta">Dorëzimi pritet rreth <b>${fmtT(eta)}</b></div>` : (currentStatus==='delivered' ? '<div class="tl-eta ok">Porosia u dorëzua</div>' : '');
 result.innerHTML = `<div class="card" style="padding:16px">
 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong style="font-size:16px">${esc(order.id)}</strong><span class="badge gold">${formatPrice(order.total)}</span></div>
 <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">${new Date(order.createdAt).toLocaleString('sq-AL')}${order.itemCount?` • ${order.itemCount} artikuj`:''}</div>
 ${cancelled ? `<div class="tl-eta bad">Kjo porosi është anuluar. Thirr ${esc(phoneTxt)} për detaje.</div>` : `${etaHtml}<ol class="tl">${stepsHtml}</ol>`}
 ${pii}</div>`;
}

function initTracking(){
 $('#trackingOpenBtn')?.addEventListener('click', ()=>{ closeAccount(); openTracking(); });
 $('#myOrdersBtn')?.addEventListener('click', ()=>{ closeAccount(); openTracking(); renderMyOrders(); });
 $('#closeTracking')?.addEventListener('click', closeTracking);
 $('#trackingBackdrop')?.addEventListener('click', closeTracking);
 $('#trackingSearchBtn')?.addEventListener('click', ()=>{ const id=$('#trackingInput').value.trim().toUpperCase(); if(id) renderTrackingResult(id); });
 $('#trackingInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const id=e.target.value.trim().toUpperCase(); if(id) renderTrackingResult(id); } });
}

function renderMyOrders(){
 const result = $('#trackingResult');
 let orders=[]; try{ orders=JSON.parse(localStorage.getItem(isFirebaseEnabled()?'hana_my_orders':'hana_orders')||'[]'); }catch{}
 if(orders.length===0){
  result.innerHTML = `<div class="tr-empty"><p>Porositë që bën nga kjo pajisje shfaqen këtu. Ose shkruaj ID-në më sipër.</p></div>`;
  return;
 }
 result.innerHTML = `<div class="tr-list-title">Porositë e tua</div><div class="tr-list">${orders.slice(0,10).map(o=>`<div class="tr-row">
  <button type="button" class="tr-open" data-track="${o.id}"><strong>${o.id}</strong><span>${new Date(o.createdAt).toLocaleDateString('sq-AL')} • ${formatPrice(o.total)}</span></button>
  ${(o.items&&o.items.length)?`<button type="button" class="tr-again" data-reorder="${o.id}">Blej përsëri</button>`:''}
 </div>`).join('')}</div>`;
 result.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click', ()=>{ $('#trackingInput').value=b.dataset.track; renderTrackingResult(b.dataset.track); }));
 result.querySelectorAll('[data-reorder]').forEach(b=>b.addEventListener('click', ()=>reorderFrom(b.dataset.reorder)));
}

function whatsappOrder(){
 if(cart.length===0){ toast('Shporta është bosh'); return; }
 const t = calculateTotals();
 const c = window.HanaSite ? window.HanaSite.contactFrom(window.HANA_HOME_DEFAULTS||{}, STORE_SETTINGS||{}, window.HanaCities ? window.HanaCities.current() : null) : {};
 const num = c.whatsapp || (window.HANA_CONFIG && window.HANA_CONFIG.whatsapp) || '38348588886';
 const lines = cart.map(ci=>{
  const p = PRODUCTS.find(x=>x.id===ci.id); if(!p) return null;
  return `• ${ci.qty} × ${p.brand} ${p.name} — ${formatPrice(getProductFinalPrice(p).finalPrice*ci.qty)}`;
 }).filter(Boolean);
 const msg = [
  `Përshëndetje! Dua të porosis nga Hana Free Shop (${cityName()}):`, '', ...lines, '',
  `Nëntotali: ${formatPrice(t.subtotal)}`,
  t.discountAmount>0 ? `Zbritja${discountCode?' ('+discountCode+')':''}: -${formatPrice(t.discountAmount)}` : null,
  `Dërgesa: ${t.delivery===0?'Falas':formatPrice(t.delivery)}`,
  `Totali: ${formatPrice(t.grand)}`, '', 'Emri:', 'Adresa:', 'Telefoni:'
 ].filter(x=>x!==null).join('\n');
 window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
}

function reorderFrom(id){
 let all=[]; try{ all=[...JSON.parse(localStorage.getItem('hana_my_orders')||'[]'), ...JSON.parse(localStorage.getItem('hana_orders')||'[]')]; }catch{}
 const o = all.find(x=>x.id===id);
 if(!o || !Array.isArray(o.items) || !o.items.length){ toast('Nuk gjetëm produktet e kësaj porosie.'); return; }
 let added=0, skipped=0;
 o.items.forEach(it=>{
  const p = PRODUCTS.find(x=>x.id===it.id);
  const have = cart.find(c=>c.id===it.id)?.qty || 0;
  if(!p || p.status==='archived' || p.stock<=0 || p.availability==='out_of_stock'){ skipped++; return; }
  const q = Math.min(Number(it.qty)||1, typeof p.stock==='number' ? Math.max(0,p.stock-have) : (Number(it.qty)||1));
  if(q<=0){ skipped++; return; }
  const ex = cart.find(c=>c.id===it.id);
  if(ex) ex.qty += q; else cart.push({ id:it.id, qty:q });
  added++;
 });
 saveCart(); closeTracking();
 if(added){ openCart(); toast(`U shtuan ${added} produkte nga porosia${skipped?` (${skipped} nuk janë në stok)`:''}`, 'gold'); }
 else toast('Asnjë nga produktet nuk është në stok tani.');
}

// NAVIGATION
function initNavigation(){
 $$('.bottom-nav .bn-item').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 const nav = btn.dataset.nav;
 $$('.bottom-nav .bn-item').forEach(b=>b.classList.remove('active'));
 btn.classList.add('active');
 const onHome = (document.body.dataset.page||'home')==='home';
 if(nav==='ballina'){ if(onHome) window.scrollTo({top:0, behavior:'smooth'}); else location.href='/'; }
 else if(nav==='market'){ location.href='/market'; }
 else if(nav==='kerko') openSearch();
 else if(nav==='shporta') openCart();
 else if(nav==='porosite') openTrackingPanel();
 });
 });
 $('#cartBtn')?.addEventListener('click', openCart);
 $('#wishlistBtn')?.addEventListener('click', openWishlist);
 $('#trackBtn')?.addEventListener('click', openTrackingPanel);
 $('#drawerBackdrop')?.addEventListener('click', ()=>{ closeCart(); closeWishlist(); });
 $$('.close-drawer').forEach(b=>b.addEventListener('click', ()=>{ if(b.dataset.close==='wishlist') closeWishlist(); else closeCart(); }));
 $('#accountBackdrop')?.addEventListener('click', closeAccount);
 $('#closeAccount')?.addEventListener('click', closeAccount);
 $('#closeSearch')?.addEventListener('click', closeSearch);
 $$('[data-scroll]').forEach(btn=>{ btn.addEventListener('click', ()=>{ const sel=btn.dataset.scroll||btn.getAttribute('data-filter')?null:btn.dataset.scroll; if(sel) $(sel)?.scrollIntoView({behavior:'smooth'}); }); });
 $$('[data-filter]').forEach(btn=>{
 btn.addEventListener('click', ()=>{
 const cat = btn.dataset.filter;
 activeCategory = cat;
 renderCategories();
 renderProducts();
 $('#ofertat')?.scrollIntoView({behavior:'smooth'});
 });
 });
 $('#viewAllCats')?.addEventListener('click', e=>{ e.preventDefault(); activeCategory=null; renderCategories(); renderProducts(); });
 $('#viewAllOffers')?.addEventListener('click', e=>{ e.preventDefault(); activePromo=null; activeCategory=null; searchQuery=''; $('#searchInput').value=''; renderCategories(); renderProducts(); });
 $('#clearFilters')?.addEventListener('click', ()=>{ activeCategory=null; activePromo=null; searchQuery=''; $('#searchInput').value=''; renderCategories(); renderProducts(); });
 $('#locationBtn')?.addEventListener('click', ()=>{ $('#locationModal')?.classList.add('open'); $('#locationBackdrop')?.classList.add('open'); });
 $$('.promo-item').forEach(item=>{
 item.addEventListener('click', e=>{
 e.preventDefault();
 const type = item.dataset.promo;
 activePromo = activePromo===type ? null : type;
 renderProducts();
 $$('.promo-item').forEach(i=>i.style.background = i.dataset.promo===activePromo ? 'rgba(232,198,122,.10)' : '');
 });
 });
}

// SEARCH
function initSearch(){
 const input = $('#searchInput');
 const overlayInput = $('#searchOverlayInput');
 function onSearch(val){ renderSearchResults(val.trim()); }
 input?.addEventListener('input', e=>onSearch(e.target.value));
 input?.addEventListener('focus', ()=>{ openSearch(); });
 const goSearch = v=>{ const q=String(v||'').trim(); if(q) location.href='/market?q='+encodeURIComponent(q); };
 overlayInput?.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); saveSearch(overlayInput.value); goSearch(overlayInput.value); } });
 $('#searchResults')?.addEventListener('click', e=>{
  const add = e.target.closest('[data-add]');
  if(add){ e.stopPropagation(); addToCart(add.dataset.add,1,add.closest('.sr-row')?.querySelector('img')); return; }
  const row = e.target.closest('.sr-row');
  if(row){ saveSearch(overlayInput?.value); closeSearch(); if(window.openProductModal) window.openProductModal(row.dataset.id); }
 });
 $('#searchResults')?.addEventListener('keydown', e=>{ if((e.key==='Enter'||e.key===' ') && e.target.classList.contains('sr-row')){ e.preventDefault(); e.target.click(); } });
 overlayInput?.addEventListener('input', e=>onSearch(e.target.value));
 $('#searchSuggestions')?.addEventListener('click', e=>{
  if(e.target.closest('#sgClear')){ try{ localStorage.removeItem('hana_searches'); }catch{} renderSearchSuggestions(); return; }
  const c = e.target.closest('[data-q]');
  if(c){ const v=c.dataset.q; if(input) input.value=v; if(overlayInput) overlayInput.value=v; onSearch(v); saveSearch(v); }
 });
 document.addEventListener('keydown', e=>{
 if(e.key==='Escape'){ closeCart(); closeWishlist(); closeSearch(); closeAccount(); closeCheckout(); closeTracking(); const locM=$('#locationModal'); if(locM?.classList.contains('open')){ locM.classList.remove('open'); $('#locationBackdrop')?.classList.remove('open'); document.body.style.overflow=''; } }
 if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openSearch(); }
 });
}

// AUTH - WITH GOOGLE + bardhiicloud@gmail.com owner — 100% LOGIC SUPER PROFESSIONAL
function initAuth(){
 const emailEl = $('#authEmail');
 const passEl = $('#authPass');
 onAuthState(user=>{
 const authState = $('#authState');
 const userState = $('#userState');
 const userEmailEl = $('#userEmail');
 if(user){
 if(authState) authState.style.display='none';
 if(userState) userState.style.display='block';
 if(userEmailEl) userEmailEl.textContent = user.email || user.displayName || 'Përdorues';
 const isOwner = user.email && user.email.toLowerCase() === 'bardhiicloud@gmail.com';
 const roleLabel = isOwner ? 'Owner • Google • Admin' : (user.role ? `${user.role} • ${user.provider||'password'}` : (isFirebaseEnabled() ? 'Firebase Auth' : 'Lokal'));
 $('#userMeta') && ($('#userMeta').textContent = roleLabel);
 // Show admin link if owner
 const adminLink = $('#adminLink');
 if(adminLink){
   adminLink.style.display = isOwner || user.role==='owner' ? 'flex' : 'none';
 }
 }else{
 if(authState) authState.style.display='block';
 if(userState) userState.style.display='none';
 }
 });
 
 // Ensure owner admin exists
 try{
   if(typeof ensureOwnerAdmin!=='undefined') ensureOwnerAdmin();
   else {
     // Fallback ensure owner
     const ADMIN_OWNER = 'bardhiicloud@gmail.com';
     let admins = [];
     try{ admins = JSON.parse(localStorage.getItem('hana_admin_users_v1')||'[]'); }catch{ admins=[]; }
     if(!admins.find(u=>u.email.toLowerCase()===ADMIN_OWNER.toLowerCase())){
       admins.push({id:'owner-'+btoa(ADMIN_OWNER).slice(0,8), email:ADMIN_OWNER, displayName:'Bardhi', role:'owner', provider:'google', createdAt:new Date().toISOString(), lastLogin:new Date().toISOString(), isOwner:true});
       localStorage.setItem('hana_admin_users_v1', JSON.stringify(admins));
     }
   }
 }catch(e){ console.warn('Ensure owner failed', e); }
 
 $('#loginBtn')?.addEventListener('click', async()=>{
 const email=emailEl.value.trim(), pass=passEl.value;
 if(!email||!pass) return toast('Plotëso email dhe fjalëkalim');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Email korrekt obligativ');
 try{ await signInLocal(email,pass); const isOwner=email.toLowerCase()==='bardhiicloud@gmail.com'; toast(isOwner ? '✅ U kyçe si OWNER • bardhiicloud@gmail.com • Admin' : 'U kyçe me sukses • Pa ID', 'gold'); closeAccount(); if(isOwner) setTimeout(()=>{ if(confirm('Je kyçur si OWNER • Dëshiron të hapësh SUPER ADMIN CMS?')) location.href='/admin/'; },800); }catch(e){ toast(e.message||'Gabim'); }
 });
 $('#registerBtn')?.addEventListener('click', async()=>{
 const email=emailEl.value.trim(), pass=passEl.value;
 if(!email||!pass) return toast('Plotëso email dhe fjalëkalim');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Email korrekt obligativ');
 if(pass.length<6) return toast('Fjalëkalimi të paktën 6 karaktere');
 try{ await signUpLocal(email,pass); const isOwner=email.toLowerCase()==='bardhiicloud@gmail.com'; toast(isOwner ? '✅ Llogaria OWNER u krijua • bardhiicloud@gmail.com • Admin' : 'Llogaria u krijua • Pa ID • Mund të porositësh', 'gold'); closeAccount(); }catch(e){ toast(e.message||'Gabim'); }
 });
 
 // GOOGLE LOGIN — 100% LOGIC — bardhiicloud@gmail.com owner
 $('#googleLoginBtn')?.addEventListener('click', async()=>{
   const btn = $('#googleLoginBtn');
   if(btn){ btn.textContent='Duke u kyçur me Google...'; btn.disabled=true; }
   try{
     let result;
     if(typeof signInWithGoogle!=='undefined'){
       result = await signInWithGoogle();
     } else {
       // Fallback mock Google for local
       const ADMIN_OWNER='bardhiicloud@gmail.com';
       const mockUser={email:ADMIN_OWNER, uid:'google-'+btoa(ADMIN_OWNER).slice(0,12), displayName:'Bardhi', photoURL:'', role:'owner', provider:'google'};
       localStorage.setItem('hana_user', JSON.stringify(mockUser));
       localStorage.setItem('hana_user_id', mockUser.uid);
       let admins=[]; try{ admins=JSON.parse(localStorage.getItem('hana_admin_users_v1')||'[]'); }catch{ admins=[]; }
       if(!admins.find(u=>u.email===ADMIN_OWNER)) admins.push({id:mockUser.uid, email:ADMIN_OWNER, displayName:'Bardhi', role:'owner', provider:'google', createdAt:new Date().toISOString(), lastLogin:new Date().toISOString()});
       localStorage.setItem('hana_admin_users_v1', JSON.stringify(admins));
       result={user:mockUser};
     }
     const user=result.user;
     const isOwner=user.email && user.email.toLowerCase()==='bardhiicloud@gmail.com';
     toast(isOwner ? `✅ Google Login si OWNER • ${user.email} • Admin` : `✅ Google Login • ${user.email}`, 'gold');
     closeAccount();
     if(isOwner){
       setTimeout(()=>{
         if(confirm(`🎉 Je kyçur me Google si OWNER\n\n${user.email}\n\nDëshiron të hapësh SUPER ADMIN CMS?`)){
           location.href='/admin/';
         }
       },600);
     }
     if(typeof Security!=='undefined') Security.logAudit('google_login', {email:user.email, isOwner});
     if(typeof haptic!=='undefined') haptic('success');
     if(typeof triggerConfetti!=='undefined') triggerConfetti(20);
   }catch(e){
     console.error('Google login failed', e);
     toast('❌ Google login dështoi: '+(e.message||'Gabim'), 'default');
     if(typeof haptic!=='undefined') haptic('error');
   } finally {
     if(btn){ btn.textContent='Continue with Google'; btn.disabled=false; }
   }
 });
 
 $('#logoutBtn')?.addEventListener('click', async()=>{ try{ await signOutLocal(); toast('U çkyçe • Mirupafshim!'); closeAccount(); }catch{} });
}

// SUPER HUGE BEST ANIMATIONS - ANOTHER LEVEL - 100% CLEAN LOGIC
function initLoadingScreen(){
  const loader = $('#loadingScreen');
  if(!loader) return;
  window.addEventListener('load', ()=>{
    setTimeout(()=>{
      loader.classList.add('hidden');
      document.body.style.overflow='';
    }, 800);
  });
  // Fallback hide after 2s
  setTimeout(()=>{
    loader.classList.add('hidden');
  }, 2200);
}

function initFAB(){
  const fab = $('#fab');
  if(!fab) return;
  let lastScroll = 0;
  window.addEventListener('scroll', ()=>{
    const current = window.scrollY;
    if(current>400){
      fab.classList.remove('hidden');
    }else{
      fab.classList.add('hidden');
    }
    lastScroll = current;
  },{passive:true});
  fab.addEventListener('click', openCart);
}

function initCountdown(){
  const hEl=$('#cdH'), mEl=$('#cdM'), sEl=$('#cdS');
  if(!hEl) return;
  let total = 12*3600 + 34*60 + 56; // 12:34:56
  setInterval(()=>{
    total--;
    if(total<0) total = 12*3600 + 34*60 + 56;
    const h = Math.floor(total/3600);
    const m = Math.floor((total%3600)/60);
    const s = total%60;
    hEl.textContent = String(h).padStart(2,'0');
    mEl.textContent = String(m).padStart(2,'0');
    sEl.textContent = String(s).padStart(2,'0');
  },1000);
}

function initNewsletter(){
  $('#newsletterBtn')?.addEventListener('click', ()=>{
    const email = $('#newsletterEmail')?.value.trim();
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      toast('Email korrekt obligativ për ofertat');
      return;
    }
    toast(`✅ U abonove me ${email} • -15% zbritje do vjen në email`, 'gold');
    $('#newsletterEmail').value='';
    // Save to localStorage
    try{
      const list = JSON.parse(localStorage.getItem('hana_newsletter')||'[]');
      list.push({email, date:new Date().toISOString()});
      localStorage.setItem('hana_newsletter', JSON.stringify(list));
    }catch{}
  });
}

function initMagneticButtons(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  $$('.btn-magnetic, .btn-gold').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--mx', `${x}px`);
      btn.style.setProperty('--my', `${y}px`);
      const centerX = rect.width/2;
      const centerY = rect.height/2;
      const deltaX = (x - centerX) / 8;
      const deltaY = (y - centerY) / 8;
      btn.style.transform = `translate(${deltaX}px,${deltaY}px) scale(1.02)`;
    });
    btn.addEventListener('mouseleave', ()=>{
      btn.style.transform = '';
    });
  });
}

function initSmoothAnimations(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.12,rootMargin:'0px 0px -60px 0px'});
  $$('.reveal, .categories, .offers, .featured-section, .footer, .super-huge, .super-card, .step-card, .testi-card').forEach(el=>{
    if(!el.classList.contains('reveal')) el.classList.add('reveal');
    observer.observe(el);
  });
}

// INIT - SUPER HUGE BEST ANIMATION MOST LOGIC ANOTHER LEVEL - 100% CLEAN - CONNECTED TO SUPER ADMIN CMS - 100K with maintenance mode
async function init(){
  
  // 100K: Maintenance mode check from STORE_SETTINGS
  try{
    const maintenance = localStorage.getItem('hana_maintenance_mode');
    if(maintenance==='true'){
      document.body.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:#070709;color:#fff;text-align:center;padding:20px"><div><div style="width:80px;height:80px;background:linear-gradient(135deg,#FFF1C6,#D4AF37);border-radius:20px;display:grid;place-items:center;margin:0 auto 20px;font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:700;color:#1A1200">H</div><h1 style="font-family:'Cormorant Garamond',serif;font-size:32px;margin-bottom:12px">Punime në progres</h1><p style="color:#CFCFD6;max-width:400px;margin:0 auto">Hana Free Shop është në mirëmbajtje për të sjellë përvojë edhe më të mirë. Kthehemi së shpejti!</p><p style="margin-top:16px;color:#E8C67A">📞 +383 48 588 886</p></div></div>`;
      return;
    }
  }catch{}
  
  loadState();
  updateCartUI();
  updateWishlistUI();
  await initFirebase();
 try{
 const [products, categories, promos, hero, brands, banners, offers, storeSettings, deliveryZones] = await Promise.all([
   fetchProducts(), 
   fetchCategories(), 
   fetchPromos(),
   fetchHero().catch(()=>[]),
   fetchBrands().catch(()=>[]),
   fetchBanners().catch(()=>[]),
   fetchOffers().catch(()=>[]),
   fetchStoreSettings().catch(()=>null),
   fetchDeliveryZones().catch(()=>[]),
 ]);
 PRODUCTS = products; CATEGORIES = categories; PROMOS = promos; HERO_SLIDES = hero; BRANDS = brands; BANNERS = banners; OFFERS = offers; STORE_SETTINGS = storeSettings; DELIVERY_ZONES = deliveryZones;
 // If hero from CMS exists and has visible slides, use it
 if(HERO_SLIDES && HERO_SLIDES.length>0){
   const visibleHero = HERO_SLIDES.filter(h=>h.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0));
   if(visibleHero.length>0){
     // Check scheduling
     const now=new Date();
     const scheduled = visibleHero.filter(h=>{
       if(h.scheduleStart && new Date(h.scheduleStart)>now) return false;
       if(h.scheduleEnd && new Date(h.scheduleEnd)<now) return false;
       return true;
     });
     if(scheduled.length>0) HERO_SLIDES = scheduled;
   }
 }
 // Apply store settings to UI if exists + 100K maintenance mode
 if(STORE_SETTINGS){
   if(STORE_SETTINGS.maintenanceMode){
     document.body.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:#070709;color:#fff;text-align:center;padding:20px"><div><div style="width:80px;height:80px;background:linear-gradient(135deg,#FFF1C6,#D4AF37);border-radius:20px;display:grid;place-items:center;margin:0 auto 20px;font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:700;color:#1A1200">H</div><h1 style="font-family:'Cormorant Garamond',serif;font-size:32px;margin-bottom:12px">Punime në progres</h1><p style="color:#CFCFD6;max-width:400px;margin:0 auto">Hana Free Shop është në mirëmbajtje për të sjellë përvojë edhe më të mirë. Kthehemi së shpejti!</p><p style="margin-top:16px;color:#E8C67A">📞 +383 48 588 886</p><button onclick="localStorage.removeItem('hana_maintenance_mode'); location.reload()" style="margin-top:20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 16px;border-radius:999px">Rifresko</button></div></div>`;
     console.log('[100K] Maintenance mode active from STORE_SETTINGS');
     return;
   }
   if(STORE_SETTINGS.phone){
     $$('.footer-loc span').forEach(el=>{
       if(el.textContent.includes('+383')) el.textContent = el.textContent.replace(/\+383 [\d ]+/, STORE_SETTINGS.phone);
     });
   }
 }
 // Filter out expired offers for public display
 if(OFFERS && OFFERS.length>0){
   const now=new Date();
   OFFERS = OFFERS.filter(o=>{
     if(o.status==='expired') return false;
     if(o.status==='draft') return false;
     if(o.endDate && new Date(o.endDate)<now) return false;
     if(o.startDate && new Date(o.startDate)>now && o.status!=='scheduled') return false;
     return o.status==='active' || o.status==='scheduled';
   });
 }
 }catch(e){
 console.warn('Failed to fetch CMS data, using local', e);
 const local = getLocalData();
 PRODUCTS = local.products; CATEGORIES = local.categories; PROMOS = local.promos; HERO_SLIDES = local.hero||[]; BRANDS = local.brands||[]; BANNERS = local.banners||[]; OFFERS = local.offers||[]; STORE_SETTINGS = local.storeSettings||null; DELIVERY_ZONES = local.deliveryZones||[];
 }
 if(window.HanaCoupons) window.HanaCoupons.setOverrides(STORE_SETTINGS && STORE_SETTINGS.coupons);
 if(window.HanaCities){ window.HanaCities.setOverrides(STORE_SETTINGS && STORE_SETTINGS.cities, STORE_SETTINGS && STORE_SETTINGS.deliveryConfig); const cc = window.HanaCities.current(); if(cc) currentCity = cc.id; }
 setupPageContext();
 $('#sortSelect')?.addEventListener('change', e=>{ sortMode = e.target.value; renderProducts(); });
 applyHomeContent();
 refreshCityTexts();
 renderCategories();
 renderBrands();
 renderBrandChips();
 renderRecent();
 renderProducts();
 renderAlcoholGrid();
 renderTobaccoGrid();
 renderBuldakGrid();
 renderPopularGrid();
 renderCartDrawer();
 renderWishlistDrawer();
 initLocation();
 // initHero();
 initNavigation();
 initSearch();
 // initAuth(); — pa llogari klienti: porosi si vizitor, gjurmim me ID
 initCheckout();
 $('#waOrderBtn')?.addEventListener('click', whatsappOrder);
 initTracking();
 // initSmoothAnimations();
 // initFAB();
 // initCountdown();
 // initNewsletter();
 // initMagneticButtons();

 // Fix Shiko te gjitha - category filters - GO TO /market
 $('#viewAllCats')?.addEventListener('click', e=>{
 e.preventDefault();
 location.href='/market';
 });
 $('#viewAllOffers')?.addEventListener('click', e=>{
 e.preventDefault();
 location.href='/market?filter=oferta';
 });
 $('#viewPopular')?.addEventListener('click', e=>{
 e.preventDefault();
 location.href='/market?filter=popular';
 });
 $$('[data-filter-section]').forEach(btn=>{
 btn.addEventListener('click', e=>{
 e.preventDefault();
 const cat = btn.dataset.filterSection;
 if(cat==='pije-tonike') location.href='/market?cat=alkool';
 else if(cat==='ushqime-pije') location.href='/market?cat=ushqime-pije';
 else location.href=`/market?cat=${cat}`;
 });
 });


 try{
  const qp = new URLSearchParams(location.search);
  const pid = qp.get('p');
  if(pid && window.openProductModal) setTimeout(()=>window.openProductModal(pid), 400);
  const tid = qp.get('track');
  if(tid){ openTracking(); const ti=$('#trackingInput'); if(ti) ti.value=tid.toUpperCase(); renderTrackingResult(tid.toUpperCase()); }
  else if(qp.get('tracking')) openTrackingPanel();
 }catch{}
 console.log('[Hana Premium Fixed] App initialized - Super Huge Professional', {products:PRODUCTS.length, categories:CATEGORIES.length, city:currentCity, firebase:isFirebaseEnabled()});
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', ()=>{ const ph = window.HANA_CONFIG?.phone; const a = document.getElementById('trPhone'); if(a && ph){ a.textContent = ph; a.href = 'tel:' + ph.replace(/[^\d+]/g,''); } });
window.addEventListener('hana:toast', e=>toast(e.detail));
window.HANA = {
  getProducts:()=>PRODUCTS, getCart:()=>cart,
  getCartSummary:()=>({ count:cartCount(), subtotal:cartSubtotal(), total:(typeof calculateTotals==='function'? calculateTotals().grand : cartSubtotal()) }),
  openCart:()=>openCart(), closeCart:()=>closeCart(),
  openTracking:(id)=>{ openTracking(); if(id){ const i=$('#trackingInput'); if(i) i.value=id; renderTrackingResult(id); } },
  setCity:(id)=>setCity(id),
  trackView:(id)=>trackView(id),
  addToCart:(id,qty,el)=>addToCart(id,qty,el),
  toggleWishlist:(id)=>{ toggleWishlist(id); syncCardControls(); },
  isWished:(id)=>wishlist.includes(id),
  priceOf:(p)=>{ const r=getProductFinalPrice(p); return {finalPrice:Math.max(0,r.finalPrice), originalPrice:r.originalPrice, discount:r.discount}; },
  getCategories:()=>CATEGORIES,
  catHref:(id)=>catHref(id)
};
document.addEventListener('hana:city', ()=>{ /* sinkronizim nga skeda tjetër */ });
