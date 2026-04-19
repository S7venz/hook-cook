import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { SpeciesIllus } from '../components/ui/SpeciesIllus.jsx';
import { SeasonCalendar } from '../components/ui/SeasonCalendar.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { SiteFooter } from '../components/SiteFooter.jsx';
import { carnet, contests, products, species } from '../data/catalog.js';
import { formatPrice } from '../lib/format.js';

const CURRENT_MONTH = 4;

const cardStyle = { padding: 'var(--sp-6)' };
const cardTitleStyle = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: 'var(--fs-24)',
  margin: 'var(--sp-2) 0 var(--sp-4)',
  lineHeight: 1.1,
};

function PermisCard() {
  const steps = ['Type', 'Identité', 'Pièces', 'Paiement'];
  return (
    <div className="card" style={cardStyle}>
      <div className="eyebrow">Permis 2026</div>
      <h3 style={cardTitleStyle}>En 4 gestes · 2 jours ouvrés</h3>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        {steps.map((label, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-12)',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid var(--rule)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              {i + 1}
            </div>
            <div style={{ color: 'var(--ink-mute)' }}>{label}</div>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm">
        Commencer
      </Button>
    </div>
  );
}

function SeasonsCard() {
  return (
    <div className="card" style={cardStyle}>
      <div className="eyebrow">Saisons en cours</div>
      <h3 style={cardTitleStyle}>Truite, ombre, perche, bar</h3>
      <SeasonCalendar months={[3, 4, 5, 6, 7, 8, 9]} currentMonth={CURRENT_MONTH} />
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-12)',
          color: 'var(--ink-mute)',
          marginTop: 'var(--sp-3)',
        }}
      >
        Avril · truite fario · fermée le 21 septembre
      </div>
    </div>
  );
}

function ConditionsCard() {
  const metrics = [
    { value: '12°', label: 'eau' },
    { value: '1013', label: 'hPa' },
    { value: 'L+2', label: 'lune' },
  ];
  return (
    <div className="card" style={cardStyle}>
      <div className="eyebrow">Conditions du moment</div>
      <h3 style={cardTitleStyle}>Loue — Montgesoye</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--sp-3)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-13)',
        }}
      >
        {metrics.map((m) => (
          <div key={m.label}>
            <div
              style={{
                fontSize: 'var(--fs-24)',
                fontFamily: 'var(--font-display)',
                color: 'var(--ink)',
              }}
            >
              {m.value}
            </div>
            <div style={{ color: 'var(--ink-mute)' }}>{m.label}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 'var(--sp-3)',
          fontSize: 'var(--fs-13)',
          color: 'var(--ink-soft)',
        }}
      >
        Couvert, basses pressions. Conditions idéales pour la sèche matinale.
      </div>
    </div>
  );
}

function contestStatus(contest) {
  if (contest.inscrits >= contest.max) return 'rejected';
  if (contest.inscrits / contest.max > 0.85) return 'pending';
  return 'approved';
}

function contestLabel(contest) {
  if (contest.inscrits >= contest.max) return 'Complet';
  return `${contest.inscrits}/${contest.max}`;
}

export function HomePage() {
  const featured = products.slice(0, 4);
  const upcomingContests = contests.slice(0, 3);
  const recentCatches = carnet.slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="page-container">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">Saison 2026 · Ouverture truite · 14 mars</div>
              <h1>
                Préparez
                <br />
                le <em>geste</em>.
              </h1>
              <p className="lede">
                Du permis au premier lancer — en quatre gestes. Une boutique tenue par des
                pêcheurs, pas par des algorithmes.
              </p>
              <div className="hero-actions">
                <Button variant="accent" size="lg">
                  Obtenir mon permis →
                </Button>
                <Button variant="ghost" size="lg">
                  Voir la boutique
                </Button>
              </div>
            </div>
            <div className="hero-illus">
              <Placeholder label="Matin sur le Doubs — brume, pêcheur au loin" />
            </div>
          </div>
        </div>
      </section>

      <section className="saison-strip">
        <div className="saison-inner">
          <div className="saison-item">
            <span className="lbl">Votre permis</span>
            <span className="val">Expire dans 284 jours</span>
          </div>
          <div className="saison-item">
            <span className="lbl">Prochain concours</span>
            <span className="val">Open de Vesoul · 04 mai</span>
          </div>
          <div className="saison-item">
            <span className="lbl">Ouverture à venir</span>
            <span className="val">Carpe · dans 12 jours</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Je m'équipe par</div>
              <h2>Espèce ciblée</h2>
            </div>
            <a className="more">Voir toutes →</a>
          </div>

          <div className="species-grid">
            {species.map((sp) => (
              <div key={sp.id} className="species-card" role="button" tabIndex={0}>
                <div className="media">
                  <SpeciesIllus species={sp.id} />
                </div>
                <div className="meta">{sp.water}</div>
                <div className="name">{sp.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-sunk)' }}>
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Avant le geste</div>
              <h2>Je prépare</h2>
            </div>
          </div>

          <div
            className="prep-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--sp-5)',
            }}
          >
            <PermisCard />
            <SeasonsCard />
            <ConditionsCard />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Curation d'avril · matériel truite rivière</div>
              <h2>Équipement du moment</h2>
            </div>
            <a className="more">Tout le catalogue →</a>
          </div>
          <div className="products-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--bg-sunk)' }}>
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Calendrier local</div>
              <h2>Concours à venir</h2>
            </div>
            <a className="more">Tous les concours →</a>
          </div>
          <div className="concours-grid">
            {upcomingContests.map((contest) => {
              const [day, month] = contest.dateDisplay.split(' ');
              const ratio = (contest.inscrits / contest.max) * 100;
              return (
                <div key={contest.id} className="concours-card">
                  <div className="date-block">
                    <div className="day">{day}</div>
                    <div className="month">{month}</div>
                  </div>
                  <h3>{contest.title}</h3>
                  <div className="meta-row">
                    <span>{contest.lieu}</span>
                    <span>·</span>
                    <span>{contest.format}</span>
                  </div>
                  <div className="footer-row">
                    <Badge status={contestStatus(contest)}>{contestLabel(contest)}</Badge>
                    <div className="progress-bar" style={{ maxWidth: 100 }}>
                      <div className="fill" style={{ width: `${ratio}%` }} />
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-mute)' }}
                    >
                      {contest.prix === 0 ? 'Gratuit' : formatPrice(contest.prix)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">Depuis le carnet</div>
              <h2>Cette semaine sur les rivières</h2>
            </div>
            <a className="more">Votre carnet →</a>
          </div>
          <div className="carnet-feed">
            {recentCatches.map((entry) => {
              const sp = species.find((s) => s.id === entry.species);
              return (
                <article className="carnet-entry" key={entry.id}>
                  <div className="media">
                    <Placeholder label={entry.photo} />
                  </div>
                  <div className="body">
                    <div className="eyebrow">
                      {sp?.name} · {entry.spot}
                    </div>
                    <div className="big-num">
                      {entry.taille}
                      <small>cm</small>
                    </div>
                    <div className="entry-meta">
                      <span>{new Date(entry.date).toLocaleDateString('fr-FR')}</span>
                      <span>·</span>
                      <span>{entry.bait}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
