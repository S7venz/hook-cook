/**
 * PondJump — petite scène décorative placée entre le hero et la
 * bande "saison-strip" sur la home. Un poisson saute hors d'une
 * flaque, fait un arc en l'air, et retombe avec un petit plouf.
 *
 * L'animation respecte prefers-reduced-motion (figée) et est
 * cachée sur mobile pour éviter le clutter visuel.
 *
 * Timing : cycle de 5 s — ~0.5 s de calme, 3 s de saut, 1.5 s de
 * rides tranquilles avant le prochain saut.
 *
 * Les styles (keyframes + positions) vivent dans prototype.css
 * section 20.
 */

export function PondJump() {
  return (
    <div className="hc-pond-break" aria-hidden="true">
      <svg
        className="hc-pond"
        viewBox="0 0 240 100"
        xmlns="http://www.w3.org/2000/svg"
        overflow="visible"
      >
        {/* Flaque — ellipse base + deux rides en boucle */}
        <ellipse className="pond-base" cx="120" cy="86" rx="52" ry="7" />
        <ellipse className="pond-ripple pond-ripple-1" cx="120" cy="86" rx="48" ry="6" />
        <ellipse className="pond-ripple pond-ripple-2" cx="120" cy="86" rx="42" ry="4.5" />

        {/* Brillance de surface — petit reflet statique */}
        <path
          className="pond-shine"
          d="M95 83 Q120 81 145 83"
          strokeLinecap="round"
        />

        {/* Gouttelettes du plouf (cachées sauf au moment de l'impact) */}
        <circle className="splash splash-l" cx="128" cy="85" r="1.6" />
        <circle className="splash splash-c" cx="136" cy="82" r="2.4" />
        <circle className="splash splash-r" cx="144" cy="85" r="1.6" />
        <circle className="splash splash-t" cx="136" cy="80" r="1" />

        {/* Poisson — ancré au centre de la flaque, animé en arc */}
        <g className="fish-anchor" transform="translate(120, 85)">
          <g className="fish-leap">
            <ellipse className="body" cx="0" cy="0" rx="9" ry="3.4" fill="currentColor" />
            <polygon
              className="tail"
              points="-9,0 -15,-3.5 -15,3.5"
              fill="currentColor"
            />
            {/* Nageoire dorsale */}
            <path
              d="M-3 -3 L0 -5 L3 -3 Z"
              fill="currentColor"
              opacity="0.7"
            />
            {/* Œil */}
            <circle cx="5" cy="-1" r="0.9" fill="var(--bg)" />
            <circle cx="5.3" cy="-1" r="0.4" fill="currentColor" />
          </g>
        </g>
      </svg>
    </div>
  );
}
