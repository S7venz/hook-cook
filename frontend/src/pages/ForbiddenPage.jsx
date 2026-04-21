import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { useAuth } from '../lib/auth.js';

/**
 * Affichée quand un utilisateur connecté mais non-admin tente
 * d'accéder à /admin. Pas de redirect silencieux — on explique.
 */
export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="page">
      <div
        className="page-container"
        style={{
          textAlign: 'center',
          padding: 'var(--sp-16) var(--sp-4)',
          maxWidth: 620,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 96,
            height: 96,
            margin: '0 auto var(--sp-5)',
            color: 'var(--accent)',
            opacity: 0.85,
          }}
        >
          <svg
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
          >
            <rect
              x="24"
              y="44"
              width="48"
              height="36"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M34 44v-8a14 14 0 0 1 28 0v8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="48" cy="60" r="3" fill="currentColor" />
            <path
              d="M48 63v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-4)' }}>
          Erreur 403
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: 'var(--sp-5)',
          }}
        >
          Accès <em style={{ color: 'var(--accent)', fontWeight: 300 }}>refusé</em>.
        </div>
        <p className="soft" style={{ margin: '0 auto var(--sp-6)', maxWidth: '44ch' }}>
          {user
            ? `Connecté en tant que ${user.email}, mais votre compte n'a pas les droits administrateur requis pour cette section.`
            : 'Vous devez être connecté pour accéder à cette section.'}
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
          {user && (
            <Button variant="ghost" size="lg" onClick={() => navigate('/compte')}>
              Mon compte
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
