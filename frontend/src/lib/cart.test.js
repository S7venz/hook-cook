import { describe, expect, it } from 'vitest';
import { cartTotals } from './cart.js';

describe('cartTotals', () => {
  it('returns zeros for an empty cart', () => {
    const totals = cartTotals([]);
    expect(totals).toEqual({ count: 0, subtotal: 0, shipping: 0, total: 0 });
  });

  it('applies 5.90€ shipping under 120€', () => {
    const items = [{ product: { id: 'a', price: 50 }, qty: 1 }];
    const totals = cartTotals(items);
    expect(totals.subtotal).toBe(50);
    expect(totals.shipping).toBe(5.9);
    expect(totals.total).toBe(55.9);
    expect(totals.count).toBe(1);
  });

  it('offers free shipping above 120€', () => {
    const items = [{ product: { id: 'a', price: 150 }, qty: 1 }];
    const totals = cartTotals(items);
    expect(totals.subtotal).toBe(150);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(150);
  });

  it('sums multiple items and quantities', () => {
    const items = [
      { product: { id: 'a', price: 10 }, qty: 2 },
      { product: { id: 'b', price: 25 }, qty: 3 },
    ];
    const totals = cartTotals(items);
    expect(totals.subtotal).toBe(95);
    expect(totals.count).toBe(5);
  });
});
