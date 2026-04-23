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
            width: 240,
            margin: '0 auto var(--sp-5)',
            color: 'var(--ink-soft)',
          }}
        >
          {/* Scène : un pêcheur dépité, canne molle, et un poisson qui passe
              sous l'eau sans mordre. Ondulations + bulles ambient. */}
          <svg
            viewBox="0 0 240 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            {/* Soleil pâle / lune */}
            <circle cx="200" cy="32" r="10" fill="var(--accent-soft)" opacity="0.7" />
            {/* Pêcheur silhouette */}
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
              {/* tête */}
              <circle cx="60" cy="42" r="7" />
              {/* chapeau */}
              <path d="M50 38 Q 60 28 70 38" />
              <line x1="48" y1="38" x2="72" y2="38" />
              {/* corps */}
              <line x1="60" y1="49" x2="60" y2="84" />
              {/* bras qui tient la canne */}
              <line x1="60" y1="58" x2="80" y2="64" />
              {/* jambes */}
              <line x1="60" y1="84" x2="52" y2="104" />
              <line x1="60" y1="84" x2="68" y2="104" />
              {/* canne (légèrement penchée vers le bas, ennuyée) */}
              <line x1="80" y1="64" x2="170" y2="92" />
              {/* fil de pêche qui descend mollement vers l'eau */}
              <path d="M170 92 Q 175 110 178 132" strokeWidth="0.8" opacity="0.6" />
            </g>
            {/* Hameçon en bas du fil */}
            <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7">
              <path d="M178 132 v4 a3 3 0 1 1 -3 3" />
            </g>
            {/* Surface de l'eau — ondulations */}
            <g stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55">
              <path d="M0 142 Q 30 134 60 142 T 120 142 T 180 142 T 240 142" />
              <path d="M0 154 Q 30 146 60 154 T 120 154 T 180 154 T 240 154" opacity="0.6" />
              <path d="M0 166 Q 30 158 60 166 T 120 166 T 180 166 T 240 166" opacity="0.4" />
            </g>
            {/* Petit poisson qui passe sous le fil (l'air narquois) */}
            <g fill="currentColor" opacity="0.55" transform="translate(40 158)">
              <path d="M2 4 q 8 -8 18 -2 q 4 1 6 -2 l-1 4 1 4 q -2 -3 -6 -2 q -10 6 -18 -2z" />
              <circle cx="14" cy="3" r="0.8" fill="var(--bg)" />
            </g>
            {/* Petites bulles qui montent depuis le poisson */}
            <g fill="none" stroke="var(--accent)" strokeWidth="0.8" opacity="0.5">
              <circle cx="58" cy="148" r="1.5" />
              <circle cx="62" cy="142" r="1" />
              <circle cx="66" cy="138" r="0.8" />
            </g>
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
        <p className="soft" style={{ margin: '0 auto var(--sp-2)', maxWidth: '44ch' }}>
          Ça mord pas par ici. La page <span className="mono">{pathname}</span> n'existe pas,
          ou a été retirée du catalogue. On reprend depuis la première ligne ?
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
