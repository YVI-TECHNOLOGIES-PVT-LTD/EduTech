import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import { apiClient } from '../../../lib/api-client';

export function useBiometric() {
    const queryClient = useQueryClient();

    const logsQuery = useQuery({
        queryKey: ['biometric-logs'],
        queryFn: async () => {
            const { data } = await apiClient.get('/v1/student/attendance/biometric/logs'); // Fallback log listing
            return data || [];
        },
        initialData: [],
    });

    const syncBiometric = useMutation({
        mutationFn: attendanceApi.syncBiometric,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['biometric-logs'] });
        },
    });

    return {
        logs: logsQuery.data,
        isLoadingLogs: logsQuery.isLoading,
        syncBiometric: syncBiometric.mutateAsync,
        isSyncing: syncBiometric.isPending,
    };
}
