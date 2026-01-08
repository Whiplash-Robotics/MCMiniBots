import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from DOM class to match the inline script
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check if dark class was already applied by the inline script
    return document.documentElement.classList.contains('dark');
  });

  const [mounted, setMounted] = useState(false);

  // Mark as mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use layout effect to apply theme changes immediately without flash
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    localStorage.setItem('theme', JSON.stringify(isDark));

    if (isDark) {
      root.classList.add('dark');
      // Apply inline styles immediately to prevent flash
      root.style.backgroundColor = '#0a0a0a';
      root.style.color = '#f3f4f6';
    } else {
      root.classList.remove('dark');
      // Apply light mode inline styles
      root.style.backgroundColor = '#f5f5f7';
      root.style.color = '#111827';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};