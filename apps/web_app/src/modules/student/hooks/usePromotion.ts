import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function usePromotion() {
    const queryClient = useQueryClient();

    const promoteMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { to_academic_year_id: string; to_grade: string; to_section_id?: string; promotion_reason: string } }) =>
            studentApi.promote(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
        },
    });

    const bulkPromoteMutation = useMutation({
        mutationFn: studentApi.bulkPromote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    return {
        promoteStudent: promoteMutation.mutateAsync,
        isPromoting: promoteMutation.isPending,
        bulkPromote: bulkPromoteMutation.mutateAsync,
        isBulkPromoting: bulkPromoteMutation.isPending,
    };
}
