import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';
import { apiClient } from '../../../lib/api-client';

export function useCorrections() {
    const queryClient = useQueryClient();

    const correctionsQuery = useQuery({
        queryKey: ['corrections-list'],
        queryFn: async () => {
            const { data } = await apiClient.get('/v1/student/attendance/correction/list'); // Mock correction listing
            return data || [];
        },
        initialData: [],
    });

    const createCorrection = useMutation({
        mutationFn: attendanceApi.createCorrection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['corrections-list'] });
        },
    });

    const approveCorrection = useMutation({
        mutationFn: attendanceApi.approveCorrection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['corrections-list'] });
        },
    });

    const rejectCorrection = useMutation({
        mutationFn: attendanceApi.rejectCorrection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['corrections-list'] });
        },
    });

    return {
        corrections: correctionsQuery.data,
        isLoadingCorrections: correctionsQuery.isLoading,
        createCorrection: createCorrection.mutateAsync,
        approveCorrection: approveCorrection.mutateAsync,
        rejectCorrection: rejectCorrection.mutateAsync,
    };
}
export default useCorrections;
