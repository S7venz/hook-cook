/**
 * Petits doodles tracés à la main, à coller à côté d'un titre de
 * section. Variantes : flyhook (mouche+ligne), wave (vague), fish.
 *
 * Tracé en stroke uniquement, couleur héritée de currentColor pour
 * s'adapter au contexte (ocre sur fond ivoire, etc.).
 */

const PATHS = {
  flyhook: {
    viewBox: '0 0 80 40',
    d: 'M2 30 q 18 -22 36 -10 q 12 8 24 -8 M50 12 l4 4 M54 12 l-4 4 M62 4 q4 4 0 8',
  },
  wave: {
    viewBox: '0 0 80 24',
    d: 'M2 12 q 8 -10 16 0 t 16 0 t 16 0 t 16 0',
  },
  fish: {
    viewBox: '0 0 80 40',
    d: 'M10 20 q 14 -16 38 -8 q 8 3 18 -2 l-4 8 4 8 q -10 -5 -18 -2 q -24 8 -38 -4',
  },
  splash: {
    viewBox: '0 0 60 60',
    d: 'M30 10 v8 M22 14 l4 6 M38 14 l-4 6 M14 22 l8 4 M46 22 l-8 4 M30 30 a 6 6 0 1 0 0.1 0',
  },
  ripple: {
    viewBox: '0 0 80 40',
    d: 'M5 20 q 10 -10 20 0 t 20 0 t 20 0 M5 28 q 10 -8 20 0 M55 28 q 10 -8 20 0',
  },
};

export function Doodle({ variant = 'flyhook', size = 64, className = '' }) {
  const p = PATHS[variant] || PATHS.flyhook;
  return (
    <span
      className={`doodle doodle-${variant} ${className}`.trim()}
      aria-hidden="true"
      style={{ width: size }}
    >
      <svg
        viewBox={p.viewBox}
        width="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={p.d} />
      </svg>
    </span>
  );
}
