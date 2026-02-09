import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);
