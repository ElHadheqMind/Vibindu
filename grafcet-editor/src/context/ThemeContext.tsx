import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeMode, lightTheme, Theme } from './themeConstants';



// Create theme context
type ThemeContextType = {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  themeMode: 'light',
  toggleTheme: () => { },
});

// Create theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always use light theme
  const [themeMode] = useState<ThemeMode>('light');
  const theme = lightTheme;

  // No-op toggle function (kept for compatibility)
  const toggleTheme = () => {
    // Light mode only - no toggle
  };

  // Apply theme to body element
  useEffect(() => {
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.text;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
