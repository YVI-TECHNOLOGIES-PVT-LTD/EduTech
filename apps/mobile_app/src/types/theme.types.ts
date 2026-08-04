export type ThemeMode = 'light' | 'dark' | 'system';

export interface FeatureColors {
  admission: { primary: string; surface: string; border: string };
  finance: { primary: string; surface: string; border: string };
  transport: { primary: string; surface: string; border: string };
  library: { primary: string; surface: string; border: string };
  lms: { primary: string; surface: string; border: string };
  hr: { primary: string; surface: string; border: string };
  attendance: { primary: string; surface: string; border: string };
  student: { primary: string; surface: string; border: string };
}

export interface ModuleColors {
  admission: string;
  student: string;
  teacher: string;
  parent: string;
  finance: string;
  hr: string;
  transport: string;
  library: string;
  hostel: string;
  certificates: string;
  communication: string;
  lms: string;
  exams: string;
}

export interface StatusColors {
  pending: string;
  paid: string;
  overdue: string;
  absent: string;
  present: string;
  late: string;
  cancelled: string;
  draft: string;
  rejected: string;
  approved: string;
  completed: string;
}

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  grid: string;
  axis: string;
  tooltip: string;
  background: string;
}

export interface AvatarColors {
  teacher: string;
  parent: string;
  student: string;
  admin: string;
  principal: string;
}

export interface ElevationTokens {
  level0: number;
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

export interface AnimationTokens {
  fast: number;   // 150ms
  normal: number; // 250ms
  slow: number;   // 400ms
  spring: {
    damping: number;
    stiffness: number;
  };
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;
  paper: string;
  border: string;
  divider: string;
  overlay: string;
  backdrop: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  disabled: string;
  placeholder: string;
  inverse: string;
  navigation: string;
  header: string;
  tabBar: string;
  input: string;
  inputBorder: string;
  inputFocused: string;
  selection: string;
  ripple: string;
  focus: string;
  shadow: string;
  iconPrimary: string;
  iconSecondary: string;
  iconMuted: string;
  iconDisabled: string;
  iconDanger: string;
  iconSuccess: string;
  iconWarning: string;
  transparent: string;
  white: string;
  black: string;
  modules: ModuleColors;
  feature: FeatureColors;
  status: StatusColors;
  charts: ChartColors;
  avatar: AvatarColors;
}

export interface SpacingTokens {
  none: number;
  xxs: number; // 4
  xs: number;  // 8
  sm: number;  // 12
  md: number;  // 16
  lg: number;  // 20
  xl: number;  // 24
  xxl: number; // 28
  xxxl: number;// 32
  h1: number;  // 40
  h2: number;  // 48
  h3: number;  // 56
  h4: number;  // 64
  h5: number;  // 80
}

export interface RadiusTokens {
  none: number;
  xs: number;  // 4
  sm: number;  // 8
  md: number;  // 12
  lg: number;  // 16
  xl: number;  // 20
  xxl: number; // 24
  xxxl: number;// 32
  full: number;// 999
}

export interface TypographyScale {
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  fontWeight: '400' | '500' | '600' | '700' | '800' | '900';
}

export interface TypographyTokens {
  display: TypographyScale;
  headline: TypographyScale;
  title: TypographyScale;
  body: TypographyScale;
  caption: TypographyScale;
  label: TypographyScale;
  button: TypographyScale;
  overline: TypographyScale;
}

export interface SchoolBrandConfig {
  schoolId: string;
  schoolName: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}
