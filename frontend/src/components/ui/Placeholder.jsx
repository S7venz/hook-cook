export function Placeholder({ label = '', className = '' }) {
  return (
    <div
      className={`placeholder-img ${className}`.trim()}
      data-label={label}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
