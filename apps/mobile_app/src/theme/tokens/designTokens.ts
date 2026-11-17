/**
 * EduTrack Parent Portal - Unified Design Tokens
 * Source of truth for color, spacing, radius, typography, and shadows across all parent screens.
 * Aligned with the 5-screen Parent Mobile reference design.
 */
export const DESIGN_TOKENS = {
  colors: {
    // Primary Brand Palette
    primary: '#5145F5', // Royal Indigo
    primaryDark: '#172554', // Deep Navy
    primaryHover: '#3730A3',
    primaryLight: '#EEF2FF',
    electricViolet: '#7C3AED',
    deepNavy: '#172554',
    royalIndigo: '#5145F5',
    protoIndigo: '#4338CA',

    // Surfaces & Backgrounds
    background: '#F7F8FC', // Soft Lavender White
    lightNeutral: '#F1F4FA',
    protoBg: '#F6F7FC',
    surface: '#FFFFFF',
    pureWhite: '#FFFFFF',
    secondarySurface: '#F1F5F9',
    card: '#FFFFFF',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#CBD5E1',
    borderLight: '#E2E8F0',

    // Supporting & Status Colors
    emerald: '#059669',
    skyBlue: '#0EA5E9',
    amber: '#F59E0B',
    protoAmber: '#D97706',
    rose: '#F43F5E',
    protoRose: '#E11D48',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#F43F5E',
    error: '#F43F5E',
    errorLight: '#FFF1F2',
    information: '#0284C7',
    info: '#0284C7',
    infoLight: '#F0F9FF',

    // Gradients
    gradients: {
      primary: ['#5145F5', '#7C3AED'],
      headerNav: ['#172554', '#1E1B4B', '#4338CA'],
      navyHero: ['#172554', '#1E1B4B'],
      welcomeSlide: ['#172554', '#4338CA', '#7C3AED'],
      excellenceSlide: ['#059669', '#115E59'],
      activitiesSlide: ['#0369A1', '#0284C7'],
      updatedSlide: ['#D97706', '#C2410C'],
      academic: ['#0EA5E9', '#5145F5'],
      emerald: ['#059669', '#10B981'],
      amber: ['#F59E0B', '#EA580C'],
      rose: ['#F43F5E', '#BE123C'],
      softLight: ['#FFFFFF', '#F8FAFC'],
      softCard: ['#FFFFFF', '#F6F7FC'],
    },
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
    micro: 6,
    small: 10,
    input: 12,
    button: 14,
    badge: 16,
    card: 20,
    featureCard: 24,
    heroCard: 28,
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
      shadowColor: '#172554',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#172554',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    floating: {
      shadowColor: '#172554',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
    },
    glowIndigo: {
      shadowColor: '#5145F5',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
