import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useAdminContests() {
  const { token, user } = useAuth();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || user?.role !== 'ROLE_ADMIN') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/contests', { token });
        if (!cancelled) setContests(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setContests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, nonce]);

  const createContest = useCallback(
    async (payload) => {
      const created = await api.post('/api/contests', payload, { token });
      refresh();
      return created;
    },
    [token, refresh],
  );

  const updateContest = useCallback(
    async (id, payload) => {
      const updated = await api.put(
        `/api/contests/${encodeURIComponent(id)}`,
        payload,
        { token },
      );
      refresh();
      return updated;
    },
    [token, refresh],
  );

  const deleteContest = useCallback(
    async (id) => {
      await api.del(`/api/contests/${encodeURIComponent(id)}`, { token });
      refresh();
    },
    [token, refresh],
  );

  return {
    contests,
    loading,
    refresh,
    createContest,
    updateContest,
    deleteContest,
  };
}
