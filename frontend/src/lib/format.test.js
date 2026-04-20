import { describe, expect, it } from 'vitest';
import { formatPrice } from './format.js';

describe('formatPrice', () => {
  it('formats integer amounts with € symbol', () => {
    expect(formatPrice(189)).toMatch(/189/);
    expect(formatPrice(189)).toContain('€');
  });

  it('formats decimals with fr-FR conventions', () => {
    // comma decimal separator in French locale
    expect(formatPrice(12.5)).toMatch(/12,50/);
  });

  it('handles zero', () => {
    expect(formatPrice(0)).toMatch(/0,00/);
  });
});
