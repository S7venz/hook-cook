import { useEffect, useMemo, useReducer } from 'react';
import { CartContext } from '../lib/cart.js';

const STORAGE_KEY = 'hc.cart.v1';

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

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, qty } = action;
      const existing = state.findIndex((it) => it.product.id === product.id);
      if (existing >= 0) {
        const next = [...state];
        next[existing] = { ...next[existing], qty: next[existing].qty + qty };
        return next;
      }
      return [...state, { product, qty }];
    }
    case 'remove':
      return state.filter((_, i) => i !== action.index);
    case 'update_qty':
      return state.map((it, i) => (i === action.index ? { ...it, qty: action.qty } : it));
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // quota or private mode — ignore, cart still works in memory
    }
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      add: (product, qty = 1) => dispatch({ type: 'add', product, qty }),
      remove: (index) => dispatch({ type: 'remove', index }),
      updateQty: (index, qty) => dispatch({ type: 'update_qty', index, qty }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
