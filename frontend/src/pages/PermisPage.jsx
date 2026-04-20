import { useState } from 'react';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import {
  DEPARTMENTS,
  PERMIT_TYPES,
  findPermitType,
  useSubmittedPermit,
} from '../lib/permitApplication.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../lib/toast.js';

const STEP_LABELS = ['Type', 'Identité', 'Pièces', 'Récap', 'Paiement'];

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const className = `step ${current === n ? 'current' : current > n ? 'done' : ''}`.trim();
        return (
          <div key={label} className={className}>
            <span className="pill">{current > n ? '✓' : n}</span>
            <span className="lbl">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function UploadZone({ uploaded, onUpload, onRemove, label, fileName, fileSize, initials }) {
  return (
    <div
      className={`upload-zone ${uploaded ? 'has-file' : ''}`}
      onClick={uploaded ? undefined : onUpload}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !uploaded) {
          e.preventDefault();
          onUpload();
        }
      }}
    >
      {uploaded ? (
        <>
          <div className="upload-preview">
            {initials[0]}
            <br />
            {initials[1]}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{fileName}</div>
            <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
              {fileSize} · uploadé
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            Remplacer
          </button>
        </>
      ) : (
        <div>
          <Icon name="upload" size={24} />
          <div style={{ marginTop: 'var(--sp-2)' }}>{label}</div>
          <div
            className="mono soft"
            style={{ fontSize: 'var(--fs-12)', marginTop: 4 }}
          >
            ou cliquez pour parcourir · JPG / PDF · max 8 Mo
          </div>
        </div>
      )}
    </div>
  );
}

function TrackingView({ permit, onBack }) {
  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 720 }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Suivi de votre demande
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--fs-44)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            margin: '0 0 var(--sp-3)',
          }}
        >
          Permis {permit.id}
        </h1>
        <div className="row" style={{ marginBottom: 'var(--sp-6)' }}>
          <Badge status="pending">{permit.statusLabel}</Badge>
          <span className="mono soft">
            {permit.typeTitle} · {permit.department} · {formatPrice(permit.amount)}
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--sp-6)' }}>
          <div className="timeline">
            {permit.history.map((entry, i) => {
              const className = `timeline-step ${entry.done ? 'done' : ''} ${
                entry.current ? 'current' : ''
              }`.trim();
              return (
                <div key={entry.label} className={className}>
                  <div className="timeline-dot">{entry.done ? '✓' : i + 1}</div>
                  <div className="timeline-body">
                    <div className="t">{entry.label}</div>
                    <div className="date">{entry.date || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-5)' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            Messagerie · Fédération des Pyrénées-Orientales
          </div>
          <p className="soft" style={{ fontSize: 'var(--fs-14)' }}>
            Bonjour. Votre dossier est en cours d'instruction. Délai moyen : 2 jours
            ouvrés. Aucune action requise de votre part pour l'instant.
          </p>
        </div>

        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="ghost" onClick={onBack}>
            ← Retour
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyView({ onSubmit, onBack }) {
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState('annuel');
  const [firstName, setFirstName] = useState('Claude');
  const [lastName, setLastName] = useState('Desprez');
  const [birthDate, setBirthDate] = useState('1992-06-14');
  const [department, setDepartment] = useState(DEPARTMENTS[0].name);
  const [idDoc, setIdDoc] = useState(false);
  const [photoDoc, setPhotoDoc] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');

  const type = findPermitType(typeId);

  const pay = () => {
    onSubmit({ typeId, firstName, lastName, birthDate, department });
  };

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 760 }}>
        <Stepper current={step} />

        {step === 1 && (
          <div className="stack-md">
            <h2
              className="disp"
              style={{
                fontSize: 'var(--fs-32)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Quel type de permis ?
            </h2>
            <div className="permis-types">
              {PERMIT_TYPES.map((t) => (
                <div
                  key={t.id}
                  className={`permis-type-card ${typeId === t.id ? 'selected' : ''}`}
                  onClick={() => setTypeId(t.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTypeId(t.id);
                    }
                  }}
                >
                  <div className="lbl">{t.label}</div>
                  <div className="t">{t.title}</div>
                  <ul>
                    {t.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="pp">
                    {formatPrice(t.price)} <small>TTC</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="row">
              <Button variant="ghost" onClick={onBack}>
                ← Annuler
              </Button>
              <Button variant="primary" size="lg" onClick={() => setStep(2)}>
                Continuer →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="stack-md">
            <h2
              className="disp"
              style={{
                fontSize: 'var(--fs-32)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Votre identité
            </h2>
            <div
              className="card"
              style={{
                padding: 'var(--sp-4)',
                background: 'color-mix(in oklch, var(--info) 6%, var(--bg-elev))',
                borderLeftWidth: 3,
                borderLeftStyle: 'solid',
                borderLeftColor: 'var(--info)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 'var(--fs-12)',
                  color: 'var(--info)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 4,
                }}
              >
                RGPD
              </div>
              <div className="soft" style={{ fontSize: 'var(--fs-13)' }}>
                Les données saisies sont transmises à votre fédération départementale.
                Elles ne sont jamais revendues.
              </div>
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label>
                  Prénom<span className="req">*</span>
                </label>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Nom<span className="req">*</span>
                </label>
                <input
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label>
                  Date de naissance<span className="req">*</span>
                </label>
                <input
                  className="input"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label>
                  Département<span className="req">*</span>
                </label>
                <select
                  className="select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Retour
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                disabled={!firstName || !lastName || !birthDate}
              >
                Continuer →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack-md">
            <h2
              className="disp"
              style={{
                fontSize: 'var(--fs-32)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Pièces justificatives
            </h2>
            <p className="soft">JPG ou PDF · max 8 Mo par fichier.</p>

            <div className="field">
              <label>
                Pièce d'identité<span className="req">*</span>
              </label>
              <UploadZone
                uploaded={idDoc}
                onUpload={() => setIdDoc(true)}
                onRemove={() => setIdDoc(false)}
                label="Déposez votre pièce d'identité ici"
                fileName="carte-identite-recto.jpg"
                fileSize="2.4 Mo"
                initials={['ID', 'RECTO']}
              />
            </div>

            <div className="field">
              <label>
                Photo d'identité<span className="req">*</span>
              </label>
              <UploadZone
                uploaded={photoDoc}
                onUpload={() => setPhotoDoc(true)}
                onRemove={() => setPhotoDoc(false)}
                label="Déposez une photo d'identité"
                fileName="photo-identite.jpg"
                fileSize="1.1 Mo"
                initials={['PH', 'OTO']}
              />
            </div>

            <div className="row">
              <Button variant="ghost" onClick={() => setStep(2)}>
                ← Retour
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(4)}
                disabled={!idDoc || !photoDoc}
              >
                Continuer →
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="stack-md">
            <h2
              className="disp"
              style={{
                fontSize: 'var(--fs-32)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Récapitulatif
            </h2>
            <div className="card" style={{ padding: 'var(--sp-5)' }}>
              <div className="summary-row">
                <span>Type</span>
                <span className="val">{type.title}</span>
              </div>
              <div className="summary-row">
                <span>Département</span>
                <span className="val">{department}</span>
              </div>
              <div className="summary-row">
                <span>Pièces</span>
                <span className="val">2 fichiers</span>
              </div>
              <div className="summary-row total">
                <span>Total TTC</span>
                <span className="val">{formatPrice(type.price)}</span>
              </div>
            </div>
            <label
              className="row"
              style={{ gap: 'var(--sp-2)', alignItems: 'flex-start', fontSize: 'var(--fs-14)' }}
            >
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span>
                Je certifie l'exactitude des informations et accepte les conditions générales
                de la fédération.
              </span>
            </label>
            <div className="row">
              <Button variant="ghost" onClick={() => setStep(3)}>
                ← Retour
              </Button>
              <Button
                variant="accent"
                size="lg"
                disabled={!accepted}
                onClick={() => setStep(5)}
              >
                Procéder au paiement →
              </Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="stack-md">
            <h2
              className="disp"
              style={{
                fontSize: 'var(--fs-32)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              Paiement
            </h2>
            <p className="soft">
              Le montant inclut la Cotisation Pêche Milieux Aquatiques (CPMA).
            </p>
            <div className="card" style={{ padding: 'var(--sp-5)' }}>
              <div className="field">
                <label>Numéro de carte</label>
                <input
                  className="input mono"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>
            </div>
            <Button variant="accent" size="lg" full onClick={pay}>
              Payer {formatPrice(type.price)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingView({ onApply, onTrack, hasPermit }) {
  return (
    <div className="page" style={{ padding: 0 }}>
      <section className="permis-hero">
        <div className="page-container">
          <div
            className="eyebrow"
            style={{
              color: 'color-mix(in oklch, var(--bg) 60%, var(--ink))',
              marginBottom: 'var(--sp-4)',
            }}
          >
            Saison 2026
          </div>
          <h1>
            Votre permis
            <br />
            en 4 gestes.
          </h1>
          <p style={{ fontSize: 'var(--fs-18)', maxWidth: '50ch', margin: 'var(--sp-5) 0' }}>
            Demande en ligne, pièces justificatives uploadées, instruction sous 2 jours
            ouvrés, PDF téléchargeable dès l'approbation.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <Button variant="accent" size="lg" onClick={onApply}>
              Commencer ma demande →
            </Button>
            {hasPermit && (
              <Button
                variant="ghost"
                size="lg"
                onClick={onTrack}
                style={{
                  color: 'var(--bg)',
                  borderColor: 'color-mix(in oklch, var(--bg) 40%, transparent)',
                }}
              >
                Suivre ma demande
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Tarifs 2026</div>
              <h2>Choisir son permis</h2>
            </div>
          </div>
          <div className="permis-types">
            {PERMIT_TYPES.map((t) => (
              <div key={t.id} className="permis-type-card">
                <div className="lbl">{t.label}</div>
                <div className="t">{t.title}</div>
                <ul>
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="pp">
                  {formatPrice(t.price)} <small>TTC</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PermisPage() {
  const { permit, submit } = useSubmittedPermit();
  const [view, setView] = useState('landing');
  const { push } = useToast();

  const handleSubmit = async (input) => {
    try {
      await submit(input);
      push('Demande envoyée — en instruction');
      setView('track');
    } catch (err) {
      push(err?.message ?? 'Impossible de soumettre la demande.');
    }
  };

  if (view === 'track' && permit) {
    return <TrackingView permit={permit} onBack={() => setView('landing')} />;
  }

  if (view === 'apply') {
    return <ApplyView onSubmit={handleSubmit} onBack={() => setView('landing')} />;
  }

  return (
    <LandingView
      onApply={() => setView('apply')}
      onTrack={() => setView('track')}
      hasPermit={Boolean(permit)}
    />
  );
}
