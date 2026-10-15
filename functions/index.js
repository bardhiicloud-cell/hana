// HANA FREE SHOP — Cloud Functions
// placeOrder : krijon porosinë në server (çmime, stok, dërgesë llogariten këtu, jo nga klienti)
// trackOrder : kthen statusin e porosisë pa të dhëna personale
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({ region: 'europe-west1', maxInstances: 20 });

const GIFT_WRAP_FEE = 1.5;
const EXPRESS_FEE = 3.99;
const MAX_ORDER_TOTAL = 500;
const RATE_LIMITS = {
  order: { max: 8, windowMs: 10 * 60 * 1000 },   // 8 porosi / 10 min / IP
  track: { max: 60, windowMs: 10 * 60 * 1000 },  // 60 kërkime / 10 min / IP
};
const DEFAULT_CITIES = ['peje'];
const TIME_SLOT_FEES = { morning: 0, afternoon: 0, evening: 0, express: 2.99 };

// Kuponat e njohur (si në storefront). Kuponat aktivë nga koleksioni `coupons` e mbishkruajnë këtë listë.
const BUILTIN_COUPONS = {
  HANA15: { type: 'percent', value: 15 },
  HANA10: { type: 'percent', value: 10, minOrder: 20 },
  GOLDEN: { type: 'percent', value: 20 },
  WELCOME5: { type: 'fixed', value: 5, minOrder: 15 },
  PEJA: { freeDelivery: true },
  FREE: { freeDelivery: true },
  EXPRESSFREE: { type: 'fixed', value: 3.99, minOrder: 30 },
};

const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function newTrackingId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(10);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return `ORD-${id}`;
}

function finalUnitPrice(product, offers, now) {
  let price = Number(product.price);
  if (!(price >= 0)) throw new HttpsError('failed-precondition', `Çmim i pavlefshëm për ${product.name || product.id}`);
  for (const o of offers) {
    if (o.status !== 'active') continue;
    if (o.startDate && new Date(o.startDate) > now) continue;
    if (o.endDate && new Date(o.endDate) < now) continue;
    const byProduct = o.products?.includes(product.id);
    const byCategory = o.categories?.includes(product.category);
    const global = !o.products?.length && !o.categories?.length;
    if (!(byProduct || byCategory || global)) continue;
    let next = price;
    if (o.type === 'percentage') next = price * (1 - Number(o.value) / 100);
    else if (o.type === 'fixed') next = Math.max(0, price - Number(o.value));
    if (next < price) price = next;
  }
  return round2(Math.max(0, price));
}

async function enforceRateLimit(req, bucket) {
  const limit = RATE_LIMITS[bucket];
  const ip = req.rawRequest?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.rawRequest?.ip || 'unknown';
  const key = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
  const ref = db.collection('rateLimits').doc(`${bucket}_${key}`);
  const now = Date.now();
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const d = snap.exists ? snap.data() : null;
    if (!d || now - d.first > limit.windowMs) {
      tx.set(ref, { count: 1, first: now });
    } else if (d.count >= limit.max) {
      throw new HttpsError('resource-exhausted', 'Shumë porosi nga ky rrjet. Provo pas pak minutash ose thirr +383 48 588 886.');
    } else {
      tx.update(ref, { count: d.count + 1 });
    }
  });
}

function validateInput(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  if (!items.length || items.length > 50) throw new HttpsError('invalid-argument', 'Shporta është bosh ose shumë e madhe.');
  const merged = new Map();
  for (const it of items) {
    const id = str(it?.id, 100);
    const qty = Number(it?.qty);
    if (!id || id.includes('/') || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new HttpsError('invalid-argument', 'Artikull i pavlefshëm në shportë.');
    }
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  const c = data.customer || {};
  const customer = {
    name: str(c.name, 80),
    phone: str(c.phone, 25),
    email: str(c.email, 120).toLowerCase(),
    address: str(c.address, 200),
    city: str(c.city, 30) || 'peje',
    notes: str(c.notes, 500),
  };
  if (customer.name.length < 3) throw new HttpsError('invalid-argument', 'Emri është i detyrueshëm.');
  if (!/^\+?[\d\s\-()]{8,20}$/.test(customer.phone)) throw new HttpsError('invalid-argument', 'Telefon i pavlefshëm.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new HttpsError('invalid-argument', 'Email i pavlefshëm.');
  if (customer.address.length < 8) throw new HttpsError('invalid-argument', 'Adresa është e detyrueshme.');
  if (!/^[a-z0-9-]{2,30}$/.test(customer.city)) throw new HttpsError('invalid-argument', 'Qytet i pavlefshëm.');
  const lat = Number(c.location && c.location.lat), lng = Number(c.location && c.location.lng);
  if (c.location && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    customer.location = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), accuracy: Math.max(0, Math.round(Number(c.location.accuracy) || 0)) };
    customer.mapsLink = `https://www.google.com/maps?q=${customer.location.lat},${customer.location.lng}`;
  }
  return {
    merged,
    customer,
    giftWrap: !!data.giftWrap,
    giftNote: str(data.giftNote, 200),
    timeSlot: TIME_SLOT_FEES[data.timeSlot] !== undefined ? data.timeSlot : null,
    express: !!data.express,
    couponCode: str(data.couponCode, 30).toUpperCase(),
  };
}

exports.placeOrder = onCall({ cors: true, timeoutSeconds: 30 }, async req => {
  await enforceRateLimit(req, 'order');
  const input = validateInput(req.data);
  const now = new Date();

  const [offersSnap, settingsSnap] = await Promise.all([
    db.collection('offers').where('status', '==', 'active').get(),
    db.collection('storeSettings').doc('main').get(),
  ]);
  const offers = offersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  const dc = settings.deliveryConfig || {};
  const cityList = Array.isArray(settings.cities) && settings.cities.length ? settings.cities : DEFAULT_CITIES.map(id => ({ id }));
  const cityCfg = cityList.find(c => c.id === input.customer.city);
  if (!cityCfg || cityCfg.active === false) throw new HttpsError('invalid-argument', 'Nuk dërgojmë ende në këtë qytet.');
  const num = (a, b, d) => Number(a != null && a !== '' ? a : (b != null && b !== '' ? b : d));
  const flatFee = num(cityCfg.flatFee, dc.flatFee, 2);
  const freeThreshold = num(cityCfg.freeThreshold, dc.freeThreshold, 25);
  const minOrder = num(cityCfg.minOrder, dc.minOrder, 0);
  const maxOrder = num(dc.maxOrder, null, MAX_ORDER_TOTAL);

  // Kuponi: koleksioni `coupons` ka përparësi mbi listën e brendshme
  let coupon = null;
  if (input.couponCode) {
    const cs = await db.collection('coupons').doc(input.couponCode).get();
    const c = cs.exists ? cs.data() : null;
    if (c && c.status === 'active' && !(c.expiresAt && new Date(c.expiresAt) < now) && !(c.usageLimit && c.usedCount >= c.usageLimit)) {
      coupon = { type: c.type, value: Number(c.discount ?? c.value ?? 0), minOrder: c.minOrder, freeDelivery: c.freeDelivery };
    } else if (BUILTIN_COUPONS[input.couponCode]) {
      coupon = BUILTIN_COUPONS[input.couponCode];
    }
  }

  const trackingId = newTrackingId();
  const orderRef = db.collection('orders').doc(trackingId);

  const order = await db.runTransaction(async tx => {
    const ids = [...input.merged.keys()];
    const refs = ids.map(id => db.collection('products').doc(id));
    const snaps = await Promise.all(refs.map(r => tx.get(r)));

    const lines = [];
    let subtotal = 0;
    snaps.forEach((snap, i) => {
      const id = ids[i];
      const qty = input.merged.get(id);
      if (!snap.exists) throw new HttpsError('failed-precondition', `Produkti "${id}" nuk ekziston më.`);
      const p = { id, ...snap.data() };
      if (p.status && p.status !== 'active') throw new HttpsError('failed-precondition', `"${p.name}" nuk është në shitje.`);
      if (typeof p.stock === 'number' && p.stock < qty) {
        throw new HttpsError('failed-precondition', `Stok i pamjaftueshëm për "${p.name}" (mbeten ${Math.max(0, p.stock)}).`);
      }
      const unit = finalUnitPrice(p, offers, now);
      subtotal += unit * qty;
      lines.push({ id, name: p.name, brand: p.brand || '', qty, unitPrice: unit, lineTotal: round2(unit * qty), ref: refs[i], stock: p.stock });
    });
    subtotal = round2(subtotal);

    if (minOrder > 0 && subtotal < minOrder) throw new HttpsError('failed-precondition', `Porosia minimale është ${minOrder.toFixed(2)} €.`);

    let discount = 0;
    let freeDelivery = false;
    if (coupon) {
      if (coupon.minOrder && subtotal < coupon.minOrder) {
        coupon = null;
      } else {
        if (coupon.type === 'percent') discount = subtotal * (coupon.value / 100);
        else if (coupon.type === 'fixed') discount = coupon.value;
        freeDelivery = !!coupon.freeDelivery;
        discount = round2(Math.min(subtotal, discount));
      }
    }
    const afterDiscount = round2(subtotal - discount);
    const deliveryFee = freeDelivery || afterDiscount >= freeThreshold ? 0 : flatFee;
    const giftFee = input.giftWrap ? GIFT_WRAP_FEE : 0;
    const slotFee = (input.timeSlot ? TIME_SLOT_FEES[input.timeSlot] : 0) + (input.express ? EXPRESS_FEE : 0);
    const total = round2(afterDiscount + deliveryFee + giftFee + slotFee);
    if (total > maxOrder) throw new HttpsError('failed-precondition', `Porosia maksimale online është ${maxOrder} €. Thirr +383 48 588 886.`);

    for (const l of lines) {
      if (typeof l.stock === 'number') {
        tx.update(l.ref, { stock: l.stock - l.qty, updatedAt: now.toISOString() });
        tx.set(db.collection('inventoryLogs').doc(), {
          productId: l.id, productName: l.name, oldStock: l.stock, newStock: l.stock - l.qty,
          change: -l.qty, reason: 'order_created', orderId: trackingId, createdAt: now.toISOString(),
        });
      }
    }

    const iso = now.toISOString();
    const doc = {
      id: trackingId,
      trackingId,
      items: lines.map(({ ref, stock, ...rest }) => rest),
      subtotal,
      discountCode: coupon ? input.couponCode : null,
      discountAmount: discount,
      deliveryFee,
      giftWrap: input.giftWrap,
      giftWrapFee: giftFee,
      giftNote: input.giftNote,
      timeSlot: input.timeSlot,
      express: input.express,
      total,
      customer: input.customer,
      location: input.customer.city,
      payment: 'cash_on_delivery',
      paymentStatus: 'pending',
      deliveryMethod: 'delivery',
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: iso, user: 'system', note: 'Porosia u krijua' }],
      createdAt: iso,
      updatedAt: iso,
    };
    tx.set(orderRef, doc);
    return doc;
  });

  return { trackingId: order.trackingId, total: order.total, subtotal: order.subtotal, deliveryFee: order.deliveryFee, discountAmount: order.discountAmount, status: order.status, createdAt: order.createdAt };
});

exports.trackOrder = onCall({ cors: true }, async req => {
  await enforceRateLimit(req, 'track');
  const id = str(req.data?.trackingId, 40).toUpperCase();
  if (!/^ORD-[A-Z0-9]{6,16}$/.test(id)) throw new HttpsError('invalid-argument', 'ID e pavlefshme.');
  const snap = await db.collection('orders').doc(id).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Porosia nuk u gjet.');
  const o = snap.data();
  return {
    trackingId: o.trackingId || id,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    itemCount: (o.items || []).reduce((s, i) => s + (i.qty || 0), 0),
    history: (o.statusHistory || []).map(h => ({ status: h.status, timestamp: h.timestamp })),
  };
});
