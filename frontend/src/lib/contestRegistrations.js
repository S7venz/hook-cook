import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hc.contests.v1';

function loadInitial() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function useContestRegistrations() {
  const [ids, setIds] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }, [ids]);

  const register = useCallback((id) => {
    setIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const isRegistered = useCallback((id) => ids.has(id), [ids]);

  return { register, isRegistered, count: ids.size };
}
