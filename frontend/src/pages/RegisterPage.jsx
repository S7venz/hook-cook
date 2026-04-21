import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
      validateName(firstName, { field: 'Le prénom' }),
      validateName(lastName, { field: 'Le nom' }),
      validateEmail(email),
      validatePassword(password),
      password !== confirm ? 'Les mots de passe ne correspondent pas.' : null,
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
            Bienvenue chez Hook &amp; Cook
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
            Créer un compte
          </h1>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
            >
              <div className="field">
                <label htmlFor="reg-firstname">Prénom</label>
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
                <label htmlFor="reg-lastname">Nom</label>
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
              <label htmlFor="reg-email">Email</label>
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
              <label htmlFor="reg-password">Mot de passe</label>
              <input
                id="reg-password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <div className="hint">Minimum 8 caractères.</div>
            </div>
            <div className="field">
              <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
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
              {submitting ? 'Création…' : 'Créer mon compte'}
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
            Déjà un compte ?{' '}
            <Link
              to="/connexion"
              style={{ color: 'var(--accent)', borderBottom: '1px solid var(--accent)' }}
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
