import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { contests } from '../data/catalog.js';
import { useAdminProducts } from '../lib/adminProducts.js';
import { useAuth } from '../lib/auth.js';
import { formatPrice } from '../lib/format.js';
import { useOrders } from '../lib/orders.js';
import { useSubmittedPermit } from '../lib/permitApplication.js';

const SECTIONS = [
  { id: 'overview', label: "Vue d'ensemble", group: 'Activité' },
  { id: 'orders', label: 'Commandes', group: 'Activité' },
  { id: 'permis', label: 'Permis', group: 'Pêche' },
  { id: 'concours', label: 'Concours', group: 'Pêche' },
  { id: 'products', label: 'Produits', group: 'Catalogue' },
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

function OverviewSection({ orders, permit, contestCount, lowStock, onGo }) {
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
        <KpiCard label="CA cumulé" value={formatPrice(totalRevenue)} />
        <KpiCard
          label="Commandes à expédier"
          value={ordersToShip}
          delta={`${orders.length} au total`}
          deltaTone="soft"
        />
        <KpiCard
          label="Permis en attente"
          value={permit && permit.status === 'pending' ? 1 : 0}
        />
        <KpiCard label="Inscriptions concours" value={contestCount} />
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
                    <Button variant="ghost" size="sm" onClick={() => onGo('products')}>
                      Réapprovisionner
                    </Button>
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

function OrdersSection({ orders, onUpdateStatus }) {
  return (
    <>
      <h1>Commandes</h1>
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

function PermisSection({ permit, onUpdate }) {
  return (
    <>
      <h1>Demandes de permis</h1>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Demandeur</th>
              <th>Type</th>
              <th>Déposé</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!permit && (
              <tr>
                <td colSpan={7} className="soft" style={{ padding: 'var(--sp-4)' }}>
                  Aucune demande en cours.
                </td>
              </tr>
            )}
            {permit && (
              <tr>
                <td className="mono">{permit.id}</td>
                <td>
                  {permit.firstName} {permit.lastName}
                </td>
                <td>{permit.typeTitle}</td>
                <td className="soft">
                  {new Intl.DateTimeFormat('fr-FR').format(new Date(permit.submittedAt))}
                </td>
                <td className="mono">{formatPrice(permit.amount)}</td>
                <td>
                  <Badge
                    status={
                      permit.status === 'approved'
                        ? 'approved'
                        : permit.status === 'rejected'
                          ? 'rejected'
                          : 'pending'
                    }
                  >
                    {permit.statusLabel}
                  </Badge>
                </td>
                <td>
                  {permit.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate('approved')}
                      >
                        Approuver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate('rejected')}
                      >
                        Rejeter
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ConcoursSection({ registered }) {
  return (
    <>
      <h1>Concours</h1>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Inscrits (site)</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {contests.map((c) => {
              const siteCount = registered.has(c.id) ? c.inscrits + 1 : c.inscrits;
              const full = siteCount >= c.max;
              return (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td className="mono">{c.dateDisplay}</td>
                  <td className="soft">{c.lieu}</td>
                  <td className="mono">
                    {siteCount}/{c.max}
                  </td>
                  <td>
                    <Badge status={full ? 'rejected' : 'approved'}>
                      {full ? 'Complet' : 'Ouvert'}
                    </Badge>
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

function ProductsSection({ products, onUpdateStock, onSetStock }) {
  const [editingId, setEditingId] = useState(null);
  const [draftValue, setDraftValue] = useState('');

  const startEdit = (product) => {
    setEditingId(product.id);
    setDraftValue(String(product.stock));
  };

  const saveEdit = (id) => {
    onSetStock(id, draftValue);
    setEditingId(null);
  };

  return (
    <>
      <h1>Produits</h1>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="mono">{p.sku}</td>
                <td>{p.name}</td>
                <td className="soft">{p.category}</td>
                <td className="mono">{formatPrice(p.price)}</td>
                <td className="mono">
                  {editingId === p.id ? (
                    <input
                      className="input mono"
                      type="number"
                      min="0"
                      value={draftValue}
                      onChange={(e) => setDraftValue(e.target.value)}
                      style={{ width: 90, height: 32 }}
                      autoFocus
                    />
                  ) : (
                    p.stock
                  )}
                </td>
                <td>
                  {editingId === p.id ? (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveEdit(p.id)}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Annuler
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(p)}
                      >
                        Éditer stock
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStock(p.id, 10)}
                      >
                        +10
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

export function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, updateStatus: updateOrderStatus } = useOrders();
  const { permit, updateStatus: updatePermitStatus } = useSubmittedPermit();
  const { products, updateStock, setStock } = useAdminProducts();
  const [section, setSection] = useState('overview');

  const registeredIds = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('hc.contests.v1');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }, []);

  if (!user) {
    return <Navigate to="/connexion" state={{ from: '/admin' }} replace />;
  }

  const lowStock = products.filter((p) => p.stock < 15).slice(0, 4);

  return (
    <div className="admin-layout">
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
            permit={permit}
            contestCount={registeredIds.size}
            lowStock={lowStock}
            onGo={setSection}
          />
        )}
        {section === 'orders' && (
          <OrdersSection orders={orders} onUpdateStatus={updateOrderStatus} />
        )}
        {section === 'permis' && (
          <PermisSection permit={permit} onUpdate={updatePermitStatus} />
        )}
        {section === 'concours' && <ConcoursSection registered={registeredIds} />}
        {section === 'products' && (
          <ProductsSection
            products={products}
            onUpdateStock={updateStock}
            onSetStock={setStock}
          />
        )}
      </main>
    </div>
  );
}
