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
      // Backend renvoie { registration } (gratuit) ou
      // { registration, clientSecret, publishableKey } (Stripe).
      const response = await api.post(
        `/api/contests/${encodeURIComponent(contestId)}/register`,
        { category, permitNumber },
        { token },
      );
      const created = response.registration ?? response;
      setRegistrations((current) => [created, ...current]);
      return {
        registration: created,
        clientSecret: response.clientSecret ?? null,
        publishableKey: response.publishableKey ?? null,
      };
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
