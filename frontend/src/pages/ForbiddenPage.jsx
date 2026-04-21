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
