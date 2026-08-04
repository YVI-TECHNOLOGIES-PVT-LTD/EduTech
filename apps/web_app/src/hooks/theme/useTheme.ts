import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settings.store';

export type ThemeMode = 'light' | 'dark' | 'system';
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type ColorPreset = 'blue' | 'purple' | 'emerald' | 'slate' | 'corporate';

export const useTheme = () => {
    const {
        theme,
        colorPreset,
        density,
        reducedMotion,
        highContrast,
        setTheme,
        setColorPreset,
        setDensity,
        toggleReducedMotion,
        toggleHighContrast
    } = useSettingsStore();

    useEffect(() => {
        const root = document.documentElement;

        // 1. Apply Dark Mode class
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const activeTheme = theme === 'system' ? systemTheme : theme;
        
        if (activeTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Listen to system theme changes if set to 'system'
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;

        // 2. Apply Color Preset classes
        root.classList.forEach(className => {
            if (className.startsWith('theme-')) {
                root.classList.remove(className);
            }
        });
        root.classList.add(`theme-${colorPreset}`);
    }, [colorPreset]);

    useEffect(() => {
        const root = document.documentElement;
        
        // 3. Apply Attributes for Density, Reduced Motion, High Contrast
        root.setAttribute('data-density', density);
        root.setAttribute('data-reduced-motion', String(reducedMotion));
        root.setAttribute('data-high-contrast', String(highContrast));
    }, [density, reducedMotion, highContrast]);

    return {
        theme,
        colorPreset,
        density,
        reducedMotion,
        highContrast,
        setTheme,
        setColorPreset,
        setDensity,
        toggleReducedMotion,
        toggleHighContrast
    };
};

