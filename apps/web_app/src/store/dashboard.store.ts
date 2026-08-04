import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardStore {
    activeRole: string | null;
    selectedAcademicYearId: string | null;
    selectedSchoolId: string | null;
    dashboardMetrics: Record<string, any>;
    lastRefreshedAt: string | null;

    setActiveRole: (role: string) => void;
    setAcademicYear: (id: string) => void;
    setSchool: (id: string) => void;
    setMetrics: (metrics: Record<string, any>) => void;
    markRefreshed: () => void;
    reset: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
    persist(
        (set) => ({
            activeRole: null,
            selectedAcademicYearId: null,
            selectedSchoolId: null,
            dashboardMetrics: {},
            lastRefreshedAt: null,

            setActiveRole: (role) => set({ activeRole: role }),
            setAcademicYear: (id) => set({ selectedAcademicYearId: id }),
            setSchool: (id) => set({ selectedSchoolId: id }),
            setMetrics: (metrics) => set({ dashboardMetrics: metrics }),
            markRefreshed: () => set({ lastRefreshedAt: new Date().toISOString() }),
            reset: () => set({ dashboardMetrics: {}, lastRefreshedAt: null }),
        }),
        {
            name: 'erp-dashboard',
            partialize: (s) => ({
                activeRole: s.activeRole,
                selectedAcademicYearId: s.selectedAcademicYearId,
                selectedSchoolId: s.selectedSchoolId,
            }),
        }
    )
);
