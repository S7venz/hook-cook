import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon.jsx';
import { LanguageSwitcher } from './LanguageSwitcher.jsx';
import { useAuth } from '../lib/auth.js';
import { cartTotals, useCart } from '../lib/cart.js';
import { useTheme } from '../lib/theme.js';

export function TopNav() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { count } = cartTotals(items);
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();

  const links = [
    { to: '/boutique', label: t('nav.shop') },
    { to: '/permis', label: t('nav.permits') },
    { to: '/concours', label: t('nav.contests') },
    { to: '/challenges', label: t('nav.challenges') },
  ];

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand" aria-label={t('nav.brand')}>
          Hook &amp; Cook<span className="dot" />
          <small>Perpignan</small>
        </Link>

        <nav className="topnav-links" aria-label={t('nav.main')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="topnav-actions">
          <button
            className="icon-btn"
            aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            type="button"
            onClick={toggle}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <LanguageSwitcher />
          <button
            className="icon-btn"
            aria-label={t('nav.search')}
            type="button"
            onClick={() => navigate('/boutique')}
          >
            <Icon name="search" />
          </button>
          <Link
            to={user ? '/compte' : '/connexion'}
            className="icon-btn"
            aria-label={user ? t('nav.account', { name: user.firstName }) : t('nav.login')}
            title={user ? t('nav.account', { name: user.firstName }) : t('nav.login')}
          >
            <Icon name="user" />
          </Link>
          <Link
            to="/panier"
            className="icon-btn"
            aria-label={
              count > 0
                ? t('nav.cartWithCount', { count })
                : t('nav.cart')
            }
          >
            <Icon name="cart" />
            {count > 0 && <span className="badge-count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
