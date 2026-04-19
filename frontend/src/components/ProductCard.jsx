import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Placeholder } from './ui/Placeholder.jsx';
import { categories, species as speciesList } from '../data/catalog.js';
import { formatPrice } from '../lib/format.js';
import { useToast } from '../lib/toast.js';

export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const category = categories.find((c) => c.id === product.category);
  const tags = product.species
    .map((id) => speciesList.find((s) => s.id === id)?.name)
    .filter(Boolean);

  const open = () => navigate(`/boutique/${product.id}`);

  const handleAdd = (event) => {
    event.stopPropagation();
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
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={handleKey}
    >
      <div className="card-media">
        <Placeholder label={product.img} />
        <div className="tag-row">
          {product.wasPrice && <Badge accent>Promo</Badge>}
          {product.stock < 10 && <Badge status="pending">Stock {product.stock}</Badge>}
        </div>
        <div className="add-overlay">
          <Button variant="primary" size="sm" onClick={handleAdd} full>
            Ajouter au panier
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
