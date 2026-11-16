/**
 * EduTrack Parent Portal - Unified Design Tokens
 * Source of truth for color, spacing, radius, typography, and shadows across all parent screens.
 * Aligned with the 5-screen Parent Mobile reference design.
 */
export const DESIGN_TOKENS = {
  colors: {
    // Primary Purple
    primary: '#5145E5',
    primaryDark: '#3930B5',
    primaryHover: '#3930B5',
    primaryLight: '#EEF0FF',

    // Surfaces & Backgrounds
    background: '#F5F7FB',
    surface: '#FFFFFF',
    secondarySurface: '#F1F4F9',
    card: '#FFFFFF',

    // Typography
    textPrimary: '#151D32',
    textSecondary: '#71819A',
    textMuted: '#9AA9BD',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',

    // Status Colors
    success: '#10B981',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    information: '#0EA5E9',
    info: '#0EA5E9',
    infoLight: '#E0F2FE',
  },
  spacing: {
    micro: 4,
    compact: 8,
    small: 12,
    component: 12,
    standard: 16,
    comfortable: 20,
    card: 20,
    section: 24,
    largeSection: 28,
    major: 32,
  },
  radius: {
    small: 10,
    input: 12,
    button: 14,
    card: 20,
    featureCard: 24,
    full: 9999,
  },
  typography: {
    pageHeading: {
      fontSize: 26,
      fontWeight: '900' as const,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    sectionHeading: {
      fontSize: 18,
      fontWeight: '800' as const,
      lineHeight: 24,
      letterSpacing: -0.3,
    },
    cardHeading: {
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    supporting: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 18,
    },
    label: {
      fontSize: 11,
      fontWeight: '700' as const,
      lineHeight: 14,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },
  shadows: {
    subtle: {
      shadowColor: '#151D32',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#5145E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    floating: {
      shadowColor: '#151D32',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
    },
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
