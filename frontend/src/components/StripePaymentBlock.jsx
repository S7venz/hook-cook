import { useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from './ui/Button.jsx';
import { formatPrice } from '../lib/format.js';

/**
 * Bloc de paiement Stripe générique réutilisable (permis, concours,
 * commande, etc.). Reçoit un clientSecret + publishableKey et un
 * callback `onSuccess(paymentIntent)`.
 *
 * Usage :
 *   <StripePaymentBlock
 *     clientSecret={cs}
 *     publishableKey={pk}
 *     amount={49.5}
 *     returnUrl={`${origin}/permis/confirmation/${ref}`}
 *     onSuccess={() => navigate(...)}
 *   />
 */

// Cache des promesses loadStripe par clé publique pour ne pas re-télécharger
// le script Stripe.js à chaque montage.
const stripePromiseCache = new Map();
function getStripePromise(publishableKey) {
  if (!publishableKey) return null;
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey);
}

function PayForm({ amount, returnUrl, onSuccess, onError, label = 'Payer' }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setError('');
    setProcessing(true);
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (payError) {
      setError(payError.message || 'Paiement refusé.');
      setProcessing(false);
      onError?.(payError);
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
      {error && <div className="error">{error}</div>}
      <Button
        variant="accent"
        size="lg"
        full
        onClick={handlePay}
        disabled={processing || !stripe || !elements}
      >
        {processing ? 'Traitement…' : `${label} ${formatPrice(amount)}`}
      </Button>
      <div className="mono soft" style={{ fontSize: 'var(--fs-12)' }}>
        Carte de test : 4242 4242 4242 4242 — date future quelconque, CVC 3 chiffres.
      </div>
    </div>
  );
}

export function StripePaymentBlock({
  clientSecret,
  publishableKey,
  amount,
  returnUrl,
  onSuccess,
  onError,
  label,
}) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);

  if (!stripePromise) {
    return (
      <div className="error">
        Stripe n'a pas pu être initialisé (clé publique manquante).
      </div>
    );
  }
  if (!clientSecret) {
    return <div className="error">Configuration de paiement introuvable.</div>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'stripe' } }}
    >
      <PayForm
        amount={amount}
        returnUrl={returnUrl}
        onSuccess={onSuccess}
        onError={onError}
        label={label}
      />
    </Elements>
  );
}
