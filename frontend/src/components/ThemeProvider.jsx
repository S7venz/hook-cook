import { useCallback, useEffect, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  readInitialTheme,
} from '../lib/theme.js';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readInitialTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage bloqué (navigation privée stricte) — on ignore
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (next !== 'light' && next !== 'dark') return;
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
