import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../components/ui/Button.jsx';
import { cartTotals, useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';
import { useOrders } from '../lib/orders.js';
import {
  firstError,
  validateAddress,
  validateCity,
  validateEmail,
  validateName,
  validatePhone,
  validatePostalCode,
} from '../lib/validation.js';

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

// Cache la promesse de loadStripe par clé publique pour éviter
// de recharger le script Stripe.js à chaque re-render.
const stripePromiseCache = new Map();
function getStripePromise(publishableKey) {
  if (!publishableKey) return null;
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey);
}

function StripePaymentForm({ orderRef, total, onSuccess, onError, processing, setProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setStripeError('');
    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // 3DS et Apple/Google Pay redirigent ici. En cas de succès sans 3DS,
        // confirmPayment retourne directement avec paymentIntent.status = 'succeeded'.
        return_url: `${window.location.origin}/confirmation/${orderRef}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setStripeError(error.message || 'Paiement refusé.');
      setProcessing(false);
      onError?.(error);
      return;
    }
    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onSuccess?.(paymentIntent);
    } else {
      setProcessing(false);
    }
  };

  return (
    <div className="stack-md">
      <div className="card" style={{ padding: 'var(--sp-5)' }}>
        <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
          Carte bancaire · Stripe (mode test)
        </div>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {stripeError && <div className="error">{stripeError}</div>}
      <Button
        variant="accent"
        size="lg"
        onClick={handlePay}
        disabled={processing || !stripe || !elements}
      >
        {processing ? 'Traitement…' : `Payer ${formatPrice(total)}`}
      </Button>
      <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
        Carte de test : 4242 4242 4242 4242 — date future quelconque, CVC 3 chiffres.
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { createOrder } = useOrders();
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [address, setAddress] = useState('');
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [shippingId, setShippingId] = useState('standard');

  const [error, setError] = useState('');

  // État du paiement (créé à l'entrée step 3)
  const [paymentSetup, setPaymentSetup] = useState(null);
  // { orderRef, clientSecret, publishableKey, mockPayment, total }
  const [preparing, setPreparing] = useState(false);

  const { subtotal } = cartTotals(items);
  const shippingMode = SHIPPING_MODES.find((m) => m.id === shippingId);
  const shippingPrice = shippingMode ? shippingMode.getPrice(subtotal) : 0;
  const total = subtotal + shippingPrice;

  const stripePromise = useMemo(
    () => getStripePromise(paymentSetup?.publishableKey),
    [paymentSetup?.publishableKey],
  );

  // Si le panier devient vide après création d'ordre (ex: paiement OK), on évite l'effet "panier vide"
  useEffect(() => {
    if (paymentSetup && items.length === 0) return;
  }, [paymentSetup, items.length]);

  if (items.length === 0 && !paymentSetup) {
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

  const validateStep = (n) => {
    if (n === 1) {
      return firstError(
        validateEmail(email),
        validateName(firstName, { field: 'Le prénom' }),
        validateName(lastName, { field: 'Le nom' }),
        validatePhone(phone),
      );
    }
    if (n === 2) {
      return firstError(
        validateAddress(address),
        validatePostalCode(postal),
        validateCity(city),
      );
    }
    return null;
  };

  const goNext = (next) => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(next);
  };

  // Création de la commande + récupération clientSecret (au passage step 2 → 3)
  const startPayment = async () => {
    const err = validateStep(2);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setPreparing(true);
    try {
      const result = await createOrder({
        items: items.map((it) => ({
          product: { id: it.product.id },
          qty: it.qty,
        })),
        email,
        shipping: shippingPrice,
        addressLine: address,
        postalCode: postal,
        city,
        shippingMode: shippingMode.title,
      });

      if (result.mockPayment) {
        // Pas de Stripe configuré côté backend : ordre déjà payée, on saute le step 3
        clear();
        navigate(`/confirmation/${result.order.id}`);
        return;
      }

      if (!result.clientSecret) {
        throw new Error('Configuration de paiement introuvable.');
      }

      setPaymentSetup({
        orderRef: result.order.id,
        clientSecret: result.clientSecret,
        publishableKey: result.publishableKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY,
        total: result.order.total,
      });
      setStep(3);
    } catch (err2) {
      setError(err2?.message ?? 'Impossible d\'initialiser le paiement.');
    } finally {
      setPreparing(false);
    }
  };

  const onPaymentSuccess = () => {
    clear();
    navigate(`/confirmation/${paymentSetup.orderRef}`);
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
                    placeholder="prenom.nom@email.fr"
                    autoComplete="email"
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
                      placeholder="Prénom"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="field">
                    <label>Nom</label>
                    <input
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nom"
                      autoComplete="family-name"
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
                    placeholder="06 12 34 56 78"
                    autoComplete="tel"
                  />
                </div>
                {error && <div className="error">{error}</div>}
                <Button variant="primary" size="lg" onClick={() => goNext(2)}>
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
                    placeholder="14 rue de la République"
                    autoComplete="street-address"
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
                      placeholder="66000"
                      autoComplete="postal-code"
                    />
                  </div>
                  <div className="field">
                    <label>Ville</label>
                    <input
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Perpignan"
                      autoComplete="address-level2"
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
                {error && <div className="error">{error}</div>}
                <div className="row">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    ← Retour
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={startPayment}
                    disabled={preparing}
                  >
                    {preparing ? 'Préparation…' : 'Continuer vers le paiement →'}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && paymentSetup && (
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
                {stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: paymentSetup.clientSecret,
                      appearance: { theme: 'stripe' },
                    }}
                  >
                    <StripePaymentForm
                      orderRef={paymentSetup.orderRef}
                      total={paymentSetup.total}
                      processing={processing}
                      setProcessing={setProcessing}
                      onSuccess={onPaymentSuccess}
                      onError={() => undefined}
                    />
                  </Elements>
                ) : (
                  <div className="error">
                    Stripe n'a pas pu être initialisé (clé publique manquante).
                  </div>
                )}
                {error && <div className="error">{error}</div>}
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
