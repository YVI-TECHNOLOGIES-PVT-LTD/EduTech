import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type LayoutDensity = 'compact' | 'normal';

interface AppState {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    
    // Theme options
    theme: ThemeMode;
    fontSize: FontSize;
    density: LayoutDensity;
    setTheme: (theme: ThemeMode) => void;
    setFontSize: (size: FontSize) => void;
    setDensity: (density: LayoutDensity) => void;

    // Navigation options
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // Notifications
    notificationCount: number;
    incrementNotificationCount: () => void;
    clearNotifications: () => void;

    // Global filtering stubs
    schoolId: string;
    academicYearId: string;
    setSchoolId: (id: string) => void;
    setAcademicYearId: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    isLoading: false,
    setLoading: (loading) => set({ isLoading: loading }),

    theme: (localStorage.getItem('erp-theme') as ThemeMode) || 'system',
    fontSize: (localStorage.getItem('erp-font-size') as FontSize) || 'medium',
    density: (localStorage.getItem('erp-density') as LayoutDensity) || 'normal',
    
    setTheme: (theme) => {
        localStorage.setItem('erp-theme', theme);
        set({ theme });
    },
    setFontSize: (fontSize) => {
        localStorage.setItem('erp-font-size', fontSize);
        set({ fontSize });
    },
    setDensity: (density) => {
        localStorage.setItem('erp-density', density);
        set({ density });
    },

    sidebarCollapsed: localStorage.getItem('erp-sidebar-collapsed') === 'true',
    setSidebarCollapsed: (sidebarCollapsed) => {
        localStorage.setItem('erp-sidebar-collapsed', String(sidebarCollapsed));
        set({ sidebarCollapsed });
    },

    notificationCount: 0,
    incrementNotificationCount: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),
    clearNotifications: () => set({ notificationCount: 0 }),

    schoolId: '',
    academicYearId: '',
    setSchoolId: (schoolId) => set({ schoolId }),
    setAcademicYearId: (academicYearId) => set({ academicYearId }),
}));
