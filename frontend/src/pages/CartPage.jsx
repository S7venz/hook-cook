import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Placeholder } from '../components/ui/Placeholder.jsx';
import { QtyStepper } from '../components/ui/QtyStepper.jsx';
import { cartTotals, useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';

export function CartPage() {
  const navigate = useNavigate();
  const { items, remove, updateQty } = useCart();
  const { subtotal, shipping, total } = cartTotals(items);
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="page-container">
          <EmptyState illus="cart" title={t('cart.empty')} description="">
            <Button variant="primary" size="lg" onClick={() => navigate('/boutique')}>
              {t('cart.emptyCta')}
            </Button>
          </EmptyState>
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
          {t('cart.title')}
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
                    {t('cart.remove')}
                  </button>
                </div>
                <div className="price">
                  {formatPrice(item.product.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>{t('cart.title')}</h3>
            <div className="summary-row">
              <span>{t('cart.subtotal')}</span>
              <span className="val">{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>
                {t('cart.shipping')}{' '}
                {subtotal >= 120 && (
                  <span className="mono soft" style={{ fontSize: 11 }}>
                    {t('cart.shippingFree').toLowerCase()}
                  </span>
                )}
              </span>
              <span className="val">
                {shipping === 0 ? t('cart.shippingFree') : formatPrice(shipping)}
              </span>
            </div>
            <div className="promo-row">
              <input className="input" placeholder={t('cart.promoCode')} />
              <Button variant="ghost" size="sm">
                {t('cart.promoApply')}
              </Button>
            </div>
            <div className="summary-row total">
              <span>{t('cart.total')}</span>
              <span className="val">{formatPrice(total)}</span>
            </div>
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <Button
                variant="primary"
                size="lg"
                full
                onClick={() => navigate('/checkout')}
              >
                {t('cart.checkout')}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
