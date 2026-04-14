import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

interface ThemeContextValue {
  colorScheme: ColorSchemeName;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(
    () => Appearance.getColorScheme()
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme: scheme }) => {
      setColorScheme(scheme);
    });
    return () => sub.remove();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    Appearance.setColorScheme(next);
  }, [colorScheme]);

  return (
    <ThemeContext.Provider value={{ colorScheme, isDark: colorScheme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
