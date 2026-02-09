import 'styled-components';
import { ThemeMode } from './context/ThemeContext';

declare module 'styled-components' {
  export interface DefaultTheme {
    mode: ThemeMode;
    // Base colors
    background: string;
    surface: string;
    surfaceAlt: string;
    surfaceRaised: string;
    // Brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverted: string;
    // UI element colors
    border: string;
    borderLight: string;
    divider: string;
    shadow: string;
    shadowLight: string;
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    // Canvas elements
    gridColor: string;
    selectionColor: string;
    selectionBorder: string;
    stepBackground: string;
    stepBorder: string;
    transitionBackground: string;
    actionBlockBackground: string;
    actionBlockBorder: string;
    // Menu and UI
    menuBackground: string;
    menuHover: string;
    tooltipBackground: string;
    tooltipText: string;
    // Animations
    transition: {
      fast: string;
      normal: string;
      slow: string;
    };
    scale: {
      hover: string;
      active: string;
    };
  }
}
