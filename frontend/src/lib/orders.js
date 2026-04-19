import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hc.orders.v1';

function loadInitial() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function generateOrderId() {
  const rand = Math.floor(1000 + Math.random() * 8999);
  return `HC-2186-${rand}`;
}

export function findOrder(orders, id) {
  return orders.find((o) => o.id === id) ?? null;
}

export function useOrders() {
  const [orders, setOrders] = useState(loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // ignore
    }
  }, [orders]);

  const createOrder = useCallback(({ items, subtotal, shipping, total, email, address, shippingMode }) => {
    const order = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      items: items.map((it) => ({
        product: it.product,
        qty: it.qty,
        unitPrice: it.product.price,
      })),
      subtotal,
      shipping,
      total,
      email,
      address,
      shippingMode,
      status: 'paid',
      statusLabel: 'Payée',
    };
    setOrders((current) => [order, ...current]);
    return order;
  }, []);

  const updateStatus = useCallback((id, status) => {
    const labels = {
      paid: 'Payée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status, statusLabel: labels[status] ?? status }
          : order,
      ),
    );
  }, []);

  return { orders, createOrder, updateStatus };
}
