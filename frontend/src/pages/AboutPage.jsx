import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';

/**
 * Page "À propos" avec trois sections ancrées (#histoire, #ateliers,
 * #engagements). Accessible depuis le footer (colonne Marque) et
 * indirectement en SEO — une vraie page éditoriale au ton artisan
 * cohérent avec l'identité Carnet du site.
 *
 * Contenu éditorial intégralement piloté par les locales i18n
 * (clés `about.history`, `about.workshops`, `about.commitments`).
 * Chaque section déclare ses paragraphes / éléments comme tableaux
 * dans le JSON pour rester facilement éditable sans toucher au JSX.
 */

const SECTIONS = [
  { id: 'histoire', icon: 'compass', key: 'history' },
  { id: 'ateliers', icon: 'rod', key: 'workshops' },
  { id: 'engagements', icon: 'leaf', key: 'commitments' },
];

function renderArray(items, kind = 'p') {
  if (!Array.isArray(items)) return null;
  if (kind === 'ul') {
    return (
      <ul>
        {items.map((html, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ))}
      </ul>
    );
  }
  return items.map((html, i) => (
    <p
      key={i}
      className={i === 0 ? 'hc-dropcap' : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ));
}

export function AboutPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Scroll à l'ancre au montage ET à chaque changement de hash,
  // avec un léger délai pour laisser le layout se stabiliser.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }, [hash]);

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 760 }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          {t('about.eyebrow')}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, var(--fs-64))',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            margin: '0 0 var(--sp-6)',
          }}
        >
          <Trans i18nKey="about.title" components={{ em: <em style={{ color: 'var(--accent)', fontWeight: 300 }} /> }} />
        </h1>
        <p className="lede" style={{ fontSize: 'var(--fs-18)', marginBottom: 'var(--sp-10)' }}>
          {t('about.lede')}
        </p>

        {SECTIONS.map((s, i) => {
          const base = `about.${s.key}`;
          const paragraphs = t(`${base}.paragraphs`, { returnObjects: true, defaultValue: [] });
          const list = t(`${base}.list`, { returnObjects: true, defaultValue: null });
          const headings = t(`${base}.headings`, { returnObjects: true, defaultValue: null });
          return (
            <section
              key={s.id}
              id={s.id}
              className="legal-content"
              style={{
                paddingTop: 'var(--sp-10)',
                paddingBottom: 'var(--sp-6)',
                borderTop: i === 0 ? '1px solid var(--hairline)' : 'none',
                scrollMarginTop: 'var(--sp-10)',
              }}
            >
              {i > 0 && (
                <div className="hc-ornament" aria-hidden="true">
                  <svg
                    viewBox="0 0 40 12"
                    width="40"
                    height="12"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: 'var(--accent)' }}
                  >
                    <path
                      d="M 2 6 Q 8 2 14 6 T 26 6 T 38 6"
                      stroke="currentColor"
                      strokeWidth="1"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle cx="20" cy="6" r="1.6" fill="currentColor" />
                  </svg>
                </div>
              )}
              <div className="eyebrow" style={{ marginBottom: 'var(--sp-2)' }}>
                {s.icon && <SectionIcon name={s.icon} />}
                {t(`${base}.eyebrow`)}
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-32)',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  margin: '0 0 var(--sp-5)',
                }}
              >
                {t(`${base}.title`)}
              </h2>

              {/* Section "Engagements" : structure avec sous-titres + paragraphes alternés */}
              {Array.isArray(headings) && headings.map((h, idx) => (
                <div key={idx}>
                  <h3>{h.title}</h3>
                  {renderArray(h.paragraphs)}
                </div>
              ))}

              {/* Section "Histoire" : paragraphes simples */}
              {!headings && Array.isArray(paragraphs) && renderArray(paragraphs)}

              {/* Section "Ateliers" : liste */}
              {list && renderArray(list, 'ul')}
            </section>
          );
        })}

        <div
          style={{
            marginTop: 'var(--sp-10)',
            paddingTop: 'var(--sp-8)',
            borderTop: '1px solid var(--hairline)',
            textAlign: 'center',
          }}
        >
          <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
            {t('about.cta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
