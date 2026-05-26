import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { requestPasswordReset } from '../lib/gdpr.js';
import { validateEmail } from '../lib/validation.js';

/**
 * Formulaire "Mot de passe oublié". On ne révèle jamais si l'email
 * existe ou pas — on affiche toujours le même message de confirmation
 * quelle que soit la réponse du backend (anti-énumération).
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page">
        <div className="page-container" style={{ maxWidth: 480 }}>
          <div style={{ padding: 'var(--sp-12) 0', textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-44)',
                fontWeight: 400,
                margin: '0 0 var(--sp-4)',
              }}
            >
              ✉️
            </div>
            <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
              {t('auth.forgot.success')}
            </p>
            <Link to="/connexion">
              <Button variant="ghost">← {t('auth.forgot.backToLogin')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 440 }}>
        <div style={{ padding: 'var(--sp-12) 0' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'var(--fs-44)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--sp-4)',
            }}
          >
            {t('auth.forgot.title')}
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            {t('auth.forgot.subtitle')}
          </p>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="forgot-email">{t('auth.forgot.emailLabel')}</label>
              <input
                id="forgot-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            {error && <div className="error">{error}</div>}
            <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
              {submitting ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
            </Button>
          </form>

          <div
            style={{
              marginTop: 'var(--sp-6)',
              textAlign: 'center',
              fontSize: 'var(--fs-14)',
              color: 'var(--ink-soft)',
            }}
          >
            <Link
              to="/connexion"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}
            >
              {t('auth.forgot.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
