import { describe, expect, it } from 'vitest';
import { monthLabel } from './leaderboard.js';

describe('monthLabel', () => {
  it('retourne le libellé français pour les 12 mois', () => {
    expect(monthLabel(1)).toBe('Janvier');
    expect(monthLabel(4)).toBe('Avril');
    expect(monthLabel(8)).toBe('Août');
    expect(monthLabel(12)).toBe('Décembre');
  });
  it('renvoie une chaîne vide pour un mois hors plage', () => {
    expect(monthLabel(0)).toBe('');
    expect(monthLabel(13)).toBe('');
    expect(monthLabel(-1)).toBe('');
  });
});
