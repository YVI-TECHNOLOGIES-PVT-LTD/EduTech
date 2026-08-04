import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'te';
type Density = 'compact' | 'comfortable' | 'spacious';
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
type ColorPreset = 'blue' | 'purple' | 'emerald' | 'slate' | 'corporate';

interface SettingsStore {
    theme: Theme;
    colorPreset: ColorPreset;
    language: Language;
    density: Density;
    dateFormat: DateFormat;
    timezone: string;
    reducedMotion: boolean;
    highContrast: boolean;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };

    setTheme: (theme: Theme) => void;
    setColorPreset: (preset: ColorPreset) => void;
    setLanguage: (language: Language) => void;
    setDensity: (density: Density) => void;
    setDateFormat: (format: DateFormat) => void;
    setTimezone: (tz: string) => void;
    toggleReducedMotion: () => void;
    toggleHighContrast: () => void;
    setNotificationPref: (type: 'email' | 'push' | 'sms', value: boolean) => void;
    resetToDefaults: () => void;
}

const DEFAULTS = {
    theme: 'light' as Theme,
    colorPreset: 'blue' as ColorPreset,
    language: 'en' as Language,
    density: 'comfortable' as Density,
    dateFormat: 'DD/MM/YYYY' as DateFormat,
    timezone: 'Asia/Kolkata',
    reducedMotion: false,
    highContrast: false,
    notifications: { email: true, push: true, sms: false },
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...DEFAULTS,

            setTheme: (theme) => set({ theme }),
            setColorPreset: (colorPreset) => set({ colorPreset }),
            setLanguage: (language) => set({ language }),
            setDensity: (density) => set({ density }),
            setDateFormat: (dateFormat) => set({ dateFormat }),
            setTimezone: (timezone) => set({ timezone }),
            toggleReducedMotion: () => set(s => ({ reducedMotion: !s.reducedMotion })),
            toggleHighContrast: () => set(s => ({ highContrast: !s.highContrast })),
            setNotificationPref: (type, value) =>
                set(s => ({ notifications: { ...s.notifications, [type]: value } })),
            resetToDefaults: () => set(DEFAULTS),
        }),
        { name: 'erp-settings' }
    )
);

