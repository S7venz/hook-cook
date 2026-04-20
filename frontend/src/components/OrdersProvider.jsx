import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { OrdersContext } from '../lib/orders.js';

export function OrdersProvider({ children }) {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!user || !token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/orders/me', { token });
        if (!cancelled) {
          setError(null);
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, token, nonce]);

  const createOrder = useCallback(
    async (payload) => {
      const order = await api.post('/api/orders', payload, { token });
      setOrders((current) => [order, ...current]);
      return order;
    },
    [token],
  );

  const value = useMemo(
    () => ({ orders, loading, error, createOrder, refresh }),
    [orders, loading, error, createOrder, refresh],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
