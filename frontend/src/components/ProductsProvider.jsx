import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { ProductsContext } from '../lib/products.js';

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/products');
        if (!cancelled) {
          setError(null);
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const value = useMemo(
    () => ({ products, loading, error, refresh }),
    [products, loading, error, refresh],
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}
