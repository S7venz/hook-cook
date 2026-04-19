import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hc.carnet.v1';

const SEED = [
  {
    id: 'c1',
    date: '2026-04-12',
    species: 'truite',
    taille: 34,
    poids: 420,
    spot: 'Loue — tronçon inférieur',
    weather: 'Couvert 12°C',
    bait: 'Mouche sèche CDC #16',
    photo: 'Truite fario 34cm',
  },
  {
    id: 'c2',
    date: '2026-04-08',
    species: 'ombre',
    taille: 31,
    poids: 380,
    spot: 'Doubs — Mouthier',
    weather: 'Ciel clair 10°C',
    bait: 'Nymphe pheasant tail #16',
    photo: 'Ombre 31cm',
  },
];

function loadInitial() {
  if (typeof window === 'undefined') return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

export function useCarnet() {
  const [entries, setEntries] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  const addEntry = useCallback((entry) => {
    const record = {
      ...entry,
      id: `c-${Date.now().toString(36)}`,
      date: entry.date || new Date().toISOString().slice(0, 10),
    };
    setEntries((current) => [record, ...current]);
    return record;
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((current) => current.filter((e) => e.id !== id));
  }, []);

  return { entries, addEntry, removeEntry };
}
