import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hc.permit.v1';

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
    items: ['Mineurs jusqu\'à 12 ans', "Toute l'année", 'Carte gratuite -2 ans'],
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

function loadInitial() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildHistory(submittedAt) {
  const date = new Date(submittedAt);
  const fmt = (d) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);

  const paid = new Date(date.getTime() + 3 * 60 * 1000);
  const instructed = new Date(date.getTime() + 60 * 60 * 1000);
  return [
    { label: 'Demande envoyée', date: fmt(date), done: true },
    { label: 'Paiement confirmé', date: fmt(paid), done: true },
    { label: 'En instruction (fédération)', date: fmt(instructed), done: true, current: true },
    { label: 'Décision', date: null, done: false },
  ];
}

function generatePermitId() {
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `FR-2026-${rand}`;
}

export function useSubmittedPermit() {
  const [permit, setPermit] = useState(loadInitial);

  useEffect(() => {
    try {
      if (permit) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(permit));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [permit]);

  const submit = useCallback((input) => {
    const submittedAt = new Date().toISOString();
    const type = findPermitType(input.typeId);
    const record = {
      id: generatePermitId(),
      typeId: type.id,
      typeTitle: type.title,
      amount: type.price,
      department: input.department,
      firstName: input.firstName,
      lastName: input.lastName,
      birthDate: input.birthDate,
      submittedAt,
      status: 'pending',
      statusLabel: 'En instruction',
      history: buildHistory(submittedAt),
    };
    setPermit(record);
    return record;
  }, []);

  const reset = useCallback(() => setPermit(null), []);

  return { permit, submit, reset };
}
