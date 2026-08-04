import { ThemeColors } from '../../types/theme.types';

export const lightPalette: ThemeColors = {
  primary: '#3b82f6',         // Electric Blue
  primaryLight: '#60a5fa',    // Light Blue
  primaryDark: '#312e81',     // Deep Royal Indigo
  secondary: '#64748b',       // Slate 500
  accent: '#0284c7',          // Sky 600
  success: '#10b981',         // Emerald 500
  warning: '#f59e0b',         // Amber 500
  danger: '#ef4444',          // Red 500
  info: '#3b82f6',            // Blue 500
  background: '#f4f5f9',      // Soft Light Background
  surface: '#ffffff',         // Pure White Surface
  surfaceVariant: '#f1f5f9',  // Slate 100 Surface Variant
  card: '#ffffff',            // Pure White Card
  paper: '#f8fafc',           // Slate 50 Paper
  border: '#e2e8f0',          // Slate 200 Border
  divider: '#cbd5e1',         // Slate 300 Divider
  overlay: 'rgba(15, 23, 42, 0.4)', // Dark Backdrop Overlay
  backdrop: 'rgba(15, 23, 42, 0.5)',
  textPrimary: '#1e1b4b',     // Dark Indigo Slate Text
  textSecondary: '#64748b',   // Slate 500 Secondary Text
  textMuted: '#94a3b8',       // Slate 400 Muted Text
  disabled: '#cbd5e1',        // Slate 300 Disabled
  placeholder: '#94a3b8',     // Slate 400 Placeholder
  inverse: '#ffffff',         // White Inverse
  navigation: '#ffffff',      // Pure White Navigation Bar
  header: '#ffffff',          // Header Surface
  tabBar: '#ffffff',          // TabBar Surface
  input: '#ffffff',           // Input Container Fill
  inputBorder: '#e2e8f0',
  inputFocused: '#3b82f6',
  selection: '#60a5fa',       // Text Selection Highlight
  ripple: 'rgba(59, 130, 246, 0.12)', // Touch Feedback Ripple
  focus: '#3b82f6',           // Focused Ring Border
  shadow: 'rgba(15, 23, 42, 0.08)',   // Soft Shadow Color
  iconPrimary: '#1e1b4b',
  iconSecondary: '#64748b',
  iconMuted: '#94a3b8',
  iconDisabled: '#cbd5e1',
  iconDanger: '#ef4444',
  iconSuccess: '#10b981',
  iconWarning: '#f59e0b',
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  modules: {
    admission: '#6366f1',
    student: '#0284c7',
    teacher: '#a855f7',
    parent: '#10b981',
    finance: '#f59e0b',
    hr: '#f43f5e',
    transport: '#06b6d4',
    library: '#14b8a6',
    hostel: '#f97316',
    certificates: '#3b82f6',
    communication: '#ec4899',
    lms: '#8b5cf6',
    exams: '#d97706',
  },

  feature: {
    admission: { primary: '#6366f1', surface: '#e0e7ff', border: '#c7d2fe' },
    finance: { primary: '#f59e0b', surface: '#fef3c7', border: '#fde68a' },
    transport: { primary: '#06b6d4', surface: '#cffaff', border: '#a5f3fc' },
    library: { primary: '#14b8a6', surface: '#ccfbf1', border: '#99f6e4' },
    lms: { primary: '#8b5cf6', surface: '#ede9fe', border: '#ddd6fe' },
    hr: { primary: '#f43f5e', surface: '#ffe4e6', border: '#fecdd3' },
    attendance: { primary: '#10b981', surface: '#d1fae5', border: '#a7f3d0' },
    student: { primary: '#0284c7', surface: '#e0f2fe', border: '#bae6fd' },
  },

  status: {
    pending: '#f59e0b',
    paid: '#10b981',
    overdue: '#ef4444',
    absent: '#ef4444',
    present: '#10b981',
    late: '#f59e0b',
    cancelled: '#64748b',
    draft: '#94a3b8',
    rejected: '#ef4444',
    approved: '#10b981',
    completed: '#10b981',
  },

  charts: {
    primary: '#3b82f6',
    secondary: '#a855f7',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0284c7',
    grid: '#e2e8f0',
    axis: '#94a3b8',
    tooltip: '#1e1b4b',
    background: '#ffffff',
  },

  avatar: {
    teacher: '#a855f7',
    parent: '#10b981',
    student: '#0284c7',
    admin: '#3730a3',
    principal: '#f59e0b',
  },
};
