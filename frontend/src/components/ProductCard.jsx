import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Placeholder } from './ui/Placeholder.jsx';
import { useCart } from '../lib/cart.js';
import { formatPrice } from '../lib/format.js';
import { useReferenceData } from '../lib/referenceData.js';
import { useToast } from '../lib/toast.js';

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const { add } = useCart();
  const { categories, species: speciesList } = useReferenceData();
  const category = categories.find((c) => c.id === product.category);
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
        <Placeholder label={product.img} src={product.imageUrl} alt={product.name} />
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
