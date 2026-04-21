import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { requestPasswordReset } from '../lib/gdpr.js';
import { validateEmail } from '../lib/validation.js';

/**
 * Formulaire "Mot de passe oublié". On ne révèle jamais si l'email
 * existe ou pas — on affiche toujours le même message de confirmation
 * quelle que soit la réponse du backend (anti-énumération).
 */
export function ForgotPasswordPage() {
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
      // On garde le même message qu'en succès pour ne rien leaker
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
              Email envoyé.
            </div>
            <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
              Si un compte Hook &amp; Cook existe avec l'adresse{' '}
              <span className="mono">{email}</span>, un email avec un lien de
              réinitialisation vient d'être envoyé. Le lien expire dans 1 heure.
            </p>
            <p className="soft" style={{ fontSize: 'var(--fs-13)', marginBottom: 'var(--sp-5)' }}>
              Rien reçu ? Vérifiez les spams, puis contactez-nous à{' '}
              <a href="mailto:contact@hookcook.fr" style={{ color: 'var(--accent)' }}>
                contact@hookcook.fr
              </a>.
            </p>
            <Link to="/connexion">
              <Button variant="ghost">← Retour à la connexion</Button>
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
            Accès oublié ?
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
            Mot de passe oublié
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            Saisissez l'email de votre compte. Si vous en avez un, on vous envoie
            un lien pour définir un nouveau mot de passe.
          </p>

          <form onSubmit={submit} className="stack-md" noValidate>
            <div className="field">
              <label htmlFor="forgot-email">Email</label>
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
              {submitting ? 'Envoi…' : 'Envoyer le lien'}
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
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
