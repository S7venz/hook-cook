import { useState } from 'react';

const HUE_BY_SPECIES = {
  truite: 30,
  brochet: 210,
  sandre: 270,
  carpe: 60,
  bar: 180,
  perche: 120,
  silure: 330,
  ombre: 150,
};

export function SpeciesIllus({ species, imageUrl, alt }) {
  const [errored, setErrored] = useState(false);
  const hue = HUE_BY_SPECIES[species] ?? 30;

  if (imageUrl && !errored) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `oklch(0.96 0.006 ${hue})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-3)',
        }}
      >
        <img
          src={imageUrl}
          alt={alt ?? species}
          loading="lazy"
          decoding="async"
          width={400}
          height={300}
          onError={() => setErrored(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div className="species-illus" style={{ background: `oklch(0.88 0.02 ${hue})` }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <path
          d="M5 40 Q 25 20 50 40 T 95 40"
          stroke="currentColor"
          strokeWidth="0.6"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M5 48 Q 30 34 55 48 T 95 48"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M10 32 Q 25 24 50 32 Q 75 40 90 32"
          stroke="currentColor"
          strokeWidth="0.4"
          fill="none"
          opacity="0.25"
        />
      </svg>
    </div>
  );
}
