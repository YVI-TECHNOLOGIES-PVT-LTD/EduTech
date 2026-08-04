import { lightPalette } from './palettes/light.palette';
import { darkPalette } from './palettes/dark.palette';
import { spacing } from './spacing/spacing';
import { typography } from './typography/typography';
import { radius } from './tokens/radius';
import { shadows } from './elevation/shadows';
import { animations } from './animations/animations';

export const theme = {
  light: lightPalette,
  dark: darkPalette,
  spacing,
  typography,
  radius,
  shadows,
  animations,
};

export type Theme = typeof theme;
export * from './palettes/light.palette';
export * from './palettes/dark.palette';
export * from './spacing/spacing';
export * from './typography/typography';
export * from './tokens/radius';
export * from './elevation/shadows';
export * from './animations/animations';
export * from './hooks/useTheme';
