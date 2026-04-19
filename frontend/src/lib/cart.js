import { createContext, useContext } from 'react';

export const CartContext = createContext({
  items: [],
  add: () => {},
  remove: () => {},
  updateQty: () => {},
  clear: () => {},
});

export function useCart() {
  return useContext(CartContext);
}

export function cartTotals(items) {
  const count = items.reduce((sum, it) => sum + it.qty, 0);
  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.qty, 0);
  const shipping = subtotal === 0 ? 0 : subtotal >= 120 ? 0 : 5.9;
  const total = subtotal + shipping;
  return { count, subtotal, shipping, total };
}
