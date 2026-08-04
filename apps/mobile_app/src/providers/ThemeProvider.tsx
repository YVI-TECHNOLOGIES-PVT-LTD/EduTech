import React, { createContext, useContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../stores/theme.store';
import { useTheme } from '../theme/hooks/useTheme';

const ThemeContext = createContext<ReturnType<typeof useTheme> | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <ThemeContext.Provider value={theme}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} animated />
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};
