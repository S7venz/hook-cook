import { createContext, useContext } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  hydrating: false,
  login: async () => ({ ok: false, error: '' }),
  register: async () => ({ ok: false, error: '' }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function emailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function passwordStrongEnough(password) {
  return password.length >= 8;
}
