import { createContext, useContext } from 'react';

export const ReferenceDataContext = createContext({
  species: [],
  categories: [],
  techniques: [],
  contests: [],
  loading: false,
  refresh: async () => {},
});

export function useReferenceData() {
  return useContext(ReferenceDataContext);
}

export function findContest(contests, id) {
  return contests.find((c) => c.id === id) ?? null;
}
