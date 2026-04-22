import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Icon } from './ui/Icon.jsx';
import { Placeholder } from './ui/Placeholder.jsx';
import { useAuth } from '../lib/auth.js';
import { useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';
import { useReferenceData } from '../lib/referenceData.js';
import { useToast } from '../lib/toast.js';
import { useWishlist } from '../lib/wishlist.js';

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const { add } = useCart();
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const { categories, species: speciesList } = useReferenceData();
  const category = categories.find((c) => c.id === product.category);
  const favorited = has(product.id);

  const handleFavorite = async (event) => {
    event.stopPropagation();
    if (!user) {
      push('Connectez-vous pour enregistrer vos favoris.');
      navigate('/connexion');
      return;
    }
    const result = await toggle(product.id);
    if (result.ok) {
      push(result.added ? 'Ajouté aux favoris' : 'Retiré des favoris');
    }
  };
  const tags = product.species
    .map((id) => speciesList.find((s) => s.id === id)?.name)
    .filter(Boolean);

  const stock = Number(product.stock) || 0;
  const soldOut = stock <= 0;

  const open = () => navigate(`/boutique/${product.id}`);

  const handleAdd = (event) => {
    event.stopPropagation();
    if (soldOut) return;
    add(product, 1);
    push(`Ajouté : ${product.name}`);
  };

  const handleKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open();
    }
  };

  return (
    <div
      className={`product-card ${soldOut ? 'sold-out' : ''}`.trim()}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKey}
    >
      <div className="card-media">
        <Placeholder
          label={product.img}
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
        />
        <button
          type="button"
          className={`card-favorite ${favorited ? 'active' : ''}`.trim()}
          onClick={handleFavorite}
          aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          aria-pressed={favorited}
        >
          <Icon name="heart" size={18} />
        </button>
        <div className="tag-row">
          {product.wasPrice && <Badge accent>Promo</Badge>}
          {soldOut ? (
            <Badge status="rejected">Épuisé</Badge>
          ) : (
            stock < 10 && <Badge status="pending">Stock {stock}</Badge>
          )}
        </div>
        <div className="add-overlay">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            full
            disabled={soldOut}
          >
            {soldOut ? 'Épuisé' : 'Ajouter au panier'}
          </Button>
        </div>
      </div>
      <div className="info">
        <div className="cat">{category?.name}</div>
        <div className="name">{product.name}</div>
        <div className="price-row">
          <span className="price">{formatPrice(product.price)}</span>
          <span className="species-tag">{tags.slice(0, 2).join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}
