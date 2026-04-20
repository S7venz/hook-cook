import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useAdminOrders() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || user?.role !== 'ROLE_ADMIN') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/orders', { token });
        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, nonce]);

  const updateStatus = useCallback(
    async (reference, status) => {
      await api.patch(`/api/orders/${encodeURIComponent(reference)}`, { status }, { token });
      refresh();
    },
    [token, refresh],
  );

  return { orders, loading, refresh, updateStatus };
}
