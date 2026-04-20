import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export const PERMIT_TYPES = [
  {
    id: 'annuel',
    label: 'Le plus choisi',
    title: 'Permis annuel',
    price: 92,
    items: [
      'Valide du 1er janv. au 31 déc.',
      'Toutes eaux 1re et 2e catégorie',
      'CPMA incluse',
    ],
  },
  {
    id: 'semaine',
    label: 'Vacances',
    title: 'Permis semaine',
    price: 28,
    items: ['7 jours consécutifs', 'Carte interfédérale', 'Idéal séjour'],
  },
  {
    id: 'decouverte',
    label: '-12 ans',
    title: 'Découverte',
    price: 6,
    items: ["Mineurs jusqu'à 12 ans", "Toute l'année", 'Carte gratuite -2 ans'],
  },
];

export const DEPARTMENTS = [
  { code: '66', name: '66 — Pyrénées-Orientales' },
  { code: '11', name: '11 — Aude' },
  { code: '09', name: '09 — Ariège' },
  { code: '34', name: '34 — Hérault' },
];

export function findPermitType(id) {
  return PERMIT_TYPES.find((t) => t.id === id) ?? PERMIT_TYPES[0];
}

export function useSubmittedPermit() {
  const { token, user } = useAuth();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/permits/me', { token });
        if (!cancelled) setPermit(data?.permit ?? null);
      } catch {
        if (!cancelled) setPermit(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, user, nonce]);

  const submit = useCallback(
    async (input) => {
      const created = await api.post('/api/permits', input, { token });
      setPermit(created);
      return created;
    },
    [token],
  );

  const updateStatus = useCallback(
    async (status) => {
      if (!permit) return null;
      const updated = await api.patch(
        `/api/permits/${encodeURIComponent(permit.id)}`,
        { status },
        { token },
      );
      setPermit(updated);
      return updated;
    },
    [permit, token],
  );

  return { permit, loading, submit, updateStatus, refresh };
}

export function useAdminPermits() {
  const { token, user } = useAuth();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!token || user?.role !== 'ROLE_ADMIN') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/permits', { token });
        if (!cancelled) setPermits(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setPermits([]);
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
      await api.patch(
        `/api/permits/${encodeURIComponent(reference)}`,
        { status },
        { token },
      );
      refresh();
    },
    [token, refresh],
  );

  return { permits, loading, updateStatus, refresh };
}
