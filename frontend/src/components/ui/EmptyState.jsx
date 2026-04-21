/**
 * EmptyState — illustration SVG + titre + description + CTA.
 * Réutilisable dans tous les états vides (panier, favoris, 404, etc.).
 * Les couleurs utilisent currentColor → cohérent light/dark via tokens.
 */

// ─── Illustrations SVG (viewBox 96x96) ─────────────────────────

const ILLUS = {
  cart: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 20h10l7 40h40l7-26H32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="72" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="66" cy="72" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M46 30l4-6 6 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </svg>
  ),
  fish: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 48c0-10 16-18 32-18s24 8 32 12c-8 4-16 12-32 12s-32-4-32-6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 38l10 10-10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="70" cy="44" r="1.5" fill="currentColor" />
      <path
        d="M14 66c6-2 14-2 22 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  ),
  rod: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 78L70 26"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M68 26c2-2 6-4 10 0s2 8 0 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M60 34l4 4M52 42l4 4M44 50l4 4M36 58l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M14 84c2-4 6-6 10-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M48 80S20 62 20 40a14 14 0 0 1 28-4 14 14 0 0 1 28 4c0 22-28 40-28 40z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  lost: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="48"
        cy="48"
        r="32"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      <path
        d="M36 40c0-6 12-6 12 0s-6 6-6 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="42" cy="62" r="2" fill="currentColor" />
      <path
        d="M62 38l8 8M70 38l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="24"
        y="44"
        width="48"
        height="36"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M34 44v-8a14 14 0 0 1 28 0v8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="48" cy="60" r="3" fill="currentColor" />
      <path d="M48 63v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  permit: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="16"
        y="20"
        width="64"
        height="56"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M26 36h16M26 46h24M26 56h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="66" cy="42" r="6" stroke="currentColor" strokeWidth="2" />
      <path
        d="M60 62l4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 20h32v18a16 16 0 0 1-32 0V20z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 26H22v8a10 10 0 0 0 10 10M64 26h10v8a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 58l-2 10h20l-2-10M32 76h32"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 30l32-14 32 14v36L48 80 16 66V30z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 30l32 14 32-14M48 44v36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M30 23l32 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  ),
};

export function EmptyState({ illus = 'box', title, description, children }) {
  const svg = ILLUS[illus] ?? ILLUS.box;
  return (
    <div className="hc-empty">
      <div className="hc-empty-illus">{svg}</div>
      <h2 className="hc-empty-title">{title}</h2>
      {description && <p className="hc-empty-desc">{description}</p>}
      {children && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
