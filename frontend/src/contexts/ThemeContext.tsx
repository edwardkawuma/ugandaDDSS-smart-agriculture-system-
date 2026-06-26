import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'classic' | 'minimal' | 'vibrant' | 'elegant' | 'modern' | 'warm' | 'cool' | 'soft' | 'bold' | 'gentle' | 'crisp' | 'smooth' | 'fresh' | 'cozy' | 'bright' | 'calm' | 'energetic' | 'serene' | 'dynamic' | 'peaceful';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  themes: { value: Theme; label: string; description: string; category: 'light' | 'dark' }[];
  getThemesByCategory: (category: 'light' | 'dark') => { value: Theme; label: string; description: string; category: 'light' | 'dark' }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = [
  { value: 'classic' as Theme, label: 'Classic Professional', description: 'Timeless and reliable', category: 'light' as const },
  { value: 'minimal' as Theme, label: 'Minimal Clean', description: 'Simple and focused', category: 'light' as const },
  { value: 'vibrant' as Theme, label: 'Vibrant Energy', description: 'Bold and exciting', category: 'light' as const },
  { value: 'elegant' as Theme, label: 'Elegant Sophistication', description: 'Refined and graceful', category: 'light' as const },
  { value: 'modern' as Theme, label: 'Modern Innovation', description: 'Cutting-edge design', category: 'light' as const },
  { value: 'warm' as Theme, label: 'Warm Comfort', description: 'Inviting and cozy', category: 'light' as const },
  { value: 'cool' as Theme, label: 'Cool Breeze', description: 'Fresh and calming', category: 'light' as const },
  { value: 'soft' as Theme, label: 'Soft Touch', description: 'Gentle and soothing', category: 'light' as const },
  { value: 'bold' as Theme, label: 'Bold Statement', description: 'Confident and strong', category: 'light' as const },
  { value: 'gentle' as Theme, label: 'Gentle Care', description: 'Nurturing and kind', category: 'light' as const },
  { value: 'crisp' as Theme, label: 'Crisp Precision', description: 'Sharp and defined', category: 'light' as const },
  { value: 'smooth' as Theme, label: 'Smooth Flow', description: 'Fluid and seamless', category: 'light' as const },
  { value: 'fresh' as Theme, label: 'Fresh Start', description: 'New and invigorating', category: 'light' as const },
  { value: 'cozy' as Theme, label: 'Cozy Home', description: 'Comfortable and familiar', category: 'light' as const },
  { value: 'bright' as Theme, label: 'Bright Future', description: 'Optimistic and clear', category: 'light' as const },
  { value: 'calm' as Theme, label: 'Calm Waters', description: 'Peaceful and stable', category: 'light' as const },
  { value: 'energetic' as Theme, label: 'Energetic Pulse', description: 'Dynamic and active', category: 'light' as const },
  { value: 'serene' as Theme, label: 'Serene Beauty', description: 'Tranquil and balanced', category: 'light' as const },
  { value: 'dynamic' as Theme, label: 'Dynamic Motion', description: 'Fluid and responsive', category: 'light' as const },
  { value: 'peaceful' as Theme, label: 'Peaceful Mind', description: 'Harmonious and zen', category: 'light' as const },
];

const isTheme = (value: string | null): value is Theme => {
  return typeof value === 'string' && themes.some(t => t.value === value);
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return isTheme(saved) ? saved : 'smooth';
  });

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('dashboard-theme-mode');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('dashboard-theme', theme);
    localStorage.setItem('dashboard-theme-mode', themeMode);

    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.forEach(cls => {
      if (cls.startsWith('theme-')) root.classList.remove(cls);
    });

    // Toggle dark mode — CSS .dark { } handles all dark color overrides
    root.classList.toggle('dark', themeMode === 'dark');

    // Add theme class (for future per-theme CSS overrides like .theme-vibrant { --primary: ... })
    root.classList.add(`theme-${theme}`);
  }, [theme, themeMode]);

  const getThemesByCategory = (category: 'light' | 'dark') => {
    return themes.filter(t => t.category === category);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themeMode, setThemeMode, themes, getThemesByCategory }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
