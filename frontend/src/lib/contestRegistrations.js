import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function useContestRegistrations() {
  const { token, user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/contests-registrations/me', { token });
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
  }, [token, user, nonce]);

  const register = useCallback(
    async (contestId, { category, permitNumber }) => {
      const created = await api.post(
        `/api/contests/${encodeURIComponent(contestId)}/register`,
        { category, permitNumber },
        { token },
      );
      setRegistrations((current) => [created, ...current]);
      return created;
    },
    [token],
  );

  const isRegistered = useCallback(
    (contestId) => registrations.some((r) => r.contestId === contestId),
    [registrations],
  );

  const count = registrations.length;

  return { registrations, loading, register, isRegistered, count, refresh };
}
