import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { useAuth } from '../lib/auth.js';
import { useCarnet } from '../lib/carnet.js';
import { useContestRegistrations } from '../lib/contestRegistrations.js';
import { formatPrice } from '../lib/format.js';
import { downloadInvoice } from '../lib/invoice.js';
import { useOrders } from '../lib/orders.js';
import { useSubmittedPermit } from '../lib/permitApplication.js';
import { useProducts } from '../lib/products.js';
import { useReferenceData } from '../lib/referenceData.js';
import { useToast } from '../lib/toast.js';
import { useWishlist } from '../lib/wishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';

const TABS = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'commandes', label: 'Commandes' },
  { id: 'permis', label: 'Permis' },
  { id: 'concours', label: 'Concours' },
  { id: 'carnet', label: 'Carnet de prise' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'adresses', label: 'Adresses' },
  { id: 'parametres', label: 'Paramètres' },
];

function StatCard({ label, value, small }) {
  return (
    <div className="stat-card">
      <div className="lbl">{label}</div>
      <div className="val">
        {value}
        {small && <small>{small}</small>}
      </div>
    </div>
  );
}

function Overview({ carnetCount, orderCount, contestCount, hasPermit, onTab }) {
  return (
    <div className="stack-lg">
      <div className="stats-row">
        <StatCard label="Permis" value={hasPermit ? '1' : '0'} small={hasPermit ? 'actif' : ''} />
        <StatCard label="Prises saisies" value={carnetCount} />
        <StatCard label="Commandes" value={orderCount} />
        <StatCard label="Concours" value={contestCount} small={contestCount > 0 ? 'inscrits' : ''} />
      </div>
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Raccourcis
        </div>
        <div
          className="row"
          style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}
        >
          <Button variant="ghost" size="sm" onClick={() => onTab('commandes')}>
            Mes commandes
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onTab('permis')}>
            Mon permis
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onTab('carnet')}>
            Carnet de prise
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders, onShop }) {
  const { token } = useAuth();
  const { push } = useToast();
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (reference) => {
    setDownloadingId(reference);
    try {
      await downloadInvoice(reference, token);
    } catch (err) {
      push(err?.message ?? 'Téléchargement impossible.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-24)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Pas encore de commande.
        </div>
        <p className="soft" style={{ marginBottom: 'var(--sp-5)' }}>
          Votre prochaine commande apparaîtra ici avec son numéro de suivi.
        </p>
        <Button variant="primary" onClick={onShop}>
          Parcourir la boutique
        </Button>
      </div>
    );
  }
  return (
    <div className="stack-md">
      {orders.map((order) => (
        <div key={order.id} className="card" style={{ padding: 'var(--sp-5)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div
                className="disp"
                style={{ fontSize: 'var(--fs-20)', fontWeight: 500 }}
              >
                Commande {order.id}
              </div>
              <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                {new Intl.DateTimeFormat('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(order.date))}{' '}
                · {order.items.length} article{order.items.length > 1 ? 's' : ''} ·{' '}
                {formatPrice(order.total)}
              </div>
            </div>
            <Badge status="approved">{order.statusLabel}</Badge>
          </div>
          <div
            className="stack-sm"
            style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--fs-13)' }}
          >
            {order.items.map((it) => (
              <div
                key={it.product.id}
                className="row"
                style={{ justifyContent: 'space-between' }}
              >
                <span>
                  {it.qty}× {it.product.name}
                </span>
                <span className="mono">
                  {formatPrice(it.unitPrice * it.qty)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(order.id)}
              disabled={downloadingId === order.id}
            >
              <Icon name="download" size={14} />
              {downloadingId === order.id ? 'Préparation…' : 'Télécharger la facture'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermisTab({ permit, onStart }) {
  if (!permit) {
    return (
      <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-24)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Aucun permis en cours.
        </div>
        <p className="soft" style={{ marginBottom: 'var(--sp-5)' }}>
          Faites votre demande en 4 gestes. Traitement sous 2 jours ouvrés.
        </p>
        <Button variant="primary" onClick={onStart}>
          Demander mon permis
        </Button>
      </div>
    );
  }
  return (
    <div className="stack-md">
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div
              className="disp"
              style={{ fontSize: 'var(--fs-20)', fontWeight: 500 }}
            >
              {permit.typeTitle}
            </div>
            <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
              {permit.id} · déposé le{' '}
              {new Intl.DateTimeFormat('fr-FR').format(new Date(permit.submittedAt))}
            </div>
          </div>
          <Badge status={permit.status === 'approved' ? 'approved' : 'pending'}>
            {permit.statusLabel}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ConcoursTab({ inscribed, onExplore }) {
  if (inscribed.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-24)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Aucune inscription à un concours.
        </div>
        <Button variant="primary" onClick={onExplore}>
          Voir les concours à venir
        </Button>
      </div>
    );
  }
  return (
    <div className="stack-md">
      {inscribed.map((contest) => (
        <div key={contest.id} className="card" style={{ padding: 'var(--sp-5)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div
                className="disp"
                style={{ fontSize: 'var(--fs-20)', fontWeight: 500 }}
              >
                {contest.title}
              </div>
              <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                {contest.dateDisplay} · {contest.lieu}
              </div>
            </div>
            <Badge status="approved">Inscrit</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function CarnetForm({ onSubmit, onCancel }) {
  const { species: speciesList } = useReferenceData();
  const [species, setSpecies] = useState('truite');
  const [taille, setTaille] = useState('');
  const [poids, setPoids] = useState('');
  const [spot, setSpot] = useState('');
  const [bait, setBait] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = (e) => {
    e.preventDefault();
    if (!taille || !spot) return;
    const sp = speciesList.find((s) => s.id === species);
    onSubmit({
      species,
      taille: Number(taille),
      poids: poids ? Number(poids) : null,
      spot,
      bait,
      date,
      photo: `${sp?.name ?? 'Prise'} ${taille}cm`,
      weather: '—',
    });
  };

  return (
    <form
      onSubmit={submit}
      className="card stack-md"
      style={{ padding: 'var(--sp-5)' }}
      noValidate
    >
      <div className="eyebrow">Nouvelle prise</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label>Espèce</label>
          <select
            className="select"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            {speciesList.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label>Taille (cm)</label>
          <input
            className="input"
            type="number"
            min="1"
            value={taille}
            onChange={(e) => setTaille(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Poids (g)</label>
          <input
            className="input"
            type="number"
            min="0"
            value={poids}
            onChange={(e) => setPoids(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <label>Lieu</label>
        <input
          className="input"
          value={spot}
          onChange={(e) => setSpot(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Appât / mouche</label>
        <input className="input" value={bait} onChange={(e) => setBait(e.target.value)} />
      </div>
      <div className="row">
        <Button variant="ghost" onClick={onCancel} type="button">
          Annuler
        </Button>
        <Button variant="primary" type="submit" disabled={!taille || !spot}>
          Enregistrer la prise
        </Button>
      </div>
    </form>
  );
}

function CarnetTab({ entries, onAdd, onRemove }) {
  const { species: speciesList } = useReferenceData();
  const [showForm, setShowForm] = useState(false);

  const submit = (entry) => {
    onAdd(entry);
    setShowForm(false);
  };

  return (
    <div className="stack-lg">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="eyebrow">
          {entries.length} prise{entries.length > 1 ? 's' : ''} · saison 2026
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} /> Ajouter une prise
          </Button>
        )}
      </div>

      {showForm && <CarnetForm onSubmit={submit} onCancel={() => setShowForm(false)} />}

      {entries.length === 0 && !showForm && (
        <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
          <p className="soft">Votre carnet est vide. Enregistrez votre première prise.</p>
        </div>
      )}

      <div className="carnet-grid">
        {entries.map((entry) => {
          const sp = speciesList.find((s) => s.id === entry.species);
          return (
            <article className="carnet-entry" key={entry.id}>
              <div className="media">
                <Placeholder label={entry.photo} />
              </div>
              <div className="body">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div className="eyebrow">
                    {sp?.name} ·{' '}
                    {new Intl.DateTimeFormat('fr-FR').format(new Date(entry.date))}
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onRemove(entry.id)}
                    aria-label={`Supprimer la prise du ${entry.date}`}
                    style={{ width: 28, height: 28 }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
                <div className="big-num">
                  {entry.taille}
                  <small>
                    cm{entry.poids ? ` · ${entry.poids}g` : ''}
                  </small>
                </div>
                <div className="stack-sm" style={{ fontSize: 'var(--fs-13)' }}>
                  <div className="row" style={{ gap: 'var(--sp-2)' }}>
                    <Icon name="location" size={14} />
                    <span className="soft">{entry.spot}</span>
                  </div>
                  {entry.bait && (
                    <div
                      className="mono soft"
                      style={{ fontSize: 'var(--fs-12)' }}
                    >
                      {entry.bait}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ProfileForm({ user, onSubmit }) {
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [addressLine, setAddressLine] = useState(user.addressLine ?? '');
  const [postalCode, setPostalCode] = useState(user.postalCode ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [country, setCountry] = useState(user.country ?? 'France');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ kind: null, message: '' });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ kind: null, message: '' });
    const result = await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || null,
      addressLine: addressLine.trim() || null,
      postalCode: postalCode.trim() || null,
      city: city.trim() || null,
      country: country.trim() || null,
    });
    setSaving(false);
    if (result.ok) {
      setFeedback({ kind: 'ok', message: 'Profil mis à jour.' });
    } else {
      setFeedback({ kind: 'error', message: result.error ?? 'Échec de la mise à jour.' });
    }
  };

  return (
    <form onSubmit={submit} className="card stack-md" style={{ padding: 'var(--sp-5)' }} noValidate>
      <div className="eyebrow">Mes informations</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label>Prénom<span className="req">*</span></label>
          <input
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Nom<span className="req">*</span></label>
          <input
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="field">
        <label>Email</label>
        <input className="input mono" value={user.email} disabled />
        <div className="hint">L'email de connexion ne peut pas être modifié depuis cette page.</div>
      </div>
      <div className="field">
        <label>Téléphone</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="06 12 34 56 78"
        />
      </div>
      <div className="eyebrow" style={{ marginTop: 'var(--sp-3)' }}>
        Adresse de livraison par défaut
      </div>
      <div className="field">
        <label>Adresse</label>
        <input
          className="input"
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          placeholder="14 rue des Arènes"
        />
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 'var(--sp-3)' }}
      >
        <div className="field">
          <label>Code postal</label>
          <input
            className="input"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Ville</label>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Pays</label>
          <input
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>
      {feedback.kind === 'ok' && (
        <div style={{ color: 'var(--ok)', fontSize: 'var(--fs-14)' }}>{feedback.message}</div>
      )}
      {feedback.kind === 'error' && <div className="error">{feedback.message}</div>}
      <div>
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}

function SettingsTab({ user, onLogout, onSubmit }) {
  return (
    <div className="stack-lg">
      <ProfileForm user={user} onSubmit={onSubmit} />
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Session
        </div>
        <Button variant="ghost" onClick={onLogout}>
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

function FavorisTab({ onShop }) {
  const { productIds, loading } = useWishlist();
  const { products } = useProducts();
  const favorites = products.filter((p) => productIds.has(p.id));

  if (loading) {
    return <p className="soft">Chargement de vos favoris…</p>;
  }

  if (favorites.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-24)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Aucun favori pour l'instant.
        </div>
        <p className="soft" style={{ marginBottom: 'var(--sp-5)' }}>
          Cliquez sur le cœur d'un produit pour le retrouver ici.
        </p>
        <Button variant="primary" onClick={onShop}>
          Parcourir la boutique
        </Button>
      </div>
    );
  }

  return (
    <div className="catalog-grid">
      {favorites.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function AddressesTab({ user, onGoSettings }) {
  const hasAddress = user.addressLine && user.city;
  if (!hasAddress) {
    return (
      <div className="card" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-24)',
            marginBottom: 'var(--sp-3)',
          }}
        >
          Aucune adresse enregistrée.
        </div>
        <p className="soft" style={{ marginBottom: 'var(--sp-5)' }}>
          Ajoutez votre adresse de livraison depuis la section Paramètres pour gagner du temps
          au checkout.
        </p>
        <Button variant="primary" onClick={onGoSettings}>
          Renseigner mon adresse
        </Button>
      </div>
    );
  }
  return (
    <div className="stack-md">
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>
              Adresse de livraison
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-20)', fontWeight: 500 }}>
              {user.firstName} {user.lastName}
            </div>
            <div className="mono soft" style={{ marginTop: 'var(--sp-2)' }}>
              {user.addressLine}
              <br />
              {user.postalCode} {user.city}
              {user.country && (
                <>
                  <br />
                  {user.country}
                </>
              )}
            </div>
            {user.phone && (
              <div className="mono soft" style={{ marginTop: 'var(--sp-2)' }}>
                Tel : {user.phone}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={onGoSettings}>
            Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AccountPage() {
  // L'auth est déjà garantie par <RequireAuth> dans App.jsx :
  // quand ce composant rend, user est forcément non-null et
  // hydrating est terminé. On évite donc le double check.
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { contests: remoteContests } = useReferenceData();
  const { orders } = useOrders();
  const { entries, addEntry, removeEntry } = useCarnet();
  const { permit } = useSubmittedPermit();
  const { isRegistered } = useContestRegistrations();
  const [tab, setTab] = useState('apercu');

  const inscribed = remoteContests.filter((c) => isRegistered(c.id));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="page">
      <div className="page-container">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-44)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            margin: '0 0 var(--sp-8)',
          }}
        >
          Bonjour, {user.firstName}
        </h1>

        <div className="account-layout">
          <nav className="account-nav" aria-label="Navigation compte">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={tab === t.id ? 'active' : ''}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div>
            {tab === 'apercu' && (
              <Overview
                carnetCount={entries.length}
                orderCount={orders.length}
                contestCount={inscribed.length}
                hasPermit={Boolean(permit)}
                onTab={setTab}
              />
            )}
            {tab === 'commandes' && (
              <OrdersTab orders={orders} onShop={() => navigate('/boutique')} />
            )}
            {tab === 'permis' && (
              <PermisTab permit={permit} onStart={() => navigate('/permis')} />
            )}
            {tab === 'concours' && (
              <ConcoursTab
                inscribed={inscribed}
                onExplore={() => navigate('/concours')}
              />
            )}
            {tab === 'carnet' && (
              <CarnetTab entries={entries} onAdd={addEntry} onRemove={removeEntry} />
            )}
            {tab === 'favoris' && <FavorisTab onShop={() => navigate('/boutique')} />}
            {tab === 'adresses' && (
              <AddressesTab user={user} onGoSettings={() => setTab('parametres')} />
            )}
            {tab === 'parametres' && (
              <SettingsTab
                user={user}
                onLogout={handleLogout}
                onSubmit={updateProfile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
