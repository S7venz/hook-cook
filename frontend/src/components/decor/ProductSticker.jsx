/**
 * Stickers "cousus" thématique pêche, posés à -8° en coin de carte
 * produit. Variantes prédéfinies, couleur typographique encre/ocre.
 *
 * Usage :
 *   <ProductSticker variant="favori" />
 *   <ProductSticker variant="nouveau" />
 *   <ProductSticker variant="dernier" />
 */

const VARIANTS = {
  favori: {
    label: 'Coup de cœur',
    sub: 'du patron',
    icon: 'fish',
    tone: 'accent',
  },
  nouveau: {
    label: 'Nouveauté',
    sub: '2026',
    icon: 'fly',
    tone: 'ocean',
  },
  dernier: {
    label: 'Stock limité',
    sub: 'plus que quelques-uns',
    icon: 'hook',
    tone: 'warn',
  },
  promo: {
    label: 'Promo',
    sub: 'fin de saison',
    icon: 'feather',
    tone: 'accent',
  },
};

function StickerIcon({ icon }) {
  const paths = {
    fish:
      'M2 12c2-3 5-5 9-5 3 0 6 1 8 3l3-2-1 4 1 4-3-2c-2 2-5 3-8 3-4 0-7-2-9-5z',
    fly:
      'M12 4l3 6-3 2-3-2 3-6zm-5 9l5-1 5 1-2 4-3 1-3-1-2-4z',
    hook:
      'M12 2v8a4 4 0 1 0 4 4',
    feather:
      'M3 21l9-9a6 6 0 0 1 8-2c0 4-3 7-7 8l-3 3-3 3-4-3z',
  };
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={paths[icon] || paths.fish} />
    </svg>
  );
}

export function ProductSticker({ variant = 'favori', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.favori;
  return (
    <div
      className={`product-sticker product-sticker-${v.tone} ${className}`.trim()}
      aria-label={`${v.label} — ${v.sub}`}
    >
      <span className="product-sticker-stitch" aria-hidden="true" />
      <span className="product-sticker-icon" aria-hidden="true">
        <StickerIcon icon={v.icon} />
      </span>
      <span className="product-sticker-text">
        <span className="product-sticker-label">{v.label}</span>
        <span className="product-sticker-sub">{v.sub}</span>
      </span>
    </div>
  );
}
