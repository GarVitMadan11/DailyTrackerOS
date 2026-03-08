// Color palette matching the web app (terracotta primary, sage accent, gold secondary)
export const Colors = {
  // Primary – terracotta / orange
  primary: '#D97741',
  primaryLight: '#E8956A',
  primaryDark: '#B55F2E',

  // Secondary – gold
  secondary: '#F5A623',
  secondaryLight: '#F7C06A',

  // Accent – sage green
  accent: '#6B8F6B',
  accentLight: '#8BAF8B',

  // Background
  background: '#FAF6F1',
  backgroundDark: '#1A1A1A',
  surface: '#FFFFFF',
  surfaceDark: '#2A2A2A',
  card: '#FFFFFF',
  cardDark: '#333333',

  // Text
  text: '#2D2D2D',
  textDark: '#F0F0F0',
  textSecondary: '#6B6B6B',
  textSecondaryDark: '#A0A0A0',
  textMuted: '#9B9B9B',

  // Category colors (matching web app exactly)
  categories: {
    deepWork: '#4A90E2',
    shallowWork: '#7EC8E3',
    distraction: '#E74C3C',
    rest: '#82C882',
    sleep: '#9B59B6',
    exercise: '#E67E22',
  },

  // Status
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  info: '#3498DB',

  // Priority
  priorityHigh: '#E74C3C',
  priorityMedium: '#F39C12',
  priorityLow: '#27AE60',

  // Borders & Dividers
  border: '#E8E0D8',
  borderDark: '#3A3A3A',
  divider: '#F0EAE2',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',

  // Rarity colors (badge system)
  rarity: {
    common: '#6B8F6B',
    rare: '#4A90E2',
    legendary: '#F5A623',
  },
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 38,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
};
