import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle = () => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <button
      onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur border border-border shadow-sm hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {themeMode === 'dark' ? (
        <Sun className="w-4 h-4 text-foreground" />
      ) : (
        <Moon className="w-4 h-4 text-foreground" />
      )}
    </button>
  );
};

export default ThemeToggle;
