import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';
import { StripePaymentBlock } from '../components/StripePaymentBlock.jsx';
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
  validateName,
} from '../lib/validation.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function Stepper({ current }) {
  const { t } = useTranslation();
  const stepLabels = [
    t('permis.wizard.stepType'),
    t('permis.wizard.stepIdentity'),
    t('permis.wizard.stepDocs'),
    t('permis.wizard.stepSummary'),
    t('permis.wizard.stepPayment'),
  ];
  return (
    <div className="stepper">
      {stepLabels.map((label, i) => {
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
  const { t } = useTranslation();
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
              {t('permis.upload.replace')}
            </button>
          </>
        ) : (
          <div>
            <Icon name="upload" size={24} />
            <div style={{ marginTop: 'var(--sp-2)' }}>
              {uploading ? t('permis.upload.uploading') : label}
            </div>
            <div
              className="mono soft"
              style={{ fontSize: 'var(--fs-12)', marginTop: 4 }}
            >
              {t('permis.upload.hint')}
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
  const { t } = useTranslation();
  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 720 }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          <SectionIcon name="permit" />{t('permis.tracking.eyebrow')}
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
          {t('permis.tracking.permitNumber', { id: permit.id })}
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
              <SectionIcon name="carnet" />{t('permis.tracking.documents')}
            </div>
            <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              {permit.idDocUrl && (
                <a
                  href={permit.idDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  {t('permis.wizard.idDocLabel')} ↗
                </a>
              )}
              {permit.photoDocUrl && (
                <a
                  href={permit.photoDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  {t('permis.wizard.photoDocLabel')} ↗
                </a>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Button variant="ghost" onClick={onBack}>
            ← {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ApplyView({ onSubmit, onBack, types, departments }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const { push } = useToast();
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
  const [stepError, setStepError] = useState('');
  // Stripe : créé à la transition step 4 → 5 quand l'user clique "Procéder au paiement"
  const [paymentSetup, setPaymentSetup] = useState(null);
  const [preparingPayment, setPreparingPayment] = useState(false);

  const type = types.find((pt) => pt.id === typeId) ?? types[0];

  const validateIdentityStep = () =>
    firstError(
      validateName(firstName, { field: 'Le prénom' }),
      validateName(lastName, { field: 'Le nom' }),
      validateBirthDate(birthDate),
    );

  // Transition Type → Identité : on exige que le user soit connecté
  // avant de saisir la moindre donnée personnelle. On le redirige vers
  // /connexion avec next=/permis, il revient ici après login.
  const goToIdentityStep = () => {
    if (!user) {
      push(t('permis.wizard.needSignIn'));
      navigate('/connexion', { state: { from: '/permis' } });
      return;
    }
    setStepError('');
    setStep(2);
  };

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

  // Crée le permit côté backend (status pending_payment) et récupère
  // le clientSecret Stripe pour monter le PaymentElement à l'étape 5.
  const startPayment = async () => {
    const err = validateIdentityStep();
    if (err) {
      setStepError(err);
      return;
    }
    setStepError('');
    setPreparingPayment(true);
    try {
      const result = await onSubmit({
        typeId,
        firstName,
        lastName,
        birthDate,
        department,
        idDocUrl,
        photoDocUrl,
      });
      // Si le backend renvoie clientSecret on monte Stripe ; sinon le permis
      // est déjà validé (mode mock / type gratuit) → on passe directement au tracking.
      if (result?.clientSecret) {
        setPaymentSetup({
          clientSecret: result.clientSecret,
          publishableKey: result.publishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY,
          permitRef: result.permit.id,
        });
        setStep(5);
      }
      // Sinon onSubmit a déjà déclenché le passage en track view côté parent.
    } catch (e) {
      setStepError(e?.message ?? 'Impossible de soumettre la demande.');
    } finally {
      setPreparingPayment(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Le webhook Stripe va passer le permit en "pending" (En instruction) côté
    // serveur. On notifie le parent pour qu'il bascule en TrackingView.
    onSubmit({ __paymentDone: true, permitRef: paymentSetup?.permitRef });
  };

  if (!type) {
    return (
      <div className="page">
        <div className="page-container">
          <p>{t('permis.loadingPrices')}</p>
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
              {t('permis.wizard.selectType')}
            </h2>
            <div className="permis-types">
              {types.map((pt) => (
                <div
                  key={pt.id}
                  className={`permis-type-card ${typeId === pt.id ? 'selected' : ''}`}
                  onClick={() => setTypeId(pt.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTypeId(pt.id);
                    }
                  }}
                >
                  {pt.label && <div className="lbl">{pt.label}</div>}
                  <div className="t">{pt.title}</div>
                  <ul>
                    {(pt.items ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div className="pp">
                    {formatPrice(pt.price)} <small>{t('permis.taxIncl')}</small>
                  </div>
                </div>
              ))}
            </div>
            {!user && (
              <div
                className="card"
                style={{
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: 'color-mix(in oklch, var(--info) 6%, var(--bg-elev))',
                  borderLeftWidth: 3,
                  borderLeftStyle: 'solid',
                  borderLeftColor: 'var(--info)',
                  fontSize: 'var(--fs-13)',
                  color: 'var(--ink-soft)',
                }}
              >
                {t('permis.wizard.signInNotice')}
              </div>
            )}
            <div className="row">
              <Button variant="ghost" onClick={onBack}>
                ← {t('common.cancel')}
              </Button>
              <Button variant="primary" size="lg" onClick={goToIdentityStep}>
                {t('common.next')} →
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
              {t('permis.wizard.identityTitle')}
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
                {t('permis.wizard.rgpdNotice')}
              </div>
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label>
                  {t('permis.wizard.firstNameLabel')}<span className="req">*</span>
                </label>
                <input
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('permis.wizard.firstNameLabel')}
                  autoComplete="given-name"
                />
              </div>
              <div className="field">
                <label>
                  {t('permis.wizard.lastNameLabel')}<span className="req">*</span>
                </label>
                <input
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('permis.wizard.lastNameLabel')}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label>
                  {t('permis.wizard.birthDateLabel')}<span className="req">*</span>
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
                  {t('permis.wizard.departmentLabel')}<span className="req">*</span>
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
                ← {t('common.back')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => goToStep(3)}
                disabled={!firstName || !lastName || !birthDate}
              >
                {t('common.next')} →
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
              {t('permis.wizard.docsTitle')}
            </h2>
            <p className="soft">{t('permis.wizard.uploadHint')}</p>

            <div className="field">
              <label>
                {t('permis.wizard.idDocLabel')}<span className="req">*</span>
              </label>
              <UploadZone
                file={idDocFile}
                onUpload={(f) => uploadDoc(f, 'id')}
                onRemove={() => removeDoc('id')}
                label={t('permis.wizard.idDocDropHint')}
                initials={['ID', 'RECTO']}
                uploading={idDocUploading}
                error={idDocError}
              />
            </div>

            <div className="field">
              <label>
                {t('permis.wizard.photoDocLabel')}<span className="req">*</span>
              </label>
              <UploadZone
                file={photoDocFile}
                onUpload={(f) => uploadDoc(f, 'photo')}
                onRemove={() => removeDoc('photo')}
                label={t('permis.wizard.photoDocDropHint')}
                initials={['PH', 'OTO']}
                uploading={photoDocUploading}
                error={photoDocError}
              />
            </div>

            <div className="row">
              <Button variant="ghost" onClick={() => setStep(2)}>
                ← {t('common.back')}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(4)}
                disabled={!idDocUrl || !photoDocUrl}
              >
                {t('common.next')} →
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
              {t('permis.wizard.summaryTitle')}
            </h2>
            <div className="card" style={{ padding: 'var(--sp-5)' }}>
              <div className="summary-row">
                <span>{t('permis.wizard.typeLabel')}</span>
                <span className="val">{type.title}</span>
              </div>
              <div className="summary-row">
                <span>{t('permis.wizard.departmentLabel')}</span>
                <span className="val">{department}</span>
              </div>
              <div className="summary-row">
                <span>{t('permis.wizard.docsLabel')}</span>
                <span className="val">
                  {t('permis.wizard.fileCount', { count: uploadedCount })}
                </span>
              </div>
              <div className="summary-row total">
                <span>{t('permis.wizard.totalIncl')}</span>
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
              <span>{t('permis.wizard.termsAccept')}</span>
            </label>
            <div className="row">
              <Button variant="ghost" onClick={() => setStep(3)}>
                ← {t('common.back')}
              </Button>
              <Button
                variant="accent"
                size="lg"
                disabled={!accepted || preparingPayment}
                onClick={startPayment}
              >
                {preparingPayment ? t('permis.wizard.preparing') : `${t('permis.wizard.proceedToPayment')} →`}
              </Button>
            </div>
          </div>
        )}

        {step === 5 && paymentSetup && (
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
              {t('permis.wizard.paymentTitle')}
            </h2>
            <p className="soft">{t('permis.wizard.paymentNotice')}</p>
            <StripePaymentBlock
              clientSecret={paymentSetup.clientSecret}
              publishableKey={paymentSetup.publishableKey}
              amount={type.price}
              returnUrl={`${window.location.origin}/permis`}
              onSuccess={handlePaymentSuccess}
              label={t('permis.wizard.payCta')}
            />
            {stepError && <div className="error">{stepError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function LandingView({ onApply, onTrack, hasPermit, types }) {
  const { t } = useTranslation();
  return (
    <div className="page" style={{ padding: 0 }}>
      <section className="permis-hero">
        <div className="page-container">
          <div
            className="eyebrow"
            style={{ marginBottom: 'var(--sp-4)' }}
          >
            <SectionIcon name="calendar" />{t('permis.landing.eyebrow')}
          </div>
          <h1>
            <Trans i18nKey="permis.landing.title" components={{ br: <br /> }} />
          </h1>
          <p style={{ fontSize: 'var(--fs-18)', maxWidth: '50ch', margin: 'var(--sp-5) 0' }}>
            {t('permis.landing.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <Button variant="accent" size="lg" onClick={onApply}>
              {t('permis.startApplication')} →
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
                {t('permis.trackApplication')}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">
                <SectionIcon name="permit" />{t('permis.landing.pricingEyebrow')}
              </div>
              <h2>{t('permis.landing.pricingTitle')}</h2>
            </div>
          </div>
          <div className="permis-types">
            {types.map((pt) => (
              <div key={pt.id} className="permis-type-card">
                {pt.label && <div className="lbl">{pt.label}</div>}
                <div className="t">{pt.title}</div>
                <ul>
                  {(pt.items ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="pp">
                  {formatPrice(pt.price)} <small>{t('permis.taxIncl')}</small>
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
  const { t } = useTranslation();
  const { permit, submit } = useSubmittedPermit();
  const { types, loading: typesLoading } = usePermitTypes();
  const { departments, loading: depLoading } = useDepartments();
  const [view, setView] = useState('landing');
  const { push } = useToast();

  // Deux phases :
  // 1. submit({...payload}) → crée le permit côté backend.
  //    - Si Stripe configuré + permis payant : retourne {permit, clientSecret, ...}
  //      pour que ApplyView monte le PaymentElement à l'étape 5.
  //    - Sinon : permit déjà 'pending' (En instruction), on bascule en TrackingView.
  // 2. submit({__paymentDone:true}) → notifié par ApplyView après que Stripe
  //    a confirmé le paiement → on bascule en TrackingView (le webhook
  //    bascule le statut côté serveur, le polling AccountPage le verra).
  const handleSubmit = async (input) => {
    if (input?.__paymentDone) {
      push(t('permis.toasts.paymentConfirmed'));
      setView('track');
      return null;
    }
    try {
      const result = await submit(input);
      if (!result.clientSecret) {
        // Mode mock / gratuit : permit déjà en instruction → tracking direct
        push(t('permis.toasts.applicationSent'));
        setView('track');
      }
      return result;
    } catch (err) {
      push(err?.message ?? t('permis.toasts.submitFailed'));
      throw err;
    }
  };

  if (typesLoading || depLoading) {
    return (
      <div className="page">
        <div className="page-container">
          <p>{t('common.loading')}</p>
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
