import { useThemeContext } from '../../providers/ThemeProvider';
import { useThemeStore } from '../../stores/theme.store';

export const useTheme = () => {
  const { colors, isDark } = useThemeContext();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return {
    colors,
    isDark,
    mode,
    setMode,
  };
};
