/**
 * Spinner thématique : un fil de pêche qui pendule + petit hameçon
 * qui dandine. Remplace le spinner classique sur les chargements.
 *
 * @param {number} size  taille en px (défaut 40)
 * @param {string} label texte SR uniquement
 */
export function FishingLoader({ size = 40, label = 'Chargement…' }) {
  return (
    <div
      className="fishing-loader"
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        {/* Fil */}
        <line
          x1="20"
          y1="2"
          x2="20"
          y2="22"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {/* Hameçon qui dandine */}
        <g className="fishing-loader-hook">
          <path
            d="M20 22 v6 a4 4 0 1 1 -4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="20"
            y1="22"
            x2="18"
            y2="20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="22"
            x2="22"
            y2="20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
