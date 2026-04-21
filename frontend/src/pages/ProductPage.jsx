import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { QtyStepper } from '../components/ui/QtyStepper.jsx';
import { SeasonCalendar } from '../components/ui/SeasonCalendar.jsx';
import { Skeleton, SkeletonLine } from '../components/ui/Skeleton.jsx';
import { useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';
import { useProduct, useProducts } from '../lib/products.js';
import { useReferenceData } from '../lib/referenceData.js';
import { useToast } from '../lib/toast.js';

const TABS = [
  { id: 'specs', label: 'Caractéristiques' },
  { id: 'entretien', label: 'Entretien' },
  { id: 'livraison', label: 'Livraison & retours' },
  { id: 'avis', label: 'Avis' },
];

const CURRENT_MONTH = 4;

function RatingStars({ value }) {
  const rounded = Math.round(value);
  return (
    <div className="row" style={{ gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={16} className={i <= rounded ? '' : 'muted'} />
      ))}
    </div>
  );
}

function BreadcrumbNav({ category, productName }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-12)',
        color: 'var(--ink-mute)',
        marginBottom: 'var(--sp-5)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}
    >
      <Link to="/boutique" style={{ cursor: 'pointer' }}>
        Boutique
      </Link>
      {category && <> / {category.name}</>} / {productName}
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 'var(--sp-20) 0' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-44)',
              fontWeight: 500,
              margin: '0 0 var(--sp-4)',
            }}
          >
            Produit introuvable.
          </h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--sp-6)' }}>
            Cet article n'est plus au catalogue ou le lien est cassé.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
            Retour à la boutique
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const product = useProduct(id);
  const { loading } = useProducts();
  const { categories, species: speciesList } = useReferenceData();
  const { push } = useToast();
  const { add } = useCart();
  const [thumb, setThumb] = useState(0);
  const [tab, setTab] = useState('specs');
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});

  if (loading) {
    return (
      <div className="page">
        <div className="page-container">
          <div className="pd-layout" aria-busy="true">
            <div className="pd-gallery">
              <div className="pd-main-img">
                <Skeleton width="100%" height="100%" radius={0} />
              </div>
            </div>
            <div className="pd-details">
              <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
              <Skeleton width="80%" height={32} style={{ marginBottom: 16 }} />
              <SkeletonLine lines={3} />
              <div style={{ marginTop: 24 }}>
                <Skeleton width="30%" height={24} />
              </div>
              <div style={{ marginTop: 24 }}>
                <Skeleton width="50%" height={44} radius={8} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <NotFound />;

  const category = categories.find((c) => c.id === product.category);
  const stock = Number(product.stock) || 0;
  const soldOut = stock <= 0;
  const addToCart = () => {
    if (soldOut) return;
    const qtyCapped = Math.min(qty, stock);
    add(product, qtyCapped);
    push(
      qtyCapped === 1
        ? `Ajouté : ${product.name}`
        : `${qtyCapped} × ${product.name} ajouté${qtyCapped > 1 ? 's' : ''} au panier`,
    );
  };

  const tabContent = {
    specs: product.specs ? (
      <table className="spec-table">
        <tbody>
          {Object.entries(product.specs).map(([key, val]) => (
            <tr key={key}>
              <td>{key}</td>
              <td>{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className="soft">Les caractéristiques détaillées seront publiées prochainement.</p>
    ),
    entretien: (
      <p className="soft">
        Rincer à l'eau claire après chaque usage en mer. Séchage vertical à l'abri du soleil.
        Ne jamais stocker humide dans son étui.
      </p>
    ),
    livraison: (
      <div className="stack-sm">
        <p className="soft">Livraison Colissimo gratuite dès 120 €. Délai 48h en France métropolitaine.</p>
        <p className="soft">
          Retour gratuit sous 30 jours — produit non utilisé, emballage d'origine.
        </p>
      </div>
    ),
    avis: (
      <p className="soft">
        {product.reviews} avis vérifiés post-achat. Note moyenne {product.rating}/5.
      </p>
    ),
  };

  return (
    <div className="page">
      <div className="page-container">
        <BreadcrumbNav category={category} productName={product.name} />

        <div className="pd-layout">
          <div className="pd-gallery">
            <div className="pd-main-img">
              <Placeholder label={product.img} src={product.imageUrl} alt={product.name} />
            </div>
            <div className="pd-thumbs">
              {[0, 1, 2, 3].map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`pd-thumb ${i === thumb ? 'active' : ''}`}
                  onClick={() => setThumb(i)}
                  aria-label={`Vue ${i + 1}`}
                >
                  <Placeholder label={`vue ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="pd-details">
            <div className="eyebrow">
              {product.brand} · REF {product.sku}
            </div>
            <h1>{product.name}</h1>
            <p className="pd-desc">{product.description}</p>

            <div className="row" style={{ gap: 'var(--sp-3)' }}>
              <RatingStars value={product.rating ?? 0} />
              <span className="mono" style={{ fontSize: 'var(--fs-13)' }}>
                {(product.rating ?? 0).toFixed(1)}
              </span>
              <span className="mono" style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-mute)' }}>
                · {product.reviews ?? 0} avis vérifiés
              </span>
            </div>

            <div className="pd-price">
              {formatPrice(product.price)}
              {product.wasPrice && (
                <span className="was">{formatPrice(product.wasPrice)}</span>
              )}
              {product.wasPrice && <Badge accent>Promo</Badge>}
            </div>

            {product.variants && (
              <div className="pd-variants">
                {Object.entries(product.variants).map(([key, options]) => (
                  <div key={key} className="variant-row">
                    <span className="lbl">{key}</span>
                    <div className="variant-chips">
                      {options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className="chip"
                          aria-pressed={selectedVariants[key] === option}
                          onClick={() =>
                            setSelectedVariants((v) => ({ ...v, [key]: option }))
                          }
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pd-actions">
              <QtyStepper value={qty} onChange={setQty} max={stock} />
              <Button
                variant="primary"
                size="lg"
                onClick={addToCart}
                disabled={soldOut}
              >
                {soldOut ? 'Épuisé' : 'Ajouter au panier'}
              </Button>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-12)',
                color: soldOut ? 'var(--danger, #c0392b)' : 'var(--ink-mute)',
                marginTop: 'calc(-1 * var(--sp-3))',
              }}
            >
              {soldOut
                ? 'Rupture de stock — réapprovisionnement sous 10 jours.'
                : `Stock : ${stock} en magasin · Livraison estimée sous 48h`}
            </div>

            <div className="adapted-for">
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: 'var(--fs-20)',
                  margin: '0 0 var(--sp-4)',
                }}
              >
                Adaptée pour
              </h3>
              <div className="adapted-grid">
                {product.species.length > 0 && (
                  <div className="adapted-block">
                    <h4>Espèces</h4>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                      {product.species.map((sid) => {
                        const sp = speciesList.find((s) => s.id === sid);
                        return (
                          <span key={sid} className="chip">
                            {sp?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="adapted-block">
                  <h4>Eau</h4>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-14)' }}>
                    {product.water}
                  </div>
                </div>
                {product.months?.length > 0 && (
                  <div className="adapted-block" style={{ gridColumn: '1 / -1' }}>
                    <h4>Saison</h4>
                    <SeasonCalendar months={product.months} currentMonth={CURRENT_MONTH} />
                  </div>
                )}
              </div>
            </div>

            {product.story && (
              <div className="adapted-for">
                <div className="eyebrow">L'histoire</div>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: 'var(--fs-24)',
                    margin: 'var(--sp-2) 0 var(--sp-4)',
                  }}
                >
                  Montée à la main
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--sp-4)',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '4/3',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--hairline)',
                    }}
                  >
                    <Placeholder label="atelier — montage à la main" />
                  </div>
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      fontSize: 'var(--fs-14)',
                      lineHeight: 'var(--lh-body)',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    {product.story}
                  </div>
                </div>
              </div>
            )}

            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={tab === t.id ? 'active' : ''}
                  onClick={() => setTab(t.id)}
                >
                  {t.id === 'avis' ? `${t.label} (${product.reviews ?? 0})` : t.label}
                </button>
              ))}
            </div>
            <div className="tab-panel">{tabContent[tab]}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
