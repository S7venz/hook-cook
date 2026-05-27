import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';
import { FishRain } from '../components/decor/FishRain.jsx';
import { HookStamp } from '../components/decor/HookStamp.jsx';
import { useAuth } from '../lib/auth.js';
import { useCarnet } from '../lib/carnet.js';
import { useContestRegistrations } from '../lib/contestRegistrations.js';
import { formatPrice } from '../lib/format.js';
import { deleteAccount, downloadGdprExport } from '../lib/gdpr.js';
import { downloadInvoice } from '../lib/invoice.js';
import { useOrders } from '../lib/orders.js';
import { useSubmittedPermit } from '../lib/permitApplication.js';
import { useProducts } from '../lib/products.js';
import { useReferenceData } from '../lib/referenceData.js';
import { useToast } from '../lib/toast.js';
import { useWishlist } from '../lib/wishlist.js';
import { ProductCard } from '../components/ProductCard.jsx';

const TAB_DEFS = [
  { id: 'apercu', i18nKey: 'overview', icon: 'compass' },
  { id: 'commandes', i18nKey: 'orders', icon: 'cart' },
  { id: 'permis', i18nKey: 'permits', icon: 'permit' },
  { id: 'concours', i18nKey: 'contests', icon: 'trophy' },
  { id: 'carnet', i18nKey: 'log', icon: 'fish' },
  { id: 'favoris', i18nKey: 'favorites', icon: 'fly' },
  { id: 'adresses', i18nKey: 'addresses', icon: 'pin' },
  { id: 'parametres', i18nKey: 'settings', icon: 'carnet' },
];

function useTabs() {
  const { t } = useTranslation();
  return TAB_DEFS.map((d) => ({ ...d, label: t(`account.tabs.${d.i18nKey}`) }));
}

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
  const { t } = useTranslation();
  return (
    <div className="stack-lg">
      <div className="stats-row">
        <StatCard label={t('account.overview.stats.permits')} value={hasPermit ? '1' : '0'} small={hasPermit ? t('account.overview.active') : ''} />
        <StatCard label={t('account.overview.stats.catches')} value={carnetCount} />
        <StatCard label={t('account.overview.stats.orders')} value={orderCount} />
        <StatCard label={t('account.overview.stats.contests')} value={contestCount} small={contestCount > 0 ? t('account.overview.registered') : ''} />
      </div>
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          {t('account.overview.shortcuts')}
        </div>
        <div
          className="row"
          style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}
        >
          <Button variant="ghost" size="sm" onClick={() => onTab('commandes')}>
            {t('account.overview.shortcutOrders')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onTab('permis')}>
            {t('account.overview.shortcutPermit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onTab('carnet')}>
            {t('account.overview.shortcutLog')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders, onShop }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { push } = useToast();
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (reference) => {
    setDownloadingId(reference);
    try {
      await downloadInvoice(reference, token);
    } catch (err) {
      push(err?.message ?? t('account.orders.downloadFailed'));
    } finally {
      setDownloadingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <EmptyState
        illus="box"
        title={t('account.orders.emptyTitle')}
        description={t('account.orders.emptyDescription')}
      >
        <Button variant="primary" onClick={onShop}>
          {t('placeholder.browseShop')}
        </Button>
      </EmptyState>
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
                {t('account.orders.orderNumber', { id: order.id })}
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
              {downloadingId === order.id ? t('account.orders.preparing') : t('account.orders.downloadInvoice')}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PermisTab({ permit, onStart }) {
  const { t } = useTranslation();
  // Pluie de poissons une seule fois quand l'utilisateur découvre que
  // son permis vient d'être approuvé. Persisté en localStorage pour
  // ne pas se rejouer à chaque visite.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!permit || permit.status !== 'approved' || !permit.id) return;
    const key = `hc-permit-celebrated-${permit.id}`;
    if (localStorage.getItem(key)) return;
    setCelebrate(true);
    localStorage.setItem(key, '1');
    const t = setTimeout(() => setCelebrate(false), 4500);
    return () => clearTimeout(t);
  }, [permit?.id, permit?.status]);

  if (!permit) {
    return (
      <EmptyState
        illus="permit"
        title={t('account.permits.emptyTitle')}
        description={t('account.permits.emptyDescription')}
      >
        <Button variant="primary" onClick={onStart}>
          {t('account.permits.requestCta')}
        </Button>
      </EmptyState>
    );
  }
  const approved = permit.status === 'approved';
  return (
    <div className="stack-md">
      <FishRain count={28} duration={4000} active={celebrate} />
      {approved && celebrate && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
          <HookStamp label={t('account.permits.stamp')} size={88} />
        </div>
      )}
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
              {permit.id} · {t('account.permits.submittedOn')}{' '}
              {new Intl.DateTimeFormat('fr-FR').format(new Date(permit.submittedAt))}
            </div>
          </div>
          <Badge status={approved ? 'approved' : 'pending'}>
            {permit.statusLabel}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ConcoursTab({ inscribed, onExplore }) {
  const { t } = useTranslation();
  if (inscribed.length === 0) {
    return (
      <EmptyState
        illus="trophy"
        title={t('account.contests.emptyTitle')}
        description={t('account.contests.emptyDescription')}
      >
        <Button variant="primary" onClick={onExplore}>
          {t('account.contests.exploreCta')}
        </Button>
      </EmptyState>
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
            <Badge status="approved">{t('account.contests.registered')}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function CarnetForm({ onSubmit, onCancel }) {
  const { t } = useTranslation();
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
      <div className="eyebrow">{t('account.log.newEntry')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label>{t('account.log.speciesLabel')}</label>
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
          <label>{t('account.log.dateLabel')}</label>
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
          <label>{t('account.log.sizeLabel')}</label>
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
          <label>{t('account.log.weightLabel')}</label>
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
        <label>{t('account.log.spotLabel')}</label>
        <input
          className="input"
          value={spot}
          onChange={(e) => setSpot(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>{t('account.log.baitLabel')}</label>
        <input className="input" value={bait} onChange={(e) => setBait(e.target.value)} />
      </div>
      <div className="row">
        <Button variant="ghost" onClick={onCancel} type="button">
          {t('common.cancel')}
        </Button>
        <Button variant="primary" type="submit" disabled={!taille || !spot}>
          {t('account.log.save')}
        </Button>
      </div>
    </form>
  );
}

function CarnetTab({ entries, onAdd, onRemove }) {
  const { t } = useTranslation();
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
          {t('account.log.countSeason', { count: entries.length })}
        </div>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} /> {t('account.log.addEntry')}
          </Button>
        )}
      </div>

      {showForm && <CarnetForm onSubmit={submit} onCancel={() => setShowForm(false)} />}

      {entries.length === 0 && !showForm && (
        <EmptyState
          illus="fish"
          title={t('account.log.emptyTitle')}
          description={t('account.log.emptyDescription')}
        >
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Icon name="plus" size={14} /> {t('account.log.addEntry')}
          </Button>
        </EmptyState>
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
                    aria-label={t('account.log.removeEntryAria', { date: entry.date })}
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
  const { t } = useTranslation();
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
      setFeedback({ kind: 'ok', message: t('account.profile.updated') });
    } else {
      setFeedback({ kind: 'error', message: result.error ?? t('account.profile.updateFailed') });
    }
  };

  return (
    <form onSubmit={submit} className="card stack-md" style={{ padding: 'var(--sp-5)' }} noValidate>
      <div className="eyebrow">{t('account.profile.myInfo')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
        <div className="field">
          <label>{t('account.profile.firstName')}<span className="req">*</span></label>
          <input
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>{t('account.profile.lastName')}<span className="req">*</span></label>
          <input
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="field">
        <label>{t('account.profile.email')}</label>
        <input className="input mono" value={user.email} disabled />
        <div className="hint">{t('account.profile.emailHint')}</div>
      </div>
      <div className="field">
        <label>{t('account.profile.phone')}</label>
        <input
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('account.profile.phonePlaceholder')}
        />
      </div>
      <div className="eyebrow" style={{ marginTop: 'var(--sp-3)' }}>
        {t('account.profile.defaultAddress')}
      </div>
      <div className="field">
        <label>{t('account.profile.addressLine')}</label>
        <input
          className="input"
          value={addressLine}
          onChange={(e) => setAddressLine(e.target.value)}
          placeholder={t('account.profile.addressPlaceholder')}
        />
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 'var(--sp-3)' }}
      >
        <div className="field">
          <label>{t('account.profile.postalCode')}</label>
          <input
            className="input"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('account.profile.city')}</label>
          <input
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="field">
          <label>{t('account.profile.country')}</label>
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
          {saving ? t('account.profile.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

function SettingsTab({ user, onLogout, onSubmit }) {
  const { t } = useTranslation();
  return (
    <div className="stack-lg">
      <ProfileForm user={user} onSubmit={onSubmit} />
      <GdprPanel onLogout={onLogout} />
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          {t('account.session.title')}
        </div>
        <Button variant="ghost" onClick={onLogout}>
          {t('account.settings.logout')}
        </Button>
      </div>
    </div>
  );
}

function GdprPanel({ onLogout }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { push } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadGdprExport(token);
      push(t('account.gdpr.exportDone'));
    } catch (err) {
      push(err?.message ?? t('account.gdpr.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'SUPPRIMER') {
      push(t('account.gdpr.confirmHint'));
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(token);
      push(t('account.gdpr.deleteDone'));
      onLogout();
    } catch (err) {
      push(err?.message ?? t('account.gdpr.deleteFailed'));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--sp-5)' }}>
      <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
        {t('account.gdpr.sectionTitle')}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--sp-4)',
          paddingBottom: 'var(--sp-4)',
          borderBottom: '1px solid var(--hairline)',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div>
          <div style={{ fontWeight: 500, marginBottom: 'var(--sp-1)' }}>
            {t('account.gdpr.downloadTitle')}
          </div>
          <p className="soft" style={{ margin: 0, fontSize: 'var(--fs-13)' }}>
            {t('account.gdpr.downloadBody')}
          </p>
        </div>
        <Button variant="ghost" onClick={handleExport} disabled={exporting}>
          <Icon name="download" size={14} />
          {exporting ? t('account.gdpr.preparing') : t('account.gdpr.exportCta')}
        </Button>
      </div>

      <div>
        <div
          style={{
            fontWeight: 500,
            marginBottom: 'var(--sp-1)',
            color: 'var(--err)',
          }}
        >
          {t('account.gdpr.deleteTitle')}
        </div>
        <p className="soft" style={{ margin: '0 0 var(--sp-3)', fontSize: 'var(--fs-13)' }}>
          {t('account.gdpr.deleteBody')}{' '}
          <strong>{t('account.gdpr.irreversible')}</strong>
        </p>
        {!confirmOpen ? (
          <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
            {t('account.gdpr.deleteTitle')}
          </Button>
        ) : (
          <div
            className="stack-sm"
            style={{
              padding: 'var(--sp-4)',
              border: '1px solid var(--err)',
              borderRadius: 'var(--r-md)',
              background: 'color-mix(in oklch, var(--err) 6%, var(--bg-elev))',
            }}
          >
            <p style={{ margin: 0, fontSize: 'var(--fs-13)' }}>
              {t('account.gdpr.typeToConfirm')} <span className="mono">SUPPRIMER</span> {t('account.gdpr.toConfirm')}.
            </p>
            <input
              className="input mono"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              autoFocus
            />
            <div className="row">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText('');
                }}
                disabled={deleting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || confirmText !== 'SUPPRIMER'}
              >
                {deleting ? t('account.gdpr.deleting') : t('account.gdpr.deleteFinal')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FavorisTab({ onShop }) {
  const { t } = useTranslation();
  const { productIds, loading } = useWishlist();
  const { products } = useProducts();
  const favorites = products.filter((p) => productIds.has(p.id));

  if (loading) {
    return <p className="soft">{t('account.favorites.loading')}</p>;
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        illus="heart"
        title={t('account.favorites.emptyTitle')}
        description={t('account.favorites.emptyDescription')}
      >
        <Button variant="primary" onClick={onShop}>
          {t('placeholder.browseShop')}
        </Button>
      </EmptyState>
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
  const { t } = useTranslation();
  const hasAddress = user.addressLine && user.city;
  if (!hasAddress) {
    return (
      <EmptyState
        illus="box"
        title={t('account.addresses.emptyTitle')}
        description={t('account.addresses.emptyDescription')}
      >
        <Button variant="primary" onClick={onGoSettings}>
          {t('account.addresses.addCta')}
        </Button>
      </EmptyState>
    );
  }
  return (
    <div className="stack-md">
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>
              {t('account.addresses.shippingAddress')}
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
                {t('account.addresses.tel')} : {user.phone}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={onGoSettings}>
            {t('common.edit')}
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
  const { hash } = useLocation();

  // Initial tab depuis le hash (deep linking footer → /compte#carnet).
  // Si le hash n'est pas un tab valide, fallback sur "apercu".
  const hashTab = hash?.slice(1);
  const initialTab = TAB_DEFS.some((tb) => tb.id === hashTab) ? hashTab : 'apercu';
  const [tab, setTab] = useState(initialTab);

  // Quand l'utilisateur navigue avec le bouton retour/avant du navigateur,
  // le hash change mais on était déjà sur /compte → resynchronise.
  useEffect(() => {
    if (hashTab && TAB_DEFS.some((tb) => tb.id === hashTab) && hashTab !== tab) {
      setTab(hashTab);
    }
  }, [hashTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const inscribed = remoteContests.filter((c) => isRegistered(c.id));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = useTabs();
  const { t: tt } = useTranslation();

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
          {tt('account.greeting', { name: user.firstName })}
        </h1>

        <div className="account-layout">
          <nav className="account-nav" aria-label={tt('account.navAria')}>
            {tabs.map((tb) => (
              <button
                key={tb.id}
                type="button"
                className={tab === tb.id ? 'active' : ''}
                onClick={() => setTab(tb.id)}
              >
                {tb.icon && <SectionIcon name={tb.icon} />}
                {tb.label}
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
