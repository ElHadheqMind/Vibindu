import { createGlobalStyle } from 'styled-components'

export const theme = {
  primary: '#1976d2',
  primaryDark: '#1565c0',
  primaryLight: '#42a5f5',
  accent: '#ff9800',
  background: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f8f9fa',
  surfaceRaised: '#ffffff',
  text: '#212121',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#e0e0e0',
  shadow: 'rgba(0, 0, 0, 0.1)',
  error: '#d32f2f',
  success: '#2e7d32',
  transition: {
    fast: '0.2s ease'
  },
  scale: {
    hover: 'scale(1.02)',
    active: 'scale(0.98)'
  }
}

export type Theme = typeof theme

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`

