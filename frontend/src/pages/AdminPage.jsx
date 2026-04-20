import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { contests } from '../data/catalog.js';
import { useAdminOrders } from '../lib/adminOrders.js';
import { useAdminProducts } from '../lib/adminProducts.js';
import { useAuth } from '../lib/auth.js';
import { formatPrice } from '../lib/format.js';
import { useSubmittedPermit } from '../lib/permitApplication.js';
import { useToast } from '../lib/toast.js';

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
          <label>URL de la photo (https://…)</label>
          <input
            className="input mono"
            type="url"
            value={form.imageUrl}
            onChange={update('imageUrl')}
            placeholder="https://images.unsplash.com/photo-..."
          />
          {form.imageUrl && (
            <div
              style={{
                marginTop: 'var(--sp-3)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                width: 160,
                height: 200,
                background: 'var(--bg-sunk)',
              }}
            >
              <img
                src={form.imageUrl}
                alt="Aperçu"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
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
                <td className="mono">{p.stock}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
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
  const { user, hydrating, logout } = useAuth();
  const { push } = useToast();
  const { orders, updateStatus: updateOrderStatus } = useAdminOrders();
  const { permit, updateStatus: updatePermitStatus } = useSubmittedPermit();
  const { products, createProduct, updateProduct, deleteProduct } = useAdminProducts();
  const [section, setSection] = useState('overview');

  const isAdmin = user?.role === 'ROLE_ADMIN';

  const registeredIds = useMemo(() => {
    try {
      const raw = window.localStorage.getItem('hc.contests.v1');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }, []);

  if (hydrating) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ padding: 'var(--sp-16) 0', textAlign: 'center' }}
        >
          <p className="soft">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: '/admin' }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-44)',
              fontWeight: 400,
              margin: '0 0 var(--sp-4)',
            }}
          >
            Accès réservé aux administrateurs.
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            Connectez-vous avec un compte admin pour accéder à cette section.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
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
            onCreate={createProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            notify={push}
          />
        )}
      </main>
    </div>
  );
}
