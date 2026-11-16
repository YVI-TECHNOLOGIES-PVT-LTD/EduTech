import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const STORAGE_KEY = 'edutrack-theme';
const LEGACY_STORAGE_KEY = 'erp-theme';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {}
  return 'system';
}

let transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;

function applyThemeToDocument(resolved: ResolvedTheme, animate: boolean = false) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (animate) {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      if (transitionTimeoutId) {
        clearTimeout(transitionTimeoutId);
      }
      root.classList.add('theme-transitioning');
      transitionTimeoutId = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        transitionTimeoutId = null;
      }, 350);
    }
  }

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}> = ({ children, defaultTheme = 'system' }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    return stored || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initialTheme = getStoredTheme() || defaultTheme;
    return initialTheme === 'system' ? getSystemPreference() : initialTheme;
  });

  const isMountedRef = React.useRef(false);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
      localStorage.setItem(LEGACY_STORAGE_KEY, newTheme);
    } catch {}

    const resolved = newTheme === 'system' ? getSystemPreference() : newTheme;
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved, true);
  }, []);

  // Update DOM and resolved theme on theme change or system preference change
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const resolved = theme === 'system' ? getSystemPreference() : theme;
      setResolvedTheme(resolved);
      applyThemeToDocument(resolved, false);
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = (e: MediaQueryListEvent) => {
        const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextResolved);
        applyThemeToDocument(nextResolved, true);
      };

      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }
  }, [theme]);

  // Cross-Tab Synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        const newTheme = e.newValue;
        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
          setThemeState(newTheme);
          const resolved = newTheme === 'system' ? getSystemPreference() : newTheme;
          setResolvedTheme(resolved);
          applyThemeToDocument(resolved, true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if rendered outside ThemeProvider
    return {
      theme: 'system',
      resolvedTheme: getSystemPreference(),
      setTheme: () => {},
      isDark: getSystemPreference() === 'dark',
    };
  }
  return context;
};

export default ThemeProvider;
