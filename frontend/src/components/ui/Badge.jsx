export function Badge({ status, accent = false, children }) {
  const className = status
    ? `badge badge-dot badge-${status}`
    : `badge ${accent ? 'badge-accent' : ''}`.trim();

  return <span className={className}>{children}</span>;
}
