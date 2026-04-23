import { useMemo } from 'react';

/**
 * Bulles d'eau qui remontent doucement en background. Décoratif,
 * pointer-events: none. À monter dans un parent en position relative.
 *
 * @param {number} count nombre de bulles (défaut 12)
 * @param {string} side  'left' | 'right' | 'full' (défaut 'full')
 */
export function Bubbles({ count = 12, side = 'full' }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const baseLeft =
          side === 'left' ? Math.random() * 35 :
          side === 'right' ? 65 + Math.random() * 35 :
          Math.random() * 100;
        return {
          id: i,
          left: baseLeft,
          size: 6 + Math.random() * 18,
          delay: Math.random() * 8,
          duration: 9 + Math.random() * 6,
          drift: -10 + Math.random() * 20,
        };
      }),
    [count, side],
  );

  return (
    <div className="bubbles" aria-hidden="true">
      {bubbles.map((b) => (
        <span
          key={b.id}
          className="bubble"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
