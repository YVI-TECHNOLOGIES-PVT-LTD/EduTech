import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function useTransfer() {
    const queryClient = useQueryClient();

    const requestTransferMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { destination_school: string; reason: string } }) =>
            studentApi.requestTransfer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
        },
    });

    const approveTransferMutation = useMutation({
        mutationFn: studentApi.approveTransfer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    return {
        requestTransfer: requestTransferMutation.mutateAsync,
        isRequesting: requestTransferMutation.isPending,
        approveTransfer: approveTransferMutation.mutateAsync,
        isApproving: approveTransferMutation.isPending,
    };
}
