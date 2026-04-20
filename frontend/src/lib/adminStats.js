import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useAdminStats() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || user?.role !== 'ROLE_ADMIN') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/admin/stats', { token });
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  return { stats, loading, error };
}
