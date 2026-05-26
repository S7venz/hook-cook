import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { emailValid, useAuth } from '../lib/auth.js';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, user, hydrating } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Priorité : state.from (posé par RouteGuards) > ?next= > /compte.
  // Sanitize anti-open-redirect : on refuse tout ce qui n'est pas un
  // chemin interne commençant par / et différent de //.
  const rawRedirect = location.state?.from ?? searchParams.get('next') ?? '/compte';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/compte';

  // Déjà connecté ? On saute direct à la destination.
  if (!hydrating && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailValid(email)) {
      setError(t('auth.login.errorGeneric'));
      return;
    }
    if (!password) {
      setError(t('auth.login.errorGeneric'));
      return;
    }
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 440 }}>
        <div style={{ padding: 'var(--sp-12) 0' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            {t('auth.login.eyebrow')}
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
            {t('auth.login.title')}
          </h1>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="login-email">{t('auth.login.emailLabel')}</label>
              <input
                id="login-email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">{t('auth.login.passwordLabel')}</label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <div style={{ textAlign: 'right' }}>
                <Link
                  to="/mot-de-passe-oublie"
                  style={{
                    fontSize: 'var(--fs-12)',
                    color: 'var(--ink-mute)',
                    borderBottom: '1px dotted currentColor',
                  }}
                >
                  {t('auth.login.forgot')}
                </Link>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
              {submitting ? t('auth.login.submitting') : t('auth.login.submit')}
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
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/inscription"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}
            >
              {t('auth.login.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
