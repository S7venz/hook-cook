import { FISH_TINY_PATH } from './svgPaths.js';

/**
 * Petits poissons qui traversent doucement la viewport horizontalement.
 * Effet parallax discret pour les sections aquatiques. Pointer-events
 * désactivés. À placer dans un container en position:relative;overflow:hidden.
 *
 * @param {number} count    nombre de poissons (défaut 3)
 * @param {string} layer    'back' | 'front' — back est plus opaque/lent
 */
export function SwimmingFish({ count = 3, layer = 'back' }) {
  return (
    <div className={`swimming-fish swimming-fish-${layer}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const top = 10 + (i * 70) / count + Math.random() * 8;
        const delay = Math.random() * 12;
        const duration = 22 + Math.random() * 16;
        const flip = Math.random() > 0.5;
        const size = layer === 'front' ? 28 + Math.random() * 14 : 18 + Math.random() * 10;
        return (
          <span
            key={i}
            className="swimming-fish-item"
            style={{
              top: `${top}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              transform: flip ? 'scaleX(-1)' : undefined,
              width: size,
              height: size,
            }}
          >
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d={FISH_TINY_PATH} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
