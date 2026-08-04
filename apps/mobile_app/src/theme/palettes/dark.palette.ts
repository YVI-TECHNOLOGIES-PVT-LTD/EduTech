import { ThemeColors } from '../../types/theme.types';

export const darkPalette: ThemeColors = {
  primary: '#6366f1',         // Indigo 500
  primaryLight: '#818cf8',    // Indigo 400
  primaryDark: '#4338ca',     // Indigo 700
  secondary: '#94a3b8',       // Slate 400
  accent: '#38bdf8',          // Sky 400
  success: '#34d399',         // Emerald 400
  warning: '#fbbf24',         // Amber 400
  danger: '#f87171',          // Red 400
  info: '#38bdf8',            // Sky 400
  background: '#0f172a',      // Charcoal Slate 900
  surface: '#1e293b',         // Slate 800 Surface
  surfaceVariant: '#334155',  // Slate 700 Surface Variant
  card: '#1e293b',            // Slate 800 Card
  paper: '#0f172a',           // Dark Slate Paper
  border: '#334155',          // Slate 700 Border
  divider: '#334155',         // Slate 700 Divider
  overlay: 'rgba(0, 0, 0, 0.7)', // Dark Backdrop Overlay
  backdrop: 'rgba(0, 0, 0, 0.8)',
  textPrimary: '#f8fafc',     // Slate 50 Primary Text
  textSecondary: '#cbd5e1',   // Slate 300 Secondary Text
  textMuted: '#64748b',       // Slate 500 Muted Text
  disabled: '#475569',        // Slate 600 Disabled
  placeholder: '#64748b',     // Slate 500 Placeholder
  inverse: '#0f172a',         // Charcoal Inverse
  navigation: '#1e293b',      // Slate 800 Navigation Bar
  header: '#1e293b',          // Header Surface
  tabBar: '#1e293b',          // TabBar Surface
  input: '#1e293b',           // Input Container Fill
  inputBorder: '#334155',
  inputFocused: '#6366f1',
  selection: '#818cf8',       // Text Selection Highlight
  ripple: 'rgba(99, 102, 241, 0.2)', // Touch Feedback Ripple
  focus: '#6366f1',           // Focused Ring Border
  shadow: 'rgba(0, 0, 0, 0.4)',     // Dark Elevation Shadow
  iconPrimary: '#f8fafc',
  iconSecondary: '#cbd5e1',
  iconMuted: '#64748b',
  iconDisabled: '#475569',
  iconDanger: '#f87171',
  iconSuccess: '#34d399',
  iconWarning: '#fbbf24',
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  modules: {
    admission: '#818cf8',
    student: '#38bdf8',
    teacher: '#c084fc',
    parent: '#34d399',
    finance: '#fbbf24',
    hr: '#fb7185',
    transport: '#22d3ee',
    library: '#2dd4bf',
    hostel: '#fb923c',
    certificates: '#60a5fa',
    communication: '#f472b6',
    lms: '#a78bfa',
    exams: '#f59e0b',
  },

  feature: {
    admission: { primary: '#818cf8', surface: '#1e1b4b', border: '#312e81' },
    finance: { primary: '#fbbf24', surface: '#451a03', border: '#78350f' },
    transport: { primary: '#22d3ee', surface: '#083344', border: '#155e75' },
    library: { primary: '#2dd4bf', surface: '#042f2e', border: '#115e59' },
    lms: { primary: '#a78bfa', surface: '#2e1065', border: '#5b21b6' },
    hr: { primary: '#fb7185', surface: '#4c0519', border: '#881337' },
    attendance: { primary: '#34d399', surface: '#064e3b', border: '#065f46' },
    student: { primary: '#38bdf8', surface: '#0c4a6e', border: '#075985' },
  },

  status: {
    pending: '#fbbf24',
    paid: '#34d399',
    overdue: '#f87171',
    absent: '#f87171',
    present: '#34d399',
    late: '#fbbf24',
    cancelled: '#94a3b8',
    draft: '#64748b',
    rejected: '#f87171',
    approved: '#34d399',
    completed: '#34d399',
  },

  charts: {
    primary: '#6366f1',
    secondary: '#c084fc',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#38bdf8',
    grid: '#334155',
    axis: '#64748b',
    tooltip: '#0f172a',
    background: '#1e293b',
  },

  avatar: {
    teacher: '#c084fc',
    parent: '#34d399',
    student: '#38bdf8',
    admin: '#6366f1',
    principal: '#fbbf24',
  },
};
