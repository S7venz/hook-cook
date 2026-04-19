import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { emailValid, useAuth } from '../lib/auth.js';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from ?? '/compte';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailValid(email)) {
      setError('Email invalide.');
      return;
    }
    if (!password) {
      setError('Mot de passe requis.');
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
            Retour parmi les pêcheurs
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
            Connexion
          </h1>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="login-email">Email</label>
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
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <Button variant="primary" size="lg" full type="submit" disabled={submitting}>
              {submitting ? 'Connexion…' : 'Se connecter'}
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
            Pas encore de compte ?{' '}
            <Link
              to="/inscription"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
