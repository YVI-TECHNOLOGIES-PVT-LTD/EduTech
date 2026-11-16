import { useEffect } from 'react';
import { useThemeContext, ThemeMode, ResolvedTheme } from '../../context/ThemeContext';
import { useSettingsStore } from '../../store/settings.store';

export type { ThemeMode, ResolvedTheme };
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type ColorPreset = 'blue' | 'purple' | 'emerald' | 'slate' | 'corporate';

export const useTheme = () => {
  const { theme, resolvedTheme, setTheme, isDark } = useThemeContext();
  const {
    colorPreset,
    density,
    reducedMotion,
    highContrast,
    setColorPreset,
    setDensity,
    toggleReducedMotion,
    toggleHighContrast,
  } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', density);
    root.setAttribute('data-reduced-motion', String(reducedMotion));
    root.setAttribute('data-high-contrast', String(highContrast));
  }, [density, reducedMotion, highContrast]);

  return {
    theme,
    resolvedTheme,
    isDark,
    colorPreset,
    density,
    reducedMotion,
    highContrast,
    setTheme,
    setColorPreset,
    setDensity,
    toggleReducedMotion,
    toggleHighContrast,
  };
};

export default useTheme;
