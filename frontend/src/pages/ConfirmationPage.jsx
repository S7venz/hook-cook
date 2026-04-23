import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { FishRain } from '../components/decor/FishRain.jsx';
import { HookStamp } from '../components/decor/HookStamp.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { downloadInvoice } from '../lib/invoice.js';
import { findOrder, useOrders } from '../lib/orders.js';
import { useToast } from '../lib/toast.js';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orders, refresh } = useOrders();
  const { token } = useAuth();
  const { push } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [polledOrder, setPolledOrder] = useState(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const fromContext = findOrder(orders, orderId);
  const order = polledOrder ?? fromContext;
  const isPending = order?.status === 'pending';
  const isFailed = order?.status === 'payment_failed';

  // Polling tant que le webhook Stripe n'a pas confirmé (max 15 tentatives × 2s = 30s).
  // À chaque tentative on appelle /api/payments/sync : ça interroge Stripe en
  // direct et bascule la commande paid → pas besoin de Stripe CLI en dev local.
  // Si le webhook arrive entre-temps, le sync devient un no-op (idempotent).
  useEffect(() => {
    if (!token || !orderId) return undefined;
    if (order && !isPending) return undefined;
    if (pollAttempts >= 15) return undefined;

    const timer = setTimeout(async () => {
      try {
        // POST sync force la synchro avec Stripe ; fallback sur GET si l'endpoint
        // n'est pas dispo (ex: backend pas encore rebuild après l'upgrade Stripe).
        let fresh = null;
        try {
          const synced = await api.post(`/api/payments/sync/${orderId}`, {}, { token });
          fresh = synced?.order ?? synced;
        } catch {
          fresh = await api.get(`/api/orders/${orderId}`, { token });
        }
        if (fresh) {
          setPolledOrder(fresh);
          if (fresh.status !== 'pending') refresh?.();
        }
      } catch (err) {
        console.warn('Polling commande :', err?.message);
      } finally {
        setPollAttempts((n) => n + 1);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [token, orderId, order, isPending, pollAttempts, refresh]);

  const handleDownload = async () => {
    if (!order || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoice(order.id, token);
    } catch (err) {
      push(err?.message ?? 'Téléchargement impossible.');
    } finally {
      setDownloading(false);
    }
  };

  if (!order) {
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
            Commande introuvable.
          </h1>
          <Button variant="primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (isPending) {
    const timedOut = pollAttempts >= 15;
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
            {timedOut ? 'Paiement en cours de validation' : 'Confirmation du paiement…'}
          </h1>
          <p className="soft">
            {timedOut
              ? 'Le paiement met plus de temps que prévu à se confirmer. Vous recevrez un email dès qu\'il est validé — vous pouvez quitter cette page sans risque.'
              : 'Stripe valide votre paiement. Cela prend généralement quelques secondes.'}
          </p>
          <p className="mono soft" style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--fs-12)' }}>
            Commande {order.id} · tentative {Math.min(pollAttempts + 1, 15)}/15
          </p>
          {timedOut && (
            <div style={{ marginTop: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Recharger
              </Button>
              <Button variant="primary" onClick={() => navigate('/compte')}>
                Voir mes commandes
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isFailed) {
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
            Paiement refusé.
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            Votre commande {order.id} n'a pas pu être réglée. Vous pouvez retenter depuis votre panier.
          </p>
          <Button variant="primary" onClick={() => navigate('/panier')}>
            Retour au panier
          </Button>
        </div>
      </div>
    );
  }

  const deliveryDate = new Date(order.date);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(deliveryDate);

  return (
    <div className="page">
      <FishRain count={32} duration={3800} />
      <div className="page-container confirm-hero" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <HookStamp label="COMMANDE VALIDÉE" size={104} />
        </div>
        <h1>Merci — on prépare vos articles.</h1>
        <div className="ref">
          Commande n° <span className="mono">{order.id}</span> · confirmation envoyée à{' '}
          <span className="mono">{order.email}</span>
        </div>
        <div
          style={{
            marginTop: 'var(--sp-8)',
            padding: 'var(--sp-6)',
            background: 'var(--bg-elev)',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--hairline)',
            textAlign: 'left',
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            Prochaines étapes
          </div>
          <ol style={{ paddingLeft: '1.2em', margin: 0 }}>
            <li className="soft">Email de confirmation dans les 2 minutes.</li>
            <li className="soft">Numéro de suivi Colissimo sous 24h.</li>
            <li className="soft">
              Livraison estimée <strong>{deliveryLabel}</strong>.
            </li>
          </ol>
        </div>
        <div
          style={{
            marginTop: 'var(--sp-6)',
            display: 'flex',
            gap: 'var(--sp-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="ghost" onClick={handleDownload} disabled={downloading}>
            <Icon name="download" size={16} />
            {downloading ? 'Préparation…' : 'Télécharger la facture'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/compte')}>
            Voir mes commandes
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
