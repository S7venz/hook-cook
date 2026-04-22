import { useState } from 'react';

/**
 * Placeholder — affiche une image src (si dispo) avec fallback sur
 * un bloc vide. Les dimensions explicites (width/height) aident le
 * navigateur à réserver la place avant chargement → évite le
 * cumulative layout shift et accélère le rendu.
 *
 * fetchpriority="high" + loading="eager" sont réservés au LCP
 * (hero, image principale visible au-dessus du pli). Par défaut on
 * laisse loading="lazy" pour tout ce qui est sous le pli.
 */
export function Placeholder({
  label = '',
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  fetchpriority,
  decoding = 'async',
}) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt ?? label}
        width={width}
        height={height}
        loading={loading}
        fetchpriority={fetchpriority}
        decoding={decoding}
        className={`placeholder-img-real ${className}`.trim()}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <div
      className={`placeholder-img ${className}`.trim()}
      data-label={label}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
