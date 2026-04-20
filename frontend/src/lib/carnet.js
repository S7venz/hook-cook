import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useCarnet() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/carnet', { token });
        if (!cancelled) setEntries(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, nonce]);

  const addEntry = useCallback(
    async (entry) => {
      const created = await api.post('/api/carnet', entry, { token });
      setEntries((current) => [created, ...current]);
      return created;
    },
    [token],
  );

  const removeEntry = useCallback(
    async (id) => {
      await api.del(`/api/carnet/${encodeURIComponent(id)}`, { token });
      setEntries((current) => current.filter((e) => e.id !== id));
    },
    [token],
  );

  return { entries, loading, addEntry, removeEntry, refresh };
}
