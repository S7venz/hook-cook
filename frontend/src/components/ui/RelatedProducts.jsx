import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { ProductCard } from '../ProductCard.jsx';

/**
 * Carrousel "Souvent acheté avec..." sur la fiche produit. Hit le
 * endpoint /api/products/:id/related qui combine co-occurrence dans
 * order_items + fallback catégorie.
 */
export function RelatedProducts({ productId, limit = 4 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(
          `/api/products/${encodeURIComponent(productId)}/related?limit=${limit}`,
        );
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, limit]);

  if (loading || products.length === 0) return null;

  return (
    <section
      style={{
        marginTop: 'var(--sp-12)',
        paddingTop: 'var(--sp-8)',
        borderTop: '1px solid var(--hairline)',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
        Souvent acheté avec
      </div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: 'var(--fs-32)',
          letterSpacing: '-0.02em',
          margin: '0 0 var(--sp-6)',
        }}
      >
        Ils complètent ce produit
      </h2>
      <div className="catalog-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
