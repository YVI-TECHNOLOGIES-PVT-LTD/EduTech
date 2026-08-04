import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../../stores/theme.store';
import { lightPalette } from '../palettes/light.palette';
import { darkPalette } from '../palettes/dark.palette';
import { spacing } from '../spacing/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../typography/typography';
import { shadows } from '../elevation/shadows';
import { animations } from '../animations/animations';
import { ThemeColors } from '../../types/theme.types';

export const useTheme = () => {
  const systemColorScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isDark = useMemo(() => {
    return mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  }, [mode, systemColorScheme]);

  const colors: ThemeColors = useMemo(() => {
    return isDark ? darkPalette : lightPalette;
  }, [isDark]);

  return {
    colors,
    spacing,
    radius,
    typography,
    shadows,
    animations,
    mode,
    isDark,
    setMode,
    toggleTheme,
  };
};
