import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import { apiClient } from '../../../lib/api-client';

export function useWorkingDays() {
    const queryClient = useQueryClient();

    const workingDaysQuery = useQuery({
        queryKey: ['working-days'],
        queryFn: async () => {
            const { data } = await apiClient.get('/v1/student/attendance/working-days/list'); // Mock configuration details
            return data || [];
        },
        initialData: [],
    });

    const configureWorkingDays = useMutation({
        mutationFn: attendanceApi.configureWorkingDays,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['working-days'] });
        },
    });

    return {
        workingDays: workingDaysQuery.data,
        isLoadingWorkingDays: workingDaysQuery.isLoading,
        configureWorkingDays: configureWorkingDays.mutateAsync,
        isConfiguring: configureWorkingDays.isPending,
    };
}
