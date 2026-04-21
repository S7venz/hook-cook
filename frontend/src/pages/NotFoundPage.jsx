import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

/**
 * 404 cohérent avec l'esthétique Carnet : big display font, ton
 * éditorial, deux sorties (retour accueil ou boutique).
 */
export function NotFoundPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

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
            <circle
              cx="48"
              cy="48"
              r="32"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
            <path
              d="M36 40c0-6 12-6 12 0s-6 6-6 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="42" cy="62" r="2" fill="currentColor" />
            <path
              d="M62 38l8 8M70 38l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        </div>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-4)' }}>
          Erreur 404
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            letterSpacing: '-0.035em',
            lineHeight: 0.9,
            marginBottom: 'var(--sp-5)',
          }}
        >
          Page <em style={{ color: 'var(--accent)', fontWeight: 300 }}>introuvable</em>.
        </div>
        <p className="soft" style={{ margin: '0 auto var(--sp-6)', maxWidth: '44ch' }}>
          La page <span className="mono">{pathname}</span> n'existe pas, ou a été retirée
          du catalogue. On reprend depuis la première ligne ?
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
          <Button variant="ghost" size="lg" onClick={() => navigate('/boutique')}>
            Parcourir la boutique
          </Button>
        </div>
        <div
          style={{
            marginTop: 'var(--sp-8)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-12)',
            color: 'var(--ink-mute)',
          }}
        >
          Pages utiles :{' '}
          <Link
            to="/permis"
            style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
          >
            Permis
          </Link>
          {' · '}
          <Link
            to="/concours"
            style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
          >
            Concours
          </Link>
          {' · '}
          <Link
            to="/challenges"
            style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
          >
            Challenges
          </Link>
          {' · '}
          <Link
            to="/compte"
            style={{ color: 'var(--accent)', borderBottom: '1px solid currentColor' }}
          >
            Mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}
