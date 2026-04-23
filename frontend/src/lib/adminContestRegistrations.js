import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useAdminContestRegistrations() {
  const { token, user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || user?.role !== 'ROLE_ADMIN') return undefined;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await api.get('/api/contests-registrations', { token });
        if (!cancelled) setRegistrations(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRegistrations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  return { registrations, loading };
}
