import { lightPalette } from '../palettes/light.palette';
import { darkPalette } from '../palettes/dark.palette';
import { ThemeColors, SchoolBrandConfig } from '../../types/theme.types';

export function createSchoolTheme(brand: SchoolBrandConfig, isDark: boolean): ThemeColors {
  const basePalette = isDark ? darkPalette : lightPalette;

  if (!brand.primaryColor) {
    return basePalette;
  }

  return {
    ...basePalette,
    primary: brand.primaryColor,
    accent: brand.accentColor || basePalette.accent,
    focus: brand.primaryColor,
  };
}
