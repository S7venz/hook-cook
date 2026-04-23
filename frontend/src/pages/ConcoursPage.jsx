import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';
import { ContestsMap } from '../components/ui/ContestsMap.jsx';
import { FishRain } from '../components/decor/FishRain.jsx';
import { StripePaymentBlock } from '../components/StripePaymentBlock.jsx';
import { useContestRegistrations } from '../lib/contestRegistrations.js';
import { useReferenceData } from '../lib/referenceData.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../lib/toast.js';

const CATEGORIES = [
  { id: 'hommes-exp', label: 'Hommes — Expérimenté' },
  { id: 'hommes-am', label: 'Hommes — Amateur' },
  { id: 'femmes', label: 'Femmes' },
  { id: 'jeunes', label: 'Jeunes (-18)' },
];

const FILTERS = [
  { id: 'all', label: 'Tous', match: () => true },
  { id: 'truite', label: 'Truite', match: (c) => c.species.includes('truite') },
  {
    id: 'carnassiers',
    label: 'Carnassiers',
    match: (c) =>
      c.species.some((s) => ['brochet', 'sandre', 'silure', 'perche'].includes(s)),
  },
  { id: 'carpe', label: 'Carpe', match: (c) => c.species.includes('carpe') },
];

function ContestStatusBadge({ contest }) {
  if (contest.inscrits >= contest.max) return <Badge status="rejected">Complet</Badge>;
  if (contest.inscrits / contest.max > 0.85)
    return <Badge status="pending">Bientôt complet</Badge>;
  return <Badge status="approved">Places disponibles</Badge>;
}

function ContestCountBadge({ contest }) {
  const status =
    contest.inscrits >= contest.max
      ? 'rejected'
      : contest.inscrits / contest.max > 0.85
        ? 'pending'
        : 'approved';
  return (
    <Badge status={status}>
      {contest.inscrits}/{contest.max}
    </Badge>
  );
}

function RegistrationModal({ contest, onClose, onConfirm }) {
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [permit, setPermit] = useState('FR-2026-48291');
  const [touched, setTouched] = useState(false);
  const permitValid = /^[A-Z]{2}-\d{4}-\d{5}$/.test(permit.trim());

  const submit = () => {
    setTouched(true);
    if (!permitValid) return;
    onConfirm({ contestId: contest.id, category, permit: permit.trim() });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contest-modal-title"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 480,
          maxWidth: '95vw',
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
          <h3
            id="contest-modal-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-24)',
              fontWeight: 500,
            }}
          >
            Inscription au concours
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="stack-md">
          <div className="field">
            <label htmlFor="contest-category">Catégorie</label>
            <select
              id="contest-category"
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="contest-permit">Numéro de permis</label>
            <input
              id="contest-permit"
              className="input mono"
              value={permit}
              onChange={(e) => setPermit(e.target.value.toUpperCase())}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !permitValid ? 'true' : undefined}
              aria-describedby="permit-hint"
            />
            {touched && !permitValid ? (
              <div className="error">Format attendu : FR-AAAA-NNNNN</div>
            ) : (
              <div id="permit-hint" className="hint">
                Un permis en cours de validité est requis.
              </div>
            )}
          </div>
          <div className="soft" style={{ fontSize: 'var(--fs-13)' }}>
            Montant :{' '}
            <span className="mono">
              {contest.prix === 0 ? 'Gratuit' : formatPrice(contest.prix)}
            </span>
          </div>
          <Button variant="accent" size="lg" full onClick={submit}>
            Confirmer mon inscription
          </Button>
        </div>
      </div>
    </>
  );
}

export function ConcoursPage() {
  const { contests, loading } = useReferenceData();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const { push } = useToast();
  const { register, isRegistered } = useContestRegistrations();

  const activeFilter = FILTERS.find((f) => f.id === filter);
  const visibleContests = useMemo(
    () => contests.filter((c) => (activeFilter ? activeFilter.match(c) : true)),
    [activeFilter, contests],
  );
  const selected =
    visibleContests.find((c) => c.id === selectedId) ?? visibleContests[0] ?? null;

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Setup Stripe créé après "Confirmer mon inscription" si le concours est payant.
  // Tant qu'il n'est pas null, le modal affiche le PaymentElement au lieu du form.
  const [paymentSetup, setPaymentSetup] = useState(null);

  const handleConfirm = async ({ contestId, category, permit }) => {
    const label = CATEGORIES.find((c) => c.id === category)?.label ?? '';
    try {
      const result = await register(contestId, { category, permitNumber: permit });
      if (result.clientSecret) {
        // Concours payant + Stripe configuré : on bascule le modal en paiement
        setPaymentSetup({
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY,
          regId: result.registration.id,
          amount: selected.prix,
          contestTitle: selected.title,
          categoryLabel: label,
        });
        return;
      }
      // Concours gratuit : déjà validé côté backend
      push(`Inscrit à ${selected.title} · ${label}`);
      setShowModal(false);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4500);
    } catch (err) {
      push(err?.message ?? 'Inscription impossible.');
    }
  };

  const handlePaymentSuccess = () => {
    push(`Inscrit à ${paymentSetup.contestTitle} · ${paymentSetup.categoryLabel}`);
    setShowModal(false);
    setPaymentSetup(null);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 4500);
  };

  if (loading) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ padding: 'var(--sp-16) 0', textAlign: 'center' }}
        >
          <p className="soft">Chargement des concours…</p>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ padding: 'var(--sp-16) 0', textAlign: 'center' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-44)',
              fontWeight: 400,
              margin: '0 0 var(--sp-4)',
            }}
          >
            Aucun concours pour l'instant.
          </h1>
          <p className="soft">Les prochains concours seront annoncés ici.</p>
        </div>
      </div>
    );
  }

  const [day, month] = selected.dateDisplay.split(' ');
  const alreadyIn = isRegistered(selected.id);
  const full = selected.inscrits >= selected.max;

  return (
    <div className="page">
      <div className="page-container">
        <div className="section-header" style={{ marginBottom: 'var(--sp-6)' }}>
          <div>
            <div className="eyebrow">
              <SectionIcon name="trophy" />
              Calendrier local · {contests.length} concours ouverts
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-44)',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                margin: 'var(--sp-2) 0 0',
              }}
            >
              Concours à venir
            </h1>
          </div>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="chip"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="concours-layout">
          <div className="concours-list">
            {visibleContests.map((contest) => {
              const [d, m] = contest.dateDisplay.split(' ');
              return (
                <div
                  key={contest.id}
                  className={`concours-list-item ${contest.id === selectedId ? 'selected' : ''}`}
                  onClick={() => setSelectedId(contest.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(contest.id);
                    }
                  }}
                >
                  <div className="date-box">
                    <div className="d">{d}</div>
                    <div className="m">{m}</div>
                  </div>
                  <div>
                    <div className="title">{contest.title}</div>
                    <div className="loc">
                      {contest.lieu} · {contest.distance} · {contest.format}
                    </div>
                  </div>
                  <ContestCountBadge contest={contest} />
                </div>
              );
            })}
            {visibleContests.length === 0 && (
              <div
                style={{
                  padding: 'var(--sp-8) var(--sp-4)',
                  textAlign: 'center',
                  color: 'var(--ink-soft)',
                }}
              >
                Aucun concours ne correspond à ce filtre.
              </div>
            )}
          </div>

          <aside className="map-placeholder">
            <ContestsMap contests={visibleContests} />
          </aside>
        </div>

        <section
          style={{
            marginTop: 'var(--sp-12)',
            paddingTop: 'var(--sp-8)',
            borderTop: '1px solid var(--rule)',
          }}
        >
          <div
            className="concours-detail"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 1fr',
              gap: 'var(--sp-8)',
            }}
          >
            <div>
              <div className="eyebrow">
                <SectionIcon name="fish" />{selected.format}
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-44)',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  margin: 'var(--sp-2) 0 var(--sp-4)',
                  lineHeight: 1.05,
                }}
              >
                {selected.title}
              </h2>
              <div
                className="row mono soft"
                style={{ fontSize: 'var(--fs-13)', marginBottom: 'var(--sp-6)' }}
              >
                <span>
                  {selected.dateDisplay} 2026
                </span>
                <span>·</span>
                <span>{selected.lieu}</span>
                <span>·</span>
                <span>
                  {selected.prix === 0 ? 'Gratuit' : formatPrice(selected.prix)}
                </span>
              </div>
              <div className="card" style={{ padding: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
                <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
                  <SectionIcon name="permit" />Règlement
                </div>
                <p className="soft" style={{ fontSize: 'var(--fs-14)' }}>
                  {selected.reglement}
                </p>
              </div>
              <div className="card" style={{ padding: 'var(--sp-5)' }}>
                <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
                  <SectionIcon name="trophy" />Inscrits
                </div>
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--fs-32)',
                    }}
                  >
                    {selected.inscrits} / {selected.max}
                  </span>
                  <ContestStatusBadge contest={selected} />
                </div>
                <div className="progress-bar" style={{ height: 6 }}>
                  <div
                    className="fill"
                    style={{ width: `${(selected.inscrits / selected.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <aside style={{ position: 'sticky', top: 88, alignSelf: 'start' }}>
              <div
                className="card"
                style={{ padding: 'var(--sp-6)', textAlign: 'center' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-64)',
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    lineHeight: 0.9,
                    margin: '0 0 var(--sp-2)',
                  }}
                >
                  {day}
                </div>
                <div
                  className="mono"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'var(--ink-soft)',
                    marginBottom: 'var(--sp-5)',
                  }}
                >
                  {month} 2026
                </div>
                <div className="rule-double" aria-hidden="true" />
                <div className="stack-sm" style={{ textAlign: 'left', fontSize: 'var(--fs-14)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="soft">Lieu</span>
                    <span>{selected.lieu.split('(')[0].trim()}</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="soft">Format</span>
                    <span>{selected.format}</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="soft">Inscription</span>
                    <span className="mono">
                      {selected.prix === 0 ? 'Gratuit' : formatPrice(selected.prix)}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 'var(--sp-5)' }}>
                  <Button
                    variant={alreadyIn ? 'ghost' : 'accent'}
                    size="lg"
                    full
                    disabled={alreadyIn || full}
                    onClick={() => setShowModal(true)}
                  >
                    {alreadyIn
                      ? '✓ Déjà inscrit'
                      : full
                        ? 'Concours complet'
                        : "S'inscrire"}
                  </Button>
                </div>
                <div
                  className="mono soft"
                  style={{ fontSize: 'var(--fs-12)', marginTop: 'var(--sp-2)' }}
                >
                  Permis en cours de validité requis
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {showModal && !paymentSetup && (
        <RegistrationModal
          contest={selected}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}

      {showModal && paymentSetup && (
        <ContestPaymentModal
          setup={paymentSetup}
          onClose={() => {
            setShowModal(false);
            setPaymentSetup(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <FishRain count={26} duration={3500} active={celebrate} />
    </div>
  );
}

function ContestPaymentModal({ setup, onClose, onSuccess }) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contest-payment-title"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          width: 520,
          maxWidth: '95vw',
          maxHeight: '92vh',
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
          <h3
            id="contest-payment-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-24)',
              fontWeight: 500,
            }}
          >
            Paiement de l'inscription
          </h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="soft" style={{ marginTop: 0, marginBottom: 'var(--sp-3)' }}>
          {setup.contestTitle} · {setup.categoryLabel}
        </p>
        <StripePaymentBlock
          clientSecret={setup.clientSecret}
          publishableKey={setup.publishableKey}
          amount={setup.amount}
          returnUrl={`${window.location.origin}/concours`}
          onSuccess={onSuccess}
          label="Confirmer et payer"
        />
      </div>
    </>
  );
}
