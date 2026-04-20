import { useState } from 'react';

export function Placeholder({ label = '', src, alt, className = '' }) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={alt ?? label}
        loading="lazy"
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
