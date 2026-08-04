import { DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme, Theme as NavTheme } from '@react-navigation/native';
import { ThemeColors } from '../../types/theme.types';

export function getNavigationTheme(colors: ThemeColors, isDark: boolean): NavTheme {
  const baseTheme = isDark ? NavDarkTheme : NavDefaultTheme;

  return {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.danger,
    },
  };
}
