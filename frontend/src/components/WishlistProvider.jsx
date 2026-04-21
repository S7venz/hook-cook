import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { WishlistContext } from '../lib/wishlist.js';

/**
 * Contexte wishlist — persiste en BDD côté serveur quand le user est
 * connecté. Si pas connecté, la wishlist est vide (on pourrait aussi
 * la persister en localStorage puis la merger au login, mais la
 * simplicité l'emporte ici).
 */
export function WishlistProvider({ children }) {
  const { token, user } = useAuth();
  const [productIds, setProductIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(async () => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token || !user) {
      // Reset conditionnel pour éviter un setState redondant et
      // la cascade de re-renders qui en découle.
      setProductIds((prev) => (prev.size === 0 ? prev : new Set()));
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      setLoading(true);
      try {
        const list = await api.get('/api/wishlist', { token });
        if (!cancelled) {
          setProductIds(new Set((list ?? []).map((item) => item.productId)));
        }
      } catch {
        if (!cancelled) setProductIds((prev) => (prev.size === 0 ? prev : new Set()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, nonce]);

  const has = useCallback((productId) => productIds.has(productId), [productIds]);

  const toggle = useCallback(
    async (productId) => {
      if (!token || !user) return { ok: false, reason: 'not_logged_in' };
      const currentlyIn = productIds.has(productId);
      // Optimistic update
      setProductIds((prev) => {
        const next = new Set(prev);
        if (currentlyIn) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (currentlyIn) {
          await api.del(`/api/wishlist/${encodeURIComponent(productId)}`, { token });
        } else {
          await api.post('/api/wishlist', { productId }, { token });
        }
        return { ok: true, added: !currentlyIn };
      } catch (err) {
        // Rollback
        setProductIds((prev) => {
          const next = new Set(prev);
          if (currentlyIn) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { ok: false, error: err?.message };
      }
    },
    [token, user, productIds],
  );

  const value = useMemo(
    () => ({ productIds, loading, has, toggle, refresh }),
    [productIds, loading, has, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
