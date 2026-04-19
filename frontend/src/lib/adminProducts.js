import { useCallback, useEffect, useState } from 'react';
import { products as staticProducts } from '../data/catalog.js';

const STORAGE_KEY = 'hc.admin.products.v1';

function loadOverrides() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useAdminProducts() {
  const [overrides, setOverrides] = useState(loadOverrides);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
  }, [overrides]);

  const products = staticProducts.map((p) => {
    const override = overrides[p.id];
    return override ? { ...p, ...override } : p;
  });

  const updateStock = useCallback((id, delta) => {
    setOverrides((current) => {
      const base = staticProducts.find((p) => p.id === id);
      if (!base) return current;
      const existing = current[id] ?? {};
      const currentStock = existing.stock ?? base.stock;
      const nextStock = Math.max(0, currentStock + delta);
      return { ...current, [id]: { ...existing, stock: nextStock } };
    });
  }, []);

  const setStock = useCallback((id, value) => {
    setOverrides((current) => {
      const existing = current[id] ?? {};
      const nextStock = Math.max(0, Number(value) || 0);
      return { ...current, [id]: { ...existing, stock: nextStock } };
    });
  }, []);

  return { products, updateStock, setStock };
}
