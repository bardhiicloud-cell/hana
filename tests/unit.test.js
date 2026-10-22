import { describe, expect, it } from 'vitest';
import {
  applyAdvancedFilters,
  calculateDiscount,
  calculateFinalPrice,
  parseCSV,
  validateProduct,
} from '../js/firebase.js';

describe('Hana production helpers', () => {
  it('calculates an active percentage offer using the real helper', () => {
    const product = { id: 'p1', name: 'Test', price: 10, category: 'snacks' };
    const offer = { id: 'o1', status: 'active', type: 'percentage', value: 20, products: ['p1'] };
    expect(calculateFinalPrice(product, [offer]).finalPrice).toBe(8);
  });

  it('does not apply inactive offers', () => {
    const product = { id: 'p1', price: 10, category: 'snacks' };
    const offer = { id: 'o1', status: 'inactive', type: 'percentage', value: 20, products: ['p1'] };
    expect(calculateFinalPrice(product, [offer]).finalPrice).toBe(10);
  });

  it('never returns a negative price for a fixed offer', () => {
    const product = { id: 'p1', price: 3, category: 'snacks' };
    const offer = { id: 'o1', status: 'active', type: 'fixed', value: 8, products: ['p1'] };
    expect(calculateFinalPrice(product, [offer]).finalPrice).toBe(0);
  });

  it('validates required product fields and rejects negative stock', () => {
    expect(validateProduct({ name: 'Test', brand: 'Hana', category: 'snacks', price: 2, stock: 1 })).toEqual([]);
    expect(validateProduct({ name: 'T', brand: '', category: '', price: -1, stock: -2 }).length).toBeGreaterThan(0);
  });

  it('calculates discount percentages safely', () => {
    expect(calculateDiscount(8, 10)).toBe(20);
    expect(calculateDiscount(10, 8)).toBe(0);
  });

  it('filters by price and stock using the production helper', () => {
    const products = [
      { id: 'a', name: 'A', price: 2, stock: 5 },
      { id: 'b', name: 'B', price: 12, stock: 0 },
      { id: 'c', name: 'C', price: 20, stock: 3 },
    ];
    expect(applyAdvancedFilters(products, { priceMin: 10, priceMax: 20, inStock: true }).map(p => p.id)).toEqual(['c']);
  });

  it('parses quoted commas in CSV values', () => {
    expect(parseCSV('name,brand\n"Chips, spicy",Hana')).toEqual([{ name: 'Chips, spicy', brand: 'Hana' }]);
  });

  it('rejects an empty CSV', () => {
    expect(() => parseCSV('name,brand')).toThrow();
  });
});
