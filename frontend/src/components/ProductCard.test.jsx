import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

// On isole la logique d'affichage de ProductCard : router, i18n et contextes
// (panier, auth, favoris, toast, référentiels) sont mockés, les composants
// enfants stubbés. Le rendu devient déterministe.
vi.mock('react-router-dom', () => ({
  useNavigate: () => () => {},
  Link: ({ children, to, className }) => (
    <a href={to} className={className}>{children}</a>
  ),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => (opts && opts.count != null ? `${key} (${opts.count})` : key),
  }),
}));
vi.mock('../lib/auth.js', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../lib/cart.js', () => ({ useCart: () => ({ add: vi.fn() }) }));
vi.mock('../lib/wishlist.js', () => ({ useWishlist: () => ({ has: () => false, toggle: vi.fn() }) }));
vi.mock('../lib/toast.js', () => ({ useToast: () => ({ push: vi.fn() }) }));
vi.mock('../lib/referenceData.js', () => ({
  useReferenceData: () => ({
    categories: [{ id: 'cannes', name: 'Cannes' }],
    species: [{ id: 'truite', name: 'Truite' }],
  }),
}));

vi.mock('./ui/Badge.jsx', () => ({
  Badge: ({ children, status, accent }) => (
    <span className={['badge', status && `badge-${status}`, accent && 'badge-accent'].filter(Boolean).join(' ')}>
      {children}
    </span>
  ),
}));
vi.mock('./ui/Button.jsx', () => ({
  Button: ({ children, disabled, onClick }) => (
    <button disabled={disabled} onClick={onClick}>{children}</button>
  ),
}));
vi.mock('./ui/Icon.jsx', () => ({ Icon: () => <svg /> }));
vi.mock('./ui/Placeholder.jsx', () => ({ Placeholder: ({ alt }) => <img alt={alt} /> }));
vi.mock('./decor/ProductSticker.jsx', () => ({ ProductSticker: () => <span className="sticker" /> }));

import { ProductCard } from './ProductCard.jsx';

const baseProduct = {
  id: 'hc-sauvage-9-5',
  name: 'Canne Sauvage 9ft',
  category: 'cannes',
  species: ['truite'],
  price: 189.0,
  stock: 24,
  img: 'canne.jpg',
  imageUrl: null,
};

describe('ProductCard', () => {
  it('affiche le nom, la catégorie et le prix formaté', () => {
    const { container } = render(<ProductCard product={baseProduct} />);
    expect(container.querySelector('.name').textContent).toBe('Canne Sauvage 9ft');
    expect(container.querySelector('.cat').textContent).toBe('Cannes');
    expect(container.querySelector('.price').textContent).toContain('189');
  });

  it('passe la carte en rupture et désactive l\'ajout quand le stock est à 0', () => {
    const { container } = render(<ProductCard product={{ ...baseProduct, stock: 0 }} />);
    expect(container.querySelector('.product-card').className).toContain('sold-out');
    expect(container.querySelector('.add-overlay button').disabled).toBe(true);
  });

  it('affiche un badge stock faible quand le stock est sous 10', () => {
    const { container } = render(<ProductCard product={{ ...baseProduct, stock: 3 }} />);
    expect(container.querySelector('.badge-pending')).not.toBeNull();
  });
});
