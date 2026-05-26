import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { FishRain } from '../components/decor/FishRain.jsx';
import { HookStamp } from '../components/decor/HookStamp.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { downloadInvoice } from '../lib/invoice.js';
import { findOrder, useOrders } from '../lib/orders.js';
import { useToast } from '../lib/toast.js';

const MAX_POLL = 15;

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orders, refresh } = useOrders();
  const { token } = useAuth();
  const { push } = useToast();
  const { t, i18n } = useTranslation();
  const [downloading, setDownloading] = useState(false);
  const [polledOrder, setPolledOrder] = useState(null);
  const [pollAttempts, setPollAttempts] = useState(0);
  const fromContext = findOrder(orders, orderId);
  const order = polledOrder ?? fromContext;
  const isPending = order?.status === 'pending';
  const isFailed = order?.status === 'payment_failed';

  useEffect(() => {
    if (!token || !orderId) return undefined;
    if (order && !isPending) return undefined;
    if (pollAttempts >= MAX_POLL) return undefined;

    const timer = setTimeout(async () => {
      try {
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
        console.warn('Polling order:', err?.message);
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
      push(err?.message ?? t('errors.generic'));
    } finally {
      setDownloading(false);
    }
  };

  if (!order) {
    return (
      <div className="page">
        <div className="page-container" style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-44)', fontWeight: 400, margin: '0 0 var(--sp-4)' }}>
            {t('confirmation.notFound')}
          </h1>
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('confirmation.home')}
          </Button>
        </div>
      </div>
    );
  }

  if (isPending) {
    const timedOut = pollAttempts >= MAX_POLL;
    return (
      <div className="page">
        <div className="page-container" style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-44)', fontWeight: 400, margin: '0 0 var(--sp-4)' }}>
            {timedOut ? t('confirmation.pendingTimedOutTitle') : t('confirmation.pendingTitle')}
          </h1>
          <p className="soft">
            {timedOut ? t('confirmation.pendingTimedOutSubtitle') : t('confirmation.pendingSubtitle')}
          </p>
          <p className="mono soft" style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--fs-12)' }}>
            {t('confirmation.pollAttempt', { id: order.id, n: Math.min(pollAttempts + 1, MAX_POLL), max: MAX_POLL })}
          </p>
          {timedOut && (
            <div style={{ marginTop: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center' }}>
              <Button variant="ghost" onClick={() => window.location.reload()}>
                {t('confirmation.reload')}
              </Button>
              <Button variant="primary" onClick={() => navigate('/compte')}>
                {t('confirmation.myOrders')}
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
        <div className="page-container" style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--fs-44)', fontWeight: 400, margin: '0 0 var(--sp-4)' }}>
            {t('confirmation.failedTitle')}
          </h1>
          <p className="soft" style={{ marginBottom: 'var(--sp-6)' }}>
            {t('confirmation.failedSubtitle', { id: order.id })}
          </p>
          <Button variant="primary" onClick={() => navigate('/panier')}>
            {t('confirmation.backToCart')}
          </Button>
        </div>
      </div>
    );
  }

  const deliveryDate = new Date(order.date);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryLabel = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(deliveryDate);

  return (
    <div className="page">
      <FishRain count={32} duration={3800} />
      <div className="page-container confirm-hero" style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <HookStamp label={t('confirmation.stamp')} size={104} />
        </div>
        <h1>{t('confirmation.title')}</h1>
        <div className="ref">
          {t('confirmation.reference')} <span className="mono">{order.id}</span> · {t('confirmation.confirmationSentTo')}{' '}
          <span className="mono">{order.email}</span>
        </div>
        <div style={{ marginTop: 'var(--sp-8)', padding: 'var(--sp-6)', background: 'var(--bg-elev)', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', textAlign: 'left' }}>
          <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            {t('confirmation.nextSteps')}
          </div>
          <ol style={{ paddingLeft: '1.2em', margin: 0 }}>
            <li className="soft">{t('confirmation.step1')}</li>
            <li className="soft">{t('confirmation.step2')}</li>
            <li className="soft">{t('confirmation.step3', { date: deliveryLabel })}</li>
          </ol>
        </div>
        <div style={{ marginTop: 'var(--sp-6)', display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={handleDownload} disabled={downloading}>
            <Icon name="download" size={16} />
            {downloading ? t('confirmation.downloadPreparing') : t('confirmation.downloadInvoice')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/compte')}>
            {t('confirmation.myOrders')}
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('confirmation.home')}
          </Button>
        </div>
      </div>
    </div>
  );
}
