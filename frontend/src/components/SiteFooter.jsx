import { Link } from 'react-router-dom';

/**
 * Liens du footer — chaque entrée pointe sur une vraie route. Les
 * catégories produits utilisent le filtre ?category= déjà géré par
 * CataloguePage. Les items "Marque" pointent sur /a-propos avec
 * ancres, "Aide" sur sa propre page FAQ.
 */
const FOOTER_COLUMNS = [
  {
    title: 'Boutique',
    items: [
      { label: 'Cannes', to: '/boutique?category=cannes' },
      { label: 'Moulinets', to: '/boutique?category=moulinets' },
      { label: 'Leurres', to: '/boutique?category=leurres' },
      { label: 'Vêtements', to: '/boutique?category=vetements' },
      { label: 'Par espèce', to: '/' },
    ],
  },
  {
    title: 'Services',
    items: [
      { label: 'Permis 2026', to: '/permis' },
      { label: 'Concours', to: '/concours' },
      { label: 'Carnet de prise', to: '/compte#carnet' },
      { label: 'Challenges', to: '/challenges' },
    ],
  },
  {
    title: 'Marque',
    items: [
      { label: 'Notre histoire', to: '/a-propos#histoire' },
      { label: 'Ateliers partenaires', to: '/a-propos#ateliers' },
      { label: 'Engagements', to: '/a-propos#engagements' },
      { label: 'Aide', to: '/aide' },
    ],
  },
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

const columnLinkStyle = {
  fontSize: 'var(--fs-14)',
  color: 'var(--ink-soft)',
  textDecoration: 'none',
  transition: 'color var(--dur-fast)',
};

export function SiteFooter() {
  return (
    <footer style={footerStyle}>
      <div className="page-container">
        <div style={gridStyle}>
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" className="brand" style={{ fontSize: 'var(--fs-32)' }}>
              Hook &amp; Cook<span className="dot" />
            </Link>
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
                  <Link
                    key={item.label}
                    to={item.to}
                    className="footer-link"
                    style={columnLinkStyle}
                  >
                    {item.label}
                  </Link>
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
