import { Link, NavLink } from 'react-router-dom';
import { Icon } from './ui/Icon.jsx';

const LINKS = [
  { to: '/boutique', label: 'Boutique' },
  { to: '/permis', label: 'Permis' },
  { to: '/concours', label: 'Concours' },
];

export function TopNav() {
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
          <button className="icon-btn" aria-label="Rechercher" type="button">
            <Icon name="search" />
          </button>
          <button className="icon-btn" aria-label="Mon compte" type="button">
            <Icon name="user" />
          </button>
          <button className="icon-btn" aria-label="Panier" type="button">
            <Icon name="cart" />
          </button>
        </div>
      </div>
    </header>
  );
}
