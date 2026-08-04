import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function useIdentity(studentId?: string) {
    const queryClient = useQueryClient();

    const barcodeQuery = useQuery({
        queryKey: ['student', 'barcode', studentId],
        queryFn: () => studentApi.getBarcode(studentId!).then(res => res.data),
        enabled: !!studentId,
    });

    const generateIdMutation = useMutation({
        mutationFn: studentApi.generateIdCard,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student', 'id-card', studentId] });
        },
    });

    const bulkGenerateIdsMutation = useMutation({
        mutationFn: studentApi.bulkGenerateIDCards,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    return {
        barcode: barcodeQuery.data,
        isLoadingBarcode: barcodeQuery.isLoading,
        generateIdCard: generateIdMutation.mutateAsync,
        isGenerating: generateIdMutation.isPending,
        bulkGenerateIDCards: bulkGenerateIdsMutation.mutateAsync,
        isBulkGenerating: bulkGenerateIdsMutation.isPending,
    };
}
