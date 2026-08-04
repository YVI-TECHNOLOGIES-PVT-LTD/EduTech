import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { useApplication, useReviewQueue } from './useApplication';
import { mapDocuments } from '../utils/document.mapper';

export function useDocuments(applicationId?: string) {
    const queryClient = useQueryClient();
    const { application, isLoading, refetch } = useApplication(applicationId, {
        enabled: !!applicationId,
    });

    const verifyMutation = useMutation({
        mutationFn: ({ id, remark }: { id: string; remark: string }) =>
            admissionApi.verifyDocs(id, remark),
        onSuccess: (_, variables) => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DOCUMENT_VERIFIED, {
                applicationId: variables.id,
            });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, {
                applicationId: variables.id,
            });
        },
    });

    return {
        documents: mapDocuments(application?.admission_documents),
        application,
        isLoading,
        refetch,
        verifyDocuments: verifyMutation.mutateAsync,
        isVerifying: verifyMutation.isPending,
    };
}

export function useDocumentVerificationQueue(status = 'submitted') {
    return useReviewQueue(status);
}
