import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { SectionIcon } from '../components/ui/SectionIcon.jsx';
import { SpeciesIllus } from '../components/ui/SpeciesIllus.jsx';
import { SeasonCalendar } from '../components/ui/SeasonCalendar.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { useAuth } from '../lib/auth.js';
import { useCarnet } from '../lib/carnet.js';
import { useLiveConditions } from '../lib/conditions.js';
import { formatPrice } from '../lib/format.js';
import { useProducts } from '../lib/products.js';
import { useReferenceData } from '../lib/referenceData.js';

const CURRENT_MONTH = 4;

const cardStyle = { padding: 'var(--sp-6)' };
const cardTitleStyle = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: 'var(--fs-24)',
  margin: 'var(--sp-2) 0 var(--sp-4)',
  lineHeight: 1.1,
};

function PermisCard({ onStart }) {
  const steps = ['Type', 'Identité', 'Pièces', 'Paiement'];
  return (
    <div className="card" style={cardStyle}>
      <div className="eyebrow">
        <SectionIcon name="permit" />Permis 2026
      </div>
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
      <Button variant="ghost" size="sm" onClick={onStart}>
        Commencer
      </Button>
    </div>
  );
}

function SeasonsCard() {
  return (
    <div className="card" style={cardStyle}>
      <div className="eyebrow">
        <SectionIcon name="leaf" />Saisons en cours
      </div>
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

function pressureTrend(hpa) {
  if (hpa == null) return 'Données météo indisponibles.';
  if (hpa < 1005) return 'Basses pressions — idéal pour la sèche matinale.';
  if (hpa < 1015) return 'Pressions stables — journée classique de pêche.';
  if (hpa < 1025) return 'Hautes pressions — privilégier le début / fin de journée.';
  return 'Anticyclone marqué — conditions techniques.';
}

// Petit pictogramme météo déduit de la pression + température.
// Principe : basse pression → probable couvert/pluie ; haute pression →
// ciel dégagé. C'est une heuristique d'indication, pas une prévision.
function MeteoIcon({ pressure, temp }) {
  if (pressure == null) return null;
  let kind;
  if (pressure < 1005) kind = 'rain';
  else if (pressure < 1013) kind = 'cloud';
  else if (pressure < 1022) kind = temp != null && temp < 8 ? 'cloud' : 'sun';
  else kind = 'sun';

  return (
    <div className="conditions-meteo" aria-hidden="true" title={`Pression ${Math.round(pressure)} hPa`}>
      {kind === 'sun' && (
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 4v4M20 32v4M4 20h4M32 20h4M8 8l3 3M29 29l3 3M32 8l-3 3M11 29l-3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
      {kind === 'cloud' && (
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 26a6 6 0 0 1 1-11.9 8 8 0 0 1 15.4 2A5 5 0 0 1 28 26H12z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {kind === 'rain' && (
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 22a6 6 0 0 1 1-11.9 8 8 0 0 1 15.4 2A5 5 0 0 1 28 22H12z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M15 28l-2 4M22 28l-2 4M29 28l-2 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

// Sparkline minimaliste : courbe + remplissage tendance sur les
// dernières heures de débit Hubeau. Vide si moins de 4 points.
function FlowSparkline({ series }) {
  if (!Array.isArray(series) || series.length < 4) return null;
  const W = 320;
  const H = 48;
  const PAD = 2;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (series.length - 1);

  const points = series.map((v, i) => {
    const x = PAD + i * step;
    const y = PAD + (H - PAD * 2) * (1 - (v - min) / range);
    return [x, y];
  });

  const stroke = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const fill = `${stroke} L ${W - PAD} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  return (
    <svg
      className="conditions-sparkline"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-label={`Tendance débit ${series.length} dernières heures`}
    >
      <path d={fill} className="fill" />
      <path d={stroke} className="stroke" />
    </svg>
  );
}

function ConditionsCard() {
  const { temp, pressure, flow, flowHistory, moon, loading, error } = useLiveConditions();

  const tempDisplay = temp != null ? `${Math.round(temp)}°` : '—';
  const pressureDisplay = pressure != null ? Math.round(pressure) : '—';
  const flowDisplay = flow != null ? flow.toFixed(1) : null;
  const moonDisplay = moon.short;

  const metrics = flowDisplay
    ? [
        { value: `${flowDisplay}`, label: 'm³/s débit' },
        { value: tempDisplay, label: 'air' },
        { value: moonDisplay, label: 'lune' },
      ]
    : [
        { value: tempDisplay, label: 'air' },
        { value: pressureDisplay, label: 'hPa' },
        { value: moonDisplay, label: 'lune' },
      ];

  return (
    <div className="card" style={{ ...cardStyle, position: 'relative' }}>
      <MeteoIcon pressure={pressure} temp={temp} />
      <div className="eyebrow">
        <SectionIcon name="wave" />Conditions en direct {loading && ' · màj…'}
        {error && ' · données partielles'}
      </div>
      <h3 style={cardTitleStyle}>La Têt — Olette</h3>
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
      <FlowSparkline series={flowHistory} />
      <div
        style={{
          marginTop: 'var(--sp-3)',
          fontSize: 'var(--fs-13)',
          color: 'var(--ink-soft)',
        }}
      >
        {pressureTrend(pressure)} {moon.label} · J{moon.daysSinceNew}.
      </div>
      <div
        style={{
          marginTop: 'var(--sp-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-12)',
          color: 'var(--ink-mute)',
        }}
      >
        Sources : Open-Meteo · Hubeau (Eaufrance)
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
  const navigate = useNavigate();
  const { products } = useProducts();
  const { contests, species } = useReferenceData();
  const { user } = useAuth();
  const { entries: carnetEntries } = useCarnet();
  const featured = products.slice(0, 4);
  const upcomingContests = contests.slice(0, 3);
  const recentCatches = user ? carnetEntries.slice(0, 3) : [];

  const openShop = () => navigate('/boutique');
  const openShopForSpecies = (id) => navigate(`/boutique?species=${id}`);
  const openPermis = () => navigate('/permis');
  const openContests = () => navigate('/concours');
  const openAccount = () => navigate('/compte');

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <svg
          className="hero-deco"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMaxYMid slice"
          aria-hidden="true"
        >
          {/* Lignes de pêche — courbes décoratives évoquant un lancer */}
          <path
            d="M 800 120 Q 600 180 400 240 T 0 360"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M 800 180 Q 550 260 350 320 T 0 440"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.6"
          />
          <path
            d="M 800 60 Q 650 120 500 170 T 200 260"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
          />
          {/* Petites mouches / hameçons ponctuant les lignes */}
          <circle cx="400" cy="240" r="3" fill="currentColor" opacity="0.8" />
          <circle cx="350" cy="320" r="2.5" fill="currentColor" opacity="0.6" />
          <circle cx="500" cy="170" r="2" fill="currentColor" opacity="0.5" />
          {/* Ondulations / rides d'eau en bas à droite */}
          <path
            d="M 500 500 Q 560 490 620 500 T 740 500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M 520 530 Q 580 520 640 530 T 760 530"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>
        <div className="page-container">
          <div className="hero-grid">
            <div>
              <div className="eyebrow">
                <SectionIcon name="calendar" />Saison 2026 · Ouverture truite · 14 mars
              </div>
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
                <Button variant="accent" size="lg" onClick={openPermis}>
                  Obtenir mon permis →
                </Button>
                <Button variant="ghost" size="lg" onClick={openShop}>
                  Voir la boutique
                </Button>
              </div>
            </div>
            <div className="hero-illus">
              <Placeholder
                src="http://localhost:8080/api/uploads/hero-home.png"
                label="Matin sur la Têt — brume, pêcheur au loin"
                alt="Pêcheur à la mouche au lever du jour sur une rivière embrumée"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="saison-strip">
        <div className="saison-inner">
          <div className="saison-item">
            <span className="lbl">
              <SectionIcon name="permit" />Votre permis
            </span>
            <span className="val">Expire dans 284 jours</span>
          </div>
          <div className="saison-item">
            <span className="lbl">
              <SectionIcon name="trophy" />Prochain concours
            </span>
            <span className="val">Open de la Têt · 04 mai</span>
          </div>
          <div className="saison-item">
            <span className="lbl">
              <SectionIcon name="fish" />Ouverture à venir
            </span>
            <span className="val">Carpe · dans 12 jours</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">
                <SectionIcon name="fish" />Je m'équipe par
              </div>
              <h2>Espèce ciblée</h2>
            </div>
            <a className="more" onClick={openShop}>
              Voir toutes →
            </a>
          </div>

          <div className="species-grid">
            {species.map((sp) => (
              <div
                key={sp.id}
                className="species-card"
                role="button"
                tabIndex={0}
                onClick={() => openShopForSpecies(sp.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openShopForSpecies(sp.id);
                  }
                }}
              >
                <div className="media">
                  <SpeciesIllus species={sp.id} imageUrl={sp.imageUrl} alt={sp.name} />
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
              <div className="eyebrow">
                <SectionIcon name="compass" />Avant le geste
              </div>
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
            <PermisCard onStart={openPermis} />
            <SeasonsCard />
            <ConditionsCard />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="page-container">
          <div className="section-header">
            <div>
              <div className="eyebrow">
                <SectionIcon name="rod" />Curation d'avril · matériel truite rivière
              </div>
              <h2>Équipement du moment</h2>
            </div>
            <a className="more" onClick={openShop}>
              Tout le catalogue →
            </a>
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
              <div className="eyebrow">
                <SectionIcon name="trophy" />Calendrier local
              </div>
              <h2>Concours à venir</h2>
            </div>
            <a className="more" onClick={openContests}>
              Tous les concours →
            </a>
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

      {user && recentCatches.length > 0 && (
        <section className="section">
          <div className="page-container">
            <div className="section-header">
              <div>
                <div className="eyebrow">
                  <SectionIcon name="carnet" />Votre carnet
                </div>
                <h2>Vos dernières prises</h2>
              </div>
              <a className="more" onClick={openAccount}>
                Voir tout →
              </a>
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
      )}
    </div>
  );
}
