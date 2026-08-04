import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '../admission.api';
import { AdmissionEngine, ADMISSION_EVENTS, ADMISSION_STALE_TIME } from '../core/AdmissionEngine';
import { admissionEventBus } from '../core/AdmissionEvents';

export interface CrmDocumentRecord {
    id: string;
    application_id?: string;
    document_type_id?: string;
    original_filename?: string;
    mime_type?: string;
    file_size?: number;
    version?: number;
    status?: string;
    uploaded_at?: string;
    verified_at?: string;
    verified_by?: string;
}

function mapDocumentList(data: unknown): CrmDocumentRecord[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as CrmDocumentRecord[];
    const obj = data as { data?: CrmDocumentRecord[] };
    return obj.data ?? [];
}

const DOC_REFRESH_EVENTS = [
    ADMISSION_EVENTS.DOCUMENT_UPLOADED,
    ADMISSION_EVENTS.DOCUMENT_VERIFIED,
    ADMISSION_EVENTS.DOCUMENT_REJECTED,
    ADMISSION_EVENTS.CHECKLIST_UPDATED,
    ADMISSION_EVENTS.APPLICATION_UPDATED,
] as const;

export function useCrmDocuments(applicationId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: AdmissionEngine.cacheKeys.documents(applicationId ?? ''),
        queryFn: () => admissionApi.listCrmDocuments(applicationId!).then(res => mapDocumentList(res.data)),
        enabled: !!applicationId,
        staleTime: ADMISSION_STALE_TIME,
    });

    useEffect(() => {
        if (!applicationId) return;
        const refresh = () => void query.refetch();
        const unsubs = DOC_REFRESH_EVENTS.map(event =>
            admissionEventBus.subscribe(event, payload => {
                if (!payload?.applicationId || payload.applicationId === applicationId) refresh();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [applicationId, query.refetch]);

    const uploadMutation = useMutation({
        mutationFn: ({ file, documentTypeCode }: { file: File; documentTypeCode: string }) =>
            admissionApi.uploadCrmDocument(applicationId!, documentTypeCode, file),
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DOCUMENT_UPLOADED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.CHECKLIST_UPDATED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (documentId: string) => admissionApi.deleteCrmDocument(documentId),
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.CHECKLIST_UPDATED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
        },
    });

    const verifyMutation = useMutation({
        mutationFn: ({ documentId, remarks }: { documentId: string; remarks?: string }) =>
            admissionApi.verifyCrmDocument(documentId, remarks),
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DOCUMENT_VERIFIED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.CHECKLIST_UPDATED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ documentId, reason }: { documentId: string; reason: string }) =>
            admissionApi.rejectCrmDocument(documentId, reason),
        onSuccess: () => {
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DOCUMENT_REJECTED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.CHECKLIST_UPDATED, { applicationId });
            AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId });
        },
    });

    return {
        documents: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        uploadDocument: uploadMutation.mutateAsync,
        deleteDocument: deleteMutation.mutateAsync,
        verifyDocument: verifyMutation.mutateAsync,
        rejectDocument: rejectMutation.mutateAsync,
        isUploading: uploadMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isVerifying: verifyMutation.isPending,
    };
}

export function useUploadDocument(applicationId: string) {
    const { uploadDocument, isUploading, ...rest } = useCrmDocuments(applicationId);
    return { uploadDocument, isUploading, ...rest };
}
