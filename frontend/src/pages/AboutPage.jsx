import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

/**
 * Page "À propos" avec trois sections ancrées (#histoire, #ateliers,
 * #engagements). Accessible depuis le footer (colonne Marque) et
 * indirectement en SEO — une vraie page éditoriale au ton artisan
 * cohérent avec l'identité Carnet du site.
 */

const SECTIONS = [
  {
    id: 'histoire',
    eyebrow: 'Depuis 2008',
    title: 'Notre histoire',
    body: (
      <>
        <p className="hc-dropcap">
          Hook &amp; Cook ouvre en 2008 dans une petite échoppe de la rue de
          l'Alsace à Perpignan. À l'époque, un comptoir, trois cannes mouche
          accrochées au mur et une boîte de mouches montées à la main par
          Jean-Marc Peyre, ancien guide sur la Têt.
        </p>
        <p>
          Seize ans plus tard, la boutique s'est agrandie et le catalogue
          couvre toutes les techniques — mouche, carnassiers, surfcasting,
          carpe — mais l'approche reste la même : sélectionner chaque produit
          comme si c'était nous qui allions pêcher avec. Pas de catalogue
          algorithmique, pas de fournisseur d'Asie anonyme. Des cannes qu'on
          lance, des moulinets qu'on démonte, des appâts qu'on teste sur la
          Têt avant de les mettre en rayon.
        </p>
        <p>
          Aujourd'hui, l'équipe compte cinq pêcheurs. On organise trois ou
          quatre concours par an sur les eaux locales (Têt, Vinça, Tech,
          Agly), on accompagne les débutants et on continue de monter nos
          propres mouches à la boutique les matins d'hiver.
        </p>
      </>
    ),
  },
  {
    id: 'ateliers',
    eyebrow: 'Made in France',
    title: 'Ateliers partenaires',
    body: (
      <>
        <p className="hc-dropcap">
          Une partie de notre offre est produite directement par des ateliers
          français avec qui on travaille en direct, sans intermédiaire. Ça
          garantit la qualité, la traçabilité, et ça fait vivre le savoir-faire
          artisanal local.
        </p>
        <ul>
          <li>
            <strong>Atelier Peyre (66)</strong> — Jean-Marc monte à la main les
            blanks carbone de la gamme Hook &amp; Cook Sauvage à Prades.
            Porte-moulinets en noyer tourné, ligatures au fil de soie. Une
            demi-douzaine de cannes par mois.
          </li>
          <li>
            <strong>Cordier Roubinet (38)</strong> — un des derniers cordiers
            français à tresser ses soies manuellement sur un métier centenaire.
            Cœur 16 brins, lissage à la cire d'abeille.
          </li>
          <li>
            <strong>Tournon (42)</strong> — fabricant historique d'hameçons et
            d'accessoires fins. Production dans la Loire, acier zingué, finition
            black.
          </li>
          <li>
            <strong>Mouches du Conflent</strong> — collectif de monteurs
            amateurs pour qui on référence les imitations locales (Sedge de la
            Têt, BWO d'Olette, Peute noire).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'engagements',
    eyebrow: 'Ce qu\'on défend',
    title: 'Engagements',
    body: (
      <>
        <h3>Transparence du sourcing</h3>
        <p className="hc-dropcap">
          Chaque fiche produit indique l'origine, l'atelier ou le fabricant.
          Quand le produit vient d'Asie (c'est le cas de certains leurres de
          masse), on le dit. Pas de packaging trompeur.
        </p>

        <h3>Pêche responsable</h3>
        <p>
          On promeut le no-kill sur les espèces fragiles (truite fario, ombre
          commun). Les concours qu'on organise sont systématiquement en
          no-kill, avec hameçons sans ardillon obligatoires. On fournit les
          tapis de réception et les épuisettes en caoutchouc gratuitement.
        </p>

        <h3>Respect des quotas et ouvertures</h3>
        <p>
          Chaque fiche espèce du site affiche le calendrier d'ouverture
          officiel en première catégorie. Les permis vendus sur Hook &amp;
          Cook sont validés par la Fédération départementale des
          Pyrénées-Orientales.
        </p>

        <h3>Impact carbone</h3>
        <p>
          Expédition Colissimo neutre en carbone (compensation via La Poste),
          emballages carton recyclé, pas de plastique gonflé. Pour les
          produits locaux (ateliers 66/42/38), livraison groupée une fois par
          semaine.
        </p>
      </>
    ),
  },
];

export function AboutPage() {
  const { hash } = useLocation();
  const navigate = useNavigate();

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
          À propos
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
          Une boutique tenue par des{' '}
          <em style={{ color: 'var(--accent)', fontWeight: 300 }}>pêcheurs</em>.
        </h1>
        <p className="lede" style={{ fontSize: 'var(--fs-18)', marginBottom: 'var(--sp-10)' }}>
          Installés depuis 2008 à Perpignan, on sélectionne chaque produit avec
          la même exigence : aurait-on plaisir à pêcher avec ?
        </p>

        {SECTIONS.map((s, i) => (
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
                  {/* Vaguelette + point — rappel visuel eau & hameçon */}
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
              {s.eyebrow}
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
              {s.title}
            </h2>
            {s.body}
          </section>
        ))}

        <div
          style={{
            marginTop: 'var(--sp-10)',
            paddingTop: 'var(--sp-8)',
            borderTop: '1px solid var(--hairline)',
            textAlign: 'center',
          }}
        >
          <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
            Découvrir la boutique
          </Button>
        </div>
      </div>
    </div>
  );
}
