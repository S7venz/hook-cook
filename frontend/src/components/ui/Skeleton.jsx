/**
 * Skeleton loaders — remplace les "Chargement…" textuels par des
 * blocs animés qui donnent une forme approximative du contenu à venir.
 *
 * Utilisation :
 *   <Skeleton width="60%" height={18} />
 *   <SkeletonLine lines={3} />
 *   <ProductCardSkeleton />
 *   <TableRowSkeleton cols={5} />
 */

export function Skeleton({
  width = '100%',
  height = 14,
  radius = 4,
  style = {},
  className = '',
}) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLine({ lines = 1, gap = 8, widths = [] }) {
  const arr = Array.from({ length: lines });
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap }}>
      {arr.map((_, i) => (
        <Skeleton
          key={i}
          width={widths[i] ?? (i === arr.length - 1 ? '70%' : '100%')}
        />
      ))}
    </span>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="card-media" style={{ background: 'var(--bg-sunk)' }}>
        <Skeleton width="100%" height="100%" radius={0} />
      </div>
      <div className="info" style={{ gap: 6 }}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="85%" height={18} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
          }}
        >
          <Skeleton width={70} height={14} />
          <Skeleton width={90} height={12} />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <Skeleton width={i === 0 ? '40%' : i === cols - 1 ? '50%' : '70%'} height={14} />
        </td>
      ))}
    </tr>
  );
}
