import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { QtyStepper } from '../components/ui/QtyStepper.jsx';
import { cartTotals, useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';

export function CartPage() {
  const navigate = useNavigate();
  const { items, remove, updateQty } = useCart();
  const { subtotal, shipping, total } = cartTotals(items);

  if (items.length === 0) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, var(--fs-64))',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            Votre panier attend.
          </div>
          <p className="soft" style={{ margin: 'var(--sp-5) auto 0', maxWidth: '40ch' }}>
            Rien à préparer pour l'instant. Commencez par une espèce.
          </p>
          <div style={{ marginTop: 'var(--sp-6)' }}>
            <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
              Parcourir la boutique
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 'var(--fs-44)',
            letterSpacing: '-0.025em',
            margin: '0 0 var(--sp-6)',
          }}
        >
          Votre panier
        </h1>
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item, index) => (
              <div className="cart-item" key={item.product.id}>
                <div className="thumb">
                  <Placeholder
                    src={item.product.imageUrl}
                    label={item.product.img ?? item.product.name}
                    alt={item.product.name}
                  />
                </div>
                <div className="details">
                  <div className="name">{item.product.name}</div>
                  <div className="variant">
                    {item.product.sku} · {item.product.brand}
                  </div>
                  <QtyStepper
                    value={item.qty}
                    onChange={(qty) => updateQty(index, qty)}
                    max={Number(item.product.stock) || 99}
                  />
                  <button
                    type="button"
                    className="remove"
                    onClick={() => remove(index)}
                  >
                    Retirer
                  </button>
                </div>
                <div className="price">
                  {formatPrice(item.product.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>Récapitulatif</h3>
            <div className="summary-row">
              <span>Sous-total</span>
              <span className="val">{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>
                Livraison{' '}
                {subtotal >= 120 && (
                  <span className="mono soft" style={{ fontSize: 11 }}>
                    offerte
                  </span>
                )}
              </span>
              <span className="val">
                {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
              </span>
            </div>
            <div className="promo-row">
              <input className="input" placeholder="Code promo" />
              <Button variant="ghost" size="sm">
                Appliquer
              </Button>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="val">{formatPrice(total)}</span>
            </div>
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <Button
                variant="primary"
                size="lg"
                full
                onClick={() => navigate('/checkout')}
              >
                Passer commande
              </Button>
            </div>
            <div
              className="mono soft"
              style={{
                fontSize: 'var(--fs-12)',
                textAlign: 'center',
                marginTop: 'var(--sp-3)',
              }}
            >
              Paiement sécurisé Stripe · Retour gratuit 30 j
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
