import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../lib/api.js';
import { AuthContext } from '../lib/auth.js';

const TOKEN_KEY = 'hc.auth.token.v1';

function loadToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(loadToken);
  const [user, setUser] = useState(null);
  const [hydrating, setHydrating] = useState(Boolean(loadToken()));

  useEffect(() => {
    saveToken(token);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/auth/me', { token });
        if (!cancelled) setUser(data.user);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setToken(null);
          }
          setUser(null);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async ({ email, password }) => {
    try {
      const data = await api.post('/api/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, error: err.message };
      }
      return { ok: false, error: 'Erreur inconnue.' };
    }
  }, []);

  const register = useCallback(async ({ email, password, firstName, lastName }) => {
    try {
      const data = await api.post('/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      setToken(data.token);
      setUser(data.user);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, error: err.message };
      }
      return { ok: false, error: 'Erreur inconnue.' };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, hydrating, login, register, logout }),
    [user, token, hydrating, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
