import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { cartTotals, useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';
import { useOrders } from '../lib/orders.js';

const STEPS = ['Coordonnées', 'Livraison', 'Paiement'];

const SHIPPING_MODES = [
  {
    id: 'standard',
    title: 'Standard Colissimo',
    desc: 'Livraison 48h',
    getPrice: (subtotal) => (subtotal >= 120 ? 0 : 5.9),
  },
  {
    id: 'express',
    title: 'Chronopost 24h',
    desc: 'Livraison le lendemain avant 13h',
    getPrice: () => 12.9,
  },
  {
    id: 'relay',
    title: 'Point relais',
    desc: 'À 5 min de chez vous',
    getPrice: () => 3.9,
  },
];

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const cls = `step ${step === n ? 'current' : step > n ? 'done' : ''}`.trim();
        return (
          <div key={label} className={cls}>
            <span className="pill">{step > n ? '✓' : n}</span>
            <span className="lbl">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { createOrder } = useOrders();
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  const [email, setEmail] = useState('claude@example.fr');
  const [firstName, setFirstName] = useState('Claude');
  const [lastName, setLastName] = useState('Desprez');
  const [phone, setPhone] = useState('06 00 00 00 00');

  const [address, setAddress] = useState('14 rue des Arènes');
  const [postal, setPostal] = useState('66000');
  const [city, setCity] = useState('Perpignan');
  const [shippingId, setShippingId] = useState('standard');

  const [card, setCard] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');

  const { subtotal } = cartTotals(items);
  const shippingMode = SHIPPING_MODES.find((m) => m.id === shippingId);
  const shippingPrice = shippingMode ? shippingMode.getPrice(subtotal) : 0;
  const total = subtotal + shippingPrice;

  if (items.length === 0) {
    return (
      <div className="page">
        <div
          className="page-container"
          style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-44)',
              fontWeight: 400,
              margin: '0 0 var(--sp-4)',
            }}
          >
            Votre panier est vide.
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            Ajoutez au moins un article avant de passer commande.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
            Parcourir la boutique
          </Button>
        </div>
      </div>
    );
  }

  const pay = () => {
    setProcessing(true);
    setTimeout(() => {
      const order = createOrder({
        items,
        subtotal,
        shipping: shippingPrice,
        total,
        email,
        address: { line: address, postal, city },
        shippingMode: shippingMode.title,
      });
      clear();
      navigate(`/confirmation/${order.id}`);
    }, 1200);
  };

  return (
    <div className="page">
      <div className="page-container" style={{ maxWidth: 900 }}>
        <Stepper step={step} />

        <div
          className="checkout-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--sp-8)' }}
        >
          <div>
            {step === 1 && (
              <div className="stack-md">
                <h2
                  className="disp"
                  style={{
                    fontSize: 'var(--fs-32)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Vos coordonnées
                </h2>
                <div className="field">
                  <label>
                    Email<span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}
                >
                  <div className="field">
                    <label>Prénom</label>
                    <input
                      className="input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Nom</label>
                    <input
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>
                    Téléphone{' '}
                    <span className="soft mono" style={{ fontSize: 11 }}>
                      (pour le livreur)
                    </span>
                  </label>
                  <input
                    className="input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!email || !firstName || !lastName}
                >
                  Continuer vers la livraison →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="stack-md">
                <h2
                  className="disp"
                  style={{
                    fontSize: 'var(--fs-32)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Livraison
                </h2>
                <div className="field">
                  <label>Adresse</label>
                  <input
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--sp-3)' }}
                >
                  <div className="field">
                    <label>Code postal</label>
                    <input
                      className="input"
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Ville</label>
                    <input
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
                    Mode de livraison
                  </div>
                  <div className="radio-card-group">
                    {SHIPPING_MODES.map((mode) => {
                      const price = mode.getPrice(subtotal);
                      return (
                        <div
                          key={mode.id}
                          className={`radio-card ${shippingId === mode.id ? 'selected' : ''}`}
                          onClick={() => setShippingId(mode.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setShippingId(mode.id);
                            }
                          }}
                        >
                          <div className="check" />
                          <div className="label-stack">
                            <div className="t">{mode.title}</div>
                            <div className="s">{mode.desc}</div>
                          </div>
                          <div className="price">
                            {price === 0 ? 'Offerte' : formatPrice(price)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="row">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    ← Retour
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setStep(3)}
                    disabled={!address || !postal || !city}
                  >
                    Continuer vers le paiement →
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="stack-md">
                <h2
                  className="disp"
                  style={{
                    fontSize: 'var(--fs-32)',
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Paiement
                </h2>
                <div className="card" style={{ padding: 'var(--sp-5)' }}>
                  <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
                    Carte bancaire · Stripe
                  </div>
                  <div className="field">
                    <label>Numéro de carte</label>
                    <input
                      className="input mono"
                      value={card}
                      onChange={(e) => setCard(e.target.value)}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--sp-3)',
                      marginTop: 'var(--sp-3)',
                    }}
                  >
                    <div className="field">
                      <label>Expiration</label>
                      <input
                        className="input mono"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>CVC</label>
                      <input
                        className="input mono"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    color: 'var(--ink-mute)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--fs-12)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  — ou —
                </div>
                <Button variant="ghost" size="lg" full>
                  Payer avec PayPal
                </Button>
                <div className="row">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    disabled={processing}
                  >
                    ← Retour
                  </Button>
                  <Button
                    variant="accent"
                    size="lg"
                    onClick={pay}
                    disabled={processing}
                  >
                    {processing ? 'Traitement…' : `Payer ${formatPrice(total)}`}
                  </Button>
                </div>
                <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
                  En validant, vous acceptez les CGV. Vos données sont chiffrées (TLS).
                </div>
              </div>
            )}
          </div>

          <aside className="summary" style={{ position: 'sticky', top: 88 }}>
            <h3>Récap</h3>
            <div className="stack-sm" style={{ marginBottom: 'var(--sp-3)' }}>
              {items.map((it) => (
                <div
                  key={it.product.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--sp-3)',
                    fontSize: 'var(--fs-13)',
                  }}
                >
                  <span>
                    {it.qty}× {it.product.name}
                  </span>
                  <span className="mono">
                    {formatPrice(it.product.price * it.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Sous-total</span>
              <span className="val">{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Livraison</span>
              <span className="val">
                {shippingPrice === 0 ? 'Offerte' : formatPrice(shippingPrice)}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="val">{formatPrice(total)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
