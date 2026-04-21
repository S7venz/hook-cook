import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

/**
 * Charge les avis d'un produit + l'éligibilité du user courant à en
 * laisser un, et expose create/remove avec refresh automatique.
 */
export function useProductReviews(productId) {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState({ eligible: false, reason: 'not_logged_in' });
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!productId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await api.get(
          `/api/products/${encodeURIComponent(productId)}/reviews`,
        );
        if (!cancelled) setReviews(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setReviews([]);
      }
      if (user && token) {
        try {
          const e = await api.get(
            `/api/products/${encodeURIComponent(productId)}/reviews/eligibility`,
            { token },
          );
          if (!cancelled) setEligibility(e);
        } catch {
          if (!cancelled) setEligibility({ eligible: false, reason: 'unknown' });
        }
      } else if (!cancelled) {
        setEligibility({ eligible: false, reason: 'not_logged_in' });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, token, user, nonce]);

  const submit = useCallback(
    async (payload) => {
      const created = await api.post(
        `/api/products/${encodeURIComponent(productId)}/reviews`,
        payload,
        { token },
      );
      refresh();
      return created;
    },
    [productId, token, refresh],
  );

  return { reviews, eligibility, loading, submit, refresh };
}
