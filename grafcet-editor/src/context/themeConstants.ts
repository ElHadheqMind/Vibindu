// Define theme types
export type ThemeMode = 'light' | 'dark';

// Define animation variables
export const animations = {
  transition: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  scale: {
    hover: 'scale(1.02)',
    active: 'scale(0.98)',
  },
};

// Define theme colors - Professional Light Theme
export const lightTheme = {
  mode: 'light' as ThemeMode,

  // Primary colors
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',

  // Secondary colors
  secondary: '#dc004e',
  secondaryLight: '#ff5983',
  secondaryDark: '#9a0036',

  // Accent color
  accent: '#ff6b35',

  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#e3f2fd',

  // Surface colors
  surface: '#ffffff',
  surfaceAlt: '#f5f5f5',
  surfaceRaised: '#fafafa',
  surfaceElevated: '#f5f5f5',

  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9e9e9e',
  textDisabled: '#bdbdbd',
  textInverted: '#ffffff',

  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderDark: '#bdbdbd',
  divider: '#e0e0e0',

  // Shadows
  shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  shadowLight: '0 1px 4px rgba(0, 0, 0, 0.08)',
  shadowHover: '0 4px 16px rgba(0, 0, 0, 0.15)',

  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',

  // Canvas specific
  canvasBackground: '#fafafa',
  gridColor: '#e8e8e8',
  selectionColor: 'rgba(25, 118, 210, 0.1)',

  // GRAFCET elements
  stepBorder: '#212121',
  stepBackground: '#ffffff',
  selectionBorder: '#1976d2',
  connectionAnchor: '#4caf50',
  transitionBackground: '#000000',
  actionBlockBackground: '#e3f2fd',
  actionBlockBorder: '#1976d2',

  // GSRSM Connection Colors - Vibrant palette for amazing UI/UX
  gsrsmConnectionActive: '#6366f1',        // Vibrant indigo for active connections
  gsrsmConnectionInactive: '#000000',      // Solid black for inactive connections
  gsrsmConnectionHighlight: '#0ea5e9',     // Sky blue for highlighted connections (changed from green)
  gsrsmConnectionHover: '#8b5cf6',         // Purple for hover states

  // Menu and UI
  menuBackground: '#ffffff',
  menuHover: '#f5f5f5',
  tooltipBackground: '#616161',
  tooltipText: '#ffffff',

  // Animation
  ...animations,
};

// Define theme colors - Professional Dark Theme
export const darkTheme = {
  mode: 'dark' as ThemeMode,

  // Primary colors
  primary: '#90caf9',
  primaryLight: '#e3f2fd',
  primaryDark: '#42a5f5',

  // Secondary colors
  secondary: '#f48fb1',
  secondaryLight: '#ffc1e3',
  secondaryDark: '#bf5f82',

  // Accent color
  accent: '#ff8a50',

  // Background colors
  background: '#121212',
  backgroundSecondary: '#1e1e1e',
  backgroundTertiary: '#2d2d2d',

  // Surface colors
  surface: '#1e1e1e',
  surfaceAlt: '#252526',
  surfaceRaised: '#2d2d2d',
  surfaceElevated: '#2d2d2d',

  // Text colors
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textTertiary: '#808080',
  textDisabled: '#666666',
  textInverted: '#121212',

  // Border colors
  border: '#404040',
  borderLight: '#333333',
  borderDark: '#555555',
  divider: '#404040',

  // Shadows
  shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowLight: '0 1px 4px rgba(0, 0, 0, 0.2)',
  shadowHover: '0 4px 16px rgba(0, 0, 0, 0.4)',

  // Status colors
  success: '#81c784',
  warning: '#ffb74d',
  error: '#e57373',
  info: '#64b5f6',

  // Canvas specific
  canvasBackground: '#1a1a1a',
  gridColor: '#333333',
  selectionColor: 'rgba(144, 202, 249, 0.15)',

  // GRAFCET elements
  stepBorder: '#ffffff',
  stepBackground: '#1e1e1e',
  selectionBorder: '#90caf9',
  connectionAnchor: '#81c784',
  transitionBackground: '#2d2d2d',
  actionBlockBackground: '#1e3a5f',
  actionBlockBorder: '#90caf9',

  // GSRSM Connection Colors - Vibrant palette for amazing UI/UX (lighter for dark mode)
  gsrsmConnectionActive: '#818cf8',        // Lighter indigo for active connections
  gsrsmConnectionInactive: '#ffffff',      // Solid white for inactive connections
  gsrsmConnectionHighlight: '#38bdf8',     // Lighter sky blue for highlighted connections (changed from green)
  gsrsmConnectionHover: '#a78bfa',         // Lighter purple for hover states

  // Menu and UI
  menuBackground: '#252526',
  menuHover: '#2a2d2e',
  tooltipBackground: '#3c3c3c',
  tooltipText: '#ffffff',

  // Animation
  ...animations,
};

export type Theme = typeof lightTheme;

