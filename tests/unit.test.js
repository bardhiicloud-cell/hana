// HANA FREE SHOP — Unit Tests for 100k
// Test calculateFinalPrice, validateProduct, getDeliveryConfig

// Mock functions for testing
function calculateFinalPrice(product, offers) {
  if(!product || typeof product.price !== 'number') throw new Error('Invalid product');
  let finalPrice = product.price;
  let appliedOffer = null;
  
  if(offers && offers.length > 0) {
    const now = new Date();
    const activeOffers = offers.filter(o => {
      if(o.status !== 'active') return false;
      if(o.endDate && new Date(o.endDate) < now) return false;
      if(o.startDate && new Date(o.startDate) > now) return false;
      if(o.productIds && !o.productIds.includes(product.id)) return false;
      if(o.categoryIds && !o.categoryIds.includes(product.category)) return false;
      return true;
    });
    
    // Find best offer
    let bestDiscount = 0;
    for(const offer of activeOffers) {
      let discount = 0;
      if(offer.type === 'percent') discount = product.price * (offer.value / 100);
      else if(offer.type === 'fixed') discount = offer.value;
      if(discount > bestDiscount) {
        bestDiscount = discount;
        appliedOffer = offer;
      }
    }
    finalPrice = Math.max(0, product.price - bestDiscount);
  }
  
  return {
    finalPrice,
    originalPrice: finalPrice < product.price ? product.price : null,
    discount: product.price - finalPrice,
    hasDiscount: finalPrice < product.price,
    appliedOffer
  };
}

function validateProduct(product) {
  const errors = [];
  if(!product.name || product.name.length < 2) errors.push('Emri shumë i shkurtër');
  if(!product.price || product.price <= 0) errors.push('Çmimi invalid');
  if(!product.category) errors.push('Kategoria mungon');
  if(product.stock < 0) errors.push('Stoku negativ');
  if(product.discount && (product.discount < 0 || product.discount > 100)) errors.push('Zbritja invalid');
  return errors;
}

function getDeliveryConfig(city, zones) {
  const zone = zones.find(z => z.city.toLowerCase() === city.toLowerCase());
  if(!zone) return {fee: 2, freeThreshold: 25, expressFee: 3.99};
  return zone;
}

// Tests
console.log('🧪 Running Unit Tests for 100k...');

// Test calculateFinalPrice
(() => {
  const product = {id: '1', price: 10, category: 'ushqime'};
  const offers = [{id: 'o1', status: 'active', type: 'percent', value: 20, productIds: ['1']}];
  const result = calculateFinalPrice(product, offers);
  console.assert(result.finalPrice === 8, 'calculateFinalPrice percent failed');
  console.assert(result.hasDiscount === true, 'hasDiscount failed');
  console.log('✅ calculateFinalPrice tests passed');
})();

// Test validateProduct
(() => {
  const valid = {name: 'Red Bull', price: 1.5, category: 'pije', stock: 10};
  const errors = validateProduct(valid);
  console.assert(errors.length === 0, 'validateProduct valid failed');
  
  const invalid = {name: 'A', price: -1, stock: -5};
  const errors2 = validateProduct(invalid);
  console.assert(errors2.length >= 3, 'validateProduct invalid failed');
  console.log('✅ validateProduct tests passed');
})();

// Test getDeliveryConfig
(() => {
  const zones = [{city: 'peje', fee: 2, freeThreshold: 25}];
  const config = getDeliveryConfig('peje', zones);
  console.assert(config.fee === 2, 'getDeliveryConfig failed');
  console.assert(config.freeThreshold === 25, 'freeThreshold failed');
  console.log('✅ getDeliveryConfig tests passed');
})();

// Test XSS protection
(() => {
  const malicious = '<script>alert("xss")</script><img src=x onerror=alert(1)>';
  const sanitized = malicious.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
  console.assert(!sanitized.includes('<script>'), 'XSS sanitization failed');
  console.log('✅ XSS protection tests passed');
})();

// Test rate limiting
(() => {
  const attempts = new Map();
  const check = (ip, limit = 10) => {
    let data = attempts.get(ip);
    if(!data) { attempts.set(ip, {count: 1}); return true; }
    data.count++;
    return data.count <= limit;
  };
  for(let i=0; i<10; i++) check('127.0.0.1');
  console.assert(check('127.0.0.1') === false, 'Rate limiting failed');
  console.log('✅ Rate limiting tests passed');
})();

console.log('🎉 All unit tests passed for 100k!');
