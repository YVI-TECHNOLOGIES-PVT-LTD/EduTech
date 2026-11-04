import { ThemeColors } from '../../types/theme.types';

export const lightPalette: ThemeColors = {
  primary: '#5146E5', // Premium Indigo Primary
  primaryLight: '#EEF0FF', // Light Indigo Surface
  primaryDark: '#4338CA', // Dark Indigo Hover/Pressed
  secondary: '#718096', // Secondary Text / Icon
  accent: '#5146E5', // Accent Violet/Indigo
  success: '#16A34A', // Emerald Green 600
  warning: '#F59E0B', // Amber Warning
  danger: '#DC2626', // Red 600 Error
  info: '#5146E5', // Brand Info
  background: '#F6F8FC', // Soft Light-Grey Background
  surface: '#FFFFFF', // Clean White Surface
  surfaceVariant: '#F1F5F9', // Slate 100 Surface Variant
  card: '#FFFFFF', // Pure White Card
  paper: '#F8FAFC', // Slate 50 Paper
  border: '#E2E8F0', // Subtle Slate 200 Border
  divider: '#CBD5E1', // Slate 300 Divider
  overlay: 'rgba(23, 32, 51, 0.4)', // Dark Backdrop Overlay
  backdrop: 'rgba(23, 32, 51, 0.5)',
  textPrimary: '#172033', // Dark Navy Primary Text
  textSecondary: '#718096', // Secondary Text
  textMuted: '#94A3B8', // Muted Text
  disabled: '#CBD5E1', // Disabled Text/Border
  placeholder: '#94A3B8', // Placeholder Text
  inverse: '#FFFFFF', // White Inverse
  navigation: '#FFFFFF', // Pure White Navigation Bar
  header: '#FFFFFF', // Header Surface
  tabBar: '#FFFFFF', // TabBar Surface
  input: '#FFFFFF', // Input Container Fill
  inputBorder: '#E2E8F0',
  inputFocused: '#5146E5',
  selection: '#EEF0FF', // Text Selection Highlight
  ripple: 'rgba(81, 70, 229, 0.12)', // Touch Feedback Ripple
  focus: '#5146E5', // Focused Ring Border
  shadow: 'rgba(23, 32, 51, 0.06)', // Soft Shadow Color
  iconPrimary: '#172033',
  iconSecondary: '#718096',
  iconMuted: '#94A3B8',
  iconDisabled: '#CBD5E1',
  iconDanger: '#DC2626',
  iconSuccess: '#16A34A',
  iconWarning: '#F59E0B',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  modules: {
    admission: '#5146E5',
    student: '#0284C7',
    teacher: '#A855F7',
    parent: '#16A34A',
    finance: '#F59E0B',
    hr: '#F43F5E',
    transport: '#06B6D4',
    library: '#14B8A6',
    hostel: '#F97316',
    certificates: '#5146E5',
    communication: '#EC4899',
    lms: '#8B5CF6',
    exams: '#D97706',
  },

  feature: {
    admission: { primary: '#5146E5', surface: '#EEF0FF', border: '#C7D2FE' },
    finance: { primary: '#F59E0B', surface: '#FEF3C7', border: '#FDE68A' },
    transport: { primary: '#06B6D4', surface: '#CFFAFF', border: '#A5F3FC' },
    library: { primary: '#14B8A6', surface: '#CCFBF1', border: '#99F6E4' },
    lms: { primary: '#8B5CF6', surface: '#EDE9FE', border: '#DDD6FE' },
    hr: { primary: '#F43F5E', surface: '#FFE4E6', border: '#FECDD3' },
    attendance: { primary: '#16A34A', surface: '#DCFCE7', border: '#BBF7D0' },
    student: { primary: '#0284C7', surface: '#E0F2FE', border: '#BAE6FD' },
  },

  status: {
    pending: '#F59E0B',
    paid: '#16A34A',
    overdue: '#DC2626',
    absent: '#DC2626',
    present: '#16A34A',
    late: '#F59E0B',
    cancelled: '#718096',
    draft: '#94A3B8',
    rejected: '#DC2626',
    approved: '#16A34A',
    completed: '#16A34A',
  },

  charts: {
    primary: '#5146E5',
    secondary: '#A855F7',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    info: '#0284C7',
    grid: '#E2E8F0',
    axis: '#94A3B8',
    tooltip: '#172033',
    background: '#FFFFFF',
  },

  avatar: {
    teacher: '#A855F7',
    parent: '#16A34A',
    student: '#0284C7',
    admin: '#4338CA',
    principal: '#F59E0B',
  },
};
