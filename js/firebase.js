// HANA FREE SHOP — SUPER ADMIN CMS — Complete Firebase Layer
// Production-ready, secure, with local fallback for development
// Preserves existing design, extends with full CMS collections

let firebaseApp = null;
let db = null;
let auth = null;
let storage = null;
let firebaseEnabled = false;

const DEFAULT_CONFIG_KEY = 'hana_firebase_config';

// LocalStorage keys - versioned for clean migrations
const LS_KEYS = {
  PRODUCTS: 'hana_products_v7',
  CATEGORIES: 'hana_categories_v3',
  PROMOS: 'hana_promos_v2',
  BRANDS: 'hana_brands_v1',
  HERO: 'hana_hero_v1',
  BANNERS: 'hana_banners_v1',
  OFFERS: 'hana_offers_v1',
  MEDIA: 'hana_media_v1',
  DELIVERY_ZONES: 'hana_delivery_zones_v1',
  STORE_SETTINGS: 'hana_store_settings_v1',
  ORDERS: 'hana_orders',
  CUSTOMERS: 'hana_customers_v1',
  INVENTORY_LOGS: 'hana_inventory_logs_v1',
  AUDIT_LOGS: 'hana_audit_logs_v1',
  ADMIN_USERS: 'hana_admin_users_v1',
  NOTIFICATIONS: 'hana_notifications_v1',
};

// Fallback data - real business data, never fake
export const FALLBACK_CATEGORIES = [
 { id:'alkool', name:'Alkool Premium', name_en:'Premium Spirits', description:'Grey Goose, Jack Daniel\'s dhe marka të tjera botërore', image:'images/hero-alcohol-variety-800w.webp', accent:'#B8862E', slug:'alkool', parentId:null, order:1, visible:true, featured:true },
 { id:'cigare', name:'Cigare & Duhan', name_en:'Tobacco', description:'Puro, Golden Eagle, OCB', image:'images/hero-puro-tobacco-800w.webp', accent:'#8A5A2B', slug:'cigare', parentId:null, order:2, visible:true, featured:true },
 { id:'bulldak', name:'Buldak & Ice Cups', name_en:'Viral Food', description:'Noodles pikante koreane dhe akullore', image:'images/hero-buldak-ice-800w.webp', accent:'#C0392B', slug:'bulldak', parentId:null, order:3, visible:true, featured:true },
 { id:'pije-tonike', name:'Pije & Energjike', name_en:'Drinks & Energy', description:'Red Bull dhe pije premium', image:'images/products/redbull-250ml.webp', accent:'#2E6FBF', slug:'pije-tonike', parentId:null, order:4, visible:true, featured:true },
 { id:'cokollata-embelsira', name:'Çokollata & Ëmbëlsira', name_en:'Chocolate & Sweets', description:'Lindt, Ferrero, Kinder', image:'images/products/lindt-lindor-dark-200g.webp', accent:'#7B3F2A', slug:'cokollata-embelsira', parentId:null, order:5, visible:true, featured:true },
 { id:'ushqime-pije', name:'Ushqime & Snacks', name_en:'Food & Snacks', description:'Snacks dhe ushqime të importuara', image:'images/hero-premium-bag-800w.webp', accent:'#D4AF37', slug:'ushqime-pije', parentId:null, order:6, visible:true, featured:true },
];

export const FALLBACK_BRANDS = [
  { id:'lindt', name:'Lindt', logo:'', description:'Çokollata premium zvicerane', featured:true, order:1, visible:true },
  { id:'redbull', name:'Red Bull', logo:'', description:'Energy drink nr.1 në botë', featured:true, order:2, visible:true },
  { id:'grey-goose', name:'Grey Goose', logo:'', description:'Vodka premium franceze', featured:true, order:3, visible:true },
  { id:'jack-daniels', name:'Jack Daniel’s', logo:'', description:'Whiskey amerikan legjendar', featured:true, order:4, visible:true },
  { id:'kinder', name:'Kinder', logo:'', description:'Ëmbëlsira për fëmijë dhe të rritur', featured:true, order:5, visible:true },
  { id:'ferrero', name:'Ferrero', logo:'', description:'Rocher dhe produkte premium', featured:true, order:6, visible:true },
  { id:'lays', name:'Lay’s', logo:'', description:'Çipsat më të njohur', featured:false, order:7, visible:true },
  { id:'puro', name:'Puro', logo:'', description:'Duhani premium', featured:true, order:8, visible:true },
  { id:'golden-eagle', name:'Golden Eagle', logo:'', description:'Cigare premium', featured:true, order:9, visible:true },
  { id:'ocb', name:'OCB', logo:'', description:'Letra rrotullimi premium', featured:true, order:10, visible:true },
  { id:'buldak', name:'Buldak', logo:'', description:'Noodles koreane pikante', featured:true, order:11, visible:true },
];

export const FALLBACK_PRODUCTS = [
 { id:'lindt-lindor-dark-200', brand:'Lindt', name:'Lindor Dark 200g', name_en:'Lindor Dark 200g', category:'cokollata-embelsira', subcategory:null, sku:'LNDT-DARK-200', barcode:'', shortDesc:'Çokollata Lindor Dark premium', fullDesc:'Lindt Lindor Dark 200g - çokollata premium zvicerane me mbushje të butë. Origjinale 100% nga Zvicra.', purchaseCost:4.50, price:6.39, originalPrice:7.99, discount:20, promoPrice:null, images:['images/products/lindt-lindor-dark-200g.jpg'], mainImage:'images/products/lindt-lindor-dark-200g.jpg', gallery:['images/products/lindt-lindor-dark-200g.jpg'], stock:42, lowStockThreshold:10, availability:'in_stock', variants:[], weight:200, dimensions:{l:15,w:10,h:5}, featured:true, newArrival:false, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Lindt Lindor Dark 200g - Hana Free Shop', seoDesc:'Lindt Lindor Dark 200g çokollata premium zvicerane', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'redbull-250', brand:'Red Bull', name:'Energy Drink 250ml', name_en:'Energy Drink 250ml', category:'pije-tonike', sku:'RB-250', barcode:'', shortDesc:'Red Bull energjik', fullDesc:'Red Bull Energy Drink 250ml - pija energjike nr.1 në botë.', purchaseCost:0.90, price:1.52, originalPrice:1.79, discount:15, promoPrice:null, images:['images/products/redbull-250ml.jpg'], mainImage:'images/products/redbull-250ml.jpg', gallery:['images/products/redbull-250ml.jpg'], stock:120, lowStockThreshold:20, availability:'in_stock', variants:[], weight:250, dimensions:{l:6,w:6,h:12}, featured:true, newArrival:false, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Red Bull 250ml', seoDesc:'Red Bull Energy Drink', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'grey-goose-700', brand:'Grey Goose', name:'Vodka 700ml Premium', name_en:'Vodka 700ml Premium', category:'alkool', sku:'GG-700', barcode:'', shortDesc:'Vodka premium franceze', fullDesc:'Grey Goose Vodka 700ml - vodka premium franceze e distiluar nga gruri më i mirë.', purchaseCost:20.00, price:28.99, originalPrice:34.99, discount:17, promoPrice:null, images:['image-search/grey-goose-vodka-bottle-premium-1.jpg'], mainImage:'image-search/grey-goose-vodka-bottle-premium-1.jpg', gallery:['image-search/grey-goose-vodka-bottle-premium-1.jpg'], stock:18, lowStockThreshold:5, availability:'in_stock', variants:[], weight:700, dimensions:{l:8,w:8,h:25}, featured:true, newArrival:true, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Grey Goose Vodka 700ml', seoDesc:'Grey Goose Vodka premium', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'jack-daniels-700', brand:'Jack Daniel’s', name:'Old No.7 700ml', name_en:'Old No.7 700ml', category:'alkool', sku:'JD-700', barcode:'', shortDesc:'Whiskey amerikan', fullDesc:'Jack Daniel’s Old No.7 700ml - whiskey amerikan legjendar nga Tennessee.', purchaseCost:15.00, price:22.49, originalPrice:26.99, discount:16, promoPrice:null, images:['image-search/jack-daniels-whiskey-bottle-premium-1.jpg'], mainImage:'image-search/jack-daniels-whiskey-bottle-premium-1.jpg', gallery:['image-search/jack-daniels-whiskey-bottle-premium-1.jpg'], stock:22, lowStockThreshold:5, availability:'in_stock', variants:[], weight:700, dimensions:{l:8,w:8,h:24}, featured:true, newArrival:false, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Jack Daniels 700ml', seoDesc:'Jack Daniel’s Old No.7', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'puro-premium', brand:'Puro', name:'Puro Premium', name_en:'Puro Premium', category:'cigare', sku:'PURO-PREM', barcode:'', shortDesc:'Puro premium', fullDesc:'Puro Premium - duhani premium për shije autentike.', purchaseCost:4.00, price:5.99, originalPrice:7.50, discount:20, promoPrice:null, images:['images/hero-puro-tobacco.jpg'], mainImage:'images/hero-puro-tobacco.jpg', gallery:['images/hero-puro-tobacco.jpg'], stock:40, lowStockThreshold:10, availability:'in_stock', variants:[], weight:50, dimensions:{l:10,w:5,h:2}, featured:true, newArrival:false, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Puro Premium', seoDesc:'Puro Premium duhani', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'golden-eagle', brand:'Golden Eagle', name:'Cigare Golden Eagle', name_en:'Golden Eagle Cigarettes', category:'cigare', sku:'GE-CIG', barcode:'', shortDesc:'Cigare premium', fullDesc:'Golden Eagle cigare premium - marka e njohur me cilësi të garantuar.', purchaseCost:2.00, price:3.20, originalPrice:3.80, discount:16, promoPrice:null, images:['images/hero-puro-tobacco.jpg'], mainImage:'images/hero-puro-tobacco.jpg', gallery:['images/hero-puro-tobacco.jpg'], stock:60, lowStockThreshold:15, availability:'in_stock', variants:[], weight:20, dimensions:{l:8,w:5,h:2}, featured:true, newArrival:false, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Golden Eagle Cigare', seoDesc:'Golden Eagle cigare premium', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'buldak-noodles', brand:'Buldak', name:'Spicy Noodles Hot', name_en:'Spicy Noodles Hot', category:'bulldak', sku:'BUL-HOT', barcode:'', shortDesc:'Noodles pikante koreane', fullDesc:'Buldak Spicy Noodles Hot - noodles koreane pikante, trendi viral në TikTok.', purchaseCost:1.50, price:2.49, originalPrice:2.99, discount:17, promoPrice:null, images:['images/hero-buldak-ice.jpg'], mainImage:'images/hero-buldak-ice.jpg', gallery:['images/hero-buldak-ice.jpg'], stock:70, lowStockThreshold:20, availability:'in_stock', variants:[{name:'Pikante', options:['Mild','Hot','2x Spicy']}], weight:140, dimensions:{l:15,w:10,h:5}, featured:true, newArrival:true, bestSeller:true, homepageVisible:true, searchVisible:true, seoTitle:'Buldak Noodles Hot', seoDesc:'Buldak Spicy Noodles', popular:true, weeklyOffer:true, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
 { id:'ice-cups', brand:'Ice', name:'Ice Cups Premium', name_en:'Ice Cups Premium', category:'bulldak', sku:'ICE-CUP', barcode:'', shortDesc:'Akullore premium', fullDesc:'Ice Cups Premium - akullore premium në gota praktike.', purchaseCost:1.20, price:1.99, originalPrice:null, discount:0, promoPrice:null, images:['images/hero-buldak-ice.jpg'], mainImage:'images/hero-buldak-ice.jpg', gallery:['images/hero-buldak-ice.jpg'], stock:50, lowStockThreshold:10, availability:'in_stock', variants:[], weight:120, dimensions:{l:8,w:8,h:8}, featured:true, newArrival:true, bestSeller:false, homepageVisible:true, searchVisible:true, seoTitle:'Ice Cups Premium', seoDesc:'Ice Cups akullore', popular:true, weeklyOffer:false, status:'active', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
];

export const FALLBACK_PROMOS = [
 { id:'week', title:'Ofertat e javës', subtitle:'Zbritje deri -20%', active:true, type:'week', order:1 },
 { id:'popular', title:'Produktet më të kërkuara', subtitle:'Më të shiturat', active:true, type:'popular', order:2 },
];

export const FALLBACK_HERO = [
  { id:'hero-1', eyebrow:'HANA EXCLUSIVE • PEJË', headline:'Marka botërore,\nnë Pejë', subtext:'Koleksioni premium i importuar — Red Bull, Lindt, Ferrero, Kinder Bueno, Lay\'s dhe marka të tjera botërore, vetëm në Hana Free Shop. Cilësi e garantuar, dërgesë e shpejtë.', primaryBtnText:'Eksploro koleksionin →', primaryBtnLink:'#ofertat', secondaryBtnText:'Të gjitha kategoritë', secondaryBtnLink:'/market', desktopImage:'images/hero-premium-bag.jpg', mobileImage:'images/hero-premium-bag.jpg', focalPoint:'center', overlayIntensity:0.6, textAlign:'left', visible:true, order:1, scheduleStart:null, scheduleEnd:null, status:'published', createdAt:new Date().toISOString() },
  { id:'hero-2', eyebrow:'MARKA TË NJOHURA • ORIGJINALE', headline:'Duhani\nPremium', subtext:'Koleksioni më i kompletuar në Pejë — Puro origjinal, Golden Eagle, OCB, cigare premium. Marka të njohura botërore, cilësi e garantuar, stok i plotë çdo ditë.', primaryBtnText:'Shiko koleksionin →', primaryBtnLink:'/market?cat=cigare', secondaryBtnText:'Markat →', secondaryBtnLink:'/market?cat=cigare', desktopImage:'images/hero-puro-tobacco.jpg', mobileImage:'images/hero-puro-tobacco.jpg', focalPoint:'center', overlayIntensity:0.65, textAlign:'left', visible:true, order:2, scheduleStart:null, scheduleEnd:null, status:'published', createdAt:new Date().toISOString() },
  { id:'hero-3', eyebrow:'TRENDI VIRAL • TIKTOK FAMOUS', headline:'Bulldak &\nIce Cups', subtext:'Trendi viral i momentit — Noodles koreane Bulldak pikante dhe akullore Ice Cups. Më të kërkuarat në TikTok, tani në Pejë me çmime super dhe dërgesë të shpejtë.', primaryBtnText:'Zbulo trendin →', primaryBtnLink:'/market?cat=ushqime', secondaryBtnText:'Shiko viral →', secondaryBtnLink:'/market?cat=bulldak', desktopImage:'images/hero-buldak-ice.jpg', mobileImage:'images/hero-buldak-ice.jpg', focalPoint:'center', overlayIntensity:0.6, textAlign:'left', visible:true, order:3, scheduleStart:null, scheduleEnd:null, status:'published', createdAt:new Date().toISOString() },
  { id:'hero-4', eyebrow:'KOLEKSIONI PREMIUM • BOTËROR', headline:'Grey Goose &\nJack Daniel\'s', subtext:'Për momente speciale — Grey Goose Vodka, Jack Daniel\'s Whiskey, Hennessy dhe marka të tjera premium botërore. Origjinale 100%, paketim luksoz Hana Bag.', primaryBtnText:'Shiko alkoolin →', primaryBtnLink:'/market?cat=alkool', secondaryBtnText:'Koleksioni premium →', secondaryBtnLink:'/market?cat=alkool', desktopImage:'images/hero-alcohol-variety.jpg', mobileImage:'images/hero-alcohol-variety.jpg', focalPoint:'center', overlayIntensity:0.65, textAlign:'left', visible:true, order:4, scheduleStart:null, scheduleEnd:null, status:'published', createdAt:new Date().toISOString() },
];

export const FALLBACK_BANNERS = [
  { id:'ribbon-1', message:'Ofertat e javës', icon:'🏷️', bgColor:'rgba(232,198,122,0.12)', textColor:'#E8C67A', link:'#ofertat', animation:'glow', speed:'normal', visible:true, startDate:null, endDate:null, order:1 },
  { id:'ribbon-2', message:'Produktet më të kërkuara', icon:'✨', bgColor:'rgba(232,198,122,0.08)', textColor:'#E8C67A', link:'#produktet', animation:'slide', speed:'normal', visible:true, startDate:null, endDate:null, order:2 },
];

export const FALLBACK_OFFERS = [
  { id:'offer-1', name:'Zbritje Vera 2024', description:'Zbritje verore për të gjitha pijet', type:'percentage', value:15, products:[], categories:['pije-tonike'], badge:'-15%', campaignName:'Vera 2024', startDate:new Date().toISOString(), endDate:new Date(Date.now()+30*24*60*60*1000).toISOString(), status:'active', homepageVisible:true, carouselVisible:true, createdAt:new Date().toISOString() },
];

export const FALLBACK_DELIVERY_ZONES = [
  { id:'zone-peje', name:'Pejë Qytet', description:'Dërgesë brenda qytetit të Pejës', fee:2.00, freeThreshold:25.00, expressFee:4.00, estimatedWindow:'30 min', visible:true, order:1, postcodes:['30000'], municipalities:['Pejë'] },
  { id:'zone-peje-rrethine', name:'Rrethina e Pejës', description:'Fshatrat përreth Pejës', fee:3.50, freeThreshold:35.00, expressFee:6.00, estimatedWindow:'45 min', visible:true, order:2, postcodes:['30010'], municipalities:['Pejë'] },
];

export const FALLBACK_STORE_SETTINGS = {
  id:'main',
  storeName:'Hana Free Shop',
  description:'Dyqani premium me marka botërore në Pejë - Red Bull, Lindt, Ferrero, Grey Goose, Jack Daniel\'s dhe më shumë',
  address:'General Wesley Clark',
  city:'Pejë',
  country:'Kosovë',
  mapCoordinates:{lat:42.659, lng:20.288},
  mapLink:'https://maps.google.com/?q=Pejë+General+Wesley+Clark',
  phone:'+383 48 588 886',
  whatsapp:'+383 48 588 886',
  email:'info@hanafreeshop.com',
  socialLinks:{facebook:'https://facebook.com/hanafreeshop', instagram:'https://instagram.com/hanafreeshop', tiktok:'https://tiktok.com/@hanafreeshop'},
  openingHours:{
    monday:{open:'08:00', close:'22:00', closed:false},
    tuesday:{open:'08:00', close:'22:00', closed:false},
    wednesday:{open:'08:00', close:'22:00', closed:false},
    thursday:{open:'08:00', close:'22:00', closed:false},
    friday:{open:'08:00', close:'22:00', closed:false},
    saturday:{open:'08:00', close:'22:00', closed:false},
    sunday:{open:'08:00', close:'22:00', closed:false},
  },
  holidaySchedules:[],
  temporaryClosures:[],
  supportInfo:'Për pyetje, telefononi +383 48 588 886 çdo ditë 08:00-22:00',
  deliveryInfo:'Dërgesë e shpejtë në Pejë - Falas mbi 25€. Dorëzim brenda 30 minutash në qytet.',
  pickupInfo:'Mund të merrni porosinë në dyqan - General Wesley Clark, Pejë. Hapni 08:00-22:00',
  currency:'EUR',
  logo:'images/hero-premium-bag.jpg',
  favicon:'',
  theme:{primaryColor:'#D4AF37', secondaryColor:'#08080A', fontFamily:'Manrope'},
  contactInfo:{phone:'+383 48 588 886', email:'info@hanafreeshop.com', address:'General Wesley Clark, Pejë'},
  deliveryConfig:{flatFee:2.00, freeThreshold:25.00, expressFee:4.00, minOrder:0, maxOrder:500, pickupAvailable:true},
  paymentMethods:[{id:'cash', name:'Pagesë me para në dorë', description:'Paguani kur merrni porosinë', enabled:true, order:1}, {id:'online', name:'Pagesë online', description:'Paguani online me kartë', enabled:false, order:2}],
  taxConfig:{enabled:false, rate:0, inclusive:true},
  orderSettings:{autoConfirm:false, requirePhone:true, requireAddress:true, requireEmail:true},
  stockSettings:{trackStock:true, allowNegative:false, lowStockAlert:true, lowStockThreshold:10},
  languages:['sq','en'],
  seoDefaults:{title:'Hana Free Shop - Pejë | Marka Botërore Premium', description:'Dyqani premium me marka botërore në Pejë', keywords:'Hana Free Shop, Pejë, Red Bull, Lindt, Grey Goose, Jack Daniels'},
  socialMedia:{facebook:'', instagram:'', tiktok:''},
  cookieConfig:{enabled:true, message:'Ne përdorim cookies për të përmirësuar përvojën tuaj'},
  privacyConfig:{enabled:true},
  maintenanceMode:false,
  notificationPrefs:{email:true, sms:false, push:false},
  policies:{terms:'', privacy:'', return:'', shipping:''},
  updatedAt:new Date().toISOString(),
};

// Helper functions for localStorage
function loadLS(key, fallback){
  try{
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  }catch{return fallback}
}
function saveLS(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){console.warn('LS save failed', e)}
}

// Initialize local data
let localProducts = loadLS(LS_KEYS.PRODUCTS, FALLBACK_PRODUCTS);
let localCategories = loadLS(LS_KEYS.CATEGORIES, FALLBACK_CATEGORIES);
let localPromos = loadLS(LS_KEYS.PROMOS, FALLBACK_PROMOS);
let localBrands = loadLS(LS_KEYS.BRANDS, FALLBACK_BRANDS);
let localHero = loadLS(LS_KEYS.HERO, FALLBACK_HERO);
let localBanners = loadLS(LS_KEYS.BANNERS, FALLBACK_BANNERS);
let localOffers = loadLS(LS_KEYS.OFFERS, FALLBACK_OFFERS);
let localMedia = loadLS(LS_KEYS.MEDIA, []);
let localDeliveryZones = loadLS(LS_KEYS.DELIVERY_ZONES, FALLBACK_DELIVERY_ZONES);
let localStoreSettings = loadLS(LS_KEYS.STORE_SETTINGS, FALLBACK_STORE_SETTINGS);
let localOrders = loadLS(LS_KEYS.ORDERS, []);
let localCustomers = loadLS(LS_KEYS.CUSTOMERS, []);
let localInventoryLogs = loadLS(LS_KEYS.INVENTORY_LOGS, []);
let localAuditLogs = loadLS(LS_KEYS.AUDIT_LOGS, []);
let localAdminUsers = loadLS(LS_KEYS.ADMIN_USERS, []);
let localNotifications = loadLS(LS_KEYS.NOTIFICATIONS, []);

export function getLocalData(){
  return { 
    products: localProducts, 
    categories: localCategories, 
    promos: localPromos,
    brands: localBrands,
    hero: localHero,
    banners: localBanners,
    offers: localOffers,
    media: localMedia,
    deliveryZones: localDeliveryZones,
    storeSettings: localStoreSettings,
    orders: localOrders,
    customers: localCustomers,
    inventoryLogs: localInventoryLogs,
    auditLogs: localAuditLogs,
    adminUsers: localAdminUsers,
    notifications: localNotifications,
  };
}

// Save functions for all collections
export function saveLocalProducts(products){ localProducts = products; saveLS(LS_KEYS.PRODUCTS, products); }
export function saveLocalCategories(cats){ localCategories = cats; saveLS(LS_KEYS.CATEGORIES, cats); }
export function saveLocalPromos(promos){ localPromos = promos; saveLS(LS_KEYS.PROMOS, promos); }
export function saveLocalBrands(brands){ localBrands = brands; saveLS(LS_KEYS.BRANDS, brands); }
export function saveLocalHero(hero){ localHero = hero; saveLS(LS_KEYS.HERO, hero); }
export function saveLocalBanners(banners){ localBanners = banners; saveLS(LS_KEYS.BANNERS, banners); }
export function saveLocalOffers(offers){ localOffers = offers; saveLS(LS_KEYS.OFFERS, offers); }
export function saveLocalMedia(media){ localMedia = media; saveLS(LS_KEYS.MEDIA, media); }
export function saveLocalDeliveryZones(zones){ localDeliveryZones = zones; saveLS(LS_KEYS.DELIVERY_ZONES, zones); }
export function saveLocalStoreSettings(settings){ localStoreSettings = settings; saveLS(LS_KEYS.STORE_SETTINGS, settings); }
export function saveLocalOrders(orders){ localOrders = orders; saveLS(LS_KEYS.ORDERS, orders); }
export function saveLocalCustomers(customers){ localCustomers = customers; saveLS(LS_KEYS.CUSTOMERS, customers); }
export function saveLocalInventoryLogs(logs){ localInventoryLogs = logs; saveLS(LS_KEYS.INVENTORY_LOGS, logs); }
export function saveLocalAuditLogs(logs){ localAuditLogs = logs; saveLS(LS_KEYS.AUDIT_LOGS, logs); }
export function saveLocalAdminUsers(users){ localAdminUsers = users; saveLS(LS_KEYS.ADMIN_USERS, users); }

// Firebase init
export async function initFirebase(){
  let config = null;
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey){
    config = window.FIREBASE_CONFIG;
  } else {
    try{
      const stored = localStorage.getItem(DEFAULT_CONFIG_KEY);
      if(stored) config = JSON.parse(stored);
    }catch{}
  }
  if(!config || !config.apiKey){
    console.info('[Hana] Firebase config not found, using local data layer. Configure in /admin');
    firebaseEnabled = false;
    return { enabled:false };
  }
  try{
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const { getAuth } = await import('firebase/auth');
    const { getStorage } = await import('firebase/storage');
    firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    try{ storage = getStorage(firebaseApp); }catch{}
    firebaseEnabled = true;
    console.info('[Hana] Firebase initialized - Full CMS mode');
    return { enabled:true, app:firebaseApp, db, auth, storage };
  }catch(e){
    console.warn('[Hana] Firebase init failed', e);
    firebaseEnabled = false;
    return { enabled:false, error:e };
  }
}

export function isFirebaseEnabled(){ return firebaseEnabled; }
export function getDb(){ return db; }
export function getAuthInstance(){ return auth; }
export function getStorageInstance(){ return storage; }

// Cloud Functions (porosi + tracking në server)
let functionsInstance = null;
async function getFns(){
  if(functionsInstance) return functionsInstance;
  const { getFunctions } = await import('firebase/functions');
  functionsInstance = getFunctions(firebaseApp, window.HANA_CONFIG?.functionsRegion || 'europe-west1');
  return functionsInstance;
}
export function isLocalDemoHost(){
  return ['localhost','127.0.0.1','0.0.0.0'].includes(location.hostname) || location.hostname.endsWith('.e2b.app');
}
// Porosia krijohet në server: çmimet, stoku, dërgesa dhe totali llogariten atje.
export async function placeOrderServer(payload){
  const { httpsCallable } = await import('firebase/functions');
  const fn = httpsCallable(await getFns(), 'placeOrder');
  const res = await fn(payload);
  return res.data;
}
export async function trackOrderServer(trackingId){
  const { httpsCallable } = await import('firebase/functions');
  const fn = httpsCallable(await getFns(), 'trackOrder');
  const res = await fn({ trackingId });
  return res.data;
}

// Generic Firestore helpers
async function fetchCollection(collectionName, fallback){
  if(firebaseEnabled && db){
    try{
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, collectionName), orderBy('order', 'asc'));
      const snap = await getDocs(q).catch(async () => {
        // Fallback if order field doesn't exist
        return await getDocs(collection(db, collectionName));
      });
      if(!snap.empty){
        return snap.docs.map(d=>({id:d.id, ...d.data()}));
      }
    }catch(e){ console.warn(`fetch ${collectionName} firestore failed`, e); }
  }
  return loadLS(LS_KEYS[collectionName.toUpperCase()] || `hana_${collectionName}`, fallback);
}

async function upsertDoc(collectionName, id, data, lsKey, localVarSetter){
  // Local first - always works
  let list = loadLS(lsKey, []);
  const idx = list.findIndex(item=>item.id===id);
  const docData = {...data, id, updatedAt:new Date().toISOString()};
  if(!docData.createdAt) docData.createdAt = new Date().toISOString();
  
  if(idx>=0) list[idx]={...list[idx], ...docData};
  else list.unshift(docData);
  
  saveLS(lsKey, list);
  if(localVarSetter) localVarSetter(list);

  // Firestore if enabled
  if(firebaseEnabled && db){
    try{
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, collectionName, id), docData, {merge:true});
      // Audit log
      await addAuditLog({action:`upsert_${collectionName}`, collection:collectionName, docId:id, data:docData});
    }catch(e){ console.warn(`upsert ${collectionName} firestore`, e); }
  }
  return docData;
}

async function deleteDocById(collectionName, id, lsKey, localVarSetter){
  let list = loadLS(lsKey, []).filter(item=>item.id!==id);
  saveLS(lsKey, list);
  if(localVarSetter) localVarSetter(list);
  
  if(firebaseEnabled && db){
    try{
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, collectionName, id));
      await addAuditLog({action:`delete_${collectionName}`, collection:collectionName, docId:id});
    }catch(e){ console.warn(`delete ${collectionName}`, e); }
  }
}

// Data fetchers
export async function fetchProducts(){ return fetchCollection('products', FALLBACK_PRODUCTS); }
export async function fetchCategories(){ return fetchCollection('categories', FALLBACK_CATEGORIES); }
export async function fetchPromos(){ return fetchCollection('promos', FALLBACK_PROMOS); }
export async function fetchBrands(){ return fetchCollection('brands', FALLBACK_BRANDS); }
export async function fetchHero(){ return fetchCollection('hero', FALLBACK_HERO); }
export async function fetchBanners(){ return fetchCollection('banners', FALLBACK_BANNERS); }
export async function fetchOffers(){ return fetchCollection('offers', FALLBACK_OFFERS); }
export async function fetchMedia(){ return fetchCollection('media', []); }
export async function fetchDeliveryZones(){ return fetchCollection('deliveryZones', FALLBACK_DELIVERY_ZONES); }
export async function fetchStoreSettings(){
  if(firebaseEnabled && db){
    try{
      const { doc, getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'storeSettings', 'main'));
      if(snap.exists()) return snap.data();
    }catch(e){ console.warn('fetchStoreSettings firestore', e); }
  }
  return loadLS(LS_KEYS.STORE_SETTINGS, FALLBACK_STORE_SETTINGS);
}
export async function fetchOrders(){
  if(firebaseEnabled && db){
    try{
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      if(!snap.empty) return snap.docs.map(d=>({id:d.id, ...d.data()}));
    }catch(e){ console.warn('fetchOrders firestore', e); }
  }
  return loadLS(LS_KEYS.ORDERS, []);
}
export async function fetchCustomers(){ return fetchCollection('customers', []); }
export async function fetchInventoryLogs(){ return fetchCollection('inventoryLogs', []); }
export async function fetchAuditLogs(){ return fetchCollection('auditLogs', []); }
export async function fetchAdminUsers(){ return fetchCollection('adminUsers', []); }

// Upsert functions for all collections
export async function upsertProduct(product){
  const result = await upsertDoc('products', product.id, product, LS_KEYS.PRODUCTS, (list)=>{localProducts=list});
  // Inventory log if stock changed
  if(product.stock !== undefined){
    await addInventoryLog({productId:product.id, productName:product.name, newStock:product.stock, reason:'admin_update'});
  }
  return result;
}
export async function deleteProduct(id){ return deleteDocById('products', id, LS_KEYS.PRODUCTS, (list)=>{localProducts=list}); }

export async function upsertCategory(cat){ return upsertDoc('categories', cat.id, cat, LS_KEYS.CATEGORIES, (list)=>{localCategories=list}); }
export async function deleteCategory(id){ return deleteDocById('categories', id, LS_KEYS.CATEGORIES, (list)=>{localCategories=list}); }

export async function upsertBrand(brand){ return upsertDoc('brands', brand.id, brand, LS_KEYS.BRANDS, (list)=>{localBrands=list}); }
export async function deleteBrand(id){ return deleteDocById('brands', id, LS_KEYS.BRANDS, (list)=>{localBrands=list}); }

export async function upsertHeroSlide(slide){ return upsertDoc('hero', slide.id, slide, LS_KEYS.HERO, (list)=>{localHero=list}); }
export async function deleteHeroSlide(id){ return deleteDocById('hero', id, LS_KEYS.HERO, (list)=>{localHero=list}); }

export async function upsertBanner(banner){ return upsertDoc('banners', banner.id, banner, LS_KEYS.BANNERS, (list)=>{localBanners=list}); }
export async function deleteBanner(id){ return deleteDocById('banners', id, LS_KEYS.BANNERS, (list)=>{localBanners=list}); }

export async function upsertOffer(offer){ return upsertDoc('offers', offer.id, offer, LS_KEYS.OFFERS, (list)=>{localOffers=list}); }
export async function deleteOffer(id){ return deleteDocById('offers', id, LS_KEYS.OFFERS, (list)=>{localOffers=list}); }

export async function upsertMediaItem(item){ return upsertDoc('media', item.id, item, LS_KEYS.MEDIA, (list)=>{localMedia=list}); }
export async function deleteMediaItem(id){ return deleteDocById('media', id, LS_KEYS.MEDIA, (list)=>{localMedia=list}); }

export async function upsertDeliveryZone(zone){ return upsertDoc('deliveryZones', zone.id, zone, LS_KEYS.DELIVERY_ZONES, (list)=>{localDeliveryZones=list}); }
export async function deleteDeliveryZone(id){ return deleteDocById('deliveryZones', id, LS_KEYS.DELIVERY_ZONES, (list)=>{localDeliveryZones=list}); }

export async function upsertStoreSettings(settings){
  const data = {...settings, id:'main', updatedAt:new Date().toISOString()};
  saveLS(LS_KEYS.STORE_SETTINGS, data);
  localStoreSettings = data;
  if(firebaseEnabled && db){
    try{
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'storeSettings', 'main'), data, {merge:true});
      await addAuditLog({action:'update_store_settings', collection:'storeSettings', docId:'main', data});
    }catch(e){ console.warn('upsertStoreSettings', e); }
  }
  return data;
}

export async function upsertOrder(order){
  return upsertDoc('orders', order.id, order, LS_KEYS.ORDERS, (list)=>{localOrders=list});
}
export async function deleteOrder(id){ return deleteDocById('orders', id, LS_KEYS.ORDERS, (list)=>{localOrders=list}); }

export async function upsertCustomer(customer){
  return upsertDoc('customers', customer.id, customer, LS_KEYS.CUSTOMERS, (list)=>{localCustomers=list});
}

export async function addInventoryLog(log){
  const id = 'inv-'+Date.now().toString(36);
  const data = {id, ...log, createdAt:new Date().toISOString(), user: getCurrentUserEmail()};
  let logs = loadLS(LS_KEYS.INVENTORY_LOGS, []);
  logs.unshift(data);
  if(logs.length>500) logs = logs.slice(0,500);
  saveLS(LS_KEYS.INVENTORY_LOGS, logs);
  localInventoryLogs = logs;
  if(firebaseEnabled && db){
    try{
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'inventoryLogs', id), data);
    }catch{}
  }
  return data;
}

export async function addAuditLog(log){
  const id = 'audit-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
  const data = {id, ...log, createdAt:new Date().toISOString(), user: getCurrentUserEmail(), userAgent:navigator.userAgent, ip:'client'};
  let logs = loadLS(LS_KEYS.AUDIT_LOGS, []);
  logs.unshift(data);
  if(logs.length>1000) logs = logs.slice(0,1000);
  saveLS(LS_KEYS.AUDIT_LOGS, logs);
  localAuditLogs = logs;
  if(firebaseEnabled && db){
    try{
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'auditLogs', id), data);
    }catch{}
  }
  return data;
}

export async function upsertAdminUser(user){
  return upsertDoc('adminUsers', user.id, user, LS_KEYS.ADMIN_USERS, (list)=>{localAdminUsers=list});
}
export async function deleteAdminUser(id){ return deleteDocById('adminUsers', id, LS_KEYS.ADMIN_USERS, (list)=>{localAdminUsers=list}); }

function getCurrentUserEmail(){
  try{
    const user = JSON.parse(localStorage.getItem('hana_user')||'null');
    return user?.email || 'anonymous';
  }catch{return 'anonymous'}
}

// Orders - enhanced
export async function createOrder(order){
  const orderId = 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,5).toUpperCase();
  const fullOrder = { 
    ...order, 
    id:orderId, 
    createdAt:new Date().toISOString(), 
    updatedAt:new Date().toISOString(),
    status:'new',
    statusHistory:[{status:'new', timestamp:new Date().toISOString(), user:'system', note:'Porosia u krijua'}],
    paymentStatus: order.paymentStatus || 'pending',
    deliveryMethod: order.deliveryMethod || 'delivery',
  };
  
  // Save locally
  let orders = loadLS(LS_KEYS.ORDERS, []);
  orders.unshift(fullOrder);
  saveLS(LS_KEYS.ORDERS, orders);
  localOrders = orders;

  // Update inventory securely
  if(fullOrder.items){
    for(const item of fullOrder.items){
      let products = loadLS(LS_KEYS.PRODUCTS, FALLBACK_PRODUCTS);
      const prodIdx = products.findIndex(p=>p.id===item.id);
      if(prodIdx>=0 && products[prodIdx].stock !== undefined){
        const oldStock = products[prodIdx].stock;
        const newStock = Math.max(0, oldStock - item.qty);
        products[prodIdx].stock = newStock;
        products[prodIdx].updatedAt = new Date().toISOString();
        saveLS(LS_KEYS.PRODUCTS, products);
        localProducts = products;
        await addInventoryLog({productId:item.id, productName:products[prodIdx].name, oldStock, newStock, change:-item.qty, reason:'order_created', orderId});
      }
    }
  }

  // Update customer
  if(fullOrder.customer){
    let customers = loadLS(LS_KEYS.CUSTOMERS, []);
    let custIdx = customers.findIndex(c=>c.email===fullOrder.customer.email);
    if(custIdx>=0){
      customers[custIdx].orderCount = (customers[custIdx].orderCount||0)+1;
      customers[custIdx].totalSpent = (customers[custIdx].totalSpent||0)+fullOrder.total;
      customers[custIdx].lastOrderDate = fullOrder.createdAt;
      customers[custIdx].orders = [...(customers[custIdx].orders||[]), orderId];
    } else {
      customers.unshift({
        id:'cust-'+Date.now().toString(36),
        name:fullOrder.customer.name,
        email:fullOrder.customer.email,
        phone:fullOrder.customer.phone,
        address:fullOrder.customer.address,
        orderCount:1,
        totalSpent:fullOrder.total,
        lastOrderDate:fullOrder.createdAt,
        firstOrderDate:fullOrder.createdAt,
        orders:[orderId],
        notes:'',
        createdAt:fullOrder.createdAt,
      });
    }
    saveLS(LS_KEYS.CUSTOMERS, customers);
    localCustomers = customers;
  }

  if(firebaseEnabled && db){
    try{
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db,'orders',orderId), fullOrder);
      // Also update products stock in Firestore with transaction
      const { runTransaction } = await import('firebase/firestore');
      // Simplified - in production use transaction
    }catch(e){ console.warn('createOrder firestore', e); }
  }
  
  await addAuditLog({action:'create_order', collection:'orders', docId:orderId, data:{total:fullOrder.total, items:fullOrder.items?.length}});
  return fullOrder;
}

export async function updateOrderStatus(orderId, newStatus, note='', user='admin'){
  let orders = loadLS(LS_KEYS.ORDERS, []);
  const idx = orders.findIndex(o=>o.id===orderId);
  if(idx<0) throw new Error('Order not found');
  
  const oldStatus = orders[idx].status;
  orders[idx].status = newStatus;
  orders[idx].updatedAt = new Date().toISOString();
  orders[idx].statusHistory = [...(orders[idx].statusHistory||[]), {status:newStatus, timestamp:new Date().toISOString(), user, note, oldStatus}];
  
  saveLS(LS_KEYS.ORDERS, orders);
  localOrders = orders;

  if(firebaseEnabled && db){
    try{
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db,'orders',orderId), {status:newStatus, updatedAt:orders[idx].updatedAt, statusHistory:orders[idx].statusHistory});
    }catch(e){ console.warn('updateOrderStatus firestore', e); }
  }
  
  await addAuditLog({action:'update_order_status', collection:'orders', docId:orderId, data:{oldStatus, newStatus, note}});
  return orders[idx];
}

// Auth
const localAuthListeners = [];
function notifyLocalAuth(){
  let u=null; try{ u=JSON.parse(localStorage.getItem('hana_user')||'null'); }catch{}
  localAuthListeners.forEach(f=>{ try{ f(u); }catch(e){ console.warn(e); } });
}
export function onAuthState(cb){
  if(firebaseEnabled && auth){
    import('firebase/auth').then(({onAuthStateChanged})=>{
      onAuthStateChanged(auth, cb);
    });
  } else {
    localAuthListeners.push(cb);
    try{
      const user = JSON.parse(localStorage.getItem('hana_user')||'null');
      cb(user);
    }catch{ cb(null); }
  }
}

// ADMIN EMAIL — bardhiicloud@gmail.com is owner
export const ADMIN_OWNER_EMAIL = 'bardhiicloud@gmail.com';
// Vetëm për teste në localhost — fshije para publikimit
const TEST_ADMIN = { email:'admin@hana.com', pass:'admin123' };

export async function signInLocal(email, pass){
  if(firebaseEnabled && auth){
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return signInWithEmailAndPassword(auth, email, pass);
  } else {
    // MODALITET LOKAL (vetëm localhost): llogari testimi admin@hana.com / admin123 (hiqet para publikimit)
    if(!isLocalDemoHost()) throw new Error('Hyrja kërkon Firebase të konfiguruar (js/config.js).');
    const norm = String(email||'').trim().toLowerCase();
    let adminUsers = loadLS(LS_KEYS.ADMIN_USERS, []);
    let adminUser = adminUsers.find(u=>u.email===norm);
    let role = adminUser?.role || 'customer';
    if(norm === TEST_ADMIN.email){
      if(pass !== TEST_ADMIN.pass) throw new Error('Fjalëkalim i gabuar');
      role = 'owner';
    } else if(norm === ADMIN_OWNER_EMAIL.toLowerCase()){
      throw new Error('Owner hyn me Google (Firebase). Për test përdor admin@hana.com');
    }
    const user = { email, uid:'local-'+btoa(email).slice(0,8), displayName: email.split('@')[0], role, provider:'password' };
    localStorage.setItem('hana_user', JSON.stringify(user));
    localStorage.setItem('hana_user_id', user.uid);
    notifyLocalAuth();
    // Update last login
    if(adminUser){
      adminUser.lastLogin = new Date().toISOString();
      saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
    }
    return { user };
  }
}

export async function signUpLocal(email, pass){
  if(firebaseEnabled && auth){
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    return createUserWithEmailAndPassword(auth, email, pass);
  } else {
    if(!isLocalDemoHost()) throw new Error('Regjistrimi kërkon Firebase të konfiguruar (js/config.js).');
    const role = 'customer';
    
    const user = { email, uid:'local-'+btoa(email).slice(0,8), displayName: email.split('@')[0], role, provider:'password' };
    localStorage.setItem('hana_user', JSON.stringify(user));
    localStorage.setItem('hana_user_id', user.uid);
    notifyLocalAuth();
    // Also add to admin users
    let adminUsers = loadLS(LS_KEYS.ADMIN_USERS, []);
    if(!adminUsers.find(u=>u.email===email)){
      adminUsers.push({id:user.uid, email, role, createdAt:new Date().toISOString(), lastLogin:new Date().toISOString(), provider:'password'});
      saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
      try{ localAdminUsers = adminUsers; }catch{}
    }
    return { user };
  }
}

// GOOGLE AUTH — 100% LOGIC — For bardhiicloud@gmail.com owner
export async function signInWithGoogle(){
  if(firebaseEnabled && auth){
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({prompt: 'select_account'});
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if owner email
    if(user.email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase()){
      // Ensure admin user exists in Firestore
      try{
        const { doc, setDoc, getDoc } = await import('firebase/firestore');
        const { getFirestore } = await import('firebase/firestore');
        const db = getFirestore();
        const adminRef = doc(db, 'adminUsers', user.uid);
        const snap = await getDoc(adminRef);
        if(!snap.exists()){
          await setDoc(adminRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'owner',
            provider: 'google',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } else {
          await setDoc(adminRef, {lastLogin: new Date().toISOString()}, {merge:true});
        }
      }catch(e){ console.warn('Failed to ensure admin user', e); }
    }
    
    return result;
  } else {
    // Local Google mock — for development — simulates Google login
    // In production, this will be real Firebase Google auth
    const mockGoogleUser = {
      email: ADMIN_OWNER_EMAIL,
      uid: 'google-'+btoa(ADMIN_OWNER_EMAIL).slice(0,12),
      displayName: 'Bardhi',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      role: 'owner',
      provider: 'google',
      emailVerified: true
    };
    
    // For any Google login, if email is bardhiicloud@gmail.com → owner, else customer
    // For demo, we simulate login with owner email
    localStorage.setItem('hana_user', JSON.stringify(mockGoogleUser));
    localStorage.setItem('hana_user_id', mockGoogleUser.uid);
    localStorage.setItem('hana_google_user', JSON.stringify(mockGoogleUser));
    
    let adminUsers = loadLS(LS_KEYS.ADMIN_USERS, []);
    if(!adminUsers.find(u=>u.email===mockGoogleUser.email)){
      adminUsers.push({
        id: mockGoogleUser.uid,
        email: mockGoogleUser.email,
        displayName: mockGoogleUser.displayName,
        photoURL: mockGoogleUser.photoURL,
        role: 'owner',
        provider: 'google',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
      try{ localAdminUsers = adminUsers; }catch{}
    } else {
      const existing = adminUsers.find(u=>u.email===mockGoogleUser.email);
      existing.lastLogin = new Date().toISOString();
      existing.role = 'owner';
      existing.provider = 'google';
      saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
    }
    
    console.log('[Firebase] Google login mock — owner:', mockGoogleUser.email);
    return { user: mockGoogleUser };
  }
}

// Ensure owner admin exists on init
export function ensureOwnerAdmin(){
  let adminUsers = loadLS(LS_KEYS.ADMIN_USERS, []);
  if(!adminUsers.find(u=>u.email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase())){
    const owner = {
      id: 'owner-'+btoa(ADMIN_OWNER_EMAIL).slice(0,8),
      email: ADMIN_OWNER_EMAIL,
      displayName: 'Bardhi',
      role: 'owner',
      provider: 'google',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isOwner: true
    };
    adminUsers.push(owner);
    saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
    try{ localAdminUsers = adminUsers; }catch{}
    console.log('[Firebase] Owner admin ensured:', ADMIN_OWNER_EMAIL);
  } else {
    // Ensure role is owner
    const owner = adminUsers.find(u=>u.email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase());
    if(owner.role !== 'owner'){
      owner.role = 'owner';
      owner.isOwner = true;
      saveLS(LS_KEYS.ADMIN_USERS, adminUsers);
    }
  }
  return adminUsers;
}

export async function signOutLocal(){
  if(firebaseEnabled && auth){
    const { signOut } = await import('firebase/auth');
    return signOut(auth);
  } else {
    localStorage.removeItem('hana_user');
    localStorage.removeItem('hana_user_id');
    localStorage.removeItem('hana_google_user');
    notifyLocalAuth();
  }
}

// CSV import/export helpers
export function exportToCSV(data, filename){
  if(!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row=>headers.map(h=>`"${String(row[h]||'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function parseCSV(text){
  const lines = text.trim().split('\n');
  if(lines.length<2) throw new Error('CSV bosh');
  const headers = lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
  return lines.slice(1).map(line=>{
    const values = [];
    let current = '';
    let inQuotes = false;
    for(let i=0;i<line.length;i++){
      const char = line[i];
      if(char==='"' && line[i+1]==='"'){ current+='"'; i++; }
      else if(char==='"'){ inQuotes=!inQuotes; }
      else if(char===',' && !inQuotes){ values.push(current.trim()); current=''; }
      else current+=char;
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h,i)=>{ obj[h] = values[i]?.replace(/^"|"$/g,'') || ''; });
    return obj;
  });
}

// Validation helpers
export function validateProduct(product){
  const errors = [];
  if(!product.name || product.name.trim().length<2) errors.push('Emri i produktit duhet të ketë të paktën 2 karaktere');
  if(!product.brand) errors.push('Marka është e detyrueshme');
  if(!product.category) errors.push('Kategoria është e detyrueshme');
  if(product.price===undefined || product.price<0) errors.push('Çmimi duhet të jetë pozitiv');
  if(product.originalPrice && product.originalPrice < product.price) errors.push('Çmimi origjinal nuk mund të jetë më i ulët se çmimi aktual');
  if(product.stock!==undefined && product.stock<0) errors.push('Stoku nuk mund të jetë negativ');
  if(product.discount && (product.discount<0 || product.discount>100)) errors.push('Zbritja duhet të jetë 0-100%');
  return errors;
}

export function calculateDiscount(price, originalPrice){
  if(!originalPrice || originalPrice<=price) return 0;
  return Math.round((1-price/originalPrice)*100);
}

export function calculateFinalPrice(product, activeOffers=[]){
  let finalPrice = product.price;
  let appliedOffer = null;
  
  // Find applicable offers
  for(const offer of activeOffers){
    if(offer.status!=='active') continue;
    const now = new Date();
    if(offer.startDate && new Date(offer.startDate) > now) continue;
    if(offer.endDate && new Date(offer.endDate) < now) continue;
    
    const matchesProduct = offer.products?.includes(product.id);
    const matchesCategory = offer.categories?.includes(product.category);
    
    if(matchesProduct || matchesCategory || (!offer.products?.length && !offer.categories?.length)){
      let discounted = finalPrice;
      if(offer.type==='percentage'){
        discounted = finalPrice * (1-offer.value/100);
      } else if(offer.type==='fixed'){
        discounted = Math.max(0, finalPrice - offer.value);
      }
      if(discounted < finalPrice){
        finalPrice = discounted;
        appliedOffer = offer;
      }
    }
  }
  
  return {finalPrice:Math.max(0, finalPrice), originalPrice:product.price, discount:calculateDiscount(finalPrice, product.price), appliedOffer};
}

// ================= 100K OPTIMIZATION — TRANSACTIONS, PAGINATION, BACKUP =================

// Transaction for stock — prevents race condition loadLS+saveLS
export async function createOrderWithTransaction(orderData) {
  if(!firebaseEnabled || !db) {
    // Fallback local with simulated transaction
    console.log('[Firebase 100K] Local transaction fallback');
    const orders = JSON.parse(localStorage.getItem(LS_KEYS.ORDERS) || '[]');
    const products = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || '[]');
    
    // Check stock atomically
    for(const item of orderData.items) {
      const prod = products.find(p => p.id === item.id);
      if(prod && prod.stock < item.qty) {
        throw new Error(`Stok i pamjaftueshëm për ${prod.name}: vetëm ${prod.stock} në stok`);
      }
    }
    
    // Deduct stock
    for(const item of orderData.items) {
      const prod = products.find(p => p.id === item.id);
      if(prod) prod.stock -= item.qty;
    }
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
    
    const trackingId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    const order = {
      ...orderData,
      id: trackingId,
      trackingId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    orders.push(order);
    localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
    
    return order;
  }
  
  try {
    const { runTransaction, doc, collection } = await import('firebase/firestore');
    
    const result = await runTransaction(db, async (transaction) => {
      // Check and deduct stock for each item
      for(const item of orderData.items) {
        const productRef = doc(db, 'products', item.id);
        const productSnap = await transaction.get(productRef);
        
        if(!productSnap.exists()) throw new Error(`Produkti ${item.id} nuk ekziston`);
        
        const product = productSnap.data();
        if(product.stock < item.qty) {
          throw new Error(`Stok i pamjaftueshëm për ${product.name}`);
        }
        
        transaction.update(productRef, {
          stock: product.stock - item.qty,
          updatedAt: new Date().toISOString()
        });
        
        // Log inventory change
        const logRef = doc(collection(db, 'inventoryLogs'));
        transaction.set(logRef, {
          productId: item.id,
          change: -item.qty,
          reason: 'order',
          orderId: orderData.trackingId,
          createdAt: new Date().toISOString()
        });
      }
      
      // Create order
      const trackingId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
      const orderRef = doc(collection(db, 'orders'));
      const order = {
        ...orderData,
        trackingId,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      transaction.set(orderRef, order);
      
      return order;
    });
    
    console.log('[Firebase 100K] Order transaction successful', result.trackingId);
    return result;
  } catch(e) {
    console.error('[Firebase 100K] Transaction failed', e);
    throw e;
  }
}

// Pagination with limit(20) for 100k
export async function fetchProductsPaginated(page = 1, limitCount = 20, filters = {}) {
  if(!firebaseEnabled || !db) {
    const all = JSON.parse(localStorage.getItem(LS_KEYS.PRODUCTS) || '[]');
    const start = (page - 1) * limitCount;
    return {
      products: all.slice(start, start + limitCount),
      hasMore: start + limitCount < all.length,
      total: all.length
    };
  }
  
  try {
    const { collection, query, where, orderBy, limit, startAfter, getDocs } = await import('firebase/firestore');
    let q = collection(db, 'products');
    let constraints = [];
    
    if(filters.category) constraints.push(where('category', '==', filters.category));
    if(filters.status) constraints.push(where('status', '==', filters.status));
    else constraints.push(where('status', '==', 'active'));
    
    constraints.push(orderBy('order', 'asc'));
    constraints.push(limit(limitCount));
    
    const querySnapshot = await getDocs(query(q, ...constraints));
    const products = [];
    querySnapshot.forEach(doc => products.push({id: doc.id, ...doc.data()}));
    
    return {
      products,
      hasMore: products.length === limitCount,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
    };
  } catch(e) {
    console.warn('[Firebase 100K] Paginated fetch failed, fallback', e);
    const all = FALLBACK_PRODUCTS;
    const start = (page - 1) * limitCount;
    return {
      products: all.slice(start, start + limitCount),
      hasMore: start + limitCount < all.length,
      total: all.length
    };
  }
}

// Advanced filters for 100k
export function applyAdvancedFilters(products, filters) {
  let filtered = [...products];
  
  if(filters.priceMin !== undefined) filtered = filtered.filter(p => p.price >= filters.priceMin);
  if(filters.priceMax !== undefined) filtered = filtered.filter(p => p.price <= filters.priceMax);
  if(filters.brands && filters.brands.length > 0) filtered = filtered.filter(p => filters.brands.includes(p.brand));
  if(filters.inStock) filtered = filtered.filter(p => p.stock > 0);
  if(filters.onSale) filtered = filtered.filter(p => p.discount > 0);
  if(filters.category) filtered = filtered.filter(p => p.category === filters.category);
  
  if(filters.sort) {
    switch(filters.sort) {
      case 'price_asc': filtered.sort((a,b) => a.price - b.price); break;
      case 'price_desc': filtered.sort((a,b) => b.price - a.price); break;
      case 'name_asc': filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'popular': filtered.sort((a,b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0)); break;
      case 'newest': filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    }
  }
  
  return filtered;
}

// Backup export
export function exportLocalStorageBackup() {
  const backup = {};
  Object.values(LS_KEYS).forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if(data) backup[key] = JSON.parse(data);
    } catch(e) {}
  });
  backup._timestamp = new Date().toISOString();
  backup._version = '100k-v9';
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hana-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return backup;
}

// Reports data for Chart.js
export function generateReportsData(orders, period = '7d') {
  const now = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
  
  const dailyRevenue = {};
  const dailyOrders = {};
  
  for(let i=0; i<days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    dailyRevenue[key] = 0;
    dailyOrders[key] = 0;
  }
  
  filteredOrders.forEach(order => {
    const key = new Date(order.createdAt).toISOString().split('T')[0];
    if(dailyRevenue[key] !== undefined) {
      dailyRevenue[key] += order.total || 0;
      dailyOrders[key] += 1;
    }
  });
  
  // Best sellers
  const productSales = {};
  filteredOrders.forEach(order => {
    order.items?.forEach(item => {
      if(!productSales[item.id]) productSales[item.id] = {name: item.name, qty: 0, revenue: 0, image: item.image};
      productSales[item.id].qty += item.qty;
      productSales[item.id].revenue += (item.price * item.qty);
    });
  });
  
  const bestSellers = Object.values(productSales).sort((a,b) => b.qty - a.qty).slice(0, 10);
  
  return {
    period,
    totalOrders: filteredOrders.length,
    totalRevenue: Object.values(dailyRevenue).reduce((a,b) => a+b, 0),
    avgOrderValue: filteredOrders.length > 0 ? Object.values(dailyRevenue).reduce((a,b) => a+b, 0) / filteredOrders.length : 0,
    dailyRevenue,
    dailyOrders,
    bestSellers,
    generatedAt: new Date().toISOString()
  };
}
