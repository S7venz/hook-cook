import { useCallback } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.js';
import { useProducts } from './products.js';

export function useAdminProducts() {
  const { products, loading, refresh } = useProducts();
  const { token } = useAuth();

  const createProduct = useCallback(
    async (payload) => {
      const created = await api.post('/api/products', payload, { token });
      await refresh();
      return created;
    },
    [token, refresh],
  );

  const updateProduct = useCallback(
    async (id, payload) => {
      const updated = await api.put(`/api/products/${encodeURIComponent(id)}`, payload, {
        token,
      });
      await refresh();
      return updated;
    },
    [token, refresh],
  );

  const deleteProduct = useCallback(
    async (id) => {
      await api.del(`/api/products/${encodeURIComponent(id)}`, { token });
      await refresh();
    },
    [token, refresh],
  );

  return { products, loading, createProduct, updateProduct, deleteProduct };
}
