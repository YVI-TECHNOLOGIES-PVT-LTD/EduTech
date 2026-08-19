import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeContext, ThemeMode } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ThemeSwitcherProps {
  variant?: 'toggle' | 'segmented' | 'icon-toggle';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'toggle',
  size = 'default',
  className,
}) => {
  const { theme, resolvedTheme, setTheme } = useThemeContext();

  // 1. SEGMENTED CONTROL (For Settings / Preferences Panes)
  if (variant === 'segmented') {
    return (
      <div
        role="radiogroup"
        aria-label="Theme selection"
        className={cn(
          'inline-flex items-center p-1 rounded-xl bg-muted border border-border gap-1',
          className,
        )}
      >
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
          const isSelected = theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label} theme`}
              onClick={() => setTheme(value)}
              className={cn(
                'flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer',
                isSelected
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. CANONICAL ONE-CLICK THEME TOGGLE (Default for Navbars, Headers, Public Shell)
  const isDark = resolvedTheme === 'dark';
  const nextTheme: ThemeMode = isDark ? 'light' : 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const CurrentIcon = isDark ? Moon : Sun;

  const handleToggle = () => {
    setTheme(nextTheme);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-xl w-9 h-9 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer',
        className,
      )}
    >
      <CurrentIcon className="w-4 h-4 shrink-0 transition-transform duration-200 hover:rotate-12" />
      <span className="sr-only">{label}</span>
    </Button>
  );
};

export default ThemeSwitcher;
