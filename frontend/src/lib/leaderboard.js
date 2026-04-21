import { useEffect, useState } from 'react';
import { api } from './api.js';

const MONTH_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function monthLabel(month) {
  return MONTH_LABELS[month - 1] ?? '';
}

export function useMonthlyLeaderboard({ species, year, month, limit = 10 } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (species) params.set('species', species);
        if (year) params.set('year', year);
        if (month) params.set('month', month);
        if (limit) params.set('limit', limit);
        const data = await api.get(`/api/leaderboard/monthly?${params.toString()}`);
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [species, year, month, limit]);

  return { rows, loading };
}
