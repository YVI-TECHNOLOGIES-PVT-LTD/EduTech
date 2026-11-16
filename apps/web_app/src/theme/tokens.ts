import { COLORS } from './colors';
import { SPACING } from './spacing';
import { TYPOGRAPHY } from './typography';
import { RADIUS } from './radius';
import { SHADOWS } from './shadows';

export const THEME_TOKENS = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  radius: RADIUS,
  shadows: SHADOWS,
} as const;

export type ThemeTokens = typeof THEME_TOKENS;
