import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, LeaveRequestPayload } from '../services/attendance.api';
import { apiClient } from '../../../lib/api-client';

export function useLeave() {
    const queryClient = useQueryClient();

    const leaveRequestsQuery = useQuery({
        queryKey: ['leave-requests'],
        queryFn: async () => {
            // Fetch student_leaves table records using direct select query or controller
            const { data } = await apiClient.get('/v1/student/attendance/leave/list'); // Fallback or mock list
            return data || [];
        },
        initialData: [],
    });

    const submitLeave = useMutation({
        mutationFn: attendanceApi.submitLeave,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
        },
    });

    const approveLeave = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
            attendanceApi.approveLeave(id, { remarks }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
        },
    });

    const rejectLeave = useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
            attendanceApi.rejectLeave(id, { remarks }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
        },
    });

    return {
        requests: leaveRequestsQuery.data,
        isLoadingRequests: leaveRequestsQuery.isLoading,
        submitLeave: submitLeave.mutateAsync,
        approveLeave: approveLeave.mutateAsync,
        rejectLeave: rejectLeave.mutateAsync,
    };
}
