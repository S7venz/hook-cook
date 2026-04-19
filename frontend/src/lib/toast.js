import { createContext, useContext } from 'react';

export const ToastContext = createContext({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}
