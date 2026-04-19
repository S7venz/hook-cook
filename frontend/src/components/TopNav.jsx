import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon.jsx';
import { useAuth } from '../lib/auth.js';
import { cartTotals, useCart } from '../lib/cart.js';

const LINKS = [
  { to: '/boutique', label: 'Boutique' },
  { to: '/permis', label: 'Permis' },
  { to: '/concours', label: 'Concours' },
];

export function TopNav() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { count } = cartTotals(items);
  const { user } = useAuth();

  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="brand" aria-label="Hook & Cook — accueil">
          Hook &amp; Cook<span className="dot" />
          <small>Perpignan</small>
        </Link>

        <nav className="topnav-links" aria-label="Navigation principale">
          {LINKS.map((link) => (
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
            aria-label="Rechercher dans la boutique"
            type="button"
            onClick={() => navigate('/boutique')}
          >
            <Icon name="search" />
          </button>
          <Link
            to={user ? '/compte' : '/connexion'}
            className="icon-btn"
            aria-label={user ? `Compte de ${user.firstName}` : 'Se connecter'}
            title={user ? `Compte de ${user.firstName}` : 'Se connecter'}
          >
            <Icon name="user" />
          </Link>
          <Link
            to="/panier"
            className="icon-btn"
            aria-label={count > 0 ? `Panier · ${count} article${count > 1 ? 's' : ''}` : 'Panier'}
          >
            <Icon name="cart" />
            {count > 0 && <span className="badge-count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
