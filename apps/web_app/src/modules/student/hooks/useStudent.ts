import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function useStudent(id: string) {
    const queryClient = useQueryClient();

    const studentQuery = useQuery({
        queryKey: ['student', 'detail', id],
        queryFn: () => studentApi.getById(id).then(res => res.data),
        enabled: !!id,
    });

    const timelineQuery = useQuery({
        queryKey: ['student', 'timeline', id],
        queryFn: () => studentApi.getTimeline(id).then(res => res.data),
        enabled: !!id,
    });

    const historyQuery = useQuery({
        queryKey: ['student', 'history', id],
        queryFn: () => studentApi.getHistory(id).then(res => res.data),
        enabled: !!id,
    });

    const allocateClassMutation = useMutation({
        mutationFn: (data: { academic_year_id: string; grade: string; section_id: string; roll_number?: string }) =>
            studentApi.allocateClass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student', 'detail', id] });
            queryClient.invalidateQueries({ queryKey: ['student', 'history', id] });
        },
    });

    return {
        student: studentQuery.data,
        isLoadingStudent: studentQuery.isLoading,
        timeline: timelineQuery.data || [],
        isLoadingTimeline: timelineQuery.isLoading,
        history: historyQuery.data || [],
        isLoadingHistory: historyQuery.isLoading,
        allocateClass: allocateClassMutation.mutateAsync,
        isAllocating: allocateClassMutation.isPending,
        refetchAll: () => {
            studentQuery.refetch();
            timelineQuery.refetch();
            historyQuery.refetch();
        }
    };
}
