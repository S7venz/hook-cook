import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../lib/auth.js';
import {
  firstError,
  validateEmail,
  validateName,
  validatePassword,
} from '../lib/validation.js';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const err = firstError(
      validateName(firstName, { field: t('auth.register.firstNameLabel') }),
      validateName(lastName, { field: t('auth.register.lastNameLabel') }),
      validateEmail(email),
      validatePassword(password),
      password !== confirm ? t('auth.register.errorMismatch') : null,
    );
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    const result = await register({ email, password, firstName, lastName });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/compte', { replace: true });
  };

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 480 }}>
        <div style={{ padding: 'var(--sp-12) 0' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            {t('auth.register.eyebrow')}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'var(--fs-44)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--sp-6)',
            }}
          >
            {t('auth.register.title')}
          </h1>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label htmlFor="reg-firstname">{t('auth.register.firstNameLabel')}</label>
                <input
                  id="reg-firstname"
                  className="input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="reg-lastname">{t('auth.register.lastNameLabel')}</label>
                <input
                  id="reg-lastname"
                  className="input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="reg-email">{t('auth.register.emailLabel')}</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="reg-password">{t('auth.register.passwordLabel')}</label>
              <input
                id="reg-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <div className="hint">{t('auth.register.passwordHint')}</div>
            </div>
            <div className="field">
              <label htmlFor="reg-confirm">{t('auth.register.confirmLabel')}</label>
              <input
                id="reg-confirm"
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
              {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
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
            {t('auth.register.alreadyAccount')}{' '}
            <Link
              to="/connexion"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}
            >
              {t('auth.register.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
