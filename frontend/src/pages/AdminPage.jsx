import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ImageUploadField } from '../components/ui/ImageUploadField.jsx';
import { useAdminContests } from '../lib/adminContests.js';
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

const SECTIONS = [
  { id: 'overview', label: "Vue d'ensemble", group: 'Activité', icon: 'compass' },
  { id: 'stats', label: 'Statistiques', group: 'Activité', icon: 'calendar' },
  { id: 'orders', label: 'Commandes', group: 'Activité', icon: 'cart' },
  { id: 'permis', label: 'Permis', group: 'Pêche', icon: 'permit' },
  { id: 'concours', label: 'Concours', group: 'Pêche', icon: 'trophy' },
  { id: 'products', label: 'Produits', group: 'Catalogue', icon: 'fish' },
];

const GROUPS = ['Activité', 'Pêche', 'Catalogue'];

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
  if (loading || !stats) {
    return (
      <>
        <h1>Statistiques</h1>
        <p className="soft">Chargement…</p>
      </>
    );
  }
  return (
    <>
      <h1>Statistiques</h1>
      <div className="kpi-row">
        <div className="kpi">
          <div className="lbl">CA total</div>
          <div className="val">
            <CountUpPrice value={stats.totalRevenue} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Panier moyen</div>
          <div className="val">
            <CountUpPrice value={stats.avgBasket} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Taux de conversion</div>
          <div className="val">
            <CountUpNumber value={stats.conversionRate} decimals={1} />
            <small>%</small>
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Acheteurs uniques</div>
          <div className="val">
            <CountUpNumber value={stats.totalBuyers} />
            <small> / {stats.totalUsers ?? 0}</small>
          </div>
        </div>
      </div>

      <div className="kpi-row" style={{ marginTop: 'var(--sp-3)' }}>
        <div className="kpi">
          <div className="lbl">Commandes</div>
          <div className="val">
            <CountUpNumber value={stats.totalOrders} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Permis émis</div>
          <div className="val">
            <CountUpNumber value={stats.totalPermits} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Inscriptions concours</div>
          <div className="val">
            <CountUpNumber value={stats.totalRegistrations} />
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Stocks critiques</div>
          <div className="val">
            <CountUpNumber value={(stats.lowStock ?? []).length} />
          </div>
        </div>
      </div>

      <Reveal>
        <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="panel-header">
            <h3>CA par mois (6 derniers)</h3>
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
            title="Commandes par statut"
            breakdown={stats.ordersByStatus}
            labels={{
              paid: 'Payées',
              shipped: 'Expédiées',
              delivered: 'Livrées',
              cancelled: 'Annulées',
            }}
          />
          <StatusBreakdown
            title="Permis par statut"
            breakdown={stats.permitsByStatus}
            labels={{
              pending: 'En instruction',
              approved: 'Approuvés',
              rejected: 'Rejetés',
            }}
          />
        </div>
      </Reveal>

      <Reveal>
        <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="panel-header">
            <h3>Top 5 produits vendus</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>SKU</th>
                <th>Quantité</th>
                <th>CA généré</th>
              </tr>
            </thead>
            <tbody>
              {(stats.topProducts ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    Aucune vente enregistrée pour l'instant.
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
              <h3>Stocks critiques</h3>
            </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock</th>
                <th>Seuil</th>
              </tr>
            </thead>
            <tbody>
              {(stats.lowStock ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    Aucun produit sous le seuil.
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
            <h3>Jamais vendus</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock</th>
                <th>Prix</th>
              </tr>
            </thead>
            <tbody>
              {(stats.neverSold ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="soft" style={{ padding: 'var(--sp-4)' }}>
                    Tous les produits ont été vendus au moins une fois.
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
          <h3>CA par catégorie</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Catégorie</th>
              <th>CA généré</th>
              <th>Part</th>
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
                      Pas encore de ventes.
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
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const ordersToShip = orders.filter((o) => o.status === 'paid').length;

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}
      >
        <h1>Vue d'ensemble</h1>
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
        <KpiCard label="CA cumulé" value={<CountUpPrice value={totalRevenue} />} />
        <KpiCard
          label="Commandes à expédier"
          value={<CountUpNumber value={ordersToShip} />}
          delta={`${orders.length} au total`}
          deltaTone="soft"
        />
        <KpiCard label="Permis en attente" value={<CountUpNumber value={pendingPermits ?? 0} />} />
        <KpiCard label="Inscriptions concours" value={<CountUpNumber value={contestCount} />} />
      </div>

      <div className="panel" style={{ marginTop: 'var(--sp-5)' }}>
        <div className="panel-header">
          <h3>Commandes récentes</h3>
          <Button variant="ghost" size="sm" onClick={() => onGo('orders')}>
            Tout voir
          </Button>
        </div>
        <div className="panel-body">
          {orders.length === 0 ? (
            <p className="soft" style={{ padding: 'var(--sp-4) 0' }}>
              Aucune commande enregistrée pour l'instant.
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
          <h3>Stock critique</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Produit</th>
              <th>Stock</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lowStock.length === 0 ? (
              <tr>
                <td colSpan={4} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucun produit en stock critique.
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
                        + stock
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onGo('products')}>
                        Ouvrir
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
  const { token } = useAuth();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await downloadExport(kind, token);
    } catch (err) {
      push(err?.message ?? 'Export impossible.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" onClick={handle} disabled={busy}>
      <Icon name="download" size={14} />
      {busy ? 'Export…' : label}
    </Button>
  );
}

function OrdersSection({ orders, onUpdateStatus }) {
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Commandes</h1>
        <ExportButton kind="orders" label="Exporter en CSV" />
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Email</th>
              <th>Date</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucune commande.
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
                  {order.status === 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateStatus(order.id, 'shipped')}
                    >
                      Marquer expédiée
                    </Button>
                  )}
                  {order.status === 'shipped' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateStatus(order.id, 'delivered')}
                    >
                      Marquer livrée
                    </Button>
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

function PermisSection({ permits, onUpdate }) {
  const list = permits ?? [];
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Demandes de permis</h1>
        <ExportButton kind="permits" label="Exporter en CSV" />
      </div>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Demandeur</th>
              <th>Type</th>
              <th>Déposé</th>
              <th>Pièces</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucune demande en cours.
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
                        Approuver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate(p.id, 'rejected')}
                      >
                        Rejeter
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
      setError(err?.message ?? 'Erreur inconnue.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="panel" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
      <form onSubmit={submit} className="stack-md" noValidate>
        <h3 style={{ margin: 0 }}>
          {isCreate ? 'Nouveau concours' : `Éditer ${initial.title}`}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>Identifiant (slug)<span className="req">*</span></label>
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
            <label>Titre<span className="req">*</span></label>
            <input className="input" value={form.title} onChange={update('title')} required />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>Date ISO<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.date}
              onChange={update('date')}
              placeholder="2026-07-12"
              required
            />
          </div>
          <div className="field">
            <label>Date affichée<span className="req">*</span></label>
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
          <label>Lieu<span className="req">*</span></label>
          <input className="input" value={form.lieu} onChange={update('lieu')} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
          <div className="field">
            <label>Distance</label>
            <input className="input" value={form.distance} onChange={update('distance')} placeholder="12 km" />
          </div>
          <div className="field">
            <label>Format</label>
            <input className="input" value={form.format} onChange={update('format')} placeholder="Individuel" />
          </div>
          <div className="field">
            <label>Prix (€)</label>
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
            <label>Inscrits actuels</label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.inscrits}
              onChange={update('inscrits')}
            />
          </div>
          <div className="field">
            <label>Places max</label>
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
          <label>Espèces (séparées par virgules)</label>
          <input
            className="input mono"
            value={form.species}
            onChange={update('species')}
            placeholder="truite, carpe"
          />
        </div>
        <div className="field">
          <label>Règlement</label>
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
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Enregistrement…' : isCreate ? 'Créer le concours' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ConcoursSection({ contests: remoteContests, onCreate, onUpdate, onDelete, notify }) {
  const [mode, setMode] = useState('list');
  const editing = typeof mode === 'string' && mode.startsWith('edit:')
    ? remoteContests.find((c) => c.id === mode.slice(5))
    : null;

  const handleCreate = async (payload) => {
    await onCreate(payload);
    notify(`Concours « ${payload.title} » créé.`);
    setMode('list');
  };

  const handleUpdate = (id) => async (payload) => {
    await onUpdate(id, payload);
    notify(`Concours « ${payload.title} » mis à jour.`);
    setMode('list');
  };

  const handleDelete = async (contest) => {
    if (!window.confirm(`Supprimer définitivement « ${contest.title} » ?`)) return;
    try {
      await onDelete(contest.id);
      notify(`Concours « ${contest.title} » supprimé.`);
    } catch (err) {
      notify(err?.message ?? 'Suppression impossible.');
    }
  };

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
      >
        <h1 style={{ margin: 0 }}>Concours</h1>
        {mode === 'list' && (
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <ExportButton kind="contestRegistrations" label="Exporter inscriptions CSV" />
            <Button variant="primary" onClick={() => setMode('create')}>
              + Ajouter un concours
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
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Inscrits</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {remoteContests.length === 0 && (
              <tr>
                <td colSpan={6} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucun concours. Ajoutez-en un pour démarrer.
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
                      {full ? 'Complet' : 'Ouvert'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode(`edit:${c.id}`)}
                      >
                        Éditer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
  const isCreate = !initial;
  const [form, setForm] = useState(() => toFormState(initial));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(buildPayload(form));
    } catch (err) {
      setError(err?.message ?? 'Erreur inconnue.');
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
            {isCreate ? 'Nouveau produit' : `Éditer ${initial.name}`}
          </h3>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>Identifiant (slug)<span className="req">*</span></label>
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
            <label>SKU<span className="req">*</span></label>
            <input
              className="input mono"
              value={form.sku}
              onChange={update('sku')}
              required
            />
          </div>
        </div>
        <div className="field">
          <label>Nom<span className="req">*</span></label>
          <input className="input" value={form.name} onChange={update('name')} required />
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>Catégorie<span className="req">*</span></label>
            <select
              className="select"
              value={form.category}
              onChange={update('category')}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Technique</label>
            <input className="input" value={form.technique} onChange={update('technique')} />
          </div>
          <div className="field">
            <label>Marque</label>
            <input className="input" value={form.brand} onChange={update('brand')} />
          </div>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}
        >
          <div className="field">
            <label>Prix (€)<span className="req">*</span></label>
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
            <label>Prix barré</label>
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
            <label>Stock<span className="req">*</span></label>
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
            <label>Note (0-5)</label>
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
            <label>Nombre d'avis</label>
            <input
              className="input mono"
              type="number"
              min="0"
              value={form.reviews}
              onChange={update('reviews')}
            />
          </div>
          <div className="field">
            <label>Type d'eau</label>
            <input
              className="input"
              value={form.water}
              onChange={update('water')}
              placeholder="rivière, lac, mer…"
            />
          </div>
        </div>
        <div className="field">
          <label>Espèces (séparées par des virgules)</label>
          <input
            className="input mono"
            value={form.species}
            onChange={update('species')}
            placeholder="truite, ombre, perche"
          />
        </div>
        <div className="field">
          <label>Photo du produit</label>
          <ImageUploadField
            value={form.imageUrl}
            onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
          />
        </div>
        <div className="field">
          <label>Étiquette du placeholder (fallback texte si pas d'URL)</label>
          <input className="input" value={form.img} onChange={update('img')} />
        </div>
        <div className="field">
          <label>Description</label>
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
  const [mode, setMode] = useState('list'); // 'list' | 'create' | number(id)
  const editing = typeof mode === 'string' && mode.startsWith('edit:')
    ? products.find((p) => p.id === mode.slice(5))
    : null;

  const handleCreate = async (payload) => {
    await onCreate(payload);
    notify(`Produit « ${payload.name} » créé.`);
    setMode('list');
  };

  const handleUpdate = (id) => async (payload) => {
    await onUpdate(id, payload);
    notify(`Produit « ${payload.name} » mis à jour.`);
    setMode('list');
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer définitivement « ${product.name} » ?`)) return;
    try {
      await onDelete(product.id);
      notify(`Produit « ${product.name} » supprimé.`);
    } catch (err) {
      notify(err?.message ?? 'Suppression impossible.');
    }
  };

  return (
    <>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}
      >
        <h1 style={{ margin: 0 }}>Produits</h1>
        {mode === 'list' && (
          <Button variant="primary" onClick={() => setMode('create')}>
            + Ajouter un produit
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
              <th>Ref</th>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucun produit. Ajoutez-en un pour démarrer.
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
                      Éditer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReplenish?.(p)}
                    >
                      Réapprovisionner
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p)}
                    >
                      Supprimer
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
  const { user, logout } = useAuth();
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
      `Combien d'unités ajouter à « ${product.name} » ? (stock actuel : ${product.stock})`,
      '10',
    );
    if (!raw) return;
    const qty = Number.parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      push('Quantité invalide.');
      return;
    }
    try {
      await replenish(product.id, qty);
      push(`+${qty} unités sur « ${product.name} ».`);
    } catch (err) {
      push(err?.message ?? 'Réapprovisionnement impossible.');
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
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {SECTIONS.filter((s) => s.group === group).map((s) => (
              <button
                key={s.id}
                type="button"
                className={section === s.id ? 'active' : ''}
                onClick={() => setSection(s.id)}
              >
                {s.icon && <SectionIcon name={s.icon} />}
                {s.label}
              </button>
            ))}
          </div>
        ))}
        <button
          type="button"
          style={{ marginTop: 'auto' }}
          onClick={() => navigate('/')}
        >
          ← Retour au site
        </button>
        <button type="button" onClick={logout}>
          Se déconnecter
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
