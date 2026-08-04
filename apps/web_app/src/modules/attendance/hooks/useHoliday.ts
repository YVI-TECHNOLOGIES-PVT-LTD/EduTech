import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import { apiClient } from '../../../lib/api-client';

export function useHoliday() {
    const queryClient = useQueryClient();

    const holidaysQuery = useQuery({
        queryKey: ['holidays'],
        queryFn: async () => {
            const { data } = await apiClient.get('/v1/student/attendance/holidays'); // Mock list lookup
            return data || [];
        },
        initialData: [],
    });

    const createHoliday = useMutation({
        mutationFn: attendanceApi.createHoliday,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['holidays'] });
        },
    });

    return {
        holidays: holidaysQuery.data,
        isLoadingHolidays: holidaysQuery.isLoading,
        createHoliday: createHoliday.mutateAsync,
        isCreating: createHoliday.isPending,
    };
}
