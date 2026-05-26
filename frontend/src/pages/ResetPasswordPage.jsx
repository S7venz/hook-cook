import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { confirmPasswordReset } from '../lib/gdpr.js';
import { validatePassword } from '../lib/validation.js';

/**
 * Page atteinte par le lien reçu par email : /reset-password/:token.
 * Le token est dans l'URL, on demande seulement le nouveau mot de
 * passe + confirmation. Si le token est invalide/expiré, le backend
 * renvoie un message clair et on propose de relancer le flow.
 */
export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) {
      setError(err);
      return;
    }
    if (password !== confirm) {
      setError(t('auth.register.errorMismatch'));
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
      setTimeout(() => navigate('/connexion', { replace: true }), 3000);
    } catch (err2) {
      setError(err2?.message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="page">
        <div className="page-container" style={{ maxWidth: 480 }}>
          <div style={{ padding: 'var(--sp-12) 0', textAlign: 'center' }}>
            <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
              {t('auth.reset.success')}
            </p>
            <Link to="/connexion">
              <Button variant="primary">{t('auth.reset.backToLogin')}</Button>
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
            {t('auth.reset.title')}
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            {t('auth.reset.subtitle')}
          </p>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="new-password">{t('auth.reset.passwordLabel')}</label>
              <input
                id="new-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">{t('auth.reset.confirmLabel')}</label>
              <input
                id="confirm-password"
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
              {submitting ? t('auth.reset.submitting') : t('auth.reset.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
