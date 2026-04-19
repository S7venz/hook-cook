import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../lib/auth.js';

const USERS_KEY = 'hc.users.v1';
const SESSION_KEY = 'hc.session.v1';

function loadUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function loadSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function encodePassword(raw) {
  // Mock only — never do this in production. Backend bcrypt replaces this.
  return `mock:${btoa(unescape(encodeURIComponent(raw)))}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  useEffect(() => {
    try {
      if (user) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const login = useCallback(async ({ email, password }) => {
    const users = loadUsers();
    const normalized = email.trim().toLowerCase();
    const found = users.find((u) => u.email === normalized);
    if (!found) return { ok: false, error: 'Aucun compte ne correspond à cet email.' };
    if (found.passwordHash !== encodePassword(password)) {
      return { ok: false, error: 'Mot de passe incorrect.' };
    }
    const session = {
      id: found.id,
      email: found.email,
      firstName: found.firstName,
      lastName: found.lastName,
    };
    setUser(session);
    return { ok: true };
  }, []);

  const register = useCallback(async ({ email, password, firstName, lastName }) => {
    const users = loadUsers();
    const normalized = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalized)) {
      return { ok: false, error: 'Un compte existe déjà avec cet email.' };
    }
    const record = {
      id: `u-${Date.now().toString(36)}`,
      email: normalized,
      passwordHash: encodePassword(password),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdAt: new Date().toISOString(),
    };
    saveUsers([...users, record]);
    const session = {
      id: record.id,
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
    };
    setUser(session);
    return { ok: true };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
