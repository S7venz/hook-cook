/**
 * SectionIcon — petit pictogramme SVG animé à poser devant un eyebrow,
 * un titre ou un label. Les animations sont définies dans
 * prototype.css (section 19, .hc-sicon--*) et respectent
 * prefers-reduced-motion.
 *
 * Usage :
 *   <SectionIcon name="fish" />  Espèce ciblée
 *
 * Par défaut la taille suit la font-size du parent (1em × 1em).
 * Le trait utilise currentColor → l'icône prend automatiquement la
 * teinte de l'accent via le CSS .hc-sicon { color: var(--accent) }.
 *
 * Chaque SVG utilise un viewBox 24×24. Les sous-éléments animés ont
 * une classe nommée (.body, .tail, .w1, etc.) qui est ciblée par
 * le keyframe correspondant dans le CSS.
 */

/* eslint-disable react/no-unknown-property */

const SW = 1.8; // strokeWidth uniforme, suit le poids du trait des autres icônes

// ─── Poisson avec queue animée ─────────────────────────────
function Fish() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="body">
        <path
          d="M4 12c0-3 3.5-5 7-5s6.5 2 8 5c-1.5 3-4.5 5-8 5s-7-2-7-5z"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <circle cx="15" cy="10.5" r="0.7" fill="currentColor" />
      </g>
      <g className="tail">
        <path
          d="M4 12l-2.5-2.5v5L4 12z"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// ─── Vagues ondulantes ─────────────────────────────────────
function Wave() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        className="w1"
        d="M2 7c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 2 0 2 0"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        className="w2"
        d="M2 12c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 2 0 2 0"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        className="w3"
        d="M2 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0 2 0 2 0"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Canne à pêche qui oscille ─────────────────────────────
function Rod() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="rod">
        <path d="M4 20L20 4" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
        <path
          d="M18 4c1-1 3-1 3 1s-1 3-2 3"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinecap="round"
        />
        {/* Ligne + hameçon */}
        <path
          d="M13 11l1 6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="14" cy="18" r="1" stroke="currentColor" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

// ─── Hameçon qui se balance ────────────────────────────────
function Hook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="hook">
        <path d="M12 2v10" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
        <path
          d="M12 12c0 3 2 5 5 5s5-2 5-5"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinecap="round"
        />
        <path
          d="M20 18l2-1M22 17l-1-2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

// ─── Mouche artificielle qui flotte ────────────────────────
function Fly() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="fly">
        <ellipse cx="12" cy="12" rx="3" ry="1.5" stroke="currentColor" strokeWidth={SW} />
        {/* ailes */}
        <path
          d="M10 11c-3-2-5-2-6-1M14 11c3-2 5-2 6-1M10 13c-3 2-5 2-6 1M14 13c3 2 5 2 6 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

// ─── Trophée avec reflet qui passe ────────────────────────
function Trophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M8 3h8v5a4 4 0 0 1-8 0V3z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path
        d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
      />
      <path
        d="M10 15l-0.5 3h5l-0.5-3M8 21h8"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        className="shine"
        x1="10"
        y1="4"
        x2="10"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Boussole avec aiguille tournante ──────────────────────
function Compass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={SW} />
      <g className="needle">
        <path d="M12 5l2 7-2 7-2-7 2-7z" stroke="currentColor" strokeWidth={SW} strokeLinejoin="round" />
      </g>
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

// ─── Permis (carte + tampon pulsant) ──────────────────────
function Permit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth={SW} />
      <path d="M6 10h7M6 14h5" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
      <g className="stamp">
        <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M15.5 7l1 1 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── Calendrier avec point pulsant ────────────────────────
function Calendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth={SW} />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" />
      <circle className="dot" cx="12" cy="15" r="1.8" fill="currentColor" />
    </svg>
  );
}

// ─── Carnet avec trait d'encre qui se dessine ──────────────
function Carnet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6 3h11l3 3v15H6V3z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M17 3v3h3" stroke="currentColor" strokeWidth={SW} strokeLinejoin="round" />
      <path
        className="ink"
        d="M9 12h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9 16h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// ─── Panier avec roues qui tournent ────────────────────────
function Cart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 4h2l2 11h12l2-8H7"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="wheel1">
        <circle cx="8" cy="19" r="1.6" stroke="currentColor" strokeWidth={SW} />
      </g>
      <g className="wheel2">
        <circle cx="16" cy="19" r="1.6" stroke="currentColor" strokeWidth={SW} />
      </g>
    </svg>
  );
}

// ─── Feuille qui oscille ───────────────────────────────────
function Leaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="leaf">
        <path
          d="M5 20c0-8 5-13 14-15-2 9-7 14-15 15z"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <path
          d="M5 20c4-4 7-7 10-10"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

// ─── Goutte d'eau qui chute ───────────────────────────────
function Drop() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g className="drop">
        <path
          d="M12 3c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z"
          stroke="currentColor"
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// ─── Épingle carte (static, pas d'anim) ───────────────────
function Pin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"
        stroke="currentColor"
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth={SW} />
    </svg>
  );
}

const ICONS = {
  fish: Fish,
  wave: Wave,
  rod: Rod,
  hook: Hook,
  fly: Fly,
  trophy: Trophy,
  compass: Compass,
  permit: Permit,
  calendar: Calendar,
  carnet: Carnet,
  cart: Cart,
  leaf: Leaf,
  drop: Drop,
  pin: Pin,
};

export function SectionIcon({ name, className = '', style }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return (
    <span className={`hc-sicon hc-sicon--${name} ${className}`.trim()} style={style}>
      <Component />
    </span>
  );
}
