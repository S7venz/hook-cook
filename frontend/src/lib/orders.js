import { createContext, useContext } from 'react';

export const OrdersContext = createContext({
  orders: [],
  loading: false,
  error: null,
  createOrder: async () => null,
  refresh: async () => null,
});

export function useOrders() {
  return useContext(OrdersContext);
}

export function findOrder(orders, id) {
  return orders.find((o) => o.id === id) ?? null;
}
