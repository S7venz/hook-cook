import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ImageUploadField } from '../components/ui/ImageUploadField.jsx';
import { useAdminContests } from '../lib/adminContests.js';
import { useAdminContestRegistrations } from '../lib/adminContestRegistrations.js';
import { useAdminOrders } from '../lib/adminOrders.js';
import { useAdminProducts } from '../lib/adminProducts.js';
import { useAdminStats } from '../lib/adminStats.js';
import { useCountUp, useScrollReveal } from '../lib/animations.js';
import { useAuth } from '../lib/auth.js';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';
import { downloadExport } from '../lib/exports.js';
import { formatPrice } from '../lib/format.js';
import { useAdminPermits } from '../lib/permitApplication.js';
import { useToast } from '../lib/toast.js';

const SECTION_DEFS = [
  { id: 'overview', i18nKey: 'overview', groupKey: 'activity', icon: 'compass' },
  { id: 'stats', i18nKey: 'stats', groupKey: 'activity', icon: 'calendar' },
  { id: 'orders', i18nKey: 'orders', groupKey: 'activity', icon: 'cart' },
  { id: 'permis', i18nKey: 'permits', groupKey: 'fishing', icon: 'permit' },
  { id: 'concours', i18nKey: 'contests', groupKey: 'fishing', icon: 'trophy' },
  { id: 'products', i18nKey: 'products', groupKey: 'catalogue', icon: 'fish' },
];

const GROUP_KEYS = ['activity', 'fishing', 'catalogue'];

function KpiCard({ label, value, delta, deltaTone }) {
  return (
    <div className="kpi">
      <div className="lbl">
        {label}
        {delta && (
          <span className={`delta ${deltaTone ?? ''}`} style={{ marginLeft: 8 }}>
            {delta}
          </span>
        )}
      </div>
      <div className="val">{value}</div>
    </div>
  );
}

/**
 * Affiche un entier en animant 0 → target. Fallback instantané pour les
 * utilisateurs qui préfèrent prefers-reduced-motion (géré par useCountUp).
 */
function CountUpNumber({ value, decimals = 0 }) {
  const n = Number(value ?? 0);
  const animated = useCountUp(Number.isFinite(n) ? n : 0, 900, decimals);
  return <>{animated}</>;
}

/** Variante pour les montants en euros (ex : 12 345,67 €). */
function CountUpPrice({ value }) {
  const n = Number(value ?? 0);
  const animated = useCountUp(Number.isFinite(n) ? n : 0, 900, 2);
  // useCountUp retourne un Number — on le re-formate à 2 décimales avant de splitter.
  const fixed = (Number(animated) || 0).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (
    <>
      {withSpaces},{decPart ?? '00'} €
    </>
  );
}

/**
 * Wrapper qui applique `hc-reveal` + observe le scroll. Les enfants
 * apparaissent en fondu montant quand la section entre dans le viewport.
 */
function Reveal({ children, ...rest }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className="hc-reveal" {...rest}>
      {children}
    </div>
  );
}

function RevenueBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const amounts = data.map((d) => Number(d.total ?? 0));
  const max = Math.max(...amounts, 1);
  const width = 600;
  const height = 180;
  const padding = 28;
  const barWidth = (width - padding * 2) / data.length;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="CA par mois"
      style={{ width: '100%', maxWidth: width }}
    >
      {data.map((d, i) => {
        const val = Number(d.total ?? 0);
        const h = ((val / max) * (height - padding * 2)) || 0;
        const x = padding + i * barWidth + barWidth * 0.15;
        const y = height - padding - h;
        const bw = barWidth * 0.7;
        return (
          <g key={d.key}>
            <rect
              className="revenue-bar"
              x={x}
              y={y}
              width={bw}
              height={h}
              fill="var(--accent)"
              opacity={val > 0 ? 0.85 : 0.2}
              rx={2}
            />
            <text
              x={x + bw / 2}
              y={height - padding + 14}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="var(--ink-mute)"
            >
              {d.label}
            </text>
            {val > 0 && (
              <text
                x={x + bw / 2}
                y={y - 4}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="10"
                fill="var(--ink-soft)"
              >
                {Math.round(val)} €
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StatusBreakdown({ title, breakdown, labels }) {
  const entries = Object.entries(breakdown ?? {});
  if (entries.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          {title}
        </div>
        <p className="soft">Aucune donnée.</p>
      </div>
    );
  }
  const total = entries.reduce((s, [, v]) => s + (Number(v) || 0), 0);
  return (
    <div className="card" style={{ padding: 'var(--sp-5)' }}>
      <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
        {title}
      </div>
      <div className="stack-sm">
        {entries.map(([key, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={key}>
              <div
                className="row"
                style={{ justifyContent: 'space-between', fontSize: 'var(--fs-13)' }}
              >
                <span>{labels?.[key] ?? key}</span>
                <span className="mono">
                  {value} · {pct.toFixed(0)} %
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--bg-sunk)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'var(--accent)',
                    opacity: 0.75,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatsSection({ stats, loading }) {
  const { t } = useTranslation();
  if (loading || !stats) {
    return (
      <>
        <h1>{t('admin.stats.title')}</h1>
        <p className="soft">{t('common.loading')}</p>
      </>
    );
  }
  return (
    <>
      <h1>{t('admin.stats.title')}</h1>
      <div className="kpi-row">
        <div className="kpi">
          <div className="lbl">{t('admin.stats.revenue')}</div>
          <div className="val">
            <CountUpPrice value={stats.totalRevenue} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.avgBasket')}</div>
          <div className="val">
            <CountUpPrice value={stats.avgBasket} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.conversionRate')}</div>
          <div className="val">
            <CountUpNumber value={stats.conversionRate} decimals={1} />
            <small>%</small>
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.uniqueBuyers')}</div>
          <div className="val">
            <CountUpNumber value={stats.totalBuyers} />
            <small> / {stats.totalUsers ?? 0}</small>
          </div>
        </div>
      </div>

      <div className="kpi-row" style={{ marginTop: 'var(--sp-3)' }}>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.orders')}</div>
          <div className="val">
            <CountUpNumber value={stats.totalOrders} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.permits')}</div>
          <div className="val">
            <CountUpNumber value={stats.totalPermits} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.registrations')}</div>
          <div className="val">
            <CountUpNumber value={stats.totalRegistrations} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">{t('admin.stats.lowStockKpi')}</div>
          <div className="val">
            <CountUpNumber value={(stats.lowStock ?? []).length} />
          </div>
        </div>
      </div>

      <Reveal>
        <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="panel-header">
            <h3>{t('admin.stats.revenueByMonth')}</h3>
          </div>
          <div className="panel-body" style={{ padding: 'var(--sp-5)' }}>
            <RevenueBarChart data={stats.revenueByMonth ?? []} />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--sp-4)',
            marginTop: 'var(--sp-5)',
          }}
        >
          <StatusBreakdown
            title={t('admin.stats.ordersByStatus')}
            breakdown={stats.ordersByStatus}
            labels={{
              paid: t('admin.stats.orderStatusLabels.paid'),
              shipped: t('admin.stats.orderStatusLabels.shipped'),
              delivered: t('admin.stats.orderStatusLabels.delivered'),
              cancelled: t('admin.stats.orderStatusLabels.cancelled'),
            }}
          />
          <StatusBreakdown
            title={t('admin.stats.permitsByStatus')}
            breakdown={stats.permitsByStatus}
            labels={{
              pending: t('admin.stats.permitStatusLabels.pending'),
              approved: t('admin.stats.permitStatusLabels.approved'),
              rejected: t('admin.stats.permitStatusLabels.rejected'),
            }}
          />
        </div>
      </Reveal>

      <Reveal>
        <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="panel-header">
            <h3>{t('admin.stats.topProducts')}</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.tableHeaders.product')}</th>
                <th>{t('admin.tableHeaders.sku')}</th>
                <th>{t('admin.tableHeaders.qty')}</th>
                <th>{t('admin.tableHeaders.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topProducts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    {t('admin.stats.noSalesYet')}
                  </td>
                </tr>
              ) : (
                stats.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td>{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td className="mono">{p.qty}</td>
                    <td className="mono">{formatPrice(Number(p.revenue ?? 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--sp-4)',
            marginTop: 'var(--sp-5)',
          }}
        >
          <div className="panel">
            <div className="panel-header">
              <h3>{t('admin.stats.lowStockTitle')}</h3>
            </div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.tableHeaders.product')}</th>
                <th>{t('admin.tableHeaders.stock')}</th>
                <th>{t('admin.tableHeaders.threshold')}</th>
              </tr>
            </thead>
            <tbody>
              {(stats.lowStock ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    {t('admin.stats.noLowStock')}
                  </td>
                </tr>
              ) : (
                stats.lowStock.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td
                      className="mono"
                      style={{
                        color: (p.stock ?? 0) === 0 ? 'var(--err)' : 'var(--warn)',
                        fontWeight: 500,
                      }}
                    >
                      {p.stock ?? 0}
                    </td>
                    <td className="mono soft">{p.threshold ?? 15}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>{t('admin.stats.neverSold')}</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.tableHeaders.product')}</th>
                <th>{t('admin.tableHeaders.stock')}</th>
                <th>{t('admin.tableHeaders.price')}</th>
              </tr>
            </thead>
            <tbody>
              {(stats.neverSold ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    {t('admin.stats.allProductsSold')}
                  </td>
                </tr>
              ) : (
                stats.neverSold.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="mono">{p.stock ?? 0}</td>
                    <td className="mono">{formatPrice(Number(p.price ?? 0))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </Reveal>

      <Reveal>
      <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="panel-header">
          <h3>{t('admin.stats.categoryRevenue')}</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.category')}</th>
              <th>{t('admin.tableHeaders.revenue')}</th>
              <th>{t('admin.tableHeaders.share')}</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = stats.categoryRevenue ?? [];
              const total = rows.reduce((s, r) => s + Number(r.revenue ?? 0), 0) || 1;
              if (rows.length === 0) {
                return (
                  <tr>
                    <td colSpan={3} className="soft" style={{ padding: 'var(--sp-4)' }}>
                      {t('admin.stats.noSalesShort')}
                    </td>
                  </tr>
                );
              }
              return rows.map((r) => {
                const pct = ((Number(r.revenue ?? 0) / total) * 100).toFixed(1);
                return (
                  <tr key={r.category}>
                    <td style={{ textTransform: 'capitalize' }}>{r.category}</td>
                    <td className="mono">{formatPrice(Number(r.revenue ?? 0))}</td>
                    <td className="mono soft">{pct} %</td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
      </Reveal>
    </>
  );
}

function OverviewSection({ orders, pendingPermits, contestCount, lowStock, onGo, onReplenish }) {
  const { t } = useTranslation();
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const ordersToShip = orders.filter((o) => o.status === 'paid').length;

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}
      >
        <h1>{t('admin.overview.title')}</h1>
        <span className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
          {new Intl.DateTimeFormat('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }).format(new Date())}
        </span>
      </div>
      <div className="kpi-row">
        <KpiCard label={t('admin.overview.totalRevenue')} value={<CountUpPrice value={totalRevenue} />} />
        <KpiCard
          label={t('admin.overview.ordersToShip')}
          value={<CountUpNumber value={ordersToShip} />}
          delta={t('admin.overview.totalCount', { count: orders.length })}
          deltaTone="soft"
        />
        <KpiCard label={t('admin.overview.pendingPermits')} value={<CountUpNumber value={pendingPermits ?? 0} />} />
        <KpiCard label={t('admin.overview.contestRegistrations')} value={<CountUpNumber value={contestCount} />} />
      </div>

      <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="panel-header">
          <h3>{t('admin.overview.recentOrders')}</h3>
          <Button variant="ghost" size="sm" onClick={() => onGo('orders')}>
            {t('admin.overview.seeAll')}
          </Button>
        </div>
        <div className="panel-body">
          {orders.length === 0 ? (
            <p className="soft" style={{ padding: 'var(--sp-4) 0' }}>
              {t('admin.overview.noOrdersYet')}
            </p>
          ) : (
            orders.slice(0, 4).map((order) => (
              <div key={order.id} className="activity-item">
                <span className="time mono">
                  {new Intl.DateTimeFormat('fr-FR').format(new Date(order.date))}
                </span>
                <span>
                  {order.id} · {formatPrice(order.total)}
                </span>
                <Badge
                  status={
                    order.status === 'delivered'
                      ? 'approved'
                      : order.status === 'shipped'
                        ? 'pending'
                        : 'pending'
                  }
                >
                  {order.statusLabel}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="panel-header">
          <h3>{t('admin.overview.criticalStock')}</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.ref')}</th>
              <th>{t('admin.tableHeaders.product')}</th>
              <th>{t('admin.tableHeaders.stock')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr>
                <td colSpan={4} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  {t('admin.overview.noCriticalStock')}
                </td>
              </tr>
            ) : (
              lowStock.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.sku}</td>
                  <td>{p.name}</td>
                  <td className="mono">{p.stock}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button variant="ghost" size="sm" onClick={() => onReplenish?.(p)}>
                        {t('admin.overview.addStock')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onGo('products')}>
                        {t('admin.overview.open')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExportButton({ kind, label }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await downloadExport(kind, token);
    } catch (err) {
      push(err?.message ?? t('admin.export.failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={handle} disabled={busy}>
      <Icon name="download" size={14} />
      {busy ? t('admin.export.busy') : label}
    </Button>
  );
}

function OrdersSection({ orders, onUpdateStatus }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{t('admin.orders.title')}</h1>
        <ExportButton kind="orders" label={t('admin.actions.exportCsv')} />
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.orderNumber')}</th>
              <th>{t('admin.tableHeaders.email')}</th>
              <th>{t('admin.tableHeaders.date')}</th>
              <th>{t('admin.tableHeaders.items')}</th>
              <th>{t('admin.tableHeaders.total')}</th>
              <th>{t('admin.tableHeaders.status')}</th>
              <th>{t('admin.tableHeaders.action')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  {t('admin.orders.empty')}
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="mono">{order.id}</td>
                <td>{order.email}</td>
                <td className="soft">
                  {new Intl.DateTimeFormat('fr-FR').format(new Date(order.date))}
                </td>
                <td className="mono">{order.items.length}</td>
                <td className="mono">{formatPrice(order.total)}</td>
                <td>
                  <Badge
                    status={
                      order.status === 'delivered' ? 'approved' : 'pending'
                    }
                  >
                    {order.statusLabel}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    {order.status === 'paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStatus(order.id, 'shipped')}
                      >
                        {t('admin.actions.markShipped')}
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStatus(order.id, 'delivered')}
                      >
                        {t('admin.actions.markDelivered')}
                      </Button>
                    )}
                    {(order.status === 'paid' || order.status === 'shipped') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              t('admin.orders.confirmCancel', { id: order.id }),
                            )
                          ) {
                            onUpdateStatus(order.id, 'cancelled');
                          }
                        }}
                      >
                        {t('admin.actions.cancel')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PermisSection({ permits, onUpdate }) {
  const { t } = useTranslation();
  const list = permits ?? [];
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{t('admin.permits.title')}</h1>
        <ExportButton kind="permits" label={t('admin.actions.exportCsv')} />
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.reference')}</th>
              <th>{t('admin.tableHeaders.applicant')}</th>
              <th>{t('admin.tableHeaders.type')}</th>
              <th>{t('admin.tableHeaders.submitted')}</th>
              <th>{t('admin.tableHeaders.documents')}</th>
              <th>{t('admin.tableHeaders.amount')}</th>
              <th>{t('admin.tableHeaders.status')}</th>
              <th>{t('admin.tableHeaders.action')}</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  {t('admin.permits.empty')}
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.id}</td>
                <td>
                  {p.firstName} {p.lastName}
                  {p.userEmail && (
                    <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                      {p.userEmail}
                    </div>
                  )}
                </td>
                <td>{p.typeTitle}</td>
                <td className="soft">
                  {p.submittedAt
                    ? new Intl.DateTimeFormat('fr-FR').format(new Date(p.submittedAt))
                    : '—'}
                </td>
                <td style={{ fontSize: 'var(--fs-12)' }}>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', flexDirection: 'column' }}>
                    {p.idDocUrl ? (
                      <a href={p.idDocUrl} target="_blank" rel="noreferrer">
                        ID ↗
                      </a>
                    ) : (
                      <span className="soft">—</span>
                    )}
                    {p.photoDocUrl ? (
                      <a href={p.photoDocUrl} target="_blank" rel="noreferrer">
                        Photo ↗
                      </a>
                    ) : (
                      <span className="soft">—</span>
                    )}
                  </div>
                </td>
                <td className="mono">{formatPrice(p.amount)}</td>
                <td>
                  <Badge
                    status={
                      p.status === 'approved'
                        ? 'approved'
                        : p.status === 'rejected'
                          ? 'rejected'
                          : 'pending'
                    }
                  >
                    {p.statusLabel}
                  </Badge>
                </td>
                <td>
                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate(p.id, 'approved')}
                      >
                        {t('admin.actions.approve')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate(p.id, 'rejected')}
                      >
                        {t('admin.actions.reject')}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const EMPTY_CONTEST = {
  id: '',
  title: '',
  date: '',
  dateDisplay: '',
  lieu: '',
  distance: '',
  format: '',
  prix: 0,
  inscrits: 0,
  max: 60,
  species: '',
  reglement: '',
};

function contestFormState(contest) {
  if (!contest) return { ...EMPTY_CONTEST };
  return {
    id: contest.id,
    title: contest.title ?? '',
    date: contest.date ?? '',
    dateDisplay: contest.dateDisplay ?? '',
    lieu: contest.lieu ?? '',
    distance: contest.distance ?? '',
    format: contest.format ?? '',
    prix: contest.prix ?? 0,
    inscrits: contest.inscrits ?? 0,
    max: contest.max ?? 60,
    species: (contest.species ?? []).join(', '),
    reglement: contest.reglement ?? '',
  };
}

function buildContestPayload(form) {
  return {
    id: form.id.trim(),
    title: form.title.trim(),
    date: form.date.trim(),
    dateDisplay: form.dateDisplay.trim(),
    lieu: form.lieu.trim(),
    distance: form.distance || null,
    format: form.format || null,
    prix: Number(form.prix) || 0,
    inscrits: Number(form.inscrits) || 0,
    max: Number(form.max) || 0,
    species: form.species
      ? form.species.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    reglement: form.reglement || null,
  };
}

function ContestForm({ initial, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const isCreate = !initial;
  const [form, setForm] = useState(() => contestFormState(initial));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(buildContestPayload(form));
    } catch (err) {
      setError(err?.message ?? t('admin.contest.unknownError'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="panel" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
      <form onSubmit={submit} className="stack-md" noValidate>
        <h3 style={{ margin: 0 }}>
          {isCreate ? t('admin.contest.newContest') : t('admin.contest.editContest', { title: initial.title })}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>{t('admin.contest.identifier')}<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.id}
              onChange={update('id')}
              required
              disabled={!isCreate}
              placeholder="tet-2026-07"
            />
          </div>
          <div className="field">
            <label>{t('admin.contest.titleField')}<span className="req">*</span></label>
            <input className="input" value={form.title} onChange={update('title')} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>{t('admin.contest.isoDate')}<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.date}
              onChange={update('date')}
              placeholder="2026-07-12"
              required
            />
          </div>
          <div className="field">
            <label>{t('admin.contest.displayDate')}<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.dateDisplay}
              onChange={update('dateDisplay')}
              placeholder="12 JUIL"
              required
            />
          </div>
        </div>
        <div className="field">
          <label>{t('admin.contest.location')}<span className="req">*</span></label>
          <input className="input" value={form.lieu} onChange={update('lieu')} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>{t('admin.contest.distance')}</label>
            <input className="input" value={form.distance} onChange={update('distance')} placeholder="12 km" />
          </div>
          <div className="field">
            <label>{t('admin.contest.formatField')}</label>
            <input className="input" value={form.format} onChange={update('format')} placeholder="Individuel" />
          </div>
          <div className="field">
            <label>{t('admin.contest.price')}</label>
            <input
              className="input mono"
              type="number"
              min="0"
              step="0.01"
              value={form.prix}
              onChange={update('prix')}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>{t('admin.contest.currentRegistrations')}</label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.inscrits}
              onChange={update('inscrits')}
            />
          </div>
          <div className="field">
            <label>{t('admin.contest.maxSpots')}</label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.max}
              onChange={update('max')}
            />
          </div>
        </div>
        <div className="field">
          <label>{t('admin.contest.speciesField')}</label>
          <input
            className="input mono"
            value={form.species}
            onChange={update('species')}
            placeholder="truite, carpe"
          />
        </div>
        <div className="field">
          <label>{t('admin.contest.rules')}</label>
          <textarea
            className="textarea"
            rows={3}
            value={form.reglement}
            onChange={update('reglement')}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <Button variant="ghost" onClick={onCancel} type="button" disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? t('admin.contest.saving') : isCreate ? t('admin.contest.createCta') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ConcoursSection({ contests: remoteContests, onCreate, onUpdate, onDelete, notify }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('list');
  const [viewingId, setViewingId] = useState(null);
  const { registrations } = useAdminContestRegistrations();
  const editing = typeof mode === 'string' && mode.startsWith('edit:')
    ? remoteContests.find((c) => c.id === mode.slice(5))
    : null;

  const handleCreate = async (payload) => {
    await onCreate(payload);
    notify(t('admin.contest.created', { title: payload.title }));
    setMode('list');
  };

  const handleUpdate = (id) => async (payload) => {
    await onUpdate(id, payload);
    notify(t('admin.contest.updated', { title: payload.title }));
    setMode('list');
  };

  const handleDelete = async (contest) => {
    if (!window.confirm(t('admin.contest.confirmDelete', { title: contest.title }))) return;
    try {
      await onDelete(contest.id);
      notify(t('admin.contest.deleted', { title: contest.title }));
    } catch (err) {
      notify(err?.message ?? t('admin.contest.deleteFailed'));
    }
  };

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
      >
        <h1 style={{ margin: 0 }}>{t('admin.contests.title')}</h1>
        {mode === 'list' && (
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <ExportButton kind="contestRegistrations" label={t('admin.actions.exportRegistrationsCsv')} />
            <Button variant="primary" onClick={() => setMode('create')}>
              {t('admin.actions.addContest')}
            </Button>
          </div>
        )}
      </div>

      {mode === 'create' && (
        <ContestForm initial={null} onCancel={() => setMode('list')} onSubmit={handleCreate} />
      )}
      {editing && (
        <ContestForm
          initial={editing}
          onCancel={() => setMode('list')}
          onSubmit={handleUpdate(editing.id)}
        />
      )}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.title')}</th>
              <th>{t('admin.tableHeaders.date')}</th>
              <th>{t('admin.tableHeaders.location')}</th>
              <th>{t('admin.tableHeaders.registrations')}</th>
              <th>{t('admin.tableHeaders.status')}</th>
              <th>{t('admin.tableHeaders.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {remoteContests.length === 0 && (
              <tr>
                <td colSpan={6} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  {t('admin.contests.empty')}
                </td>
              </tr>
            )}
            {remoteContests.map((c) => {
              const full = c.inscrits >= c.max;
              return (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{c.title}</div>
                    <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                      {c.id}
                    </div>
                  </td>
                  <td className="mono">{c.dateDisplay}</td>
                  <td className="soft">{c.lieu}</td>
                  <td className="mono">
                    {c.inscrits}/{c.max}
                  </td>
                  <td>
                    <Badge status={full ? 'rejected' : 'approved'}>
                      {full ? t('admin.contests.full') : t('admin.contests.open')}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingId(c.id)}
                      >
                        {t('admin.contests.viewRegistrations')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode(`edit:${c.id}`)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewingId && (
        <ContestRegistrationsModal
          contest={remoteContests.find((c) => c.id === viewingId)}
          registrations={registrations.filter((r) => r.contestId === viewingId)}
          onClose={() => setViewingId(null)}
        />
      )}
    </>
  );
}

function ContestRegistrationsModal({ contest, registrations, onClose }) {
  const { t } = useTranslation();
  if (!contest) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contest-regs-title"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 720,
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--bg)',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow-3)',
          zIndex: 82,
          padding: 'var(--sp-6)',
        }}
      >
        <div
          className="row"
          style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
        >
          <div>
            <h3
              id="contest-regs-title"
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-24)',
                fontWeight: 500,
              }}
            >
              {t('admin.contests.registrationsHeader', { title: contest.title })}
            </h3>
            <div className="soft mono" style={{ fontSize: 'var(--fs-12)' }}>
              {contest.dateDisplay} · {contest.lieu} · {registrations.length}/{contest.max}
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
        {registrations.length === 0 ? (
          <p className="soft" style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
            {t('admin.contests.noRegistrations')}
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('admin.tableHeaders.email')}</th>
                <th>{t('admin.tableHeaders.category')}</th>
                <th>{t('admin.tableHeaders.permit')}</th>
                <th>{t('admin.tableHeaders.status')}</th>
                <th>{t('admin.tableHeaders.date')}</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id}>
                  <td>{r.userEmail ?? '—'}</td>
                  <td>{r.category}</td>
                  <td className="mono">{r.permitNumber ?? '—'}</td>
                  <td>
                    <Badge status={r.status === 'paid' ? 'approved' : 'pending'}>
                      {r.status}
                    </Badge>
                  </td>
                  <td className="soft">
                    {r.submittedAt
                      ? new Intl.DateTimeFormat('fr-FR').format(new Date(r.submittedAt))
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

const PRODUCT_CATEGORIES = [
  { id: 'cannes', label: 'Cannes' },
  { id: 'moulinets', label: 'Moulinets' },
  { id: 'leurres', label: 'Leurres & appâts' },
  { id: 'soies-lignes', label: 'Soies & lignes' },
  { id: 'vetements', label: 'Vêtements' },
  { id: 'accessoires', label: 'Accessoires' },
];

const EMPTY_PRODUCT = {
  id: '',
  sku: '',
  name: '',
  category: 'cannes',
  technique: '',
  brand: '',
  price: 0,
  wasPrice: '',
  stock: 0,
  rating: '',
  reviews: '',
  water: '',
  img: '',
  imageUrl: '',
  description: '',
  species: '',
};

function toFormState(product) {
  if (!product) return { ...EMPTY_PRODUCT };
  return {
    id: product.id,
    sku: product.sku ?? '',
    name: product.name ?? '',
    category: product.category ?? 'cannes',
    technique: product.technique ?? '',
    brand: product.brand ?? '',
    price: product.price ?? 0,
    wasPrice: product.wasPrice ?? '',
    stock: product.stock ?? 0,
    rating: product.rating ?? '',
    reviews: product.reviews ?? '',
    water: product.water ?? '',
    img: product.img ?? '',
    imageUrl: product.imageUrl ?? '',
    description: product.description ?? '',
    species: (product.species ?? []).join(', '),
  };
}

function buildPayload(form) {
  const species = form.species
    ? form.species.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  return {
    id: form.id.trim(),
    sku: form.sku.trim(),
    name: form.name.trim(),
    category: form.category,
    technique: form.technique || null,
    brand: form.brand || null,
    price: Number(form.price) || 0,
    wasPrice: form.wasPrice === '' ? null : Number(form.wasPrice),
    stock: Number(form.stock) || 0,
    rating: form.rating === '' ? null : Number(form.rating),
    reviews: form.reviews === '' ? null : Number(form.reviews),
    water: form.water || null,
    img: form.img || null,
    imageUrl: form.imageUrl.trim() || null,
    description: form.description || null,
    species,
  };
}

function ProductForm({ initial, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const isCreate = !initial;
  const [form, setForm] = useState(() => toFormState(initial));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const productCategories = [
    { id: 'cannes', label: t('admin.productCategories.rods') },
    { id: 'moulinets', label: t('admin.productCategories.reels') },
    { id: 'leurres', label: t('admin.productCategories.lures') },
    { id: 'soies-lignes', label: t('admin.productCategories.lines') },
    { id: 'vetements', label: t('admin.productCategories.clothing') },
    { id: 'accessoires', label: t('admin.productCategories.accessories') },
  ];

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(buildPayload(form));
    } catch (err) {
      setError(err?.message ?? t('admin.product.unknownError'));
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="panel" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
      <form onSubmit={submit} className="stack-md" noValidate>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>
            {isCreate ? t('admin.product.newProduct') : t('admin.product.editProduct', { name: initial.name })}
          </h3>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>{t('admin.products.id')}<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.id}
              onChange={update('id')}
              required
              disabled={!isCreate}
              placeholder="hc-nouvelle-canne"
            />
          </div>
          <div className="field">
            <label>{t('admin.products.sku')}<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.sku}
              onChange={update('sku')}
              required
            />
          </div>
        </div>
        <div className="field">
          <label>{t('admin.products.name')}<span className="req">*</span></label>
          <input className="input" value={form.name} onChange={update('name')} required />
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>{t('admin.products.category')}<span className="req">*</span></label>
            <select
              className="select"
              value={form.category}
              onChange={update('category')}
            >
              {productCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t('admin.products.technique')}</label>
            <input className="input" value={form.technique} onChange={update('technique')} />
          </div>
          <div className="field">
            <label>{t('admin.products.brand')}</label>
            <input className="input" value={form.brand} onChange={update('brand')} />
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>{t('admin.products.price')}<span className="req">*</span></label>
            <input
              className="input mono"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={update('price')}
              required
            />
          </div>
          <div className="field">
            <label>{t('admin.products.wasPrice')}</label>
            <input
              className="input mono"
              type="number"
              step="0.01"
              min="0"
              value={form.wasPrice}
              onChange={update('wasPrice')}
            />
          </div>
          <div className="field">
            <label>{t('admin.products.stock')}<span className="req">*</span></label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.stock}
              onChange={update('stock')}
              required
            />
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>{t('admin.products.rating')}</label>
            <input
              className="input mono"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={update('rating')}
            />
          </div>
          <div className="field">
            <label>{t('admin.products.reviews')}</label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.reviews}
              onChange={update('reviews')}
            />
          </div>
          <div className="field">
            <label>{t('admin.products.water')}</label>
            <input
              className="input"
              value={form.water}
              onChange={update('water')}
              placeholder={t('admin.products.waterPlaceholder')}
            />
          </div>
        </div>
        <div className="field">
          <label>{t('admin.products.species')}</label>
          <input
            className="input mono"
            value={form.species}
            onChange={update('species')}
            placeholder="truite, ombre, perche"
          />
        </div>
        <div className="field">
          <label>{t('admin.products.photo')}</label>
          <ImageUploadField
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />
        </div>
        <div className="field">
          <label>{t('admin.products.placeholderLabel')}</label>
          <input className="input" value={form.img} onChange={update('img')} />
        </div>
        <div className="field">
          <label>{t('admin.products.description')}</label>
          <textarea
            className="textarea"
            rows={3}
            value={form.description}
            onChange={update('description')}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <div className="row">
          <Button variant="ghost" onClick={onCancel} type="button" disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement…' : isCreate ? 'Créer le produit' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ProductsSection({
  products,
  onCreate,
  onUpdate,
  onDelete,
  onReplenish,
  notify,
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('list'); // 'list' | 'create' | number(id)
  const editing = typeof mode === 'string' && mode.startsWith('edit:')
    ? products.find((p) => p.id === mode.slice(5))
    : null;

  const handleCreate = async (payload) => {
    await onCreate(payload);
    notify(t('admin.product.created', { name: payload.name }));
    setMode('list');
  };

  const handleUpdate = (id) => async (payload) => {
    await onUpdate(id, payload);
    notify(t('admin.product.updated', { name: payload.name }));
    setMode('list');
  };

  const handleDelete = async (product) => {
    if (!window.confirm(t('admin.product.confirmDelete', { name: product.name }))) return;
    try {
      await onDelete(product.id);
      notify(t('admin.product.deleted', { name: product.name }));
    } catch (err) {
      notify(err?.message ?? t('admin.product.deleteFailed'));
    }
  };

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
      >
        <h1 style={{ margin: 0 }}>{t('admin.products.title')}</h1>
        {mode === 'list' && (
          <Button variant="primary" onClick={() => setMode('create')}>
            {t('admin.actions.addProduct')}
          </Button>
        )}
      </div>

      {mode === 'create' && (
        <ProductForm
          initial={null}
          onCancel={() => setMode('list')}
          onSubmit={handleCreate}
        />
      )}

      {editing && (
        <ProductForm
          initial={editing}
          onCancel={() => setMode('list')}
          onSubmit={handleUpdate(editing.id)}
        />
      )}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin.tableHeaders.ref')}</th>
              <th>{t('admin.tableHeaders.product')}</th>
              <th>{t('admin.tableHeaders.category')}</th>
              <th>{t('admin.tableHeaders.price')}</th>
              <th>{t('admin.tableHeaders.stock')}</th>
              <th>{t('admin.tableHeaders.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  {t('admin.products.empty')}
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.sku}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                    {p.id}
                  </div>
                </td>
                <td className="soft">{p.category}</td>
                <td className="mono">{formatPrice(p.price)}</td>
                <td className="mono">
                  <span
                    style={{
                      color:
                        p.stock < (p.lowStockThreshold ?? 15)
                          ? 'var(--warn)'
                          : 'var(--ink)',
                      fontWeight: p.stock < (p.lowStockThreshold ?? 15) ? 600 : 400,
                    }}
                  >
                    {p.stock}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode(`edit:${p.id}`)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReplenish?.(p)}
                    >
                      {t('admin.products.restock')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { push } = useToast();
  const { orders, updateStatus: updateOrderStatus } = useAdminOrders();
  const { permits, updateStatus: updatePermitStatus } = useAdminPermits();
  const { products, createProduct, updateProduct, deleteProduct, replenish } = useAdminProducts();
  const {
    contests: remoteContests,
    createContest,
    updateContest,
    deleteContest,
  } = useAdminContests();
  const { stats, loading: statsLoading } = useAdminStats();
  const [section, setSection] = useState('overview');

  // L'auth + rôle admin sont déjà garantis par <RequireAdmin> dans
  // App.jsx : quand ce composant rend, user existe, hydrating est
  // terminé et user.role === 'ROLE_ADMIN'. Plus besoin de double check.
  const totalRegistrations = remoteContests.reduce((s, c) => s + (c.inscrits ?? 0), 0);

  const lowStock = products
    .filter((p) => p.stock < (p.lowStockThreshold ?? 15))
    .slice(0, 4);

  const handleReplenish = async (product) => {
    const raw = window.prompt(
      t('admin.replenishPrompt', { name: product.name, stock: product.stock }),
      '10',
    );
    if (!raw) return;
    const qty = Number.parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      push(t('admin.invalidQty'));
      return;
    }
    try {
      await replenish(product.id, qty);
      push(t('admin.replenishDone', { qty, name: product.name }));
    } catch (err) {
      push(err?.message ?? t('admin.replenishFailed'));
    }
  };

  return (
    <div className="admin-layout admin-section">
      <aside className="admin-sidenav">
        <div className="brand-small">
          Hook &amp; Cook{' '}
          <span className="mono soft" style={{ fontSize: 10 }}>
            ADMIN
          </span>
        </div>
        {GROUP_KEYS.map((groupKey) => (
          <div key={groupKey}>
            <div className="nav-group-label">{t(`admin.groups.${groupKey}`)}</div>
            {SECTION_DEFS.filter((s) => s.groupKey === groupKey).map((s) => (
              <button
                key={s.id}
                type="button"
                className={section === s.id ? 'active' : ''}
                onClick={() => setSection(s.id)}
              >
                {s.icon && <SectionIcon name={s.icon} />}
                {t(`admin.sidebar.${s.i18nKey}`)}
              </button>
            ))}
          </div>
        ))}
        <button
          type="button"
          style={{ marginTop: 'auto' }}
          onClick={() => navigate('/')}
        >
          ← {t('admin.backToSite')}
        </button>
        <button type="button" onClick={logout}>
          {t('admin.sidebar.logout')}
        </button>
      </aside>

      <main className="admin-main">
        {section === 'overview' && (
          <OverviewSection
            orders={orders}
            pendingPermits={permits.filter((p) => p.status === 'pending').length}
            contestCount={totalRegistrations}
            lowStock={lowStock}
            onGo={setSection}
            onReplenish={handleReplenish}
          />
        )}
        {section === 'stats' && <StatsSection stats={stats} loading={statsLoading} />}
        {section === 'orders' && (
          <OrdersSection orders={orders} onUpdateStatus={updateOrderStatus} />
        )}
        {section === 'permis' && (
          <PermisSection permits={permits} onUpdate={updatePermitStatus} />
        )}
        {section === 'concours' && (
          <ConcoursSection
            contests={remoteContests}
            onCreate={createContest}
            onUpdate={updateContest}
            onDelete={deleteContest}
            notify={push}
          />
        )}
        {section === 'products' && (
          <ProductsSection
            products={products}
            onCreate={createProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            onReplenish={handleReplenish}
            notify={push}
          />
        )}
      </main>
    </div>
  );
}
