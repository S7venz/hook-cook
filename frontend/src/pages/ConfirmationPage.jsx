import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { findOrder, useOrders } from '../lib/orders.js';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orders } = useOrders();
  const order = findOrder(orders, orderId);

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

  const deliveryDate = new Date(order.date);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(deliveryDate);

  return (
    <div className="page">
      <div className="page-container confirm-hero" style={{ maxWidth: 680 }}>
        <div className="tick">
          <Icon name="check" size={32} />
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
