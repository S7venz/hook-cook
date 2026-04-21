import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';

export function usePermitTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/permit-types');
        if (!cancelled) setTypes(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTypes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { types, loading };
}

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/departments');
        if (!cancelled) setDepartments(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setDepartments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { departments, loading };
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
