import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';

export function useAttendanceDashboard() {
    const summaryQuery = useQuery({
        queryKey: ['attendance-admin-summary'],
        queryFn: async () => {
            const res = await apiClient.get('/attendance/admin/summary');
            return res.data;
        },
    });

    const classSummaryQuery = useQuery({
        queryKey: ['attendance-admin-class-summary'],
        queryFn: async () => {
            const res = await apiClient.get('/attendance/admin/class-summary');
            return res.data;
        },
    });

    const defaultersQuery = useQuery({
        queryKey: ['attendance-admin-defaulters'],
        queryFn: async () => {
            const res = await apiClient.get('/attendance/admin/defaulters');
            return res.data;
        },
    });

    return {
        summary: summaryQuery.data || { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRateToday: '0', sessionsMarked: 0 },
        isLoadingSummary: summaryQuery.isLoading,
        classSummaries: classSummaryQuery.data || [],
        isLoadingClassSummaries: classSummaryQuery.isLoading,
        defaulters: defaultersQuery.data || [],
        isLoadingDefaulters: defaultersQuery.isLoading,
    };
}
