import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export function PlaceholderPage({ eyebrow, title, description }) {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-container">
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: 'var(--sp-20) 0',
            textAlign: 'center',
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            {eyebrow}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, var(--fs-64))',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              margin: '0 0 var(--sp-4)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: 'var(--ink-soft)',
              fontSize: 'var(--fs-18)',
              maxWidth: '44ch',
              margin: '0 auto var(--sp-8)',
            }}
          >
            {description}
          </p>
          <div
            style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Button variant="ghost" size="lg" onClick={() => navigate('/')}>
              ← Retour à l'accueil
            </Button>
            <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
              Parcourir la boutique
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
