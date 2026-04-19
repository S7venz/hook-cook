import { createContext, useContext } from 'react';

export const ProductsContext = createContext({
  products: [],
  loading: false,
  error: null,
  refresh: async () => {},
});

export function useProducts() {
  return useContext(ProductsContext);
}

export function useProduct(id) {
  const { products } = useProducts();
  if (!id) return null;
  return products.find((p) => p.id === id) ?? null;
}
