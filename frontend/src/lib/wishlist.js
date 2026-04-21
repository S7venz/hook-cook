import { createContext, useContext } from 'react';

export const WishlistContext = createContext({
  productIds: new Set(),
  loading: false,
  toggle: async () => {},
  has: () => false,
  refresh: async () => {},
});

export function useWishlist() {
  return useContext(WishlistContext);
}
