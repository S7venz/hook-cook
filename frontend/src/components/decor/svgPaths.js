/**
 * Petits SVG paths réutilisables — silhouettes pêche pour les
 * pluies de particules, badges, doodles, etc. Tous calibrés en
 * viewBox 24×24 pour pouvoir être combinés.
 */

export const FISH_PATH =
  'M2 12c2-3 5-5 9-5 3 0 6 1 8 3l3-2-1 4 1 4-3-2c-2 2-5 3-8 3-4 0-7-2-9-5zm15-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z';

export const HOOK_PATH =
  'M12 2v8a4 4 0 1 0 4 4M12 2l-2 2M12 2l2 2';

export const FLY_PATH =
  // mouche de pêche stylisée : corps + plumes
  'M12 4l3 6-3 2-3-2 3-6zm-5 9l5-1 5 1-2 4-3 1-3-1-2-4z';

export const BUBBLE_PATH = 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z';

export const FEATHER_PATH =
  // plume tracée
  'M3 21l9-9a6 6 0 0 1 8-2c0 4-3 7-7 8l-3 3-3 3-4-3z';

export const WAVE_PATH =
  'M2 12c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3 2-3 4-3';

export const RIPPLE_PATH =
  // cercle ondulé pour effet ricochet
  'M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0';

/**
 * Variante "petit poisson" simplifiée (pour pluies / parallax) — plus
 * dense visuellement.
 */
export const FISH_TINY_PATH =
  'M3 8c2-3 6-4 9-3 1 0 2 1 3 2l3-2-1 3 1 3-3-2c-1 1-2 2-3 2-3 1-7 0-9-3z';
