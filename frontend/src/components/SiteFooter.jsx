import { Link } from 'react-router-dom';

const FOOTER_COLUMNS = [
  { title: 'Boutique', items: ['Cannes', 'Moulinets', 'Leurres', 'Vêtements', 'Par espèce'] },
  { title: 'Services', items: ['Permis 2026', 'Concours', 'Carnet de prise', 'Challenges'] },
  { title: 'Marque', items: ['Notre histoire', 'Ateliers partenaires', 'Engagements', 'Aide'] },
];

const LEGAL_LINKS = [
  { to: '/legal/mentions-legales', label: 'Mentions légales' },
  { to: '/legal/cgv', label: 'CGV' },
  { to: '/legal/politique-confidentialite', label: 'Confidentialité' },
  { to: '/legal/cookies', label: 'Cookies' },
];

const footerStyle = {
  borderTop: '1px solid var(--rule)',
  marginTop: 'var(--sp-16)',
  padding: 'var(--sp-12) 0 var(--sp-6)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 'var(--sp-6)',
  marginBottom: 'var(--sp-8)',
};

const legalStyle = {
  paddingTop: 'var(--sp-4)',
  borderTop: '1px solid var(--hairline)',
  display: 'flex',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--sp-3)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-12)',
  color: 'var(--ink-mute)',
};

const legalLinksStyle = {
  display: 'flex',
  gap: 'var(--sp-4)',
  flexWrap: 'wrap',
};

export function SiteFooter() {
  return (
    <footer style={footerStyle}>
      <div className="page-container">
        <div style={gridStyle}>
          <div style={{ gridColumn: 'span 2' }}>
            <div className="brand" style={{ fontSize: 'var(--fs-32)' }}>
              Hook &amp; Cook<span className="dot" />
            </div>
            <p className="soft" style={{ maxWidth: '32ch', marginTop: 'var(--sp-3)' }}>
              Boutique, permis et concours de pêche — tenus par des pêcheurs. Perpignan, France.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
                {col.title}
              </div>
              <div className="stack-sm">
                {col.items.map((item) => (
                  <a
                    key={item}
                    className="soft"
                    style={{ fontSize: 'var(--fs-14)', cursor: 'pointer' }}
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={legalStyle}>
          <span>© 2026 Hook &amp; Cook · Perpignan</span>
          <nav style={legalLinksStyle} aria-label="Liens légaux">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.to} to={l.to} style={{ color: 'inherit' }}>
                {l.label}
              </Link>
            ))}
          </nav>
          <span>Paiement sécurisé · Livraison Colissimo</span>
        </div>
      </div>
    </footer>
  );
}
