import { useRef, useState } from 'react';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { useAuth } from '../lib/auth.js';
import {
  useDepartments,
  usePermitTypes,
  useSubmittedPermit,
} from '../lib/permitApplication.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../lib/toast.js';
import {
  firstError,
  validateBirthDate,
  validateCardNumber,
  validateName,
} from '../lib/validation.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

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

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  const mo = bytes / (1024 * 1024);
  if (mo >= 1) return `${mo.toFixed(1)} Mo`;
  const ko = bytes / 1024;
  return `${Math.round(ko)} Ko`;
}

function UploadZone({ file, onUpload, onRemove, label, initials, uploading, error }) {
  const inputRef = useRef(null);
  const openPicker = () => inputRef.current?.click();
  const handleChange = (event) => {
    const f = event.target.files?.[0];
    if (f) onUpload(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <div
        className={`upload-zone ${file ? 'has-file' : ''}`}
        onClick={file || uploading ? undefined : openPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !file && !uploading) {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        {file ? (
          <>
            <div className="upload-preview">
              {initials[0]}
              <br />
              {initials[1]}
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>{file.name}</div>
              <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                {formatSize(file.size)} · uploadé
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
            <div style={{ marginTop: 'var(--sp-2)' }}>
              {uploading ? 'Envoi en cours…' : label}
            </div>
            <div
              className="mono soft"
              style={{ fontSize: 'var(--fs-12)', marginTop: 4 }}
            >
              ou cliquez pour parcourir · JPG / PNG / WebP · max 8 Mo
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </div>
      {error && (
        <div className="error" style={{ marginTop: 'var(--sp-2)' }}>
          {error}
        </div>
      )}
    </>
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
          <Badge status={permit.status}>{permit.statusLabel}</Badge>
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

        {(permit.idDocUrl || permit.photoDocUrl) && (
          <div className="card" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-5)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
              Pièces déposées
            </div>
            <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              {permit.idDocUrl && (
                <a
                  href={permit.idDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Pièce d'identité ↗
                </a>
              )}
              {permit.photoDocUrl && (
                <a
                  href={permit.photoDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Photo d'identité ↗
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="ghost" onClick={onBack}>
            ← Retour
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyView({ onSubmit, onBack, types, departments }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [typeId, setTypeId] = useState(types[0]?.id ?? '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name ?? '');
  const [idDocFile, setIdDocFile] = useState(null);
  const [idDocUrl, setIdDocUrl] = useState('');
  const [idDocError, setIdDocError] = useState('');
  const [idDocUploading, setIdDocUploading] = useState(false);
  const [photoDocFile, setPhotoDocFile] = useState(null);
  const [photoDocUrl, setPhotoDocUrl] = useState('');
  const [photoDocError, setPhotoDocError] = useState('');
  const [photoDocUploading, setPhotoDocUploading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [stepError, setStepError] = useState('');

  const type = types.find((t) => t.id === typeId) ?? types[0];

  const validateIdentityStep = () =>
    firstError(
      validateName(firstName, { field: 'Le prénom' }),
      validateName(lastName, { field: 'Le nom' }),
      validateBirthDate(birthDate),
    );

  const goToStep = (n) => {
    if (n === 3) {
      const err = validateIdentityStep();
      if (err) {
        setStepError(err);
        return;
      }
    }
    setStepError('');
    setStep(n);
  };

  const uploadDoc = async (file, slot) => {
    const setFile = slot === 'id' ? setIdDocFile : setPhotoDocFile;
    const setUrl = slot === 'id' ? setIdDocUrl : setPhotoDocUrl;
    const setError = slot === 'id' ? setIdDocError : setPhotoDocError;
    const setUploading = slot === 'id' ? setIdDocUploading : setPhotoDocUploading;

    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${BASE_URL}/api/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Erreur ${response.status}`);
      }
      const data = await response.json();
      setFile(file);
      setUrl(data.url);
    } catch (err) {
      setError(err.message ?? 'Upload impossible.');
      setFile(null);
      setUrl('');
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (slot) => {
    if (slot === 'id') {
      setIdDocFile(null);
      setIdDocUrl('');
      setIdDocError('');
    } else {
      setPhotoDocFile(null);
      setPhotoDocUrl('');
      setPhotoDocError('');
    }
  };

  const uploadedCount = [idDocUrl, photoDocUrl].filter(Boolean).length;

  const pay = () => {
    const err = firstError(validateIdentityStep(), validateCardNumber(cardNumber));
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    onSubmit({
      typeId,
      firstName,
      lastName,
      birthDate,
      department,
      idDocUrl,
      photoDocUrl,
    });
  };

  if (!type) {
    return (
      <div className="page">
        <div className="page-container">
          <p>Chargement des tarifs…</p>
        </div>
      </div>
    );
  }

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
              {types.map((t) => (
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
                  {t.label && <div className="lbl">{t.label}</div>}
                  <div className="t">{t.title}</div>
                  <ul>
                    {(t.items ?? []).map((item) => (
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
                  placeholder="Prénom"
                  autoComplete="given-name"
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
                  placeholder="Nom"
                  autoComplete="family-name"
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
                  autoComplete="bday"
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
                  {departments.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {stepError && <div className="error">{stepError}</div>}
            <div className="row">
              <Button variant="ghost" onClick={() => setStep(1)}>
                ← Retour
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => goToStep(3)}
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
            <p className="soft">JPG, PNG ou WebP · max 8 Mo par fichier.</p>

            <div className="field">
              <label>
                Pièce d'identité<span className="req">*</span>
              </label>
              <UploadZone
                file={idDocFile}
                onUpload={(f) => uploadDoc(f, 'id')}
                onRemove={() => removeDoc('id')}
                label="Déposez votre pièce d'identité ici"
                initials={['ID', 'RECTO']}
                uploading={idDocUploading}
                error={idDocError}
              />
            </div>

            <div className="field">
              <label>
                Photo d'identité<span className="req">*</span>
              </label>
              <UploadZone
                file={photoDocFile}
                onUpload={(f) => uploadDoc(f, 'photo')}
                onRemove={() => removeDoc('photo')}
                label="Déposez une photo d'identité"
                initials={['PH', 'OTO']}
                uploading={photoDocUploading}
                error={photoDocError}
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
                disabled={!idDocUrl || !photoDocUrl}
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
                <span className="val">
                  {uploadedCount} fichier{uploadedCount > 1 ? 's' : ''}
                </span>
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
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  inputMode="numeric"
                />
              </div>
            </div>
            {stepError && <div className="error">{stepError}</div>}
            <Button variant="accent" size="lg" full onClick={pay}>
              Payer {formatPrice(type.price)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingView({ onApply, onTrack, hasPermit, types }) {
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
            {types.map((t) => (
              <div key={t.id} className="permis-type-card">
                {t.label && <div className="lbl">{t.label}</div>}
                <div className="t">{t.title}</div>
                <ul>
                  {(t.items ?? []).map((item) => (
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
  const { types, loading: typesLoading } = usePermitTypes();
  const { departments, loading: depLoading } = useDepartments();
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

  if (typesLoading || depLoading) {
    return (
      <div className="page">
        <div className="page-container">
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (view === 'track' && permit) {
    return <TrackingView permit={permit} onBack={() => setView('landing')} />;
  }

  if (view === 'apply') {
    return (
      <ApplyView
        onSubmit={handleSubmit}
        onBack={() => setView('landing')}
        types={types}
        departments={departments}
      />
    );
  }

  return (
    <LandingView
      onApply={() => setView('apply')}
      onTrack={() => setView('track')}
      hasPermit={Boolean(permit)}
      types={types}
    />
  );
}
