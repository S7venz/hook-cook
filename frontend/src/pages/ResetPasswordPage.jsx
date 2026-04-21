import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
      // Auto-redirect sur /connexion après 3s
      setTimeout(() => navigate('/connexion', { replace: true }), 3000);
    } catch (err2) {
      setError(err2?.message ?? 'Erreur lors de la réinitialisation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
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
              Mot de passe mis à jour.
            </div>
            <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
              Vous allez être redirigé vers la page de connexion…
            </p>
            <Link to="/connexion">
              <Button variant="primary">Se connecter maintenant</Button>
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
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            Nouveau mot de passe
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 400,
              fontSize: 'var(--fs-44)',
              letterSpacing: '-0.025em',
              margin: '0 0 var(--sp-4)',
            }}
          >
            Réinitialisation
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            Choisissez un nouveau mot de passe pour votre compte. Il doit faire
            au moins 8 caractères.
          </p>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="new-password">Nouveau mot de passe</label>
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
              <label htmlFor="confirm-password">Confirmer le mot de passe</label>
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
              {submitting ? 'Mise à jour…' : 'Définir mon mot de passe'}
            </Button>
          </form>

          {error?.toLowerCase().includes('expiré') && (
            <div
              style={{
                marginTop: 'var(--sp-4)',
                padding: 'var(--sp-3)',
                background: 'var(--bg-sunk)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--fs-13)',
              }}
            >
              <Link
                to="/mot-de-passe-oublie"
                style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
              >
                Demander un nouveau lien
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
