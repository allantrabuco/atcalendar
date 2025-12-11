import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => undefined,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem(storageKey) as Theme | null;
    return (stored as Theme) || defaultTheme;
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    // Disable transitions temporarily to prevent flashing
    root.classList.add('disable-transitions');
    const timer = setTimeout(() => {
      root.classList.remove('disable-transitions');
    }, 0);

    return () => clearTimeout(timer);

    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, storageKey]);

  const setThemeAndStore = React.useCallback(
    (t: Theme) => {
      try {
        if (typeof window !== 'undefined') localStorage.setItem(storageKey, t);
      } catch {
        // ignore
      }
      setTheme(t);
    },
    [storageKey]
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeAndStore,
    }),
    [theme, setThemeAndStore]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
