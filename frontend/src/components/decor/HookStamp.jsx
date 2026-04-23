/**
 * Tampon "Validé" en SVG : silhouette d'hameçon entouré d'un cercle
 * avec libellé courbé. Style "tampon postal" qui apparaît sur les
 * pages de succès (commande confirmée, permis approuvé).
 *
 * @param {string} label    texte affiché sous l'hameçon (défaut "VALIDÉ")
 * @param {number} size     taille en px (défaut 96)
 * @param {boolean} animate fait apparaître le tampon avec un petit "stamp" effect
 */
export function HookStamp({ label = 'VALIDÉ', size = 96, animate = true }) {
  return (
    <div
      className={`hook-stamp ${animate ? 'hook-stamp-animate' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* Cercles concentriques imitation tampon */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 2"
          opacity="0.85"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.85"
        />
        {/* Hameçon centré */}
        <g transform="translate(50 30)" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
          <line x1="0" y1="0" x2="0" y2="20" />
          <path d="M0 20 q 0 14 -10 14 a 10 10 0 0 1 -10 -10" />
          <line x1="0" y1="0" x2="-3" y2="3" />
          <line x1="0" y1="0" x2="3" y2="3" />
        </g>
        {/* Libellé courbé en bas */}
        <path
          id="hook-stamp-curve"
          d="M 14 60 A 36 36 0 0 0 86 60"
          fill="none"
        />
        <text
          fontFamily="'JetBrains Mono', monospace"
          fontSize="9"
          fill="currentColor"
          letterSpacing="2"
          fontWeight="700"
        >
          <textPath href="#hook-stamp-curve" startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
