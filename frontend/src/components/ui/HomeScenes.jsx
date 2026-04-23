/**
 * HomeScenes — 4 micro-scènes animées posées à côté des titres
 * des sections principales de la home.
 *
 *   SchoolScene  → Espèce ciblée       (banc de poissons qui nage)
 *   FlyScene     → Je prépare          (mouche aux ailes qui battent)
 *   CastScene    → Équipement du moment (leurre au bout de la ligne)
 *   TrophyScene  → Concours à venir    (trophée avec confettis)
 *
 * Perf :
 * - uniquement transform + opacity (composité GPU, zéro reflow)
 * - 3 à 5 éléments animés max par scène
 * - boucles courtes (3-8 s) — le navigateur optimise bien
 * - styles dans prototype.css section 21
 * - prefers-reduced-motion → animations figées
 * - cachées sur mobile < 768 px via .hc-scene media query
 */

// ─── Banc de poissons qui nage vers la droite ─────────────
export function SchoolScene() {
  return (
    <svg
      className="hc-scene hc-scene--school"
      viewBox="0 0 140 40"
      aria-hidden="true"
    >
      {/* trois poissons à profondeurs différentes */}
      <g className="sch-lane" transform="translate(0 14)">
        <g className="sch-fish sch-f1">
          <ellipse cx="0" cy="0" rx="6" ry="2.3" fill="currentColor" />
          <polygon
            className="sch-tail"
            points="-6,0 -10,-2.5 -10,2.5"
            fill="currentColor"
          />
          <circle cx="3" cy="-0.5" r="0.5" fill="var(--bg)" />
        </g>
      </g>
      <g className="sch-lane" transform="translate(0 24)">
        <g className="sch-fish sch-f2">
          <ellipse cx="0" cy="0" rx="5" ry="2" fill="currentColor" opacity="0.7" />
          <polygon
            className="sch-tail"
            points="-5,0 -9,-2 -9,2"
            fill="currentColor"
            opacity="0.7"
          />
        </g>
      </g>
      <g className="sch-lane" transform="translate(0 32)">
        <g className="sch-fish sch-f3">
          <ellipse cx="0" cy="0" rx="4" ry="1.6" fill="currentColor" opacity="0.5" />
          <polygon
            className="sch-tail"
            points="-4,0 -7,-1.5 -7,1.5"
            fill="currentColor"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}

// ─── Mouche artificielle avec ailes qui battent ───────────
export function FlyScene() {
  return (
    <svg
      className="hc-scene hc-scene--fly"
      viewBox="0 0 70 40"
      aria-hidden="true"
    >
      <g className="fly-body">
        {/* corps de la mouche */}
        <ellipse cx="35" cy="20" rx="5" ry="2.5" fill="currentColor" />
        {/* ailes — scale Y animé pour un effet de battement */}
        <path
          className="fly-wing fly-wing-l"
          d="M35 20 Q26 11 17 17 Q26 18 35 20 Z"
          fill="currentColor"
          opacity="0.55"
        />
        <path
          className="fly-wing fly-wing-r"
          d="M35 20 Q44 11 53 17 Q44 18 35 20 Z"
          fill="currentColor"
          opacity="0.55"
        />
        {/* antennes */}
        <path
          d="M40 18 L45 14 M40 19 L46 17"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* hameçon */}
        <path
          d="M35 23 L35 30 C35 33 39 33 39 30"
          stroke="currentColor"
          strokeWidth="1.3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// ─── Leurre qui bobbe au bout d'une ligne + rides eau ─────
export function CastScene() {
  return (
    <svg
      className="hc-scene hc-scene--cast"
      viewBox="0 0 130 50"
      aria-hidden="true"
    >
      {/* canne (diagonale, statique) */}
      <path
        d="M8 42 L50 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* poignée épaisse */}
      <path
        d="M4 46 L14 38"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* ligne : courbe qui se balance très légèrement */}
      <path
        className="cast-line"
        d="M50 8 Q80 18 105 32"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* leurre */}
      <g className="cast-lure">
        <circle cx="105" cy="32" r="2.2" fill="currentColor" />
        <path
          d="M105 34 L103 36 M105 34 L107 36"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
      {/* rides d'eau qui s'élargissent */}
      <ellipse
        className="cast-ripple cast-r1"
        cx="105"
        cy="44"
        rx="8"
        ry="1.8"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <ellipse
        className="cast-ripple cast-r2"
        cx="105"
        cy="44"
        rx="8"
        ry="1.8"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
    </svg>
  );
}

// ─── Trophée qui brille + confettis qui tombent ──────────
export function TrophyScene() {
  return (
    <svg
      className="hc-scene hc-scene--trophy"
      viewBox="0 0 70 50"
      aria-hidden="true"
    >
      {/* confettis qui tombent en continu */}
      <circle className="conf c1" cx="12" cy="4" r="1" fill="currentColor" />
      <rect
        className="conf c2"
        x="28"
        y="2"
        width="2"
        height="2"
        fill="currentColor"
      />
      <circle className="conf c3" cx="48" cy="4" r="1.2" fill="currentColor" />
      <rect
        className="conf c4"
        x="58"
        y="3"
        width="1.8"
        height="1.8"
        fill="currentColor"
      />

      {/* trophée */}
      <g className="trophy-grp">
        <path
          d="M22 14 L48 14 L48 24 C48 31 40 34 35 34 C30 34 22 31 22 24 Z"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinejoin="round"
        />
        <path
          d="M22 16 H17 V22 C17 25 20 27 22 27 M48 16 H53 V22 C53 25 50 27 48 27"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M30 35 L28 42 L42 42 L40 35 M26 44 H44"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* reflet qui balaie */}
        <line
          className="trophy-shine"
          x1="27"
          y1="17"
          x2="27"
          y2="24"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
