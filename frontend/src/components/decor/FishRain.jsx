import { useEffect, useState } from 'react';
import { FISH_TINY_PATH, BUBBLE_PATH, FEATHER_PATH } from './svgPaths.js';

/**
 * "Pluie" de petits poissons + bulles + plumes qui descend
 * doucement sur la viewport pendant ~3.5s. Remplace les confettis
 * classiques par une scène thématique pêche.
 *
 * Usage : monter le composant sur une page de succès. Il se nettoie
 * tout seul après l'animation.
 *
 * @param {number} count    nombre total de particules (défaut 28)
 * @param {number} duration durée totale en ms (défaut 3500)
 * @param {boolean} active  monte/démonte le composant — utile pour rejouer
 */
export function FishRain({ count = 28, duration = 3500, active = true }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return undefined;
    }
    // Respecte prefers-reduced-motion : pas de pluie agressive.
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setParticles([]);
      return undefined;
    }

    const kinds = ['fish', 'fish', 'fish', 'bubble', 'feather']; // ratio
    const next = Array.from({ length: count }, (_, i) => ({
      id: i,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      left: Math.random() * 100, // %
      delay: Math.random() * 800, // ms
      duration: 2200 + Math.random() * 1200, // ms
      size: 14 + Math.random() * 22, // px
      rotate: Math.floor(Math.random() * 360),
      drift: -40 + Math.random() * 80, // px d'écart latéral
      hue: Math.random() < 0.5 ? 'accent' : 'ink',
    }));
    setParticles(next);

    const cleanup = setTimeout(() => setParticles([]), duration + 1000);
    return () => clearTimeout(cleanup);
  }, [count, duration, active]);

  if (!particles.length) return null;

  return (
    <div className="fish-rain" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={`fish-rain-particle fish-rain-${p.kind} fish-rain-${p.hue}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            // CSS var pour drift latéral utilisé dans @keyframes
            '--drift': `${p.drift}px`,
            '--rot': `${p.rotate}deg`,
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
            <path
              d={
                p.kind === 'fish'
                  ? FISH_TINY_PATH
                  : p.kind === 'bubble'
                  ? BUBBLE_PATH
                  : FEATHER_PATH
              }
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
