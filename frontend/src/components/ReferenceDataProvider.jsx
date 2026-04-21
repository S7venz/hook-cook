import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { ReferenceDataContext } from '../lib/referenceData.js';

export function ReferenceDataProvider({ children }) {
  const [species, setSpecies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sp, cat, tech, ct] = await Promise.all([
          api.get('/api/species').catch(() => []),
          api.get('/api/categories').catch(() => []),
          api.get('/api/techniques').catch(() => []),
          api.get('/api/contests').catch(() => []),
        ]);
        if (cancelled) return;
        setSpecies(Array.isArray(sp) ? sp : []);
        setCategories(Array.isArray(cat) ? cat : []);
        setTechniques(Array.isArray(tech) ? tech : []);
        setContests(Array.isArray(ct) ? ct : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const value = useMemo(
    () => ({ species, categories, techniques, contests, loading, refresh }),
    [species, categories, techniques, contests, loading, refresh],
  );

  return (
    <ReferenceDataContext.Provider value={value}>{children}</ReferenceDataContext.Provider>
  );
}
