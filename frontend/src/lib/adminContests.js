import { useCallback } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';
import { useReferenceData } from './referenceData.js';

/**
 * Admin CRUD des concours. Partage délibérément le state avec
 * `useReferenceData()` pour que les créations/suppressions côté admin
 * soient immédiatement visibles côté utilisateur — un refresh global
 * après chaque mutation re-hydrate aussi la liste consommée par
 * HomePage et ConcoursPage.
 */
export function useAdminContests() {
  const { contests, loading, refresh } = useReferenceData();
  const { token } = useAuth();

  const createContest = useCallback(
    async (payload) => {
      const created = await api.post('/api/contests', payload, { token });
      await refresh();
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
      await refresh();
      return updated;
    },
    [token, refresh],
  );

  const deleteContest = useCallback(
    async (id) => {
      await api.del(`/api/contests/${encodeURIComponent(id)}`, { token });
      await refresh();
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
