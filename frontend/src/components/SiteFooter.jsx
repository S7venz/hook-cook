import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.shop'),
      items: [
        { label: t('footer.categories.rods'), to: '/boutique?category=cannes' },
        { label: t('footer.categories.reels'), to: '/boutique?category=moulinets' },
        { label: t('footer.categories.lures'), to: '/boutique?category=leurres' },
        { label: t('footer.categories.clothing'), to: '/boutique?category=vetements' },
        { label: t('footer.categories.bySpecies'), to: '/' },
      ],
    },
    {
      title: t('footer.services'),
      items: [
        { label: t('footer.permits2026'), to: '/permis' },
        { label: t('footer.contests'), to: '/concours' },
        { label: t('footer.catchLog'), to: '/compte#carnet' },
        { label: t('footer.challenges'), to: '/challenges' },
      ],
    },
    {
      title: t('footer.company'),
      items: [
        { label: t('footer.about'), to: '/a-propos#histoire' },
        { label: t('footer.help'), to: '/aide' },
      ],
    },
  ];

  const legalLinks = [
    { to: '/legal/mentions-legales', label: t('footer.legal') },
    { to: '/legal/cgv', label: t('footer.terms') },
    { to: '/legal/politique-confidentialite', label: t('footer.privacy') },
    { to: '/legal/cookies', label: t('footer.cookies') },
  ];

  return (
    <footer className="net-pattern" style={footerStyle}>
      <div className="page-container">
        <div style={gridStyle}>
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" className="brand" style={{ fontSize: 'var(--fs-32)' }}>
              Hook &amp; Cook<span className="dot" />
            </Link>
            <p className="soft" style={{ maxWidth: '32ch', marginTop: 'var(--sp-3)' }}>
              {t('footer.tagline')}
            </p>
          </div>
          {columns.map((col) => (
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
          <span>{t('footer.copyright', { year })}</span>
          <nav style={legalLinksStyle} aria-label={t('footer.legalLinks')}>
            {legalLinks.map((l) => (
              <Link key={l.to} to={l.to} style={{ color: 'inherit' }}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
